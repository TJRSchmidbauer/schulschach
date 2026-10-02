import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';
import OnlyAt from '@/components/OnlyAt';
import { getSession } from '@/lib/auth';
import { boardVars, themeVars } from '@/lib/branding';
import { Markdown } from '@/lib/markdown';
import { getSettings } from '@/lib/settings';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: settings.siteName,
    description: 'Datensparsame Schach-Lernplattform für die Schul-AG',
  };
}

function BrandName({ name }: { name: string }) {
  const i = name.lastIndexOf(' ');
  if (i < 1) return <>{name}</>;
  return (
    <>
      {name.slice(0, i)} <em>{name.slice(i + 1)}</em>
    </>
  );
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const session = await getSession();
  const isTrainer = session?.role === 'TRAINER';

  // Ausgeschaltete Funktionen: Links dorthin ausblenden. Die Seiten selbst zeigen einen Hinweis (FeatureGate).
  const hidden: string[] = [];
  if (!settings.features.free) hidden.push(`a[href^='/free']`);
  if (!settings.features.live) hidden.push(`a[href^='/play']`, `a[href^='/trainer/live']`);
  if (!settings.features.tournaments) hidden.push(`a[href^='/trainer/tournaments']`);
  if (!settings.features.medals) hidden.push(`a[href^='/awards']`);
  const css = hidden.length ? `${hidden.join(',')}{display:none !important}` : '';

  const hasImpressum = settings.impressumMd.trim().length > 0;
  const hasDatenschutz = settings.datenschutzMd.trim().length > 0;
  const showFooter = hasImpressum || hasDatenschutz || (isTrainer && (!hasImpressum || !hasDatenschutz));
  const vars = { ...themeVars(settings.theme), ...boardVars(settings.boardTheme) };

  return (
    <html lang='de' style={vars as unknown as React.CSSProperties}>
      <head>{css ? <style>{css}</style> : null}</head>
      <body>
        <header className='topbar'>
          <span className='logo'>♞</span>
          <span className='brand'>
            <BrandName name={settings.siteName} />
          </span>
          {settings.subtitle ? <span className='brand-sub'>{settings.subtitle}</span> : null}
          {isTrainer ? (
            <Link href='/trainer/settings' className='gear' aria-label='Einstellungen' title='Einstellungen'>
              ⚙️
            </Link>
          ) : null}
        </header>
        <main className='page'>
          {settings.welcomeMd.trim() ? (
            <OnlyAt path='/'>
              <div className='card' style={{ marginBottom: '1.2rem' }}>
                <Markdown source={settings.welcomeMd} />
              </div>
            </OnlyAt>
          ) : null}
          {children}
        </main>
        {showFooter ? (
          <footer className='site-footer'>
            {hasImpressum ? <Link href='/impressum'>Impressum</Link> : null}
            {hasDatenschutz ? <Link href='/datenschutz'>Datenschutz</Link> : null}
            {isTrainer && (!hasImpressum || !hasDatenschutz) ? (
              <Link href='/trainer/settings'>Hinweis für Trainer: Impressum und Datenschutz in den Einstellungen ergänzen</Link>
            ) : null}
          </footer>
        ) : null}
      </body>
    </html>
  );
}
