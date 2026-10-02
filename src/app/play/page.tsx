import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getExtras } from '@/lib/extras-server';
import { getSettings } from '@/lib/settings';
import Lobby from './Lobby';

export default async function PlayPage() {
  const session = await getSession();
  if (!session || session.role !== 'STUDENT') redirect('/');
  const extras = await getExtras();
  const settings = await getSettings();

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
      <Lobby controls={extras.live.controls} defaultControl={extras.live.defaultControl} retentionDays={settings.retention.games} />
    </div>
  );
}
