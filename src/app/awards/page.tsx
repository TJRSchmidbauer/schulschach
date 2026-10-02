import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { medalScale } from '@/lib/extras';
import { getExtras } from '@/lib/extras-server';
import { computeStats, evaluateMedals } from '@/lib/medals';

const TIER_COLOR = { bronze: '#cd7f32', silver: '#9aa5b1', gold: '#d4a017' } as const;

export default async function AwardsPage() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') redirect('/');

  const attempts = await db.attempt.findMany({
    where: { userId: session.userId },
    select: { puzzleId: true, result: true, createdAt: true, puzzle: { select: { themes: true } } },
  });
  const stats = computeStats(
    attempts.map((a) => ({ puzzleId: a.puzzleId, result: a.result, createdAt: a.createdAt, themes: a.puzzle.themes })),
  );
  const extras = await getExtras();
  const medals = evaluateMedals(stats, medalScale(extras.medalLevel));
  const earned = medals.filter((m) => m.earned);
  const next = medals
    .filter((m) => !m.earned)
    .sort((a, b) => b.current / b.target - a.current / a.target)[0];

  const stat: React.CSSProperties = { textAlign: 'center', padding: '0.6rem 1rem' };
  const big: React.CSSProperties = { display: 'block', fontSize: '1.8rem', fontWeight: 700 };

  return (
    <div>
      <p><Link href="/learn">← Zur Übersicht</Link></p>

      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h1>Meine Medaillen</h1>
        <div style={{ display: 'flex', gap: '1.2rem', flexWrap: 'wrap' }}>
          <div style={stat}><b style={big}>{stats.solved}</b>Aufgaben gelöst</div>
          <div style={stat}><b style={big}>{stats.independent}</b>ohne Tipp</div>
          <div style={stat}><b style={big}>{stats.currentStreak}</b>Tage in Folge</div>
          <div style={stat}><b style={big}>{earned.length}/{medals.length}</b>Medaillen</div>
        </div>
        {next && (
          <p className="muted" style={{ marginBottom: 0 }}>
            Als Nächstes: {next.icon} <b>{next.title}</b> ({next.current}/{next.target}) – {next.text}
          </p>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.9rem' }}>
        {medals.map((m) => (
          <div
            key={m.id}
            className="card"
            style={{
              borderTop: `6px solid ${TIER_COLOR[m.tier]}`,
              opacity: m.earned ? 1 : 0.6,
              filter: m.earned ? 'none' : 'grayscale(0.8)',
            }}
          >
            <div style={{ fontSize: '2.2rem', lineHeight: 1 }}>{m.icon}</div>
            <h3 style={{ margin: '0.4rem 0 0.2rem' }}>{m.title}</h3>
            <p className="muted" style={{ margin: 0, fontSize: '0.9rem' }}>{m.text}</p>
            <div style={{ background: '#eee6d8', borderRadius: 8, height: 10, marginTop: '0.6rem', overflow: 'hidden' }}>
              <div style={{ width: `${Math.round((m.current / m.target) * 100)}%`, height: '100%', background: TIER_COLOR[m.tier] }} />
            </div>
            <p style={{ margin: '0.3rem 0 0', fontSize: '0.85rem' }}>{m.earned ? 'Geschafft!' : `${m.current} von ${m.target}`}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
