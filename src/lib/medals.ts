import { isMetaTheme } from './themes';

export type AttemptRow = { puzzleId: string; result: string; createdAt: Date; themes: string[] };
export type Stats = {
  solved: number;
  independent: number;
  longestStreak: number;
  currentStreak: number;
  byTheme: Record<string, number>;
};
export type Tier = 'bronze' | 'silver' | 'gold';
export type MedalState = {
  id: string;
  icon: string;
  title: string;
  text: string;
  tier: Tier;
  target: number;
  current: number;
  earned: boolean;
};

type MedalDef = {
  id: string;
  icon: string;
  title: string;
  text: string;
  tier: Tier;
  target: number;
  value: (s: Stats) => number;
};

const dayFmt = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Europe/Berlin',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function dayNumber(d: Date): number {
  const [y, m, day] = dayFmt.format(d).split('-').map(Number);
  return Date.UTC(y, m - 1, day) / 86400000;
}

export function computeStats(rows: AttemptRow[], now: Date = new Date()): Stats {
  const solved = new Set<string>();
  const independent = new Set<string>();
  const themeSets = new Map<string, Set<string>>();
  const days = new Set<number>();

  for (const r of rows) {
    if (r.result !== 'SOLVED_INDEPENDENT' && r.result !== 'SOLVED_WITH_HINT') continue;
    solved.add(r.puzzleId);
    if (r.result === 'SOLVED_INDEPENDENT') independent.add(r.puzzleId);
    days.add(dayNumber(r.createdAt));
    for (const t of r.themes) {
      if (isMetaTheme(t)) continue;
      if (!themeSets.has(t)) themeSets.set(t, new Set());
      themeSets.get(t)!.add(r.puzzleId);
    }
  }

  const sorted = [...days].sort((a, b) => a - b);
  let longest = 0;
  let run = 0;
  let prev = -Infinity;
  for (const d of sorted) {
    run = d === prev + 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
    prev = d;
  }

  const today = dayNumber(now);
  let current = 0;
  if (days.has(today) || days.has(today - 1)) {
    let d = days.has(today) ? today : today - 1;
    while (days.has(d)) {
      current++;
      d--;
    }
  }

  const byTheme: Record<string, number> = {};
  for (const [t, set] of themeSets) byTheme[t] = set.size;

  return { solved: solved.size, independent: independent.size, longestStreak: longest, currentStreak: current, byTheme };
}

const th = (t: string) => (s: Stats) => s.byTheme[t] ?? 0;

const MEDALS: MedalDef[] = [
  { id: 'first', icon: '🌱', title: 'Erster Schritt', text: 'Löse deine erste Aufgabe.', tier: 'bronze', target: 1, value: (s) => s.solved },
  { id: 'solved10', icon: '♟️', title: 'Bauernstark', text: 'Löse 10 Aufgaben.', tier: 'bronze', target: 10, value: (s) => s.solved },
  { id: 'solved25', icon: '🐴', title: 'Springer-Talent', text: 'Löse 25 Aufgaben.', tier: 'silver', target: 25, value: (s) => s.solved },
  { id: 'solved50', icon: '🏰', title: 'Turm-Held', text: 'Löse 50 Aufgaben.', tier: 'silver', target: 50, value: (s) => s.solved },
  { id: 'solved100', icon: '👑', title: 'Schachkönig', text: 'Löse 100 Aufgaben.', tier: 'gold', target: 100, value: (s) => s.solved },
  { id: 'solved250', icon: '🏆', title: 'Großmeister-Anwärter', text: 'Löse 250 Aufgaben.', tier: 'gold', target: 250, value: (s) => s.solved },
  { id: 'indep10', icon: '💡', title: 'Selbstdenker', text: 'Löse 10 Aufgaben ganz ohne Tipp.', tier: 'bronze', target: 10, value: (s) => s.independent },
  { id: 'indep50', icon: '🧠', title: 'Superhirn', text: 'Löse 50 Aufgaben ganz ohne Tipp.', tier: 'silver', target: 50, value: (s) => s.independent },
  { id: 'streak3', icon: '🔥', title: 'Dranbleiber', text: 'Übe an 3 Tagen hintereinander.', tier: 'bronze', target: 3, value: (s) => s.longestStreak },
  { id: 'streak7', icon: '⚡', title: 'Wochenserie', text: 'Übe an 7 Tagen hintereinander.', tier: 'silver', target: 7, value: (s) => s.longestStreak },
  { id: 'streak14', icon: '🚀', title: 'Schach-Profi', text: 'Übe an 14 Tagen hintereinander.', tier: 'gold', target: 14, value: (s) => s.longestStreak },
  { id: 'fork10', icon: '🍴', title: 'Gabelmeister', text: 'Löse 10 Gabel-Aufgaben.', tier: 'bronze', target: 10, value: th('fork') },
  { id: 'pin10', icon: '📌', title: 'Fesselkünstler', text: 'Löse 10 Fesselungs-Aufgaben.', tier: 'bronze', target: 10, value: th('pin') },
  { id: 'mate1', icon: '🎯', title: 'Mattjäger', text: 'Löse 10 Aufgaben „Matt in 1“.', tier: 'bronze', target: 10, value: th('mateIn1') },
  { id: 'mate2', icon: '🧩', title: 'Matt-Planer', text: 'Löse 10 Aufgaben „Matt in 2“.', tier: 'silver', target: 10, value: th('mateIn2') },
  { id: 'backrank', icon: '🚪', title: 'Hintertür-Experte', text: 'Löse 5 Grundreihenmatt-Aufgaben.', tier: 'silver', target: 5, value: th('backRankMate') },
  { id: 'discovered', icon: '🎭', title: 'Abzugskünstler', text: 'Löse 5 Abzugsangriff-Aufgaben.', tier: 'silver', target: 5, value: th('discoveredAttack') },
  { id: 'allround', icon: '🌈', title: 'Allrounder', text: 'Löse in 5 verschiedenen Themen je mindestens 5 Aufgaben.', tier: 'gold', target: 5, value: (s) => Object.values(s.byTheme).filter((n) => n >= 5).length },
];

export function evaluateMedals(stats: Stats): MedalState[] {
  return MEDALS.map((m) => {
    const v = m.value(stats);
    return {
      id: m.id,
      icon: m.icon,
      title: m.title,
      text: m.text,
      tier: m.tier,
      target: m.target,
      current: Math.min(v, m.target),
      earned: v >= m.target,
    };
  });
}

export function achievementText(solved: number, medals: number): string {
  const a = solved === 1 ? '1 Schachaufgabe' : `${solved} Schachaufgaben`;
  const m = medals === 1 ? '1 Medaille' : `${medals} Medaillen`;
  return `hat ${a} gelöst und ${m} gesammelt.`;
}
