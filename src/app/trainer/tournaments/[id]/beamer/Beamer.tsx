'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { RESULT_LABEL } from '@/lib/tournament/types';
import { fmtPts, nameMap, type TView } from '@/lib/tournament/client';

const tab: React.CSSProperties = {
  padding: '0.4rem 1rem',
  border: 'none',
  borderRadius: 999,
  fontWeight: 700,
  fontSize: '1rem',
  cursor: 'pointer',
};

export default function Beamer({ id }: { id: string }) {
  const [t, setT] = useState<TView | null>(null);
  const [view, setView] = useState<'pairings' | 'standings'>('pairings');
  const [auto, setAuto] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/trainer/tournaments/${id}`, { cache: 'no-store' });
    if (res.ok) setT((await res.json()) as TView);
  }, [id]);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 5000);
    return () => clearInterval(timer);
  }, [load]);

  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => setView((v) => (v === 'pairings' ? 'standings' : 'pairings')), 15000);
    return () => clearInterval(timer);
  }, [auto]);

  const names = t ? nameMap(t) : new Map<string, string>();
  const nm = (pid: string | null) => (pid ? names.get(pid) ?? '?' : '');
  const published = t ? t.roundsList.filter((r) => r.published) : [];
  const round = published[published.length - 1];
  const manyBoards = !!round && round.pairings.length > 14;
  const manyPlayers = !!t && t.standings.length > 30;
  const big = manyBoards ? '1.35rem' : '2rem';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: '#f4efe6', overflow: 'auto', padding: '1rem 2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '2.4rem', margin: 0, flex: 1 }}>{t ? t.title : 'Turnier'}</h1>
        <button style={{ ...tab, background: view === 'pairings' ? '#2f7d5c' : '#e7dfd0', color: view === 'pairings' ? '#ffffff' : '#26221c' }} onClick={() => setView('pairings')}>Paarungen</button>
        <button style={{ ...tab, background: view === 'standings' ? '#2f7d5c' : '#e7dfd0', color: view === 'standings' ? '#ffffff' : '#26221c' }} onClick={() => setView('standings')}>Rangliste</button>
        <label style={{ display: 'inline-flex', gap: '0.3rem', margin: 0, fontSize: '1rem' }}>
          <input type='checkbox' checked={auto} onChange={(e) => setAuto(e.target.checked)} /> automatisch wechseln
        </label>
        <button style={{ ...tab, background: '#e7dfd0' }} onClick={() => void document.documentElement.requestFullscreen?.()}>Vollbild</button>
        <Link href={`/trainer/tournaments/${id}`} style={{ fontSize: '1rem' }}>Zurück</Link>
      </div>

      {!t && <p style={{ fontSize: '1.5rem' }}>Lade …</p>}

      {t && view === 'pairings' && (
        <div>
          {!round && <p style={{ fontSize: '1.8rem' }}>Die erste Runde wurde noch nicht veröffentlicht.</p>}
          {round && (
            <div>
              <h2 style={{ fontSize: '2rem' }}>Runde {round.number} von {t.rounds}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: manyBoards ? '1fr 1fr' : '1fr', gap: '0.4rem 2.5rem' }}>
                {round.pairings.map((p) => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '3.5rem 1fr 7rem 1fr', gap: '0.8rem', alignItems: 'center', fontSize: big, padding: '0.3rem 0', borderBottom: '1px solid #ddd3c3' }}>
                    <span style={{ color: '#7b7060' }}>{p.board}</span>
                    <b>{nm(p.whiteId)}</b>
                    <span style={{ textAlign: 'center', fontWeight: 700 }}>{p.blackId ? (p.result === 'UNPLAYED' ? '–' : RESULT_LABEL[p.result]) : 'Freilos'}</span>
                    <b>{nm(p.blackId)}</b>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '1rem', color: '#7b7060' }}>Weiß steht links, Schwarz rechts.</p>
            </div>
          )}
        </div>
      )}

      {t && view === 'standings' && (
        <div>
          <h2 style={{ fontSize: '2rem' }}>Rangliste{round ? ` nach Runde ${round.number}` : ''}</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: manyPlayers ? '1.1rem' : '1.8rem' }}>
            <thead>
              <tr style={{ textAlign: 'left', color: '#7b7060' }}>
                <th>Platz</th><th>Alias</th><th>Punkte</th><th>Buchholz</th><th>Fein-B.</th><th>Sonneborn-B.</th>
              </tr>
            </thead>
            <tbody>
              {t.standings.map((s, i) => (
                <tr key={s.id} style={{ borderBottom: '1px solid #ddd3c3', opacity: s.active ? 1 : 0.6 }}>
                  <td>{i + 1}</td>
                  <td><b>{s.alias}</b>{!s.active && <span style={{ color: '#7b7060', fontSize: '0.7em' }}> abgemeldet</span>}</td>
                  <td>{fmtPts(s.points)}</td>
                  <td>{fmtPts(s.buchholz)}</td>
                  <td>{fmtPts(s.feinbuchholz)}</td>
                  <td>{fmtPts(s.sonnebornBerger)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
