import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { themeLabel } from '@/lib/themes';

type SearchParams = { theme?: string; level?: string };

export default async function FreePractice({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') redirect('/');
  const sp = await searchParams;

  const where: Prisma.PuzzleWhereInput = { published: true };
  if (sp.theme) where.themes = { has: sp.theme };
  if (sp.level === 'easy') where.rating = { lte: 750 };
  if (sp.level === 'mid') where.rating = { gte: 751, lte: 950 };
  if (sp.level === 'hard') where.rating = { gte: 951 };

  const puzzles = await db.puzzle.findMany({
    where,
    orderBy: [{ rating: 'asc' }, { title: 'asc' }],
    take: 60,
    select: { id: true, title: true, rating: true, themes: true },
  });
  const themeRows = await db.puzzle.findMany({ where: { published: true }, select: { themes: true } });
  const allThemes = Array.from(new Set(themeRows.flatMap((p) => p.themes))).sort();
  const attempts = await db.attempt.findMany({ where: { userId: session.userId }, select: { puzzleId: true, result: true } });
  const solved = new Set(attempts.filter((a) => a.result !== 'ABANDONED').map((a) => a.puzzleId));

  const field: React.CSSProperties = {
    textTransform: 'none',
    letterSpacing: 'normal',
    padding: '0.6rem 0.8rem',
    border: '2px solid #ddd3c3',
    borderRadius: 10,
    fontSize: '1rem',
    background: '#fdfbf7',
  };

  return (
    <div>
      <p><Link href="/learn">← Zur Übersicht</Link></p>
      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h1>Freies Üben</h1>
        <form method="get" style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'end' }}>
          <div>
            <label htmlFor="theme">Thema</label>
            <select id="theme" name="theme" defaultValue={sp.theme ?? ''} style={field}>
              <option value="">alle</option>
              {allThemes.map((t) => (
                <option key={t} value={t}>{themeLabel(t)}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="level">Schwierigkeit</label>
            <select id="level" name="level" defaultValue={sp.level ?? ''} style={field}>
              <option value="">alle</option>
              <option value="easy">leicht</option>
              <option value="mid">mittel</option>
              <option value="hard">schwer</option>
            </select>
          </div>
          <button className="btn" type="submit" style={{ width: 'auto', marginTop: 0, padding: '0.7rem 1.2rem' }}>Anzeigen</button>
        </form>
      </div>

      <div className="card">
        {puzzles.length === 0 && <p className="muted">Keine Aufgaben für diese Auswahl.</p>}
        <ul className="module-list">
          {puzzles.map((p) => (
            <li className="module-item" key={p.id}>
              <Link href={`/practice/${p.id}?s=1`}>{p.title}</Link>
              <span>
                <span className="muted" style={{ marginRight: '0.6rem' }}>{p.themes.map(themeLabel).join(', ')}</span>
                <span className={`badge ${solved.has(p.id) ? 'badge-done' : ''}`}>{solved.has(p.id) ? 'erledigt' : 'neu'}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
