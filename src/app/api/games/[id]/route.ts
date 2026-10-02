import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import {
  acceptChallenge,
  cancelChallenge,
  drawAction,
  isFail,
  makeMove,
  resign,
  toView,
  type Fail,
  type GameRow,
} from '@/lib/live/game';

export const dynamic = 'force-dynamic';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { action?: string; uci?: string };
  const uid = session.userId;

  if (body.action === 'cancel') {
    const r = await cancelChallenge(uid, id);
    return isFail(r) ? NextResponse.json({ error: r.error }, { status: r.status }) : NextResponse.json({ ok: true });
  }

  let out: GameRow | Fail;
  switch (body.action) {
    case 'join':
      out = await acceptChallenge(uid, id);
      break;
    case 'move': {
      const uci = (body.uci ?? '').toLowerCase();
      if (!/^[a-h][1-8][a-h][1-8][qrbn]?$/.test(uci)) {
        return NextResponse.json({ error: 'Ungültiger Zug.' }, { status: 400 });
      }
      out = await makeMove(id, uid, uci);
      break;
    }
    case 'resign':
      out = await resign(id, uid);
      break;
    case 'draw-offer':
      out = await drawAction(id, uid, 'offer');
      break;
    case 'draw-accept':
      out = await drawAction(id, uid, 'accept');
      break;
    case 'draw-decline':
      out = await drawAction(id, uid, 'decline');
      break;
    default:
      return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
  }

  if (isFail(out)) return NextResponse.json({ error: out.error }, { status: out.status });
  return NextResponse.json(toView(out));
}
