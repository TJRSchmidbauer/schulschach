import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { createTournament, housekeeping, isFail, view } from '@/lib/tournament/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await housekeeping();
  const rows = await db.tournament.findMany({
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    include: { players: { select: { id: true } }, roundsList: { select: { number: true } } },
    take: 30,
  });
  return NextResponse.json(rows.map((t) => ({ id: t.id, title: t.title, status: t.status, rounds: t.rounds, players: t.players.length, currentRound: t.roundsList.length, createdAt: t.createdAt.getTime() })));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { title?: string; rounds?: number; aliases?: string[] };
  const created = await createTournament(body.title ?? '', Number(body.rounds), body.aliases ?? []);
  if (isFail(created)) return NextResponse.json({ error: created.error }, { status: created.status });
  console.log('[audit] Turnier angelegt');
  return NextResponse.json(view(created));
}
