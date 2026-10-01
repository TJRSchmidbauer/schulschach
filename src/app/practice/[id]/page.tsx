import Link from 'next/link';
import { redirect, notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getSession } from '@/lib/auth';
import PracticeBoard from './PracticeBoard';

export default async function PracticePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') redirect('/');
  const { id } = await params;

  const puzzle = await db.puzzle.findUnique({ where: { id } });
  if (!puzzle || !puzzle.published) notFound();

  return (
    <div>
      <p><Link href="/learn">← Zurück</Link></p>
      <PracticeBoard
        puzzleId={puzzle.id}
        fen={puzzle.fen}
        title={puzzle.title}
        hint={puzzle.hint}
      />
    </div>
  );
}
