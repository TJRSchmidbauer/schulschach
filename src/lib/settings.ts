import { cache } from 'react';
import { db } from '@/lib/db';
import { DEFAULT_SETTINGS, sanitizeSettings, type Settings } from './branding';

const KEY = 'app';

export type { Settings } from './branding';

export const getSettings = cache(async (): Promise<Settings> => {
  try {
    const row = await db.appSetting.findUnique({ where: { key: KEY } });
    if (!row) return DEFAULT_SETTINGS;
    const parsed = sanitizeSettings(JSON.parse(row.value));
    return parsed.ok ? parsed.value : DEFAULT_SETTINGS;
  } catch (err) {
    console.warn('[einstellungen] Standardwerte werden benutzt:', err instanceof Error ? err.message : err);
    return DEFAULT_SETTINGS;
  }
});

export async function saveSettings(value: Settings) {
  const json = JSON.stringify(value);
  await db.appSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: json },
    update: { value: json },
  });
}
