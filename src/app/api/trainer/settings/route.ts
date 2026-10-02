import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { sanitizeSettings } from '@/lib/branding';
import { getSettings, saveSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json(await getSettings());
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const body = await req.json().catch(() => null);
  const parsed = sanitizeSettings(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  await saveSettings(parsed.value);
  console.log('[audit] Einstellungen geändert');
  return NextResponse.json(parsed.value);
}
