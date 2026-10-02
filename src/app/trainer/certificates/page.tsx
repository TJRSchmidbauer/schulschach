import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { medalScale } from '@/lib/extras';
import { getExtras } from '@/lib/extras-server';
import { achievementText, computeStats, evaluateMedals } from '@/lib/medals';
import TrainerNav from '@/app/trainer/TrainerNav';
import TrainerCertificate from './TrainerCertificate';

export default async function TrainerCertificates() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');

  const extras = await getExtras();
  const scale = medalScale(extras.medalLevel);
  const students = await db.user.findMany({
    where: { role: 'STUDENT', active: true },
    orderBy: { alias: 'asc' },
    select: {
      alias: true,
      attempts: {
        select: { puzzleId: true, result: true, createdAt: true, puzzle: { select: { themes: true } } },
      },
    },
  });

  const options = students.map((s) => {
    const stats = computeStats(
      s.attempts.map((a) => ({ puzzleId: a.puzzleId, result: a.result, createdAt: a.createdAt, themes: a.puzzle.themes })),
    );
    const medals = evaluateMedals(stats, scale).filter((m) => m.earned).length;
    return { alias: s.alias, text: achievementText(stats.solved, medals) };
  });

  return (
    <div>
      <div className="card" style={{ marginBottom: '1.2rem' }}>
        <h1>Urkunden</h1>
        <p className="muted" style={{ marginBottom: 0 }}>
          Wähle ein Alias. Den echten Namen trägst du nur im Browser ein – er wird nicht an den Server gesendet.
        </p>
      </div>
      <TrainerNav active="certificates" />
      {options.length === 0 ? (
        <div className="card"><p className="muted">Es gibt noch keine aktiven Schülerinnen und Schüler.</p></div>
      ) : (
        <TrainerCertificate students={options} cert={extras.cert} />
      )}
    </div>
  );
}
