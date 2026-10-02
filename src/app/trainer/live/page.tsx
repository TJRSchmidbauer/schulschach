import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import TrainerNav from '@/app/trainer/TrainerNav';
import TrainerLive from './TrainerLive';

export default async function TrainerLivePage() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');

  const students = await db.user.findMany({
    where: { role: 'STUDENT', active: true },
    orderBy: { alias: 'asc' },
    select: { id: true, alias: true },
  });

  return (
    <div>
      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h1>Live-Partien</h1>
        <p className='muted' style={{ marginBottom: 0 }}>
          Partien ansetzen, live zusehen, mit Engine analysieren. Schüler können sich auch selbst herausfordern.
        </p>
      </div>
      <TrainerNav active='live' />
      <TrainerLive students={students} />
    </div>
  );
}
