import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { createPairing, gameInclude, housekeeping, isFail, settleAll, toSummary } from '@/lib/live/game';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await housekeeping();
  await settleAll();

  const active = await db.game.findMany({
    where: { status: { in: ['WAITING', 'ACTIVE'] } },
    include: gameInclude,
    orderBy: { createdAt: 'asc' },
  });
  const recent = await db.game.findMany({
    where: { status: 'FINISHED' },
    include: gameInclude,
    orderBy: { finishedAt: 'desc' },
    take: 15,
  });
  return NextResponse.json({ active: active.map(toSummary), recent: recent.map(toSummary) });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as {
    whiteId?: string;
    blackId?: string;
    control?: string;
    fen?: string | null;
    random?: boolean;
  };
  const out = await createPairing({
    whiteId: body.whiteId ?? '',
    blackId: body.blackId ?? '',
    controlId: body.control ?? '',
    fen: body.fen ?? null,
    randomColors: body.random === true,
  });
  if (isFail(out)) return NextResponse.json({ error: out.error }, { status: out.status });
  console.log('[audit] Partie angesetzt');
  return NextResponse.json(toSummary(out));
}
