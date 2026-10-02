import { notFound } from 'next/navigation';
import { Markdown } from '@/lib/markdown';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = await getSettings();
  return { title: `Impressum – ${settings.siteName}` };
}

export default async function ImpressumPage() {
  const settings = await getSettings();
  if (!settings.impressumMd.trim()) notFound();
  return (
    <div className='card'>
      <h1>Impressum</h1>
      <Markdown source={settings.impressumMd} />
    </div>
  );
}
