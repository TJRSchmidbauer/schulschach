import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import AddStudentForm from './AddStudentForm';

export default async function TrainerDashboard() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');

  const students = await db.user.findMany({
    where: { role: 'STUDENT' },
    orderBy: { alias: 'asc' },
    include: {
      attempts: {
        select: { puzzleId: true, result: true, hintsUsed: true, createdAt: true },
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

      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h2>Neuen Schüler anlegen</h2>
        <p className="muted">Der Code wird nur einmalig angezeigt – drucke ihn auf eine Karte.</p>
        <AddStudentForm />
      </div>

      <div className="card">
        <h2>Fortschritt</h2>
        <div style={{ overflowX: 'auto' }}>
          <table className="results">
            <thead>
              <tr>
                <th>Alias</th>
                <th>Gelöst selbstständig</th>
                <th>Mit Tipp</th>
                <th>Lösung angesehen</th>
                <th>Letzte Aktivität</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => {
                const indep = s.attempts.filter((a) => a.result === 'SOLVED_INDEPENDENT').length;
                const withHint = s.attempts.filter((a) => a.result === 'SOLVED_WITH_HINT').length;
                const viewed = s.attempts.filter((a) => a.result === 'SOLUTION_VIEWED').length;
                const last = s.attempts[0]?.createdAt;
                return (
                  <tr key={s.id}>
                    <td><b>{s.alias}</b></td>
                    <td>{indep}</td>
                    <td>{withHint}</td>
                    <td>{viewed}</td>
                    <td>{last ? new Date(last).toLocaleString('de-DE') : '—'}</td>
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
