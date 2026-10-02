import Link from 'next/link';
import { getSession } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import type { Features } from '@/lib/branding';

export async function FeatureGate({ feature, children }: { feature: keyof Features; children: React.ReactNode }) {
  const settings = await getSettings();
  if (settings.features[feature]) return <>{children}</>;
  const session = await getSession();
  const trainer = session?.role === 'TRAINER';
  return (
    <div className='card'>
      <h1>Diese Funktion ist ausgeschaltet</h1>
      <p className='muted'>
        {trainer ? 'Du kannst sie in den Einstellungen wieder einschalten.' : 'Frag deine Trainerin oder deinen Trainer.'}
      </p>
      {trainer ? (
        <Link className='btn' style={{ width: 'auto', padding: '0.7rem 1.4rem' }} href='/trainer/settings'>
          Zu den Einstellungen
        </Link>
      ) : (
        <Link className='btn btn-secondary' style={{ width: 'auto', padding: '0.7rem 1.4rem' }} href='/learn'>
          Zurück zum Lernen
        </Link>
      )}
    </div>
  );
}
