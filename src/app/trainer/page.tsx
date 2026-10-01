'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TrainerLogin() {
  const router = useRouter();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const res = await fetch('/api/auth/trainer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });
    if (!res.ok) {
      setError(res.status === 503 ? 'Trainerzugang ist noch nicht konfiguriert.' : 'Ungültiger Trainer-Code.');
      return;
    }
    router.push('/trainer/dashboard');
    router.refresh();
  }

  return (
    <div className="center-wrap">
      <div className="card card-narrow">
        <h1>Trainerbereich</h1>
        <p className="muted">Nur für begleitende Lehrkräfte.</p>
        <form onSubmit={handleLogin}>
          <label htmlFor="tcode">Trainer-Code</label>
          <input
            id="tcode"
            type="password"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            autoComplete="off"
            required
          />
          <button className="btn" type="submit">Anmelden</button>
          {error && <p className="error">{error}</p>}
        </form>
      </div>
    </div>
  );
}
