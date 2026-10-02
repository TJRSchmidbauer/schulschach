import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { swissPairings } from './pairing';
import { standings } from './scoring';
import type { PairingInput, PlayerInputFull, TResult } from './types';

export const RETENTION_DAYS = 90;
let lastCleanup = 0;

const fullInclude = {
  players: { orderBy: { startRank: 'asc' } },
  roundsList: {
    orderBy: { number: 'asc' },
    include: {
      pairings: { orderBy: { board: 'asc' } },
    },
  },
} satisfies Prisma.TournamentInclude;

export type TournamentFull = Prisma.TournamentGetPayload<{ include: typeof fullInclude }>;

export type Fail = { error: string; status: number };
export const fail = (error: string, status: number): Fail => ({ error, status });
export const isFail = (x: unknown): x is Fail => typeof x === 'object' && x !== null && 'error' in x;

export async function housekeeping() {
  const now = Date.now();
  if (now - lastCleanup < 60 * 60 * 1000) return;
  lastCleanup = now;
  await db.tournament.deleteMany({
    where: { status: 'FINISHED', finishedAt: { lt: new Date(now - RETENTION_DAYS * 86400000) } },
  });
}

export async function getTournament(id: string): Promise<TournamentFull | null> {
  return db.tournament.findUnique({ where: { id }, include: fullInclude });
}

export function inputs(t: TournamentFull): { players: PlayerInputFull[]; pairs: PairingInput[] } {
  return {
    players: t.players.map((p) => ({ id: p.id, alias: p.alias, startRank: p.startRank, active: p.active })),
    pairs: t.roundsList.flatMap((r) =>
      r.pairings.map((p) => ({
        id: p.id,
        round: r.number,
        board: p.board,
        whiteId: p.whiteId,
        blackId: p.blackId,
        result: p.result,
        repeated: p.repeated,
      })),
    ),
  };
}

export function view(t: TournamentFull) {
  const { players, pairs } = inputs(t);
  return {
    id: t.id,
    title: t.title,
    status: t.status,
    rounds: t.rounds,
    createdAt: t.createdAt.getTime(),
    finishedAt: t.finishedAt?.getTime() ?? null,
    players: t.players.map((p) => ({ id: p.id, alias: p.alias, startRank: p.startRank, active: p.active })),
    standings: standings(players, pairs),
    roundsList: t.roundsList.map((r) => ({
      id: r.id,
      number: r.number,
      published: r.published,
      pairings: r.pairings.map((p) => ({
        id: p.id,
        board: p.board,
        whiteId: p.whiteId,
        blackId: p.blackId,
        result: p.result,
        repeated: p.repeated,
      })),
    })),
  };
}

export async function createTournament(titleRaw: string, roundsRaw: number, aliasesRaw: string[]) {
  const title = titleRaw.trim();
  if (title.length < 2 || title.length > 100) return fail('Der Turniername muss 2 bis 100 Zeichen haben.', 400);
  const aliases = aliasesRaw.map((x) => x.trim()).filter(Boolean);
  if (aliases.length < 3 || aliases.length > 100) return fail('Ein Turnier braucht 3 bis 100 Teilnehmer.', 400);
  if (aliases.some((a) => a.length > 50)) return fail('Ein Alias darf höchstens 50 Zeichen haben.', 400);
  const normalized = aliases.map((a) => a.toLocaleLowerCase('de-DE'));
  if (new Set(normalized).size !== aliases.length) return fail('Jeder Alias darf nur einmal vorkommen.', 400);
  const rounds = Math.floor(roundsRaw);
  const minRounds = Math.max(1, Math.ceil(Math.log2(aliases.length)) - 1);
  const maxRounds = Math.min(15, aliases.length - 1);
  if (!Number.isFinite(rounds) || rounds < minRounds || rounds > maxRounds) {
    return fail(`Bitte ${minRounds} bis ${maxRounds} Runden wählen.`, 400);
  }

  const t = await db.tournament.create({
    data: {
      title,
      status: 'DRAFT',
      rounds,
      players: { create: aliases.map((alias, i) => ({ alias, startRank: i + 1 })) },
    },
    include: fullInclude,
  });
  return t;
}

export async function generateRound(id: string) {
  const t = await getTournament(id);
  if (!t) return fail('Turnier nicht gefunden.', 404);
  if (t.status === 'FINISHED') return fail('Dieses Turnier ist beendet.', 409);
  const previous = t.roundsList[t.roundsList.length - 1];
  if (previous && previous.pairings.some((p) => p.result === 'UNPLAYED')) {
    return fail('Bitte zuerst alle Ergebnisse der letzten Runde eintragen.', 409);
  }
  const next = t.roundsList.length + 1;
  if (next > t.rounds) return fail('Alle vorgesehenen Runden sind schon ausgelost.', 409);
  if (t.players.filter((p) => p.active).length < 2) {
    return fail('Für eine Auslosung werden mindestens 2 aktive Teilnehmer gebraucht.', 409);
  }

  const { players, pairs } = inputs(t);
  const proposed = swissPairings(players, pairs, next);
  const round = await db.tournamentRound.create({
    data: {
      tournamentId: t.id,
      number: next,
      published: false,
      pairings: {
        create: proposed.map((p, i) => ({
          board: i + 1,
          whiteId: p.whiteId,
          blackId: p.blackId,
          repeated: p.repeated,
          result: p.blackId === null ? 'BYE' : 'UNPLAYED',
        })),
      },
    },
  });
  if (t.status === 'DRAFT') await db.tournament.update({ where: { id: t.id }, data: { status: 'ACTIVE' } });
  return round;
}

export async function publishRound(id: string, roundNumber: number) {
  const t = await getTournament(id);
  if (!t) return fail('Turnier nicht gefunden.', 404);
  const r = t.roundsList.find((x) => x.number === roundNumber);
  if (!r) return fail('Runde nicht gefunden.', 404);
  await db.tournamentRound.update({ where: { id: r.id }, data: { published: true } });
  return true;
}

export async function setResult(tournamentId: string, pairingId: string, result: TResult) {
  if (!['WHITE_WIN', 'BLACK_WIN', 'DRAW', 'BYE', 'UNPLAYED'].includes(result)) return fail('Ungültiges Ergebnis.', 400);
  const pairing = await db.tournamentPairing.findUnique({
    where: { id: pairingId },
    include: { round: { select: { tournamentId: true } } },
  });
  if (!pairing || pairing.round.tournamentId !== tournamentId) return fail('Paarung nicht gefunden.', 404);
  if (!pairing.blackId && result !== 'BYE') return fail('Ein Freilos bleibt ein Freilos.', 400);
  await db.tournamentPairing.update({ where: { id: pairingId }, data: { result } });
  return true;
}

export async function finishTournament(id: string) {
  const t = await getTournament(id);
  if (!t) return fail('Turnier nicht gefunden.', 404);
  if (t.roundsList.some((r) => r.pairings.some((p) => p.result === 'UNPLAYED'))) {
    return fail('Es gibt noch offene Ergebnisse.', 409);
  }
  await db.tournament.update({ where: { id }, data: { status: 'FINISHED', finishedAt: new Date() } });
  return true;
}

// Abmelden gilt nur für künftige Runden: bisherige Partien und Punkte bleiben erhalten.
export async function setPlayerActive(tournamentId: string, playerId: string, active: boolean) {
  const t = await getTournament(tournamentId);
  if (!t) return fail('Turnier nicht gefunden.', 404);
  if (t.status === 'FINISHED') return fail('Dieses Turnier ist beendet.', 409);
  const player = t.players.find((p) => p.id === playerId);
  if (!player) return fail('Teilnehmer nicht gefunden.', 404);
  if (player.active === active) return true;
  if (!active && t.players.filter((p) => p.active).length <= 2) {
    return fail('Es müssen mindestens 2 aktive Teilnehmer im Turnier bleiben.', 409);
  }
  await db.tournamentPlayer.update({ where: { id: playerId }, data: { active } });
  return true;
}

export async function deleteTournament(id: string) {
  const t = await db.tournament.findUnique({ where: { id }, select: { id: true } });
  if (!t) return fail('Turnier nicht gefunden.', 404);
  await db.tournament.delete({ where: { id } });
  return true;
}
