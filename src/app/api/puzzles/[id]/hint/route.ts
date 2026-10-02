import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import { firstSolverIndex, movesOf } from '@/lib/puzzle';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const puzzle = await db.puzzle.findUnique({ where: { id } });
  if (!puzzle) return NextResponse.json({ error: 'not_found' }, { status: 404 });

  const url = new URL(req.url);
  const level = Number(url.searchParams.get('level') ?? '1');
  const step = Math.max(0, Number(url.searchParams.get('step') ?? '0') || 0);
  const moves = movesOf(puzzle);
  const sol = moves[firstSolverIndex(puzzle) + step * 2];
  if (!sol) return NextResponse.json({ error: 'invalid_step' }, { status: 400 });

  const source = sol.slice(0, 2);
  const target = sol.slice(2, 4);
  if (level <= 1) return NextResponse.json({ text: puzzle.hint, source });
  if (level === 2) return NextResponse.json({ source, target });
  return NextResponse.json({ solution: sol, source, target, explanation: puzzle.explanation });
}
