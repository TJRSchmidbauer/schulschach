'use client';

import dynamic from 'next/dynamic';
import { Fragment, useState } from 'react';
import { themeLabel } from '@/lib/themes';

const Chessboard = dynamic(() => import('react-chessboard').then((m) => m.Chessboard), { ssr: false });

type PuzzleRow = { id: string; title: string; rating: number; themes: string[]; fen: string };
type StudentRow = { id: string; alias: string };

const plain: React.CSSProperties = {
  textTransform: 'none',
  letterSpacing: 'normal',
  width: '100%',
  padding: '0.7rem 0.9rem',
  border: '2px solid #ddd3c3',
  borderRadius: 12,
  fontSize: '1rem',
  background: '#fdfbf7',
};

function toggle(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

export default function PuzzleAssignForm({ puzzles, students }: { puzzles: PuzzleRow[]; students: StudentRow[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [targetAll, setTargetAll] = useState(true);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState('');
  const [dueAt, setDueAt] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit() {
    setMsg(null);
    const res = await fetch('/api/trainer/assignments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        dueAt: dueAt || null,
        puzzleIds: Array.from(selected),
        targetAll,
        studentIds: Array.from(chosen),
      }),
    });
    const body = (await res.json()) as { error?: string };
    if (!res.ok) {
      setMsg({ ok: false, text: body.error ?? 'Fehler beim Anlegen.' });
      return;
    }
    setMsg({ ok: true, text: 'Hausaufgabe wurde freigeschaltet.' });
    setSelected(new Set());
    setTitle('');
  }

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h2>Hausaufgabe erstellen</h2>
        <label htmlFor="as-title">Titel</label>
        <input id="as-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={80} style={plain} />
        <label htmlFor="as-due">Fällig bis (optional)</label>
        <input id="as-due" type="date" value={dueAt} onChange={(e) => setDueAt(e.target.value)} style={plain} />
        <label>Für wen?</label>
        <div>
          <label style={{ display: 'inline-flex', gap: '0.4rem', marginRight: '1rem', margin: 0 }}>
            <input type="radio" checked={targetAll} onChange={() => setTargetAll(true)} /> Alle Schüler
          </label>
          <label style={{ display: 'inline-flex', gap: '0.4rem', margin: 0 }}>
            <input type="radio" checked={!targetAll} onChange={() => setTargetAll(false)} /> Auswahl
          </label>
        </div>
        {!targetAll && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.7rem', marginTop: '0.6rem' }}>
            {students.map((s) => (
              <label key={s.id} style={{ display: 'inline-flex', gap: '0.3rem', margin: 0 }}>
                <input type="checkbox" checked={chosen.has(s.id)} onChange={() => setChosen(toggle(chosen, s.id))} /> {s.alias}
              </label>
            ))}
          </div>
        )}
        <p className="muted">{selected.size} Aufgabe(n) ausgewählt</p>
        <button className="btn" type="button" onClick={() => void submit()}>Hausaufgabe freischalten</button>
        {msg && <p className={msg.ok ? 'info' : 'error'}>{msg.text}</p>}
      </div>

      <div className="card">
        <h2>Aufgaben ({puzzles.length})</h2>
        <button
          type="button"
          className="btn btn-secondary"
          style={{ width: 'auto', marginTop: 0, padding: '0.5rem 1rem' }}
          onClick={() => setSelected(selected.size === puzzles.length ? new Set() : new Set(puzzles.map((p) => p.id)))}
        >
          {selected.size === puzzles.length ? 'Auswahl aufheben' : 'Alle auswählen'}
        </button>
        <div style={{ overflowX: 'auto' }}>
          <table className="results">
            <thead>
              <tr><th></th><th>Aufgabe</th><th>Rating</th><th>Themen</th><th>Vorschau</th></tr>
            </thead>
            <tbody>
              {puzzles.map((p) => (
                <Fragment key={p.id}>
                  <tr>
                    <td><input type="checkbox" checked={selected.has(p.id)} onChange={() => setSelected(toggle(selected, p.id))} /></td>
                    <td><b>{p.title}</b></td>
                    <td>{p.rating}</td>
                    <td>{p.themes.map(themeLabel).join(', ')}</td>
                    <td>
                      <button type="button" className="logout-link" style={{ color: '#245f46' }} onClick={() => setPreview(preview === p.id ? null : p.id)}>
                        {preview === p.id ? 'schließen' : 'Brett'}
                      </button>
                    </td>
                  </tr>
                  {preview === p.id && (
                    <tr>
                      <td colSpan={5}>
                        <Chessboard position={p.fen} boardWidth={240} arePiecesDraggable={false} />
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
