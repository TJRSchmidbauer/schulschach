import { notFound, redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getTournament } from '@/lib/tournament/service';
import Beamer from './Beamer';

export default async function BeamerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');
  const { id } = await params;
  const t = await getTournament(id);
  if (!t) notFound();
  return <Beamer id={id} />;
}
