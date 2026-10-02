import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { isFail, toView, trainerEnd } from '@/lib/live/game';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string; result?: string };
  if (body.action !== 'abort' && body.action !== 'result') {
    return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
  }
  const out = await trainerEnd(id, body.action, body.result);
  if (isFail(out)) return NextResponse.json({ error: out.error }, { status: out.status });
  console.log('[audit] Partie vom Trainer beendet');
  return NextResponse.json(toView(out));
}
