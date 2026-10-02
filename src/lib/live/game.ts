import { Chess } from 'chess.js';
import { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { getExtras } from '@/lib/extras-server';
import { getSettings } from '@/lib/settings';
import { publish } from './bus';
import { STANDARD_FEN, controlLabel, findControl, type Color, type GameSummary, type GameView } from './types';

export const gameInclude = {
  white: { select: { id: true, alias: true } },
  black: { select: { id: true, alias: true } },
} satisfies Prisma.GameInclude;

export type GameRow = Prisma.GameGetPayload<{ include: typeof gameInclude }>;
export type Fail = { error: string; status: number };

export function fail(error: string, status: number): Fail {
  return { error, status };
}

export function isFail(x: unknown): x is Fail {
  return typeof x === 'object' && x !== null && 'error' in x;
}

const MINUTE = 60 * 1000;
const STALE_WAITING_MS = 30 * MINUTE;
const STALE_PRESTART_MS = 10 * MINUTE;
// Standardwert; die tatsächliche Frist steht in den Einstellungen (Trainer-Bereich).
export const RETENTION_DAYS = 90;
let lastCleanup = 0;

// Ist die Funktion „Live-Partien“ in den Einstellungen ausgeschaltet,
// entstehen keine neuen Partien. Bereits laufende Partien können enden.
async function liveOff(): Promise<Fail | null> {
  const settings = await getSettings();
  return settings.features.live ? null : fail('Live-Partien sind ausgeschaltet.', 403);
}

export function splitMoves(moves: string): string[] {
  return moves ? moves.split(' ') : [];
}

export function newChess(startFen: string, moves: string[]): Chess {
  const chess = new Chess(startFen);
  for (const m of moves) {
    chess.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m.length > 4 ? m[4] : undefined });
  }
  return chess;
}

function seatOf(g: GameRow, userId: string): Color | null {
  if (g.whiteId === userId) return 'w';
  if (g.blackId === userId) return 'b';
  return null;
}

function hasMatingMaterial(chess: Chess, color: Color): boolean {
  let minors = 0;
  for (const row of chess.board()) {
    for (const sq of row) {
      if (!sq || sq.color !== color) continue;
      if (sq.type === 'p' || sq.type === 'r' || sq.type === 'q') return true;
      if (sq.type === 'b' || sq.type === 'n') minors++;
    }
  }
  return minors >= 2;
}

function gameEnd(chess: Chess, mover: Color): { result: string; reason: string } | null {
  if (chess.isCheckmate()) return { result: mover === 'w' ? '1-0' : '0-1', reason: 'checkmate' };
  if (chess.isStalemate()) return { result: '1/2-1/2', reason: 'stalemate' };
  if (chess.isInsufficientMaterial()) return { result: '1/2-1/2', reason: 'insufficient' };
  if (chess.isThreefoldRepetition()) return { result: '1/2-1/2', reason: 'repetition' };
  if (chess.isDrawByFiftyMoves()) return { result: '1/2-1/2', reason: 'fiftymoves' };
  return null;
}

export function toView(g: GameRow, now: number = Date.now()): GameView {
  const moves = splitMoves(g.moves);
  const running = g.status === 'ACTIVE' && moves.length >= 2 && g.lastMoveAt !== null;
  return {
    id: g.id,
    status: g.status,
    startFen: g.startFen,
    fen: g.fen,
    moves,
    white: g.white,
    black: g.black,
    initialSeconds: g.initialSeconds,
    incrementSeconds: g.incrementSeconds,
    whiteMs: g.whiteMs,
    blackMs: g.blackMs,
    clockRunning: running,
    turnStartedAt: running && g.lastMoveAt ? g.lastMoveAt.getTime() : null,
    serverNow: now,
    turn: g.fen.split(' ')[1] === 'b' ? 'b' : 'w',
    result: g.result,
    reason: g.reason,
    drawOffer: g.drawOffer === 'w' || g.drawOffer === 'b' ? g.drawOffer : null,
    customStart: g.startFen !== STANDARD_FEN,
  };
}

export function toSummary(g: GameRow): GameSummary {
  return {
    id: g.id,
    status: g.status,
    white: g.white,
    black: g.black,
    control: controlLabel(g.initialSeconds, g.incrementSeconds),
    customStart: g.startFen !== STANDARD_FEN,
    moveCount: splitMoves(g.moves).length,
    result: g.result,
    reason: g.reason,
    createdByTrainer: g.createdByTrainer,
    createdAt: g.createdAt.getTime(),
    finishedAt: g.finishedAt ? g.finishedAt.getTime() : null,
  };
}

export async function getGame(id: string): Promise<GameRow | null> {
  return db.game.findUnique({ where: { id }, include: gameInclude });
}

async function finish(
  g: GameRow,
  result: string | null,
  reason: string,
  extra: Prisma.GameUpdateManyMutationInput = {},
): Promise<GameRow> {
  const res = await db.game.updateMany({
    where: { id: g.id, status: { not: 'FINISHED' } },
    data: { status: 'FINISHED', result, reason, finishedAt: new Date(), drawOffer: null, ...extra },
  });
  if (res.count > 0) publish(g.id);
  return (await getGame(g.id)) ?? g;
}

async function finishTimeout(g: GameRow, loser: Color): Promise<GameRow> {
  const winner: Color = loser === 'w' ? 'b' : 'w';
  const chess = newChess(g.startFen, splitMoves(g.moves));
  const result = hasMatingMaterial(chess, winner) ? (winner === 'w' ? '1-0' : '0-1') : '1/2-1/2';
  return finish(g, result, 'timeout', loser === 'w' ? { whiteMs: 0 } : { blackMs: 0 });
}

// Wendet Zeitüberschreitung und Inaktivität an. Wird bei jedem Lesen und im Live-Stream aufgerufen.
export async function settle(g: GameRow): Promise<GameRow> {
  if (g.status === 'FINISHED') return g;
  const now = Date.now();
  if (g.status === 'WAITING') {
    return now - g.createdAt.getTime() > STALE_WAITING_MS ? finish(g, null, 'aborted') : g;
  }
  const moves = splitMoves(g.moves);
  const last = (g.lastMoveAt ?? g.startedAt ?? g.createdAt).getTime();
  if (moves.length < 2) {
    return now - last > STALE_PRESTART_MS ? finish(g, null, 'aborted') : g;
  }
  const turn: Color = g.fen.split(' ')[1] === 'b' ? 'b' : 'w';
  const left = (turn === 'w' ? g.whiteMs : g.blackMs) - (now - last);
  return left > 0 ? g : finishTimeout(g, turn);
}

export async function settleAll(): Promise<void> {
  const rows = await db.game.findMany({ where: { status: { in: ['WAITING', 'ACTIVE'] } }, include: gameInclude });
  for (const g of rows) await settle(g);
}

export async function housekeeping(): Promise<void> {
  const now = Date.now();
  if (now - lastCleanup < 60 * MINUTE) return;
  lastCleanup = now;
  const days = (await getSettings()).retention.games;
  const border = new Date(now - days * 24 * 60 * MINUTE);
  await db.game.deleteMany({ where: { status: 'FINISHED', finishedAt: { lt: border } } });
}

export async function activeGameOf(userId: string): Promise<GameRow | null> {
  const g = await db.game.findFirst({
    where: { status: { in: ['WAITING', 'ACTIVE'] }, OR: [{ whiteId: userId }, { blackId: userId }] },
    include: gameInclude,
  });
  if (!g) return null;
  const settled = await settle(g);
  return settled.status === 'FINISHED' ? null : settled;
}

export function checkFen(input: string): { fen: string } | Fail {
  const parts = input.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fail('Bitte eine Stellung (FEN) eintragen.', 400);
  const full = [parts[0], parts[1] ?? 'w', parts[2] ?? '-', parts[3] ?? '-', parts[4] ?? '0', parts[5] ?? '1'];
  const board = full[0];
  const count = (ch: string) => board.split(ch).length - 1;
  if (count('k') !== 1 || count('K') !== 1) return fail('Jede Seite braucht genau einen König.', 400);
  try {
    const chess = new Chess(full.join(' '));
    if (chess.isGameOver()) return fail('In dieser Stellung ist die Partie schon zu Ende.', 400);
    return { fen: chess.fen() };
  } catch {
    return fail('Die Stellung (FEN) ist ungültig.', 400);
  }
}

export async function createChallenge(userId: string, controlId: string, pref: string): Promise<GameRow | Fail> {
  const off = await liveOff();
  if (off) return off;
  const control = findControl(controlId);
  if (!control) return fail('Unbekannte Bedenkzeit.', 400);
  const allowed = (await getExtras()).live.controls;
  if (!allowed.includes(control.id)) return fail('Diese Bedenkzeit ist nicht erlaubt.', 400);
  if (await activeGameOf(userId)) return fail('Du hast schon eine offene oder laufende Partie.', 409);
  const color: Color = pref === 'w' || pref === 'b' ? pref : Math.random() < 0.5 ? 'w' : 'b';
  const ms = control.initial * 1000;
  return db.game.create({
    data: {
      status: 'WAITING',
      whiteId: color === 'w' ? userId : null,
      blackId: color === 'b' ? userId : null,
      startFen: STANDARD_FEN,
      fen: STANDARD_FEN,
      initialSeconds: control.initial,
      incrementSeconds: control.increment,
      whiteMs: ms,
      blackMs: ms,
    },
    include: gameInclude,
  });
}

export async function acceptChallenge(userId: string, gameId: string): Promise<GameRow | Fail> {
  const off = await liveOff();
  if (off) return off;
  const g = await getGame(gameId);
  if (!g || g.status !== 'WAITING') return fail('Diese Herausforderung gibt es nicht mehr.', 404);
  if (g.whiteId === userId || g.blackId === userId) return fail('Das ist deine eigene Herausforderung.', 400);
  if (await activeGameOf(userId)) return fail('Du hast schon eine offene oder laufende Partie.', 409);
  const now = new Date();
  const res =
    g.whiteId === null
      ? await db.game.updateMany({
          where: { id: gameId, status: 'WAITING', whiteId: null },
          data: { whiteId: userId, status: 'ACTIVE', startedAt: now, lastMoveAt: now },
        })
      : await db.game.updateMany({
          where: { id: gameId, status: 'WAITING', blackId: null },
          data: { blackId: userId, status: 'ACTIVE', startedAt: now, lastMoveAt: now },
        });
  if (res.count === 0) return fail('Jemand anderes war schneller.', 409);
  publish(gameId);
  return (await getGame(gameId)) as GameRow;
}

export async function cancelChallenge(userId: string, gameId: string): Promise<true | Fail> {
  const res = await db.game.deleteMany({
    where: { id: gameId, status: 'WAITING', OR: [{ whiteId: userId }, { blackId: userId }] },
  });
  return res.count > 0 ? true : fail('Die Herausforderung gibt es nicht mehr.', 404);
}

export async function createPairing(input: {
  whiteId: string;
  blackId: string;
  controlId: string;
  fen: string | null;
  randomColors: boolean;
}): Promise<GameRow | Fail> {
  const off = await liveOff();
  if (off) return off;
  const control = findControl(input.controlId);
  if (!control) return fail('Unbekannte Bedenkzeit.', 400);
  if (input.whiteId === input.blackId) return fail('Bitte zwei verschiedene Schüler wählen.', 400);

  const students = await db.user.findMany({
    where: { id: { in: [input.whiteId, input.blackId] }, role: 'STUDENT', active: true },
    select: { id: true },
  });
  if (students.length !== 2) return fail('Unbekannter Schüler.', 400);
  if ((await activeGameOf(input.whiteId)) || (await activeGameOf(input.blackId))) {
    return fail('Einer der beiden hat schon eine offene oder laufende Partie.', 409);
  }

  let start = STANDARD_FEN;
  if (input.fen && input.fen.trim()) {
    const checked = checkFen(input.fen);
    if ('error' in checked) return checked;
    start = checked.fen;
  }

  const swap = input.randomColors && Math.random() < 0.5;
  const whiteId = swap ? input.blackId : input.whiteId;
  const blackId = swap ? input.whiteId : input.blackId;
  const now = new Date();
  const ms = control.initial * 1000;
  return db.game.create({
    data: {
      status: 'ACTIVE',
      whiteId,
      blackId,
      createdByTrainer: true,
      startFen: start,
      fen: start,
      initialSeconds: control.initial,
      incrementSeconds: control.increment,
      whiteMs: ms,
      blackMs: ms,
      startedAt: now,
      lastMoveAt: now,
    },
    include: gameInclude,
  });
}

export async function makeMove(gameId: string, userId: string, uci: string): Promise<GameRow | Fail> {
  const loaded = await getGame(gameId);
  if (!loaded) return fail('Partie nicht gefunden.', 404);
  const g = await settle(loaded);
  if (g.status !== 'ACTIVE') return fail('Die Partie läuft nicht mehr.', 409);

  const moves = splitMoves(g.moves);
  const chess = newChess(g.startFen, moves);
  const turn: Color = chess.turn();
  if (seatOf(g, userId) !== turn) return fail('Du bist nicht am Zug.', 403);

  let played: ReturnType<Chess['move']>;
  try {
    played = chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
  } catch {
    return fail('Dieser Zug ist nicht erlaubt.', 400);
  }

  const now = Date.now();
  let whiteMs = g.whiteMs;
  let blackMs = g.blackMs;
  if (moves.length >= 2 && g.lastMoveAt) {
    const left = (turn === 'w' ? whiteMs : blackMs) - (now - g.lastMoveAt.getTime());
    if (left <= 0) return finishTimeout(g, turn);
    const next = left + g.incrementSeconds * 1000;
    if (turn === 'w') whiteMs = next;
    else blackMs = next;
  }

  const newMoves = [...moves, played.from + played.to + (played.promotion ?? '')];
  const data: Prisma.GameUpdateManyMutationInput = {
    moves: newMoves.join(' '),
    fen: chess.fen(),
    whiteMs,
    blackMs,
    lastMoveAt: new Date(now),
    drawOffer: null,
  };
  const end = gameEnd(chess, turn);
  if (end) {
    data.status = 'FINISHED';
    data.result = end.result;
    data.reason = end.reason;
    data.finishedAt = new Date(now);
  }

  const res = await db.game.updateMany({ where: { id: g.id, status: 'ACTIVE', moves: g.moves }, data });
  if (res.count === 0) return fail('Der Zug kam zu spät oder doppelt an. Bitte noch einmal versuchen.', 409);
  publish(g.id);
  return (await getGame(g.id)) as GameRow;
}

export async function resign(gameId: string, userId: string): Promise<GameRow | Fail> {
  const loaded = await getGame(gameId);
  if (!loaded) return fail('Partie nicht gefunden.', 404);
  const g = await settle(loaded);
  if (g.status !== 'ACTIVE') return fail('Die Partie läuft nicht mehr.', 409);
  const seat = seatOf(g, userId);
  if (!seat) return fail('Du spielst hier nicht mit.', 403);
  return finish(g, seat === 'w' ? '0-1' : '1-0', 'resign');
}

export async function drawAction(
  gameId: string,
  userId: string,
  kind: 'offer' | 'accept' | 'decline',
): Promise<GameRow | Fail> {
  const loaded = await getGame(gameId);
  if (!loaded) return fail('Partie nicht gefunden.', 404);
  const g = await settle(loaded);
  if (g.status !== 'ACTIVE') return fail('Die Partie läuft nicht mehr.', 409);
  const seat = seatOf(g, userId);
  if (!seat) return fail('Du spielst hier nicht mit.', 403);
  const open = g.drawOffer === 'w' || g.drawOffer === 'b' ? g.drawOffer : null;

  if (kind === 'offer') {
    if (open && open !== seat) return finish(g, '1/2-1/2', 'agreement');
    await db.game.updateMany({ where: { id: g.id, status: 'ACTIVE' }, data: { drawOffer: seat } });
  } else {
    if (!open || open === seat) return fail('Es gibt kein Remis-Angebot, das du beantworten kannst.', 409);
    if (kind === 'accept') return finish(g, '1/2-1/2', 'agreement');
    await db.game.updateMany({ where: { id: g.id, status: 'ACTIVE' }, data: { drawOffer: null } });
  }
  publish(g.id);
  return (await getGame(g.id)) as GameRow;
}

export async function trainerEnd(gameId: string, action: 'abort' | 'result', result?: string): Promise<GameRow | Fail> {
  const g = await getGame(gameId);
  if (!g) return fail('Partie nicht gefunden.', 404);
  if (g.status === 'FINISHED') return fail('Die Partie ist schon beendet.', 409);
  if (action === 'abort') return finish(g, null, 'aborted');
  if (result !== '1-0' && result !== '0-1' && result !== '1/2-1/2') return fail('Ungültiges Ergebnis.', 400);
  return finish(g, result, 'trainer');
}
