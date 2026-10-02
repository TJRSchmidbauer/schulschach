'use client';

import { useState } from 'react';
import type { GroupState } from '@/lib/groups';

const field: React.CSSProperties = {
  textTransform: 'none',
  letterSpacing: 'normal',
  padding: '0.55rem 0.75rem',
  border: '2px solid #ddd3c3',
  borderRadius: 10,
  fontSize: '1rem',
  background: '#fdfbf7',
  boxSizing: 'border-box',
};

const smallBtn: React.CSSProperties = {
  padding: '0.4rem 0.9rem',
  border: 'none',
  borderRadius: 8,
  background: '#efe6d2',
  color: '#54452a',
  fontWeight: 700,
  cursor: 'pointer',
};

function drafts(s: GroupState): Record<string, string[]> {
  return Object.fromEntries(s.groups.map((g) => [g.id, g.pathIds]));
}

export default function GroupsManager({ initial }: { initial: GroupState }) {
  const [state, setState] = useState<GroupState>(initial);
  const [draftPaths, setDraftPaths] = useState<Record<string, string[]>>(() => drafts(initial));
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function send(body: Record<string, unknown>): Promise<boolean> {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/trainer/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = (await res.json().catch(() => ({}))) as Partial<GroupState> & { error?: string };
      if (!res.ok) {
        setMsg(data.error ?? 'Das hat nicht geklappt.');
        return false;
      }
      const next = data as GroupState;
      setState(next);
      setDraftPaths(drafts(next));
      return true;
    } catch {
      setMsg('Keine Verbindung zum Server.');
      return false;
    } finally {
      setBusy(false);
    }
  }

  function togglePath(groupId: string, pathId: string, on: boolean) {
    setDraftPaths((prev) => {
      const cur = new Set(prev[groupId] ?? []);
      if (on) cur.add(pathId);
      else cur.delete(pathId);
      return { ...prev, [groupId]: Array.from(cur) };
    });
  }

  return (
    <div>
      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h2>Neue Gruppe</h2>
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input type='text' value={name} maxLength={40} onChange={(e) => setName(e.target.value)} placeholder='Name der Gruppe' aria-label='Name der Gruppe' style={{ ...field, width: 260 }} autoComplete='off' />
          <button
            className='btn'
            style={{ width: 'auto', marginTop: 0, padding: '0.6rem 1.2rem' }}
            disabled={busy || name.trim().length < 2}
            onClick={() => void send({ action: 'create', name }).then((ok) => { if (ok) setName(''); })}
          >
            Gruppe anlegen
          </button>
        </div>
        {msg && <p className='error'>{msg}</p>}
      </div>

      {state.groups.length === 0 && (
        <div className='card' style={{ marginBottom: '1.2rem' }}>
          <p className='muted' style={{ margin: 0 }}>Es gibt noch keine Gruppe.</p>
        </div>
      )}

      {state.groups.map((g) => {
        const picked = draftPaths[g.id] ?? [];
        const changed = picked.slice().sort().join(',') !== g.pathIds.slice().sort().join(',');
        return (
          <div className='card' key={g.id} style={{ marginBottom: '1.2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
              <h2 style={{ margin: 0 }}>{g.name} <span className='muted'>· {g.members} Mitglieder</span></h2>
              <span style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  style={smallBtn}
                  disabled={busy}
                  onClick={() => {
                    const next = window.prompt('Neuer Name der Gruppe', g.name);
                    if (next && next.trim() !== g.name) void send({ action: 'rename', id: g.id, name: next });
                  }}
                >
                  Umbenennen
                </button>
                <button
                  style={smallBtn}
                  disabled={busy}
                  onClick={() => {
                    if (window.confirm(`Gruppe „${g.name}“ löschen? Die Mitglieder bleiben erhalten und sehen danach wieder alle Lernpfade.`)) void send({ action: 'delete', id: g.id });
                  }}
                >
                  Löschen
                </button>
              </span>
            </div>

            <p className='muted'>Lernpfade dieser Gruppe (ohne Auswahl sehen die Mitglieder alle):</p>
            {state.paths.length === 0 && <p className='muted'>Es gibt noch keine aktiven Lernpfade.</p>}
            {state.paths.map((p) => (
              <label key={p.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', margin: '0.4rem 0', fontWeight: 400 }}>
                <input type='checkbox' checked={picked.includes(p.id)} onChange={(e) => togglePath(g.id, p.id, e.target.checked)} />
                <span>{p.title}</span>
              </label>
            ))}
            <button
              className='btn'
              style={{ width: 'auto', marginTop: '0.8rem', padding: '0.6rem 1.2rem' }}
              disabled={busy || !changed}
              onClick={() => void send({ action: 'setPaths', id: g.id, pathIds: picked })}
            >
              Lernpfade speichern
            </button>
          </div>
        );
      })}

      <div className='card'>
        <h2>Schüler zuordnen</h2>
        {state.students.length === 0 && <p className='muted'>Es gibt noch keine aktiven Schüler.</p>}
        <div style={{ overflowX: 'auto' }}>
          <table className='results'>
            <thead><tr><th>Alias</th><th>Gruppe</th></tr></thead>
            <tbody>
              {state.students.map((s) => (
                <tr key={s.id}>
                  <td><b>{s.alias}</b></td>
                  <td>
                    <select
                      value={s.groupId ?? ''}
                      disabled={busy}
                      aria-label={`Gruppe für ${s.alias}`}
                      onChange={(e) => void send({ action: 'assign', userId: s.id, groupId: e.target.value === '' ? null : e.target.value })}
                      style={{ ...field, padding: '0.35rem 0.6rem' }}
                    >
                      <option value=''>keine Gruppe</option>
                      {state.groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
