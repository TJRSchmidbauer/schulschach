import { notFound } from 'next/navigation';
import { Markdown } from '@/lib/markdown';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const settings = await getSettings();
  return { title: `Datenschutz – ${settings.siteName}` };
}

export default async function DatenschutzPage() {
  const settings = await getSettings();
  if (!settings.datenschutzMd.trim()) notFound();
  return (
    <div className='card'>
      <h1>Datenschutz</h1>
      <Markdown source={settings.datenschutzMd} />
    </div>
  );
}
