import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const puzzle = await db.puzzle.findUnique({ where: { id } });
  if (!puzzle || !puzzle.published) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json({ id: puzzle.id, fen: puzzle.fen, title: puzzle.title, hint: puzzle.hint });
}
