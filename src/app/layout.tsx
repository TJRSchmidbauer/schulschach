import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SchulSchach AG',
  description: 'Datensparsame Schach-Lernplattform für die Schul-AG',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="de">
      <body>
        <header className="topbar">
          <span className="logo">♞</span>
          <span className="brand">
            SchulSchach <em>AG</em>
          </span>
        </header>
        <main className="page">{children}</main>
      </body>
    </html>
  );
}
