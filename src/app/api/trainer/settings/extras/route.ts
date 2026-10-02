import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sanitizeExtras } from '@/lib/extras';
import { getExtras, saveExtras } from '@/lib/extras-server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json(await getExtras());
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = sanitizeExtras(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  await saveExtras(parsed.value);
  console.log('[audit] Einstellungen (Medaillen, Urkunde) geändert');
  return NextResponse.json(parsed.value);
}
