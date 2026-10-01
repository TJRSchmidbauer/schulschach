import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import TrainerNav from '@/app/trainer/TrainerNav';
import CloseAssignmentButton from './CloseAssignmentButton';

function fmtDate(d: Date) {
  return d.toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' });
}

export default async function TrainerAssignments() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');

  const students = await db.user.findMany({
    where: { role: 'STUDENT', active: true },
    orderBy: { alias: 'asc' },
    select: { id: true, alias: true },
  });
  const assignments = await db.assignment.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      puzzles: { select: { puzzleId: true } },
      targets: { select: { userId: true } },
      attempts: { select: { userId: true, puzzleId: true, result: true } },
    },
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h1>Hausaufgaben</h1>
        <p className="muted">Neue Hausaufgaben legst du unter „Übungen“ an.</p>
      </div>
      <TrainerNav active="assignments" />

      {assignments.length === 0 && <div className="card"><p className="muted">Noch keine Hausaufgaben angelegt.</p></div>}

      {assignments.map((a) => {
        const audience = a.targetAll ? students : students.filter((s) => a.targets.some((t) => t.userId === s.id));
        const puzzleIds = new Set(a.puzzles.map((p) => p.puzzleId));
        const rows = audience.map((s) => {
          const done = new Set(
            a.attempts
              .filter((x) => x.userId === s.id && x.result !== 'ABANDONED' && puzzleIds.has(x.puzzleId))
              .map((x) => x.puzzleId),
          );
          const withHelp = a.attempts.filter((x) => x.userId === s.id && (x.result === 'SOLVED_WITH_HINT' || x.result === 'SOLUTION_VIEWED')).length;
          return { id: s.id, alias: s.alias, done: done.size, withHelp };
        });
        const complete = rows.filter((r) => r.done >= puzzleIds.size).length;
        const overdue = a.dueAt ? Date.now() > a.dueAt.getTime() + 12 * 3600 * 1000 : false;

        return (
          <details key={a.id} className="card" style={{ marginBottom: '1rem' }}>
            <summary style={{ cursor: 'pointer', fontWeight: 700 }}>
              {a.title} · {puzzleIds.size} Aufgaben · {complete}/{rows.length} fertig
              {a.dueAt ? ` · fällig ${fmtDate(a.dueAt)}` : ''}
              {overdue && a.active ? ' · überfällig' : ''}
              {!a.active ? ' · beendet' : ''}
            </summary>
            <div style={{ overflowX: 'auto' }}>
              <table className="results">
                <thead>
                  <tr><th>Schüler</th><th>Erledigt</th><th>Mit Hilfe</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td><b>{r.alias}</b></td>
                      <td>{r.done}/{puzzleIds.size}</td>
                      <td>{r.withHelp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <CloseAssignmentButton id={a.id} active={a.active} />
          </details>
        );
      })}
    </div>
  );
}
