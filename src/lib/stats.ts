import { isMetaTheme } from './themes';

export type StatRow = {
  userId: string;
  result: string;
  wrongAttempts: number;
  durationSeconds: number;
  themes: string[];
};

export type Totals = {
  attempts: number;
  independent: number;
  withHint: number;
  viewed: number;
  wrong: number;
  seconds: number;
};

export type ThemeStat = Totals & { theme: string };

function empty(): Totals {
  return { attempts: 0, independent: 0, withHint: 0, viewed: 0, wrong: 0, seconds: 0 };
}

function add(t: Totals, r: StatRow) {
  t.attempts++;
  if (r.result === 'SOLVED_INDEPENDENT') t.independent++;
  else if (r.result === 'SOLVED_WITH_HINT') t.withHint++;
  else if (r.result === 'SOLUTION_VIEWED') t.viewed++;
  t.wrong += r.wrongAttempts;
  t.seconds += r.durationSeconds;
}

export function totals(rows: StatRow[]): Totals {
  const t = empty();
  for (const r of rows) {
    if (r.result === 'ABANDONED') continue;
    add(t, r);
  }
  return t;
}

export function byTheme(rows: StatRow[]): ThemeStat[] {
  const map = new Map<string, ThemeStat>();
  for (const r of rows) {
    if (r.result === 'ABANDONED') continue;
    for (const theme of r.themes) {
      if (isMetaTheme(theme)) continue;
      let s = map.get(theme);
      if (!s) {
        s = { theme, ...empty() };
        map.set(theme, s);
      }
      add(s, r);
    }
  }
  return Array.from(map.values());
}

export function pct(n: number, d: number): number {
  return d > 0 ? Math.round((n / d) * 100) : 0;
}

export function avg(n: number, d: number): string {
  return d > 0 ? (n / d).toFixed(1) : '0.0';
}

export function weakest(stats: ThemeStat[], minAttempts: number, limit: number): ThemeStat[] {
  return stats
    .filter((s) => s.attempts >= minAttempts && pct(s.independent, s.attempts) < 60)
    .sort((a, b) => a.independent / a.attempts - b.independent / b.attempts)
    .slice(0, limit);
}
