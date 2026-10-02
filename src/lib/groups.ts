import { db } from '@/lib/db';

export type Fail = { error: string; status: number };
const fail = (error: string, status: number): Fail => ({ error, status });
export const isFail = (x: unknown): x is Fail => typeof x === 'object' && x !== null && 'error' in x;

export async function groupState() {
  const [groups, students, paths] = await Promise.all([
    db.group.findMany({
      orderBy: { name: 'asc' },
      include: { paths: { select: { pathId: true } }, _count: { select: { users: true } } },
    }),
    db.user.findMany({
      where: { role: 'STUDENT', active: true },
      orderBy: { alias: 'asc' },
      select: { id: true, alias: true, groupId: true },
    }),
    db.learningPath.findMany({ where: { active: true }, orderBy: { sortOrder: 'asc' }, select: { id: true, title: true } }),
  ]);
  return {
    groups: groups.map((g) => ({ id: g.id, name: g.name, pathIds: g.paths.map((p) => p.pathId), members: g._count.users })),
    students,
    paths,
  };
}

export type GroupState = Awaited<ReturnType<typeof groupState>>;

function cleanName(raw: unknown): string {
  return typeof raw === 'string' ? raw.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim() : '';
}

async function nameTaken(name: string, exceptId?: string): Promise<boolean> {
  const all = await db.group.findMany({ select: { id: true, name: true } });
  const key = name.toLocaleLowerCase('de-DE');
  return all.some((g) => g.id !== exceptId && g.name.toLocaleLowerCase('de-DE') === key);
}

export async function createGroup(raw: unknown): Promise<true | Fail> {
  const name = cleanName(raw);
  if (name.length < 2 || name.length > 40) return fail('Der Gruppenname muss 2 bis 40 Zeichen haben.', 400);
  if (await nameTaken(name)) return fail('Diese Gruppe gibt es schon.', 409);
  await db.group.create({ data: { name } });
  return true;
}

export async function renameGroup(id: unknown, raw: unknown): Promise<true | Fail> {
  const name = cleanName(raw);
  if (typeof id !== 'string') return fail('Gruppe nicht gefunden.', 404);
  if (name.length < 2 || name.length > 40) return fail('Der Gruppenname muss 2 bis 40 Zeichen haben.', 400);
  const g = await db.group.findUnique({ where: { id }, select: { id: true } });
  if (!g) return fail('Gruppe nicht gefunden.', 404);
  if (await nameTaken(name, id)) return fail('Diese Gruppe gibt es schon.', 409);
  await db.group.update({ where: { id }, data: { name } });
  return true;
}

export async function deleteGroup(id: unknown): Promise<true | Fail> {
  if (typeof id !== 'string') return fail('Gruppe nicht gefunden.', 404);
  const g = await db.group.findUnique({ where: { id }, select: { id: true } });
  if (!g) return fail('Gruppe nicht gefunden.', 404);
  await db.group.delete({ where: { id } });
  return true;
}

export async function setGroupPaths(id: unknown, pathIds: unknown): Promise<true | Fail> {
  if (typeof id !== 'string') return fail('Gruppe nicht gefunden.', 404);
  const g = await db.group.findUnique({ where: { id }, select: { id: true } });
  if (!g) return fail('Gruppe nicht gefunden.', 404);
  const ids = Array.isArray(pathIds) ? pathIds.filter((x): x is string => typeof x === 'string') : [];
  const valid = await db.learningPath.findMany({ where: { id: { in: ids }, active: true }, select: { id: true } });
  await db.$transaction([
    db.groupPath.deleteMany({ where: { groupId: id } }),
    db.groupPath.createMany({ data: valid.map((p) => ({ groupId: id, pathId: p.id })) }),
  ]);
  return true;
}

export async function assignStudent(userId: unknown, groupId: unknown): Promise<true | Fail> {
  if (typeof userId !== 'string') return fail('Schüler nicht gefunden.', 404);
  const user = await db.user.findFirst({ where: { id: userId, role: 'STUDENT' }, select: { id: true } });
  if (!user) return fail('Schüler nicht gefunden.', 404);
  if (groupId === null || groupId === '') {
    await db.user.update({ where: { id: userId }, data: { groupId: null } });
    return true;
  }
  if (typeof groupId !== 'string') return fail('Gruppe nicht gefunden.', 404);
  const g = await db.group.findUnique({ where: { id: groupId }, select: { id: true } });
  if (!g) return fail('Gruppe nicht gefunden.', 404);
  await db.user.update({ where: { id: userId }, data: { groupId } });
  return true;
}
