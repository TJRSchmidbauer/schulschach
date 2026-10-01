'use client';

import { useState } from 'react';

export default function AddStudentForm() {
  const [alias, setAlias] = useState('');
  const [issuedCode, setIssuedCode] = useState<string | null>(null);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIssuedCode(null);
    const res = await fetch('/api/trainer/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ alias }),
    });
    const body = await res.json();
    if (!res.ok) {
      setError(body.error ?? 'Fehler beim Anlegen.');
      return;
    }
    setIssuedCode(body.code);
    setAlias('');
  }

  return (
    <form onSubmit={submit}>
      <label htmlFor="alias">Alias anzeigen auf Karten, z. B. „Bauer-Mia“</label>
      <input id="alias" type="text" value={alias} onChange={(e) => setAlias(e.target.value)} maxLength={40} required />
      <button className="btn" type="submit">Alias speichern & Code erzeugen</button>
      {error && <p className="error">{error}</p>}
      {issuedCode && (
        <div className="good-box" style={{ marginTop: '1rem' }}>
          <p style={{ margin: 0, fontWeight: 700 }}>Diesen Code einmal ausdrucken:</p>
          <p style={{ fontSize: '1.4rem', letterSpacing: '0.2em', margin: '0.4rem 0' }}>{issuedCode}</p>
          <p style={{ margin: 0, fontSize: '0.85rem' }}>Danach ist er nicht mehr abrufbar.</p>
        </div>
      )}
    </form>
  );
}
