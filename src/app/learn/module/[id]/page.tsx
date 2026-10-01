import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export default async function ModulePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') redirect('/');
  const { id } = await params;

  const mod = await db.module.findUnique({
    where: { id },
    include: { modulePuzzles: { orderBy: { sortOrder: 'asc' }, include: { puzzle: true } } },
  });
  if (!mod) notFound();

  const attempts = await db.attempt.findMany({ where: { userId: session.userId } });

  return (
    <div>
      <p><Link href="/learn">← Zur Übersicht</Link></p>
      <div className="card">
        <h1>{mod.title}</h1>
        <p className="muted" style={{ marginTop: 0 }}>{mod.contentMd}</p>
        <ul className="module-list">
          {mod.modulePuzzles.map((mp, i) => {
            const attempt = attempts.find((a) => a.puzzleId === mp.puzzleId);
            return (
              <li className="module-item" key={mp.puzzleId}>
                <Link href={`/practice/${mp.puzzleId}`}>
                  Aufgabe {i + 1}: {mp.puzzle.title}
                </Link>
                <span className={`badge ${attempt && attempt.result !== 'ABANDONED' ? 'badge-done' : ''}`}>
                  {attempt ? (attempt.result === 'SOLVED_INDEPENDENT' ? 'selbstständig' : attempt.result === 'SOLVED_WITH_HINT' ? 'mit Tipp' : 'Lösung angesehen') : 'offen'}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
