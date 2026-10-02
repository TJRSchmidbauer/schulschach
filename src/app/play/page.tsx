import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import Lobby from './Lobby';

export default async function PlayPage() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') redirect('/');

  return (
    <div>
      <p>
        <Link href='/learn'>← Zur Übersicht</Link>
      </p>
      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h1>Live-Partien</h1>
        <p className='muted' style={{ marginBottom: 0 }}>
          Spiele gegen andere aus der AG, mit Schachuhr. Es gibt keinen Chat. Dein Trainer kann zusehen.
        </p>
      </div>
      <Lobby />
    </div>
  );
}
