export type AliasStyle = 'figuren' | 'tiere' | 'mix';

export const ALIAS_STYLES: { id: AliasStyle; label: string; example: string }[] = [
  { id: 'figuren', label: 'Schachfigur und Zahl', example: 'Springer-17' },
  { id: 'tiere', label: 'Tier und Zahl', example: 'Fuchs-42' },
  { id: 'mix', label: 'Figur, Tier und Zahl', example: 'Springer-Fuchs-07' },
];

const PIECES = ['Springer', 'Turm', 'Läufer', 'Dame', 'König', 'Bauer'];
const ANIMALS = ['Fuchs', 'Adler', 'Luchs', 'Bär', 'Wolf', 'Falke', 'Igel', 'Otter', 'Dachs', 'Hirsch', 'Panda', 'Delfin'];

function rnd(n: number): number {
  const a = new Uint32Array(1);
  crypto.getRandomValues(a);
  return a[0] % n;
}

// Erzeugt zufällige Spitznamen, die weder doppelt vorkommen noch in `taken` enthalten sind.
export function generateAliases(count: number, style: AliasStyle, taken: Iterable<string> = []): string[] {
  const used = new Set<string>();
  for (const t of taken) used.add(t.toLocaleLowerCase('de-DE'));
  const out: string[] = [];
  let guard = 0;
  while (out.length < count && guard++ < count * 60 + 300) {
    const piece = PIECES[rnd(PIECES.length)];
    const animal = ANIMALS[rnd(ANIMALS.length)];
    const num = String(1 + rnd(99)).padStart(2, '0');
    const name = style === 'figuren' ? `${piece}-${num}` : style === 'tiere' ? `${animal}-${num}` : `${piece}-${animal}-${num}`;
    const key = name.toLocaleLowerCase('de-DE');
    if (used.has(key)) continue;
    used.add(key);
    out.push(name);
  }
  return out;
}
