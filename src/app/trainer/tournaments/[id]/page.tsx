import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getTournament } from '@/lib/tournament/service';
import TournamentManager from '../TournamentManager';

export default async function TournamentPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');
  const { id } = await params;
  const t = await getTournament(id);
  if (!t) notFound();

  return (
    <div>
      <p>
        <Link href='/trainer/tournaments'>← Alle Turniere</Link>
      </p>
      <TournamentManager id={id} />
    </div>
  );
}
