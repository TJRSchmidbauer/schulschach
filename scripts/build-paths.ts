import { PrismaClient } from '@prisma/client';
import { PATHS } from '../src/lib/paths-config';

const db = new PrismaClient();

function spread<T>(items: T[], n: number): T[] {
  if (items.length <= n) return items;
  const out: T[] = [];
  for (let i = 0; i < n; i++) out.push(items[Math.floor((i * items.length) / n)]);
  return out;
}

async function main() {
  for (const p of PATHS) {
    const path = await db.learningPath.upsert({
      where: { slug: p.slug },
      update: { title: p.title, description: p.description, sortOrder: p.sortOrder },
      create: { slug: p.slug, title: p.title, description: p.description, sortOrder: p.sortOrder },
    });
    const usedInPath = new Set<string>();

    for (let i = 0; i < p.modules.length; i++) {
      const m = p.modules[i];
      const id = `${p.slug}-m${i + 1}`;
      await db.module.upsert({
        where: { id },
        update: { title: m.title, contentMd: m.text, sortOrder: i + 1 },
        create: { id, learningPathId: path.id, title: m.title, contentMd: m.text, sortOrder: i + 1 },
      });

      const existing = await db.modulePuzzle.findMany({ where: { moduleId: id }, select: { puzzleId: true } });
      existing.forEach((e) => usedInPath.add(e.puzzleId));
      const need = m.count - existing.length;

      let added = 0;
      if (need > 0) {
        const candidates = await db.puzzle.findMany({
          where: {
            published: true,
            origin: 'lichess',
            themes: { hasSome: m.themes },
            rating: { gte: m.min, lte: m.max },
            id: { notIn: Array.from(usedInPath) },
          },
          orderBy: { rating: 'asc' },
          take: 400,
          select: { id: true },
        });
        const picked = spread(candidates, need);
        picked.forEach((c) => usedInPath.add(c.id));
        const res = await db.modulePuzzle.createMany({
          data: picked.map((c, j) => ({ moduleId: id, puzzleId: c.id, sortOrder: existing.length + j + 1 })),
          skipDuplicates: true,
        });
        added = res.count;
      }

      const total = existing.length + added;
      await db.module.update({ where: { id }, data: { active: total > 0 } });
      const warn = total < m.count ? `  <- nur ${total} von ${m.count}, bitte mehr Aufgaben importieren` : '';
      console.log(`[paths] ${p.title} / ${m.title}: ${total} Aufgaben${warn}`);
    }
  }
}

main()
  .catch((err) => {
    console.error('[paths] FEHLER:', err);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
