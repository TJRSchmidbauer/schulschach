import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { activeGameOf, createChallenge, gameInclude, housekeeping, isFail, settleAll, toSummary } from '@/lib/live/game';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const uid = session.userId;

  await housekeeping();
  await settleAll();

  const mine = await activeGameOf(uid);
  const waiting = await db.game.findMany({ where: { status: 'WAITING' }, include: gameInclude, orderBy: { createdAt: 'asc' } });
  const open = waiting.filter((g) => g.whiteId !== uid && g.blackId !== uid);
  const recent = await db.game.findMany({
    where: { status: 'FINISHED', OR: [{ whiteId: uid }, { blackId: uid }] },
    include: gameInclude,
    orderBy: { finishedAt: 'desc' },
    take: 10,
  });

  return NextResponse.json({
    me: { id: uid, alias: session.user.alias },
    mine: mine ? toSummary(mine) : null,
    open: open.map(toSummary),
    recent: recent.map(toSummary),
  });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { control?: string; color?: string };
  const out = await createChallenge(session.userId, body.control ?? '', body.color ?? 'random');
  if (isFail(out)) return NextResponse.json({ error: out.error }, { status: out.status });
  return NextResponse.json(toSummary(out));
}
