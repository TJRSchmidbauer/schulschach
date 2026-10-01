import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const puzzle = await db.puzzle.findUnique({ where: { id } });
  if (!puzzle) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const { uci } = (await req.json()) as { uci?: string };
  const correct = !!uci && uci.toLowerCase() === puzzle.solutionUci.toLowerCase();
  return NextResponse.json({ correct });
}
