import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { codeLookupHash, getSession, scryptHash } from '@/lib/auth';
import { encryptCode, generateStudentCode } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

const MAX_IMPORT = 150;

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { aliases?: unknown };
  const list = Array.isArray(body.aliases) ? body.aliases : [];
  if (list.length === 0) return NextResponse.json({ error: 'Es wurden keine Namen übergeben.' }, { status: 400 });
  if (list.length > MAX_IMPORT) return NextResponse.json({ error: `Höchstens ${MAX_IMPORT} Namen auf einmal.` }, { status: 400 });

  const existing = await db.user.findMany({ select: { alias: true } });
  const taken = new Set(existing.map((u) => u.alias.toLocaleLowerCase('de-DE')));
  const created: { alias: string; code: string }[] = [];
  const skipped: { alias: string; reason: string }[] = [];

  for (const raw of list) {
    const alias = typeof raw === 'string' ? raw.replace(/\s+/g, ' ').trim() : '';
    if (alias.length < 2 || alias.length > 50) {
      skipped.push({ alias: alias.slice(0, 50), reason: 'Ein Alias braucht 2 bis 50 Zeichen.' });
      continue;
    }
    const key = alias.toLocaleLowerCase('de-DE');
    if (taken.has(key)) {
      skipped.push({ alias, reason: 'Dieser Alias existiert schon.' });
      continue;
    }
    const code = generateStudentCode();
    try {
      await db.user.create({
        data: {
          alias,
          codeLookup: codeLookupHash(code),
          codeHash: scryptHash(code),
          codeEnc: encryptCode(code),
        },
      });
      taken.add(key);
      created.push({ alias, code });
    } catch {
      skipped.push({ alias, reason: 'Konnte nicht angelegt werden.' });
    }
  }

  console.log(`[audit] Schüler-Import: ${created.length} angelegt, ${skipped.length} übersprungen`);
  return NextResponse.json({ created, skipped });
}
