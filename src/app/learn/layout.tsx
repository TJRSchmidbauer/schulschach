import OnlyAt from '@/components/OnlyAt';
import { Markdown } from '@/lib/markdown';
import { getSettings } from '@/lib/settings';

export default async function LearnLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  return (
    <>
      {settings.welcomeMd.trim() ? (
        <OnlyAt path='/learn'>
          <div className='card' style={{ marginBottom: '1.2rem' }}>
            <Markdown source={settings.welcomeMd} />
          </div>
        </OnlyAt>
      ) : null}
      {children}
    </>
  );
}
