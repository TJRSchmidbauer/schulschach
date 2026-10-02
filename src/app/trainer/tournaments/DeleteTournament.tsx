'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DeleteTournament({ id, title, goTo }: { id: string; title: string; goTo?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    if (!window.confirm(`Turnier „${title}“ endgültig löschen? Alle Runden und Ergebnisse gehen verloren.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/trainer/tournaments/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string };
        setError(body.error ?? 'Das hat nicht geklappt.');
        return;
      }
      if (goTo) router.push(goTo);
      router.refresh();
    } catch {
      setError('Keine Verbindung zum Server.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span>
      <button type='button' className='logout-link' disabled={busy} onClick={() => void remove()}>
        Löschen
      </button>
      {error && <span className='error'> {error}</span>}
    </span>
  );
}
