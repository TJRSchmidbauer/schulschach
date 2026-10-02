import readline from 'node:readline';
import { PrismaClient } from '@prisma/client';
import { isMetaTheme, themeLabel } from '../src/lib/themes';

function arg(name: string, fallback: number): number {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  const n = hit ? Number(hit.split('=')[1]) : NaN;
  return Number.isFinite(n) ? n : fallback;
}

const MAX = arg('max', 5000);
const MIN_RATING = arg('min-rating', 400);
const MAX_RATING = arg('max-rating', 1600);
const MIN_POPULARITY = arg('min-popularity', 90);
const MIN_PLAYS = arg('min-plays', 500);
const PER_THEME = arg('per-theme', 250);

const db = new PrismaClient();
const counts = new Map<string, number>();

type NewPuzzle = {
  id: string;
  origin: string;
  fen: string;
  solutionUci: string;
  rating: number;
  themes: string[];
  title: string;
  hint: string;
  explanation: string;
  published: boolean;
};

async function flush(batch: NewPuzzle[]): Promise<number> {
  if (batch.length === 0) return 0;
  const res = await db.puzzle.createMany({ data: batch, skipDuplicates: true });
  return res.count;
}

async function main() {
  console.log(`[import] Filter: Rating ${MIN_RATING}-${MAX_RATING}, Beliebtheit >= ${MIN_POPULARITY}, Spielzahl >= ${MIN_PLAYS}, max ${MAX}, je Thema höchstens ${PER_THEME}`);
  const rl = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  let header = true;
  let seen = 0;
  let taken = 0;
  let inserted = 0;
  let batch: NewPuzzle[] = [];

  for await (const line of rl) {
    if (header) {
      header = false;
      continue;
    }
    seen++;
    if (seen % 500000 === 0) console.log(`[import] ${seen} Zeilen gelesen, ${taken} übernommen ...`);

    const c = line.split(',');
    if (c.length < 8) continue;
    const id = c[0];
    const fen = c[1];
    const moves = c[2];
    const rating = Number(c[3]);
    const popularity = Number(c[5]);
    const plays = Number(c[6]);
    const themes = (c[7] ?? '').split(' ').filter(Boolean);

    if (!id || !fen || !moves || themes.length === 0) continue;
    if (!Number.isFinite(rating) || rating < MIN_RATING || rating > MAX_RATING) continue;
    if (popularity < MIN_POPULARITY || plays < MIN_PLAYS) continue;
    if (moves.split(' ').length < 2) continue;

    const useful = themes.filter((t) => (counts.get(t) ?? 0) < PER_THEME);
    if (useful.length === 0) continue;
    for (const t of themes) counts.set(t, (counts.get(t) ?? 0) + 1);

    const topical = themes.filter((t) => !isMetaTheme(t));
    const main = topical[0] ?? themes[0];
    const labels = (topical.length > 0 ? topical : themes).slice(0, 2).map(themeLabel);

    batch.push({
      id: `li-${id}`,
      origin: 'lichess',
      fen,
      solutionUci: moves,
      rating,
      themes,
      title: `${themeLabel(main)} (${rating})`,
      hint: `Achte auf das Muster: ${labels.join(', ')}.`,
      explanation: `Gut gespielt! Das Muster heißt: ${labels.join(', ')}.`,
      published: true,
    });
    taken++;

    if (batch.length >= 500) {
      inserted += await flush(batch);
      batch = [];
    }
    if (taken >= MAX) break;
  }

  inserted += await flush(batch);
  rl.close();
  process.stdin.destroy();
  console.log(`[import] Fertig: ${seen} Zeilen gelesen, ${taken} ausgewählt, ${inserted} neu gespeichert.`);
}

main()
  .catch((err) => {
    console.error('[import] FEHLER:', err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
