export type Color = 'w' | 'b';
export type GameStatus = 'WAITING' | 'ACTIVE' | 'FINISHED';
export type Player = { id: string; alias: string };

export type GameView = {
  id: string;
  status: GameStatus;
  startFen: string;
  fen: string;
  moves: string[];
  white: Player | null;
  black: Player | null;
  initialSeconds: number;
  incrementSeconds: number;
  whiteMs: number;
  blackMs: number;
  clockRunning: boolean;
  turnStartedAt: number | null;
  serverNow: number;
  turn: Color;
  result: string | null;
  reason: string | null;
  drawOffer: Color | null;
  customStart: boolean;
};

export type GameSummary = {
  id: string;
  status: GameStatus;
  white: Player | null;
  black: Player | null;
  control: string;
  customStart: boolean;
  moveCount: number;
  result: string | null;
  reason: string | null;
  createdByTrainer: boolean;
  createdAt: number;
  finishedAt: number | null;
};

export const STANDARD_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

export const CONTROLS = [
  { id: '5+3', initial: 300, increment: 3 },
  { id: '10+0', initial: 600, increment: 0 },
  { id: '10+5', initial: 600, increment: 5 },
  { id: '15+10', initial: 900, increment: 10 },
  { id: '30+0', initial: 1800, increment: 0 },
] as const;

export function findControl(id: string) {
  return CONTROLS.find((c) => c.id === id) ?? null;
}

export function controlLabel(initialSeconds: number, incrementSeconds: number): string {
  const minutes = Math.round(initialSeconds / 60);
  return incrementSeconds > 0 ? `${minutes} Min + ${incrementSeconds} Sek` : `${minutes} Min`;
}

export const PRESETS = [
  { id: 'standard', label: 'Normale Grundstellung', fen: STANDARD_FEN },
  { id: 'kqk', label: 'Dame + König gegen König', fen: '8/8/8/4k3/8/8/8/3QK3 w - - 0 1' },
  { id: 'krk', label: 'Turm + König gegen König', fen: '8/8/8/4k3/8/8/8/R3K3 w - - 0 1' },
  { id: 'rrk', label: 'Zwei Türme + König gegen König (Leitermatt)', fen: '8/8/8/4k3/8/8/8/R3K2R w - - 0 1' },
  { id: 'kpk', label: 'König + Bauer gegen König', fen: '8/8/4k3/8/4PK2/8/8/8 w - - 0 1' },
] as const;

export const REASON_LABEL: Record<string, string> = {
  checkmate: 'Schachmatt',
  timeout: 'Zeit abgelaufen',
  resign: 'Aufgabe',
  agreement: 'Remis vereinbart',
  stalemate: 'Patt',
  insufficient: 'zu wenig Material',
  repetition: 'dreifache Stellungswiederholung',
  fiftymoves: '50-Züge-Regel',
  aborted: 'abgebrochen',
  trainer: 'Entscheidung des Trainers',
};

export function resultText(g: {
  result: string | null;
  reason: string | null;
  white: Player | null;
  black: Player | null;
}): string {
  if (!g.result) return 'Partie abgebrochen';
  const why = g.reason ? REASON_LABEL[g.reason] ?? g.reason : '';
  if (g.result === '1/2-1/2') return why ? `Remis (${why})` : 'Remis';
  const whiteWins = g.result === '1-0';
  const name = (whiteWins ? g.white?.alias : g.black?.alias) ?? (whiteWins ? 'Weiß' : 'Schwarz');
  return why ? `${name} gewinnt (${why})` : `${name} gewinnt`;
}
