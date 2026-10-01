import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import AddStudentForm from './AddStudentForm';
import StudentCodeCell from './StudentCodeCell';
import TrainerNav from '@/app/trainer/TrainerNav';

export default async function TrainerDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');

  const students = await db.user.findMany({
    where: { role: 'STUDENT' },
    orderBy: { alias: 'asc' },
    include: {
      attempts: {
        select: { puzzleId: true, result: true, source: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h1>Übersicht Schach AG</h1>
        <form action="/api/auth/logout" method="post">
          <button className="logout-link" type="submit">abmelden</button>
        </form>
      </div>

      <TrainerNav active="students" />

      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h2>Neuen Schüler anlegen</h2>
        <p className="muted">Der Code ist danach in der Tabelle jederzeit über „Anzeigen“ abrufbar.</p>
        <AddStudentForm />
      </div>

      <div className="card">
        <h2>Fortschritt</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="results">
            <thead>
              <tr>
                <th>Alias</th>
                <th>Selbstständig</th>
                <th>Mit Tipp</th>
                <th>Lösung gesehen</th>
                <th>Selbst gewählt</th>
                <th>Letzte Aktivität</th>
                <th>Code</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const indep = s.attempts.filter((a) => a.result === 'SOLVED_INDEPENDENT').length;
                const withHint = s.attempts.filter((a) => a.result === 'SOLVED_WITH_HINT').length;
                const viewed = s.attempts.filter((a) => a.result === 'SOLUTION_VIEWED').length;
                const self = s.attempts.filter((a) => a.source === 'SELF').length;
                const last = s.attempts[0]?.createdAt;
                return (
                  <tr key={s.id}>
                    <td><b>{s.alias}</b></td>
                    <td>{indep}</td>
                    <td>{withHint}</td>
                    <td>{viewed}</td>
                    <td>{self}</td>
                    <td>{last ? new Date(last).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' }) : '—'}</td>
                    <td><StudentCodeCell studentId={s.id} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
