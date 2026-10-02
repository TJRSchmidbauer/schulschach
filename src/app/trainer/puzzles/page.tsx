import { redirect } from 'next/navigation';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { themeLabel } from '@/lib/themes';
import { startFen } from '@/lib/puzzle';
import TrainerNav from '@/app/trainer/TrainerNav';
import PuzzleAssignForm from './PuzzleAssignForm';

type SearchParams = { q?: string; theme?: string; min?: string; max?: string };

export default async function TrainerPuzzles({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');
  const sp = await searchParams;

  const min = Number(sp.min) || 0;
  const max = Number(sp.max) || 4000;
  const where: Prisma.PuzzleWhereInput = { published: true, rating: { gte: min, lte: max } };
  if (sp.theme) where.themes = { has: sp.theme };
  if (sp.q) where.title = { contains: sp.q, mode: 'insensitive' };

  const total = await db.puzzle.count({ where });
  const found = await db.puzzle.findMany({
    where,
    orderBy: [{ rating: 'asc' }, { title: 'asc' }],
    take: 200,
    select: { id: true, title: true, rating: true, themes: true, fen: true, origin: true, solutionUci: true },
  });
  const puzzles = found.map((p) => ({
    id: p.id,
    title: p.title,
    rating: p.rating,
    themes: p.themes,
    fen: startFen(p),
  }));

  const themeRows = await db.$queryRaw<{ theme: string }[]>`SELECT DISTINCT unnest(themes) AS theme FROM "Puzzle" WHERE published = true ORDER BY theme`;
  const allThemes = themeRows.map((r) => r.theme);
  const students = await db.user.findMany({
    where: { role: 'STUDENT', active: true },
    orderBy: { alias: 'asc' },
    select: { id: true, alias: true },
  });

  const field: React.CSSProperties = {
    textTransform: 'none',
    letterSpacing: 'normal',
    padding: '0.5rem 0.7rem',
    border: '2px solid #ddd3c3',
    borderRadius: 10,
    fontSize: '0.95rem',
    background: '#fdfbf7',
  };

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h1>Übungen</h1>
        <p className="muted">
          {total} Aufgaben gefunden{total > 200 ? ' (die ersten 200 werden angezeigt – bitte weiter filtern)' : ''}. Filtern, Brett ansehen und als Hausaufgabe freischalten.
        </p>
      </div>
      <TrainerNav active="puzzles" />

      <form method="get" className="card" style={{ marginBottom: '1.2rem', display: 'flex', gap: '0.7rem', flexWrap: 'wrap', alignItems: 'end' }}>
        <div>
          <label htmlFor="q">Suche</label>
          <input id="q" name="q" type="text" defaultValue={sp.q ?? ''} style={field} />
        </div>
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
          <label htmlFor="min">Rating von</label>
          <input id="min" name="min" type="number" defaultValue={sp.min ?? ''} style={{ ...field, width: 100 }} />
        </div>
        <div>
          <label htmlFor="max">bis</label>
          <input id="max" name="max" type="number" defaultValue={sp.max ?? ''} style={{ ...field, width: 100 }} />
        </div>
        <button className="btn" type="submit" style={{ width: 'auto', marginTop: 0, padding: '0.6rem 1.2rem' }}>Filtern</button>
      </form>

      <PuzzleAssignForm puzzles={puzzles} students={students} />
    </div>
  );
}
