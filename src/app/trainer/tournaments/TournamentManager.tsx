'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { RANKING_RULES, RESULT_LABEL, type TResult } from '@/lib/tournament/types';
import { fmtPts, nameMap, type TView } from '@/lib/tournament/client';
import DeleteTournament from './DeleteTournament';

const smallBtn: React.CSSProperties = {
  padding: '0.35rem 0.8rem',
  border: 'none',
  borderRadius: 8,
  background: '#efe6d2',
  color: '#54452a',
  fontWeight: 700,
  cursor: 'pointer',
};

const STATUS_LABEL = { DRAFT: 'Entwurf', ACTIVE: 'läuft', FINISHED: 'beendet' } as const;

export default function TournamentManager({ id }: { id: string }) {
  const [t, setT] = useState<TView | null>(null);
  const [roundNo, setRoundNo] = useState<number | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/trainer/tournaments/${id}`, { cache: 'no-store' });
    if (res.ok) setT((await res.json()) as TView);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  async function call(url: string, body: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = (await res.json().catch(() => ({}))) as Partial<TView> & { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? 'Das hat nicht geklappt.');
        return false;
      }
      if (data.standings) setT(data as TView);
      return true;
    } catch {
      setMsg('Keine Verbindung zum Server.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (!t) return <div className='card'><p className='muted'>Lade …</p></div>;

  const names = nameMap(t);
  const nm = (pid: string | null) => (pid ? names.get(pid) ?? '?' : '–');
  const inactive = new Set(t.players.filter((p) => !p.active).map((p) => p.id));
  const tag = (pid: string | null) => (pid && inactive.has(pid) ? <span className='muted'> (abgemeldet)</span> : null);
  const last = t.roundsList[t.roundsList.length - 1];
  const open = !!last && last.pairings.some((p) => p.result === 'UNPLAYED');
  const shown = t.roundsList.find((r) => r.number === (roundNo ?? last?.number)) ?? last;
  const finished = t.status === 'FINISHED';
  const canDraw = !finished && t.roundsList.length < t.rounds && !open;
  const canFinish = !finished && t.roundsList.length > 0 && !open;
  const withdrawnInOpenRound =
    open && !!last && last.pairings.some((p) => p.result === 'UNPLAYED' && (inactive.has(p.whiteId) || (p.blackId !== null && inactive.has(p.blackId))));

  const setResult = (pairingId: string, result: TResult) =>
    call(`/api/trainer/tournaments/${id}`, { action: 'result', pairingId, result });

  const setActive = (playerId: string, active: boolean) =>
    call(`/api/trainer/tournaments/${id}`, { action: active ? 'reactivate' : 'withdraw', playerId });

  return (
    <div>
      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h1>{t.title}</h1>
        <p className='muted'>
          {t.players.length} Teilnehmer · Runde {t.roundsList.length} von {t.rounds} · {STATUS_LABEL[t.status]}
        </p>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            className='btn'
            style={{ width: 'auto', marginTop: 0, padding: '0.6rem 1.2rem' }}
            disabled={!canDraw || busy}
            onClick={() => {
              void call(`/api/trainer/tournaments/${id}/rounds`, { action: 'generate' }).then(() => setRoundNo(null));
            }}
          >
            Nächste Runde auslosen
          </button>
          {shown && !shown.published && (
            <button
              className='btn'
              style={{ width: 'auto', marginTop: 0, padding: '0.6rem 1.2rem' }}
              disabled={busy}
              onClick={() => void call(`/api/trainer/tournaments/${id}/rounds`, { action: 'publish', round: shown.number }).then(() => load())}
            >
              Runde {shown.number} für den Beamer veröffentlichen
            </button>
          )}
          <Link className='btn btn-secondary' style={{ width: 'auto', marginTop: 0, padding: '0.6rem 1.2rem' }} href={`/trainer/tournaments/${id}/beamer`} target='_blank'>
            Beamer-Ansicht öffnen
          </Link>
          {canFinish && (
            <button
              className='btn btn-secondary'
              style={{ width: 'auto', marginTop: 0, padding: '0.6rem 1.2rem' }}
              disabled={busy}
              onClick={() => {
                if (window.confirm('Turnier abschließen? Danach sind keine Änderungen an der Auslosung mehr möglich.')) void call(`/api/trainer/tournaments/${id}`, { action: 'finish' });
              }}
            >
              Turnier abschließen
            </button>
          )}
          <DeleteTournament id={id} title={t.title} goTo='/trainer/tournaments' />
        </div>
        {open && <p className='muted'>Zuerst alle Ergebnisse der aktuellen Runde eintragen, dann kann die nächste Runde ausgelost werden.</p>}
        {withdrawnInOpenRound && (
          <p className='muted'>Ein abgemeldeter Spieler hat in der aktuellen Runde noch eine offene Partie. Bitte trage dafür ein Ergebnis ein, zum Beispiel einen Sieg für den Gegner.</p>
        )}
        {msg && <p className='error'>{msg}</p>}
      </div>

      {shown && (
        <div className='card' style={{ marginBottom: '1.2rem' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <h2 style={{ margin: 0 }}>Runde {shown.number}</h2>
            <select value={shown.number} onChange={(e) => setRoundNo(Number(e.target.value))} style={{ padding: '0.3rem 0.5rem', borderRadius: 8 }}>
              {t.roundsList.map((r) => <option key={r.id} value={r.number}>Runde {r.number}</option>)}
            </select>
            <span className='muted'>{shown.published ? 'für den Beamer veröffentlicht' : 'Vorschlag – noch nicht veröffentlicht'}</span>
          </div>
          {shown.pairings.some((p) => p.repeated) && (
            <p className='error'>Achtung: In dieser Runde gibt es eine Wiederholungspaarung, die sich nicht vermeiden ließ. Bitte prüfen.</p>
          )}
          <div style={{ overflowX: 'auto' }}>
            <table className='results'>
              <thead>
                <tr><th>Brett</th><th>Weiß</th><th>Schwarz</th><th>Ergebnis</th></tr>
              </thead>
              <tbody>
                {shown.pairings.map((p) => (
                  <tr key={p.id}>
                    <td>{p.board}</td>
                    <td><b>{nm(p.whiteId)}</b>{tag(p.whiteId)}</td>
                    <td>{p.blackId ? <b>{nm(p.blackId)}</b> : <span className='muted'>Freilos</span>}{tag(p.blackId)}{p.repeated ? ' ⚠' : ''}</td>
                    <td>
                      {p.blackId ? (
                        <span style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
                          {(['WHITE_WIN', 'DRAW', 'BLACK_WIN'] as const).map((r) => (
                            <button
                              key={r}
                              disabled={busy || finished}
                              onClick={() => void setResult(p.id, r)}
                              style={{ ...smallBtn, background: p.result === r ? 'var(--accent)' : '#efe6d2', color: p.result === r ? '#ffffff' : '#54452a' }}
                            >
                              {RESULT_LABEL[r]}
                            </button>
                          ))}
                          {p.result !== 'UNPLAYED' && !finished && (
                            <button disabled={busy} onClick={() => void setResult(p.id, 'UNPLAYED')} style={{ ...smallBtn, background: 'none', textDecoration: 'underline' }}>zurücksetzen</button>
                          )}
                        </span>
                      ) : (
                        <span className='muted'>1 Punkt</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h2>Rangliste</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className='results'>
            <thead>
              <tr><th>Platz</th><th>Alias</th><th>Punkte</th><th>Buchholz</th><th>Feinbuchholz</th><th>Sonneborn-Berger</th><th>Siege</th></tr>
            </thead>
            <tbody>
              {t.standings.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td><b>{s.alias}</b>{!s.active && <span className='muted'> (abgemeldet)</span>}</td>
                  <td>{fmtPts(s.points)}</td>
                  <td>{fmtPts(s.buchholz)}</td>
                  <td>{fmtPts(s.feinbuchholz)}</td>
                  <td>{fmtPts(s.sonnebornBerger)}</td>
                  <td>{s.wins}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className='muted' style={{ marginBottom: 0 }}>Reihenfolge der Kriterien: {RANKING_RULES.join(', ')}.</p>
      </div>

      <div className='card'>
        <h2>Teilnehmer</h2>
        <p className='muted'>
          Wer sich abmeldet, bleibt mit den bisherigen Ergebnissen in der Rangliste und wird ab der nächsten Auslosung nicht mehr berücksichtigt. Du kannst die Abmeldung wieder rückgängig machen.
        </p>
        <div style={{ overflowX: 'auto' }}>
          <table className='results'>
            <thead>
              <tr><th>Start-Nr.</th><th>Alias</th><th>Status</th>{!finished && <th>Aktion</th>}</tr>
            </thead>
            <tbody>
              {t.players.map((p) => (
                <tr key={p.id}>
                  <td>{p.startRank}</td>
                  <td><b>{p.alias}</b></td>
                  <td>{p.active ? 'dabei' : 'abgemeldet'}</td>
                  {!finished && (
                    <td>
                      <button
                        disabled={busy}
                        style={smallBtn}
                        onClick={() => {
                          if (!p.active) {
                            void setActive(p.id, true);
                          } else if (window.confirm(`„${p.alias}“ ab der nächsten Runde abmelden?`)) {
                            void setActive(p.id, false);
                          }
                        }}
                      >
                        {p.active ? 'Abmelden' : 'Wieder anmelden'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
