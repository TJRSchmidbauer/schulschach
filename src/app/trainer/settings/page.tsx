import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { getExtras } from '@/lib/extras-server';
import { getSettings } from '@/lib/settings';
import ExtrasForm from './ExtrasForm';
import SettingsForm from './SettingsForm';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const session = await getSession();
  if (!session || session.role !== 'TRAINER') redirect('/trainer');
  const settings = await getSettings();
  const extras = await getExtras();

  return (
    <div>
      <p>
        <Link href='/trainer/dashboard'>← Zum Trainer-Bereich</Link>
      </p>
      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h1>⚙️ Einstellungen</h1>
        <p className='muted' style={{ marginBottom: 0 }}>
          Hier passt du die Seite für deine AG an: Name, Farben, Funktionen, Medaillen, Urkunden sowie Impressum und Datenschutz.
        </p>
      </div>
      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h2>Gruppen</h2>
        <p className='muted'>Teile Schüler in Gruppen ein und lege fest, welche Lernpfade jede Gruppe sieht.</p>
        <Link className='btn btn-secondary' style={{ width: 'auto', padding: '0.7rem 1.4rem' }} href='/trainer/groups'>
          Zu den Gruppen
        </Link>
      </div>
      <SettingsForm initial={settings} />
      <ExtrasForm initial={extras} />
      <div className='card' style={{ marginTop: '1.2rem' }}>
        <h2>Schüler per CSV importieren</h2>
        <p className='muted'>Lege viele Schüler auf einmal mit Aliassen (Spitznamen) an. Bitte keine Klarnamen verwenden.</p>
        <Link className='btn btn-secondary' style={{ width: 'auto', padding: '0.7rem 1.4rem' }} href='/trainer/import'>
          Zum CSV-Import
        </Link>
      </div>
    </div>
  );
}
