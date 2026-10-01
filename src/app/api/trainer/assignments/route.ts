import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = (await req.json()) as {
    title?: string;
    dueAt?: string | null;
    puzzleIds?: string[];
    targetAll?: boolean;
    studentIds?: string[];
  };

  const title = (body.title ?? '').trim();
  if (title.length < 2 || title.length > 80) {
    return NextResponse.json({ error: 'Titel muss 2 bis 80 Zeichen haben.' }, { status: 400 });
  }
  const puzzleIds = Array.from(new Set(body.puzzleIds ?? []));
  if (puzzleIds.length === 0 || puzzleIds.length > 100) {
    return NextResponse.json({ error: 'Bitte 1 bis 100 Aufgaben auswählen.' }, { status: 400 });
  }
  const targetAll = body.targetAll === true;
  const studentIds = Array.from(new Set(body.studentIds ?? []));
  if (!targetAll && studentIds.length === 0) {
    return NextResponse.json({ error: 'Bitte Schüler auswählen oder „Alle Schüler“ wählen.' }, { status: 400 });
  }

  let dueAt: Date | null = null;
  if (body.dueAt) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.dueAt)) {
      return NextResponse.json({ error: 'Ungültiges Datum.' }, { status: 400 });
    }
    dueAt = new Date(`${body.dueAt}T12:00:00Z`);
    if (Number.isNaN(dueAt.getTime())) return NextResponse.json({ error: 'Ungültiges Datum.' }, { status: 400 });
  }

  const puzzleCount = await db.puzzle.count({ where: { id: { in: puzzleIds } } });
  if (puzzleCount !== puzzleIds.length) return NextResponse.json({ error: 'Unbekannte Aufgabe.' }, { status: 400 });
  if (!targetAll) {
    const studentCount = await db.user.count({ where: { id: { in: studentIds }, role: 'STUDENT' } });
    if (studentCount !== studentIds.length) return NextResponse.json({ error: 'Unbekannter Schüler.' }, { status: 400 });
  }

  const created = await db.assignment.create({
    data: {
      title,
      dueAt,
      targetAll,
      puzzles: { create: puzzleIds.map((puzzleId, i) => ({ puzzleId, sortOrder: i + 1 })) },
      targets: targetAll ? undefined : { create: studentIds.map((userId) => ({ userId })) },
    },
  });
  console.log(`[audit] Hausaufgabe angelegt: ${created.title}`);
  return NextResponse.json({ id: created.id });
}
