import { pair } from '@echecs/swiss/dutch';
import type { Game, Player } from '@echecs/swiss';
import { standings } from './scoring';
import type { PairingInput, PlayerInputFull, ProposedPairing, Standing } from './types';

// Hauptverfahren: FIDE-Holländisches System (C.04.3) über die Bibliothek @echecs/swiss (MIT).
// Rangfolge der Startnummern: Startrangliste, über eine künstliche Zahl als Rating abgebildet.
function toGames(historyPairs: PairingInput[]): Game[][] {
  const rounds = historyPairs.reduce((max, p) => Math.max(max, p.round), 0);
  const games: Game[][] = [];
  for (let r = 1; r <= rounds; r++) {
    const list: Game[] = [];
    for (const p of historyPairs) {
      if (p.round !== r) continue;
      if (p.blackId === null) {
        list.push({ white: p.whiteId, black: '', result: 1, kind: 'pairing-bye' });
        continue;
      }
      if (p.result === 'WHITE_WIN') list.push({ white: p.whiteId, black: p.blackId, result: 1 });
      else if (p.result === 'BLACK_WIN') list.push({ white: p.whiteId, black: p.blackId, result: 0 });
      else if (p.result === 'DRAW') list.push({ white: p.whiteId, black: p.blackId, result: 0.5 });
    }
    games.push(list);
  }
  return games;
}

function fideDutch(players: PlayerInputFull[], historyPairs: PairingInput[]): ProposedPairing[] {
  const libPlayers: Player[] = players.map((p) => ({ id: p.id, rating: 100000 - p.startRank }));
  const result = pair(libPlayers, toGames(historyPairs));
  const out: ProposedPairing[] = result.pairings.map((p) => ({ whiteId: p.white, blackId: p.black, repeated: false }));
  for (const b of result.byes) out.push({ whiteId: b.player, blackId: null, repeated: false, note: 'Freilos' });
  const covered = result.pairings.length * 2 + result.byes.length;
  if (covered !== players.length) throw new Error('Die Auslosung ist unvollständig.');
  return out;
}

// ---------------------------------------------------------------------------------------
// Rückfall: eigene, einfache Schulturnier-Paarung (gleiche Punktgruppe, Wiederholungen
// vermeiden, Farben ausgleichen). Wird nur benutzt, falls das Hauptverfahren fehlschlägt.
// ---------------------------------------------------------------------------------------
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function playedSet(pairs: PairingInput[]): Set<string> {
  const set = new Set<string>();
  for (const p of pairs) {
    if (p.blackId && p.result !== 'UNPLAYED') set.add([p.whiteId, p.blackId].sort().join(':'));
  }
  return set;
}

function seen(a: string, b: string, set: Set<string>): boolean {
  return set.has([a, b].sort().join(':'));
}

function colorCost(a: Standing, b: Standing, white: string): number {
  const w = white === a.id ? a : b;
  const black = white === a.id ? b : a;
  let cost = 0;
  cost += Math.max(0, w.colorBalance) * 30;
  cost += Math.max(0, -black.colorBalance) * 30;
  if (w.consecutiveColor === 'w') cost += 300;
  if (black.consecutiveColor === 'b') cost += 300;
  return cost;
}

function orient(a: Standing, b: Standing, seed: number): { white: string; black: string } {
  const ab = colorCost(a, b, a.id);
  const ba = colorCost(a, b, b.id);
  if (ab < ba) return { white: a.id, black: b.id };
  if (ba < ab) return { white: b.id, black: a.id };
  return (hash(a.id + b.id + seed) & 1) === 0 ? { white: a.id, black: b.id } : { white: b.id, black: a.id };
}

type PairChoice = { a: Standing; b: Standing; repeated: boolean; cost: number };

function chooseOpponent(a: Standing, candidates: Standing[], history: Set<string>, seed: number): PairChoice | null {
  let best: PairChoice | null = null;
  for (let i = 0; i < candidates.length; i++) {
    const b = candidates[i];
    const repeat = seen(a.id, b.id, history);
    const o = orient(a, b, seed);
    const cost =
      Math.abs(a.points - b.points) * 100000 +
      (repeat ? 10000000 : 0) +
      colorCost(a, b, o.white) * 100 +
      Math.abs(a.startRank - b.startRank) +
      i;
    if (!best || cost < best.cost) best = { a, b, repeated: repeat, cost };
  }
  return best;
}

function fallbackPairings(players: PlayerInputFull[], historyPairs: PairingInput[], round: number): ProposedPairing[] {
  const table = standings(players, historyPairs);
  const active = table.filter((x) => players.find((p) => p.id === x.id)?.active);
  const history = playedSet(historyPairs);
  const seed = round * 997 + players.length * 31;
  const byes = new Set(historyPairs.filter((p) => p.result === 'BYE').map((p) => p.whiteId));
  const work = [...active];
  const out: ProposedPairing[] = [];

  if (work.length % 2 === 1) {
    const byeCandidates = [...work]
      .filter((p) => !byes.has(p.id))
      .sort((a, b) => a.points - b.points || b.startRank - a.startRank);
    const bye = byeCandidates[0] ?? work[work.length - 1];
    work.splice(work.findIndex((p) => p.id === bye.id), 1);
    out.push({ whiteId: bye.id, blackId: null, repeated: false, note: 'Freilos' });
  }

  while (work.length > 0) {
    const a = work.shift()!;
    const same = work.filter((b) => b.points === a.points && !seen(a.id, b.id, history));
    const anyFresh = work.filter((b) => !seen(a.id, b.id, history));
    const pool = same.length ? same : anyFresh.length ? anyFresh : work;
    const choice = chooseOpponent(a, pool, history, seed);
    if (!choice) break;
    const index = work.findIndex((p) => p.id === choice.b.id);
    work.splice(index, 1);
    const o = orient(a, choice.b, seed);
    out.push({
      whiteId: o.white,
      blackId: o.black,
      repeated: choice.repeated,
      note: choice.repeated ? 'Wiederholung unvermeidbar – bitte prüfen' : undefined,
    });
  }

  return out.sort((a, b) => Number(a.blackId === null) - Number(b.blackId === null));
}

export function swissPairings(players: PlayerInputFull[], historyPairs: PairingInput[], round: number): ProposedPairing[] {
  try {
    return fideDutch(players, historyPairs);
  } catch (err) {
    console.warn('[turnier] FIDE-Auslosung fehlgeschlagen, Notlösung wird benutzt:', err instanceof Error ? err.message : err);
    return fallbackPairings(players, historyPairs, round);
  }
}
