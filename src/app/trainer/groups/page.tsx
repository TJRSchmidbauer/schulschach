import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { groupState } from '@/lib/groups';
import GroupsManager from './GroupsManager';

export const dynamic = 'force-dynamic';

export default async function GroupsPage() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');
  const state = await groupState();

  return (
    <div>
      <p>
        <Link href='/trainer/settings'>← Zu den Einstellungen</Link>
      </p>
      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h1>Gruppen</h1>
        <p className='muted' style={{ marginBottom: 0 }}>
          Teile die AG in Gruppen ein (zum Beispiel Anfänger und Fortgeschrittene) und lege fest, welche Lernpfade jede Gruppe sieht. Hat eine Gruppe keine Lernpfade, sehen ihre Mitglieder alle. Schüler ohne Gruppe sehen ebenfalls alle.
        </p>
      </div>
      <GroupsManager initial={state} />
    </div>
  );
}
