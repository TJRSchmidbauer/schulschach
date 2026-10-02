import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generateRound, getTournament, isFail, publishRound, view } from '@/lib/tournament/service';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string; round?: number };

  if (body.action === 'generate') {
    const out = await generateRound(id);
    if (isFail(out)) return NextResponse.json({ error: out.error }, { status: out.status });
  } else if (body.action === 'publish') {
    const out = await publishRound(id, Number(body.round));
    if (isFail(out)) return NextResponse.json({ error: out.error }, { status: out.status });
  } else {
    return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
  }

  const t = await getTournament(id);
  return NextResponse.json(t ? view(t) : { ok: true });
}
