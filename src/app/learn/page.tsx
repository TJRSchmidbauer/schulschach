import Link from 'next/link';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

function fmtDate(d: Date) {
  return d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });
}

export default async function LearnPage() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') redirect('/');

  const paths = await db.learningPath.findMany({
    where: { active: true },
    orderBy: { sortOrder: 'asc' },
    include: {
      modules: {
        where: { active: true },
        orderBy: { sortOrder: 'asc' },
        include: { modulePuzzles: { include: { puzzle: true } } },
      },
    },
  });
  const attempts = await db.attempt.findMany({ where: { userId: session.userId } });
  const solved = new Set(attempts.filter((a) => a.result !== 'ABANDONED').map((a) => a.puzzleId));

  const assignments = await db.assignment.findMany({
    where: {
      active: true,
      OR: [{ targetAll: true }, { targets: { some: { userId: session.userId } } }],
    },
    orderBy: [{ dueAt: 'asc' }, { createdAt: 'desc' }],
    include: {
      puzzles: { orderBy: { sortOrder: 'asc' }, include: { puzzle: { select: { id: true, title: true } } } },
    },
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h1>Hallo, {session.user.alias}!</h1>
        <form action="/api/auth/logout" method="post">
          <button className="logout-link" type="submit">abmelden</button>
        </form>
      </div>

      {assignments.length > 0 && (
        <div className="card" style={{ marginBottom: '1.2rem' }}>
          <h2>Deine Hausaufgaben</h2>
          {assignments.map((a) => {
            const doneIds = new Set(
              attempts.filter((x) => x.assignmentId === a.id && x.result !== 'ABANDONED').map((x) => x.puzzleId),
            );
            const total = a.puzzles.length;
            const done = a.puzzles.filter((p) => doneIds.has(p.puzzleId)).length;
            const overdue = a.dueAt ? Date.now() > a.dueAt.getTime() + 12 * 3600 * 1000 && done < total : false;
            return (
              <div key={a.id} style={{ marginBottom: '1rem' }}>
                <p style={{ margin: '0 0 0.4rem' }}>
                  <b>{a.title}</b>{' '}
                  <span className={`badge ${done === total ? 'badge-done' : ''}`}>{done}/{total}</span>{' '}
                  {a.dueAt && (
                    <span className="muted">
                      fällig bis {fmtDate(a.dueAt)}{overdue ? ' (überfällig – bitte trotzdem noch erledigen)' : ''}
                    </span>
                  )}
                </p>
                <ul className="module-list">
                  {a.puzzles.map((p, i) => (
                    <li className="module-item" key={p.puzzleId}>
                      <Link href={`/practice/${p.puzzleId}`}>Aufgabe {i + 1}: {p.puzzle.title}</Link>
                      <span className={`badge ${doneIds.has(p.puzzleId) ? 'badge-done' : ''}`}>{doneIds.has(p.puzzleId) ? 'erledigt' : 'offen'}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}

      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h2>Freies Üben</h2>
        <p className="muted">Such dir selbst Aufgaben aus – dein Trainer sieht, was du übst.</p>
        <Link className="btn" href="/free">Aufgaben aussuchen</Link>
      </div>

      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h2>🏅 Meine Medaillen</h2>
        <p className="muted">Sammle Medaillen für gelöste Aufgaben und schau, wie weit du schon bist.</p>
        <Link className="btn" href="/awards">Medaillen ansehen</Link>
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
