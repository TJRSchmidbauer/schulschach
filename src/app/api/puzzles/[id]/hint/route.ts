import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const puzzle = await db.puzzle.findUnique({ where: { id } });
  if (!puzzle) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const level = Number(new URL(req.url).searchParams.get('level') ?? '1');
  const sol = puzzle.solutionUci;
  const source = sol.slice(0, 2);
  const target = sol.slice(2, 4);

  if (level <= 1) return NextResponse.json({ text: puzzle.hint, source });
  if (level === 2) return NextResponse.json({ source, target });
  return NextResponse.json({ solution: sol, explanation: puzzle.explanation });
}
