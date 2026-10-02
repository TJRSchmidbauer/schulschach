export type ThemeId = 'holz' | 'ozean' | 'beere' | 'sonne' | 'kirsche' | 'schiefer';

export type ThemeDef = { id: ThemeId; label: string; vars: Record<string, string> };

const WARN = '#c8a951';

// Alle Schemata sind hell. Weißer Text auf --accent und --accent-dark, dunkle Schrift auf --bg und --card
// und die graue Zusatzschrift (--muted) erreichen mindestens 4,5:1 Kontrast (WCAG 2.2, 1.4.3).
export const THEMES: ThemeDef[] = [
  {
    id: 'holz',
    label: 'Holz und Grün',
    vars: { '--bg': '#f4efe6', '--card': '#ffffff', '--ink': '#26221c', '--muted': '#716657', '--accent': '#2f7d5c', '--accent-dark': '#245f46', '--navy': '#20303f', '--brand-em': '#7fd4ae', '--bad': '#b34747', '--warn': WARN, '--accent-tint': '#d9efe3', '--accent-tint-border': '#adddc3' },
  },
  {
    id: 'ozean',
    label: 'Ozean',
    vars: { '--bg': '#eef3f8', '--card': '#ffffff', '--ink': '#1c2733', '--muted': '#5a6877', '--accent': '#1f5fa8', '--accent-dark': '#164a85', '--navy': '#14283f', '--brand-em': '#8cc4f5', '--bad': '#b3363a', '--warn': WARN, '--accent-tint': '#dbe9f7', '--accent-tint-border': '#a9c8e8' },
  },
  {
    id: 'beere',
    label: 'Beere',
    vars: { '--bg': '#f5f0f7', '--card': '#ffffff', '--ink': '#28202d', '--muted': '#6e5f78', '--accent': '#7a3d9b', '--accent-dark': '#5f2d7a', '--navy': '#2a1b38', '--brand-em': '#d3a8ec', '--bad': '#b3363a', '--warn': WARN, '--accent-tint': '#eadcf3', '--accent-tint-border': '#cfaee2' },
  },
  {
    id: 'sonne',
    label: 'Sonne',
    vars: { '--bg': '#f8f1e7', '--card': '#ffffff', '--ink': '#2b2218', '--muted': '#6f6050', '--accent': '#b4540a', '--accent-dark': '#8f4108', '--navy': '#3a2610', '--brand-em': '#f6c27a', '--bad': '#a8302f', '--warn': WARN, '--accent-tint': '#fbe5cf', '--accent-tint-border': '#f0c9a0' },
  },
  {
    id: 'kirsche',
    label: 'Kirsche',
    vars: { '--bg': '#f8eef0', '--card': '#ffffff', '--ink': '#2c1f22', '--muted': '#715a60', '--accent': '#b02a47', '--accent-dark': '#8d1f37', '--navy': '#3a1822', '--brand-em': '#f2a3b4', '--bad': '#8d1f37', '--warn': WARN, '--accent-tint': '#f8dde3', '--accent-tint-border': '#eeb5c2' },
  },
  {
    id: 'schiefer',
    label: 'Schiefer',
    vars: { '--bg': '#eef0f2', '--card': '#ffffff', '--ink': '#1f2429', '--muted': '#566069', '--accent': '#2f5d73', '--accent-dark': '#234758', '--navy': '#1b2a33', '--brand-em': '#9fd0e6', '--bad': '#b3363a', '--warn': WARN, '--accent-tint': '#d9e7ee', '--accent-tint-border': '#b3cddb' },
  },
];

export function themeVars(id: string): Record<string, string> {
  return (THEMES.find((t) => t.id === id) ?? THEMES[0]).vars;
}

export type Features = { free: boolean; live: boolean; tournaments: boolean; medals: boolean };

export const FEATURE_LIST: { key: keyof Features; label: string; hint: string }[] = [
  { key: 'free', label: 'Freies Üben', hint: 'Schüler wählen Aufgaben nach Thema und Schwierigkeit selbst aus.' },
  { key: 'live', label: 'Live-Partien', hint: 'Spiel-Lobby für Schüler und Live-Bereich für Trainer.' },
  { key: 'tournaments', label: 'Turniere', hint: 'Turnierverwaltung und Beamer-Ansicht im Trainer-Bereich.' },
  { key: 'medals', label: 'Medaillen', hint: 'Medaillen-Seite für Schüler.' },
];

export type Settings = {
  siteName: string;
  subtitle: string;
  theme: ThemeId;
  features: Features;
  impressumMd: string;
  datenschutzMd: string;
};

export const DEFAULT_SETTINGS: Settings = {
  siteName: 'SchulSchach AG',
  subtitle: '',
  theme: 'holz',
  features: { free: true, live: true, tournaments: true, medals: true },
  impressumMd: '',
  datenschutzMd: '',
};

export const LIMITS = { siteName: 40, subtitle: 60, text: 20000 } as const;

function cleanLine(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

function cleanText(v: unknown, max: number): string {
  if (typeof v !== 'string') return '';
  return v.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').slice(0, max);
}

export function sanitizeSettings(input: unknown): { ok: true; value: Settings } | { ok: false; error: string } {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const siteName = cleanLine(o.siteName, LIMITS.siteName);
  if (siteName.length < 2) return { ok: false, error: 'Der Name muss 2 bis 40 Zeichen haben.' };
  const subtitle = cleanLine(o.subtitle, LIMITS.subtitle);
  const theme = THEMES.find((t) => t.id === o.theme)?.id;
  if (!theme) return { ok: false, error: 'Dieses Farbschema gibt es nicht.' };
  const f = (o.features && typeof o.features === 'object' ? o.features : {}) as Record<string, unknown>;
  const pick = (key: keyof Features) => (typeof f[key] === 'boolean' ? (f[key] as boolean) : DEFAULT_SETTINGS.features[key]);
  return {
    ok: true,
    value: {
      siteName,
      subtitle,
      theme,
      features: { free: pick('free'), live: pick('live'), tournaments: pick('tournaments'), medals: pick('medals') },
      impressumMd: cleanText(o.impressumMd, LIMITS.text),
      datenschutzMd: cleanText(o.datenschutzMd, LIMITS.text),
    },
  };
}
