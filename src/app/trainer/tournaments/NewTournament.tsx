'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const field: React.CSSProperties = {
  textTransform: 'none',
  letterSpacing: 'normal',
  padding: '0.55rem 0.75rem',
  border: '2px solid #ddd3c3',
  borderRadius: 10,
  fontSize: '1rem',
  background: '#fdfbf7',
  width: '100%',
  boxSizing: 'border-box',
};

export default function NewTournament({ students }: { students: string[] }) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [guestText, setGuestText] = useState('');
  const [roundsInput, setRoundsInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const guests = useMemo(() => guestText.split('\n').map((s) => s.trim()).filter(Boolean), [guestText]);
  const aliases = useMemo(() => [...students.filter((s) => picked.has(s)), ...guests], [students, picked, guests]);
  const n = aliases.length;
  const minRounds = Math.max(1, Math.ceil(Math.log2(Math.max(n, 2))) - 1);
  const maxRounds = Math.min(15, Math.max(1, n - 1));
  const recommended = Math.min(maxRounds, Math.max(minRounds, Math.ceil(Math.log2(Math.max(n, 2)))));
  const rounds = roundsInput ? Number(roundsInput) : recommended;

  function toggle(alias: string) {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(alias)) next.delete(alias);
      else next.add(alias);
      return next;
    });
  }

  async function submit() {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch('/api/trainer/tournaments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, rounds, aliases }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
      if (!res.ok || !body.id) {
        setError(body.error ?? 'Das hat nicht geklappt.');
        return;
      }
      router.push(`/trainer/tournaments/${body.id}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className='card'>
      <h2>Neues Turnier</h2>
      <label htmlFor='tt'>Name des Turniers</label>
      <input id='tt' type='text' value={title} onChange={(e) => setTitle(e.target.value)} style={field} maxLength={100} autoComplete='off' />

      <label>Teilnehmer aus der AG</label>
      {students.length === 0 && <p className='muted'>Es gibt noch keine aktiven Schüler.</p>}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
        <button type='button' className='logout-link' onClick={() => setPicked(new Set(students))}>Alle wählen</button>
        <button type='button' className='logout-link' onClick={() => setPicked(new Set())}>Keinen wählen</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem 1rem' }}>
        {students.map((s) => (
          <label key={s} style={{ display: 'inline-flex', gap: '0.3rem', margin: 0 }}>
            <input type='checkbox' checked={picked.has(s)} onChange={() => toggle(s)} /> {s}
          </label>
        ))}
      </div>

      <label htmlFor='tg'>Weitere Teilnehmer (Gast-Aliasse, ein Eintrag pro Zeile)</label>
      <textarea id='tg' value={guestText} onChange={(e) => setGuestText(e.target.value)} rows={6} style={field} placeholder={'Gast 1\nGast 2'} />
      <p className='muted'>
        Gast-Aliasse bleiben in diesem Browser, bis du „Turnier anlegen“ drückst. Danach liegen sie auf deinem Server, weil Runden und Ergebnisse gespeichert werden müssen. Bitte keine echten Namen eingeben.
      </p>

      <p><b>{n}</b> Teilnehmer (3 bis 100)</p>
      <label htmlFor='tr'>Runden (empfohlen: {recommended}, möglich: {minRounds} bis {maxRounds})</label>
      <input id='tr' type='number' min={minRounds} max={maxRounds} value={roundsInput} placeholder={String(recommended)} onChange={(e) => setRoundsInput(e.target.value)} style={{ ...field, width: 140 }} />

      <button className='btn' style={{ width: 'auto', padding: '0.7rem 1.4rem' }} disabled={busy || n < 3} onClick={() => void submit()}>
        Turnier anlegen
      </button>
      {error && <p className='error'>{error}</p>}
    </div>
  );
}
