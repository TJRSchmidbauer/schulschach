export type MedalLevel = 'leicht' | 'normal' | 'schwer';

export const MEDAL_LEVELS: { id: MedalLevel; label: string; scale: number; hint: string }[] = [
  { id: 'leicht', label: 'Leicht', scale: 0.5, hint: 'Halbe Zielwerte, zum Beispiel 5 statt 10 Aufgaben für „Bauernstark“.' },
  { id: 'normal', label: 'Normal', scale: 1, hint: 'Standardwerte, zum Beispiel 10 Aufgaben für „Bauernstark“.' },
  { id: 'schwer', label: 'Schwer', scale: 2, hint: 'Doppelte Zielwerte, zum Beispiel 20 Aufgaben für „Bauernstark“.' },
];

export function medalScale(level: string): number {
  return (MEDAL_LEVELS.find((l) => l.id === level) ?? MEDAL_LEVELS[1]).scale;
}

export type CertColorId = 'marine' | 'gruen' | 'bordeaux' | 'schwarz';

export type CertPalette = { id: CertColorId; label: string; main: string; gold: string; soft: string; occasion: string };

export const CERT_COLORS: CertPalette[] = [
  { id: 'marine', label: 'Marineblau und Gold', main: '#1f2a44', gold: '#c9a227', soft: '#efe3c2', occasion: '#8a6d1d' },
  { id: 'gruen', label: 'Tannengrün und Gold', main: '#1f4d3a', gold: '#c9a227', soft: '#e6eedd', occasion: '#7a6a1d' },
  { id: 'bordeaux', label: 'Bordeaux und Gold', main: '#5c1a2b', gold: '#c9a227', soft: '#f1e1d6', occasion: '#8a6d1d' },
  { id: 'schwarz', label: 'Schwarz und Gold', main: '#222222', gold: '#c9a227', soft: '#e8e8e8', occasion: '#7a6a2a' },
];

export function certPalette(id: string): CertPalette {
  return CERT_COLORS.find((c) => c.id === id) ?? CERT_COLORS[0];
}

export type CertDefaults = { title: string; occasion: string; signer: string; color: CertColorId };

export type Extras = { medalLevel: MedalLevel; cert: CertDefaults };

export const DEFAULT_EXTRAS: Extras = {
  medalLevel: 'normal',
  cert: { title: 'URKUNDE', occasion: 'Schach-AG', signer: 'Trainer/in', color: 'marine' },
};

export const EXTRAS_LIMITS = { title: 14, occasion: 40, signer: 40 } as const;

function line(v: unknown, max: number, fallback: string): string {
  if (typeof v !== 'string') return fallback;
  const s = v.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
  return s || fallback;
}

export function sanitizeExtras(input: unknown): { ok: true; value: Extras } | { ok: false; error: string } {
  const o = (input && typeof input === 'object' ? input : {}) as Record<string, unknown>;
  const medalLevel = MEDAL_LEVELS.find((l) => l.id === o.medalLevel)?.id;
  if (!medalLevel) return { ok: false, error: 'Diese Medaillen-Stufe gibt es nicht.' };
  const c = (o.cert && typeof o.cert === 'object' ? o.cert : {}) as Record<string, unknown>;
  const color = CERT_COLORS.find((p) => p.id === c.color)?.id;
  if (!color) return { ok: false, error: 'Diese Urkunden-Farbe gibt es nicht.' };
  return {
    ok: true,
    value: {
      medalLevel,
      cert: {
        title: line(c.title, EXTRAS_LIMITS.title, DEFAULT_EXTRAS.cert.title),
        occasion: line(c.occasion, EXTRAS_LIMITS.occasion, DEFAULT_EXTRAS.cert.occasion),
        signer: line(c.signer, EXTRAS_LIMITS.signer, DEFAULT_EXTRAS.cert.signer),
        color,
      },
    },
  };
}
