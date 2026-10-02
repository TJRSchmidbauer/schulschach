import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { deleteTournament, finishTournament, getTournament, isFail, setPlayerActive, setResult, view } from '@/lib/tournament/service';

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
  const body = (await req.json().catch(() => ({}))) as { action?: string; pairingId?: string; result?: string; playerId?: string };

  if (body.action === 'result') {
    const out = await setResult(id, body.pairingId ?? '', body.result as never);
    if (isFail(out)) return NextResponse.json({ error: out.error }, { status: out.status });
  } else if (body.action === 'finish') {
    const out = await finishTournament(id);
    if (isFail(out)) return NextResponse.json({ error: out.error }, { status: out.status });
  } else if (body.action === 'withdraw' || body.action === 'reactivate') {
    const out = await setPlayerActive(id, body.playerId ?? '', body.action === 'reactivate');
    if (isFail(out)) return NextResponse.json({ error: out.error }, { status: out.status });
    console.log(body.action === 'withdraw' ? '[audit] Teilnehmer abgemeldet' : '[audit] Teilnehmer wieder angemeldet');
  } else {
    return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
  }

  const t = await getTournament(id);
  return NextResponse.json(t ? view(t) : { ok: true });
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const out = await deleteTournament(id);
  if (isFail(out)) return NextResponse.json({ error: out.error }, { status: out.status });
  console.log('[audit] Turnier gelöscht');
  return NextResponse.json({ ok: true });
}
