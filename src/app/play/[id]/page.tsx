import { notFound, redirect } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import LiveBoard from '@/components/live/LiveBoard';

export default async function PlayGamePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') redirect('/');
  const { id } = await params;

  const game = await db.game.findUnique({ where: { id }, select: { whiteId: true, blackId: true } });
  if (!game || (game.whiteId !== session.userId && game.blackId !== session.userId)) notFound();

  return <LiveBoard gameId={id} role='player' myId={session.userId} backHref='/play' />;
}
