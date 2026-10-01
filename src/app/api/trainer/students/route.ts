import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { codeLookupHash, getSession, scryptHash } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { alias } = (await req.json()) as { alias?: string };
  if (!alias || alias.trim().length < 2) return NextResponse.json({ error: 'Alias fehlt' }, { status: 400 });
  const trimmed = alias.trim();
  const exists = await db.user.findUnique({ where: { alias: trimmed } });
  if (exists) return NextResponse.json({ error: 'Alias ist schon vergeben' }, { status: 409 });
  const code = crypto.randomBytes(5).toString('hex').toUpperCase();
  await db.user.create({
    data: {
      alias: trimmed,
      codeLookup: codeLookupHash(code),
      codeHash: scryptHash(code),
    },
  });
  return NextResponse.json({ alias: trimmed, code });
}
