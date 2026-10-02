'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { CONTROLS, PRESETS, resultText, type GameSummary } from '@/lib/live/types';

const Chessboard = dynamic(() => import('react-chessboard').then((m) => m.Chessboard), { ssr: false });

type Student = { id: string; alias: string };
type ListData = { active: GameSummary[]; recent: GameSummary[] };

const field: React.CSSProperties = {
  textTransform: 'none',
  letterSpacing: 'normal',
  padding: '0.5rem 0.7rem',
  border: '2px solid #ddd3c3',
  borderRadius: 10,
  fontSize: '0.95rem',
  background: '#fdfbf7',
  width: '100%',
  boxSizing: 'border-box',
};

function names(g: GameSummary): string {
  return `${g.white?.alias ?? '?'} – ${g.black?.alias ?? '?'}`;
}

export default function TrainerLive({ students }: { students: Student[] }) {
  const [list, setList] = useState<ListData>({ active: [], recent: [] });
  const [whiteId, setWhiteId] = useState('');
  const [blackId, setBlackId] = useState('');
  const [control, setControl] = useState('10+0');
  const [random, setRandom] = useState(false);
  const [presetId, setPresetId] = useState<string>(PRESETS[0].id);
  const [fen, setFen] = useState<string>(PRESETS[0].fen);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/trainer/games', { cache: 'no-store' });
    if (res.ok) setList((await res.json()) as ListData);
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 5000);
    return () => clearInterval(t);
  }, [load]);

  const preview = useMemo(() => {
    try {
      return { ok: true as const, fen: new Chess(fen.trim()).fen() };
    } catch {
      return { ok: false as const, fen: '' };
    }
  }, [fen]);

  async function submit() {
    setMsg(null);
    const res = await fetch('/api/trainer/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ whiteId, blackId, control, fen: fen.trim() || null, random }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      setMsg({ ok: false, text: body.error ?? 'Das hat nicht geklappt.' });
      return;
    }
    setMsg({ ok: true, text: 'Partie angesetzt. Die beiden sehen sie in ihrer Lobby und werden dorthin geleitet.' });
    void load();
  }

  async function abort(id: string) {
    if (!window.confirm('Diese Partie abbrechen (ohne Ergebnis)?')) return;
    await fetch(`/api/trainer/games/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'abort' }),
    });
    void load();
  }

  return (
    <div>
      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h2>Partie ansetzen</h2>
        <p className='muted'>Du legst zwei Schüler fest. Optional beginnen sie mit einer bestimmten Stellung.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.8rem' }}>
          <div>
            <label htmlFor='tw'>Weiß</label>
            <select id='tw' value={whiteId} onChange={(e) => setWhiteId(e.target.value)} style={field}>
              <option value=''>bitte wählen</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.alias}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor='tb'>Schwarz</label>
            <select id='tb' value={blackId} onChange={(e) => setBlackId(e.target.value)} style={field}>
              <option value=''>bitte wählen</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.alias}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor='tc'>Bedenkzeit</label>
            <select id='tc' value={control} onChange={(e) => setControl(e.target.value)} style={field}>
              {CONTROLS.map((c) => <option key={c.id} value={c.id}>{c.id.replace('+', ' Min + ')} Sek</option>)}
            </select>
          </div>
          <div>
            <label htmlFor='tp'>Startstellung</label>
            <select
              id='tp'
              value={presetId}
              onChange={(e) => {
                const p = PRESETS.find((x) => x.id === e.target.value);
                if (p) {
                  setPresetId(p.id);
                  setFen(p.fen);
                }
              }}
              style={field}
            >
              {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </div>
        </div>

        <label htmlFor='tf'>Eigene Stellung (FEN, optional ändern)</label>
        <input id='tf' type='text' value={fen} onChange={(e) => setFen(e.target.value)} style={field} autoComplete='off' />
        {!preview.ok && <p className='error'>Die Stellung ist noch keine gültige FEN.</p>}
        {preview.ok && (
          <div style={{ marginTop: '0.6rem' }}>
            <Chessboard position={preview.fen} boardWidth={220} arePiecesDraggable={false} />
          </div>
        )}

        <label style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginTop: '0.8rem' }}>
          <input type='checkbox' checked={random} onChange={(e) => setRandom(e.target.checked)} /> Farben zufällig tauschen
        </label>
        <button className='btn' style={{ width: 'auto', padding: '0.7rem 1.4rem' }} onClick={() => void submit()}>
          Partie ansetzen
        </button>
        {msg && <p className={msg.ok ? 'info' : 'error'}>{msg.text}</p>}
      </div>

      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h2>Laufende und wartende Partien</h2>
        {list.active.length === 0 && <p className='muted'>Gerade läuft keine Partie.</p>}
        <ul className='module-list'>
          {list.active.map((g) => (
            <li className='module-item' key={g.id}>
              <span>
                <b>{names(g)}</b> · {g.control} · {g.moveCount} Halbzüge
                {g.customStart ? ' · eigene Stellung' : ''}
                {g.status === 'WAITING' ? ' · wartet auf Gegner' : ''}
              </span>
              <span style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
                <Link href={`/trainer/live/${g.id}`}>Zuschauen</Link>
                <button className='logout-link' style={{ color: '#b34747' }} onClick={() => void abort(g.id)}>Abbrechen</button>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className='card'>
        <h2>Zuletzt beendet</h2>
        {list.recent.length === 0 && <p className='muted'>Noch keine beendete Partie.</p>}
        <ul className='module-list'>
          {list.recent.map((g) => (
            <li className='module-item' key={g.id}>
              <span>{names(g)}: {resultText(g)}</span>
              <Link href={`/trainer/live/${g.id}`}>Ansehen und analysieren</Link>
            </li>
          ))}
        </ul>
        <p className='muted' style={{ marginBottom: 0 }}>Beendete Partien werden nach 90 Tagen automatisch gelöscht.</p>
      </div>
    </div>
  );
}
