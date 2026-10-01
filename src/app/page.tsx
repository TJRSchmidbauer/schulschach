'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      if (!res.ok) {
        setError('Das hat leider nicht geklappt. Prüfe deinen Code.');
        return;
      }
      router.push('/learn');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-wrap">
      <div className="card card-narrow">
        <h1>Willkommen in der Schach AG</h1>
        <p className="muted">Gib deinen persönlichen Code aus deiner Karte ein.</p>
        <form onSubmit={handleLogin}>
          <label htmlFor="code">Dein AG-Code</label>
          <input
            id="code"
            type="password"
            autoComplete="off"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="z. B. A1B2C3D4E5"
            required
          />
          <button className="btn" disabled={loading} type="submit">
            {loading ? 'Prüfe ...' : 'Los geht’s'}
          </button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
