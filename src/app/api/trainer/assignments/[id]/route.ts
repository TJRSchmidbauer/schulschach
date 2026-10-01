import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const { active } = (await req.json()) as { active?: boolean };
  if (typeof active !== 'boolean') return NextResponse.json({ error: 'invalid' }, { status: 400 });
  const exists = await db.assignment.findUnique({ where: { id } });
  if (!exists) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  await db.assignment.update({ where: { id }, data: { active } });
  return NextResponse.json({ ok: true });
}
