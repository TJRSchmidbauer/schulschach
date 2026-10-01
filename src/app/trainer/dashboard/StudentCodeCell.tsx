'use client';

import { useState } from 'react';

const smallBtn: React.CSSProperties = {
  padding: '0.3rem 0.6rem',
  marginRight: '0.4rem',
  border: 'none',
  borderRadius: 8,
  background: '#efe6d2',
  color: '#54452a',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: '0.8rem',
};

export default function StudentCodeCell({ studentId }: { studentId: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [msg, setMsg] = useState('');

  async function call(action: 'reveal' | 'reissue') {
    setMsg('');
    if (action === 'reissue' && !window.confirm('Neuen Code ausstellen? Der alte Code wird sofort ungültig.')) return;
    const res = await fetch(`/api/trainer/students/${studentId}/code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    });
    if (!res.ok) {
      setCode(null);
      setMsg(res.status === 404 ? 'Kein Code gespeichert – bitte neu ausstellen.' : 'Fehler beim Abrufen.');
      return;
    }
    const body = (await res.json()) as { code: string };
    setCode(body.code);
  }

  return (
    <div>
      {code && <div style={{ fontWeight: 700, letterSpacing: '0.15em', marginBottom: '0.3rem' }}>{code}</div>}
      <button type="button" style={smallBtn} onClick={() => void call('reveal')}>Anzeigen</button>
      <button type="button" style={smallBtn} onClick={() => void call('reissue')}>Neu ausstellen</button>
      {msg && <div className="error" style={{ marginTop: '0.3rem' }}>{msg}</div>}
    </div>
  );
}
