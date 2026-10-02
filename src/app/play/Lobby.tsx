'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CONTROLS, resultText, type GameSummary } from '@/lib/live/types';

type LobbyData = {
  me: { id: string; alias: string };
  mine: GameSummary | null;
  open: GameSummary[];
  recent: GameSummary[];
};

const field: React.CSSProperties = {
  textTransform: 'none',
  letterSpacing: 'normal',
  padding: '0.6rem 0.8rem',
  border: '2px solid #ddd3c3',
  borderRadius: 10,
  fontSize: '1rem',
  background: '#fdfbf7',
};

type Props = { controls: string[]; defaultControl: string; retentionDays: number };

export default function Lobby({ controls, defaultControl, retentionDays }: Props) {
  const router = useRouter();
  const [data, setData] = useState<LobbyData | null>(null);
  const [control, setControl] = useState(defaultControl);
  const [color, setColor] = useState('random');
  const [message, setMessage] = useState<string | null>(null);
  const loaded = useRef(false);
  const prev = useRef<{ id: string; status: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch('/api/games', { cache: 'no-store' });
    if (!res.ok) return;
    const d = (await res.json()) as LobbyData;
    setData(d);
    const m = d.mine;
    if (
      loaded.current &&
      m &&
      m.status === 'ACTIVE' &&
      (!prev.current || prev.current.id !== m.id || prev.current.status !== 'ACTIVE')
    ) {
      router.push(`/play/${m.id}`);
    }
    prev.current = m ? { id: m.id, status: m.status } : null;
    loaded.current = true;
  }, [router]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), 4000);
    return () => clearInterval(t);
  }, [load]);

  async function create() {
    setMessage(null);
    const res = await fetch('/api/games', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ control, color }),
    });
    const body = (await res.json().catch(() => ({}))) as { error?: string; id?: string };
    if (!res.ok || !body.id) {
      setMessage(body.error ?? 'Das hat nicht geklappt.');
      return;
    }
    router.push(`/play/${body.id}`);
  }

  async function join(id: string) {
    setMessage(null);
    const res = await fetch(`/api/games/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'join' }),
    });
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setMessage(body.error ?? 'Das hat nicht geklappt.');
      void load();
      return;
    }
    router.push(`/play/${id}`);
  }

  if (!data) return <div className='card'><p className='muted'>Lade …</p></div>;

  const mine = data.mine;

  return (
    <div>
      {mine && (
        <div className='card' style={{ marginBottom: '1.2rem' }}>
          <h2>{mine.status === 'ACTIVE' ? 'Deine Partie läuft' : 'Du wartest auf einen Gegner'}</h2>
          <p className='muted'>
            {mine.white?.alias ?? '?'} – {mine.black?.alias ?? '?'} · {mine.control}
            {mine.customStart ? ' · Startstellung vom Trainer' : ''}
          </p>
          <Link className='btn' href={`/play/${mine.id}`}>{mine.status === 'ACTIVE' ? 'Zur Partie' : 'Zum Warteraum'}</Link>
        </div>
      )}

      {!mine && (
        <div className='card' style={{ marginBottom: '1.2rem' }}>
          <h2>Neue Herausforderung</h2>
          <p className='muted'>Andere aus der AG sehen sie und können sie annehmen.</p>
          <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'end' }}>
            <div>
              <label htmlFor='ctl'>Bedenkzeit</label>
              <select id='ctl' value={control} onChange={(e) => setControl(e.target.value)} style={field}>
                {CONTROLS.filter((c) => controls.includes(c.id)).map((c) => (
                  <option key={c.id} value={c.id}>{c.id.replace('+', ' Min + ')} Sek</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor='col'>Farbe</label>
              <select id='col' value={color} onChange={(e) => setColor(e.target.value)} style={field}>
                <option value='random'>Zufall</option>
                <option value='w'>Weiß</option>
                <option value='b'>Schwarz</option>
              </select>
            </div>
            <button className='btn' style={{ width: 'auto', marginTop: 0, padding: '0.7rem 1.2rem' }} onClick={() => void create()}>
              Herausfordern
            </button>
          </div>
          {message && <p className='error'>{message}</p>}
        </div>
      )}

      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h2>Offene Herausforderungen</h2>
        {data.open.length === 0 && <p className='muted'>Im Moment wartet niemand auf einen Gegner.</p>}
        <ul className='module-list'>
          {data.open.map((g) => {
            const creator = g.white ?? g.black;
            const creatorColor = g.white ? 'Weiß' : 'Schwarz';
            return (
              <li className='module-item' key={g.id}>
                <span>
                  <b>{creator?.alias ?? '?'}</b> · {g.control} · spielt {creatorColor}
                </span>
                <button
                  className='hint-btn'
                  style={{ width: 'auto', marginTop: 0, padding: '0.4rem 0.9rem' }}
                  disabled={!!mine}
                  onClick={() => void join(g.id)}
                >
                  Annehmen
                </button>
              </li>
            );
          })}
        </ul>
        {mine && <p className='muted'>Beende zuerst deine aktuelle Partie, um eine neue zu beginnen.</p>}
        {message && mine && <p className='error'>{message}</p>}
      </div>

      <div className='card'>
        <h2>Deine letzten Partien</h2>
        {data.recent.length === 0 && <p className='muted'>Noch keine beendete Partie.</p>}
        <ul className='module-list'>
          {data.recent.map((g) => (
            <li className='module-item' key={g.id}>
              <span>
                {g.white?.alias ?? '?'} – {g.black?.alias ?? '?'}: {resultText(g)}
              </span>
              <Link href={`/play/${g.id}`}>Ansehen und analysieren</Link>
            </li>
          ))}
        </ul>
        <p className='muted' style={{ marginBottom: 0 }}>Beendete Partien bleiben {retentionDays} Tage gespeichert.</p>
      </div>
    </div>
  );
}
