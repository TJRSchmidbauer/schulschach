import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import LiveBoard from '@/components/live/LiveBoard';

export default async function TrainerWatchPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');
  const { id } = await params;

  const game = await db.game.findUnique({ where: { id }, select: { id: true } });
  if (!game) notFound();

  return (
    <div>
      <p>
        <Link href='/trainer/live'>← Alle Live-Partien</Link>
      </p>
      <LiveBoard gameId={id} role='trainer' backHref='/trainer/live' />
    </div>
  );
}
