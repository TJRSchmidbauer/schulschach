import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { finishTournament, getTournament, isFail, setResult, view } from '@/lib/tournament/service';

export const dynamic = 'force-dynamic';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const t = await getTournament(id);
  if (!t) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  return NextResponse.json(view(t));
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string; pairingId?: string; result?: string };

  if (body.action === 'result') {
    const out = await setResult(id, body.pairingId ?? '', body.result as never);
    if (isFail(out)) return NextResponse.json({ error: out.error }, { status: out.status });
  } else if (body.action === 'finish') {
    const out = await finishTournament(id);
    if (isFail(out)) return NextResponse.json({ error: out.error }, { status: out.status });
  } else {
    return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
  }

  const t = await getTournament(id);
  return NextResponse.json(t ? view(t) : { ok: true });
}
