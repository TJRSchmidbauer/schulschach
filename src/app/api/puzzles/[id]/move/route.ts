import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { firstSolverIndex, movesOf, parseUci, positionBefore } from '@/lib/puzzle';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const puzzle = await db.puzzle.findUnique({ where: { id } });
  if (!puzzle) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const body = (await req.json()) as { uci?: string; step?: number };
  const uci = (body.uci ?? '').toLowerCase();
  if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) return NextResponse.json({ error: 'invalid' }, { status: 400 });

  const step = Number.isInteger(body.step) && (body.step as number) >= 0 ? (body.step as number) : 0;
  const moves = movesOf(puzzle);
  const idx = firstSolverIndex(puzzle) + step * 2;
  if (idx >= moves.length) return NextResponse.json({ error: 'invalid_step' }, { status: 400 });

  let correct = uci === moves[idx];
  let mate = false;
  if (!correct) {
    try {
      const chess = positionBefore(puzzle, idx);
      const m = parseUci(uci);
      chess.move({ from: m.from, to: m.to, promotion: m.promotion });
      if (chess.isCheckmate()) {
        correct = true;
        mate = true;
      }
    } catch {
      correct = false;
    }
  }

  const done = correct && (mate || idx + 1 >= moves.length);
  const reply = correct && !done ? moves[idx + 1] : null;
  return NextResponse.json({ correct, done, reply });
}
