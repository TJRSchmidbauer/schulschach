import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, scryptVerify } from '@/lib/auth';

export async function POST(req: Request) {
  const hash = process.env.TRAINER_CODE_HASH;
  if (!hash) return NextResponse.json({ error: 'Trainer login nicht konfiguriert' }, { status: 503 });

  const { code } = (await req.json()) as { code?: string };
  if (!code || !scryptVerify(code, hash)) {
    return NextResponse.json({ error: 'Ungültig' }, { status: 401 });
  }

  let trainer = await db.user.findFirst({ where: { role: 'TRAINER' } });
  trainer ??= await db.user.create({
    data: {
      alias: 'Trainer',
      role: 'TRAINER',
      codeLookup: 'TRAINER',
      codeHash: hash,
    },
  });
  await createSession(trainer.id, 'TRAINER');
  return NextResponse.json({ ok: true });
}
