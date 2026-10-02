import { cache } from 'react';
import { db } from '@/lib/db';
import { DEFAULT_EXTRAS, sanitizeExtras, type Extras } from './extras';

const KEY = 'extras';

export const getExtras = cache(async (): Promise<Extras> => {
  try {
    const row = await db.appSetting.findUnique({ where: { key: KEY } });
    if (!row) return DEFAULT_EXTRAS;
    const parsed = sanitizeExtras(JSON.parse(row.value));
    return parsed.ok ? parsed.value : DEFAULT_EXTRAS;
  } catch (err) {
    console.warn('[einstellungen] Standardwerte (extras) werden benutzt:', err instanceof Error ? err.message : err);
    return DEFAULT_EXTRAS;
  }
});

export async function saveExtras(value: Extras) {
  const json = JSON.stringify(value);
  await db.appSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, value: json },
    update: { value: json },
  });
}
