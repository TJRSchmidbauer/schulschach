'use client';

import { usePathname } from 'next/navigation';

// Zeigt den Inhalt nur auf genau einer Adresse (zum Beispiel den Begrüßungstext auf der Startseite).
export default function OnlyAt({ path, children }: { path: string; children: React.ReactNode }) {
  const pathname = usePathname();
  return pathname === path ? <>{children}</> : null;
}
