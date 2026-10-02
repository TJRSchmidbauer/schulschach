import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { assignStudent, createGroup, deleteGroup, groupState, isFail, renameGroup, setGroupPaths, type Fail } from '@/lib/groups';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json(await groupState());
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = (await req.json().catch(() => ({}))) as {
    action?: string;
    id?: unknown;
    name?: unknown;
    pathIds?: unknown;
    userId?: unknown;
    groupId?: unknown;
  };

  let out: true | Fail;
  switch (b.action) {
    case 'create':
      out = await createGroup(b.name);
      break;
    case 'rename':
      out = await renameGroup(b.id, b.name);
      break;
    case 'delete':
      out = await deleteGroup(b.id);
      break;
    case 'setPaths':
      out = await setGroupPaths(b.id, b.pathIds);
      break;
    case 'assign':
      out = await assignStudent(b.userId, b.groupId);
      break;
    default:
      return NextResponse.json({ error: 'Unbekannte Aktion.' }, { status: 400 });
  }
  if (isFail(out)) return NextResponse.json({ error: out.error }, { status: out.status });
  console.log('[audit] Gruppen geändert');
  return NextResponse.json(await groupState());
}
