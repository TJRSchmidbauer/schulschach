import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

const VALID_RESULTS = ['SOLVED_INDEPENDENT', 'SOLVED_WITH_HINT', 'SOLUTION_VIEWED', 'ABANDONED'] as const;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json()) as {
    puzzleId?: string;
    result?: string;
    hintsUsed?: number;
    wrongAttempts?: number;
    durationSeconds?: number;
  };
  if (!body.puzzleId || !body.result || !VALID_RESULTS.includes(body.result as never)) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }
  const puzzle = await db.puzzle.findUnique({ where: { id: body.puzzleId } });
  if (!puzzle) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  await db.attempt.create({
    data: {
      userId: session.userId,
      puzzleId: body.puzzleId,
      result: body.result as never,
      hintsUsed: Math.min(3, body.hintsUsed ?? 0),
      wrongAttempts: body.wrongAttempts ?? 0,
      durationSeconds: body.durationSeconds ?? 0,
    },
  });
  return NextResponse.json({ ok: true });
}
