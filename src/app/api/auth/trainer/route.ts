import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createSession, scryptVerify } from '@/lib/auth';

export async function POST(req: Request) {
  const hash = process.env.TRAINER_CODE_HASH;
  if (!hash) {
    console.error('[trainer-login] TRAINER_CODE_HASH ist nicht gesetzt');
    return NextResponse.json({ error: 'Trainer login nicht konfiguriert' }, { status: 503 });
  }

  const { code } = (await req.json()) as { code?: string };
  const trimmedCode = (code ?? '').trim();
  if (!trimmedCode) {
    return NextResponse.json({ error: 'Code fehlt' }, { status: 400 });
  }

  const ok = scryptVerify(trimmedCode, hash);
  console.log(`[trainer-login] Versuch: verify=${ok}`);
  if (!ok) {
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
