import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { codeLookupHash, getSession, scryptHash } from '@/lib/auth';
import { decryptCode, encryptCode, generateStudentCode } from '@/lib/crypto';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const { action } = (await req.json()) as { action?: string };
  const student = await db.user.findUnique({ where: { id } });
  if (!student || student.role !== 'STUDENT') return NextResponse.json({ error: 'not_found' }, { status: 404 });

  if (action === 'reveal') {
    const code = student.codeEnc ? decryptCode(student.codeEnc) : null;
    if (!code) return NextResponse.json({ error: 'no_code' }, { status: 404 });
    console.log(`[audit] Code angezeigt: ${student.alias}`);
    return NextResponse.json({ code });
  }

  if (action === 'reissue') {
    const code = generateStudentCode();
    await db.$transaction([
      db.user.update({
        where: { id },
        data: { codeLookup: codeLookupHash(code), codeHash: scryptHash(code), codeEnc: encryptCode(code) },
      }),
      db.session.deleteMany({ where: { userId: id } }),
    ]);
    console.log(`[audit] Code neu ausgestellt: ${student.alias}`);
    return NextResponse.json({ code });
  }

  return NextResponse.json({ error: 'invalid_action' }, { status: 400 });
}
