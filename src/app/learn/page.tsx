import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export default async function LearnPage() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') redirect('/');

  const paths = await db.learningPath.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      modules: { orderBy: { sortOrder: 'asc' }, include: { modulePuzzles: { include: { puzzle: true } } } },
    },
  });
  const attempts = await db.attempt.findMany({ where: { userId: session.userId } });
  const solved = new Set(
    attempts
      .filter((a) => a.result !== 'ABANDONED')
      .map((a) => a.puzzleId)
  );

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h1>Hallo, {session.user.alias}!</h1>
        <form action="/api/auth/logout" method="post">
          <button className="logout-link" type="submit">abmelden</button>
        </form>
      </div>

      {paths.map((path) => (
        <div className="card" key={path.id} style={{ marginBottom: '1.2rem' }}>
          <h2>{path.title}</h2>
          <p className="muted">{path.description}</p>
          <ul className="module-list">
            {path.modules.map((m) => {
              const total = m.modulePuzzles.length;
              const done = m.modulePuzzles.filter((mp) => solved.has(mp.puzzleId)).length;
              return (
                <li className="module-item" key={m.id}>
                  <Link href={`/learn/module/${m.id}`}>
                    {m.sortOrder}. {m.title}
                  </Link>
                  <span className={`badge ${done === total && total > 0 ? 'badge-done' : ''}`}>
                    {done}/{total}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
