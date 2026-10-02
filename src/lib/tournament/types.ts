export type TStatus = 'DRAFT' | 'ACTIVE' | 'FINISHED';
export type TResult = 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW' | 'BYE' | 'UNPLAYED';

export type PlayerInput = { alias: string; startRank: number };
export type PairingInput = {
  id: string;
  round: number;
  board: number;
  whiteId: string;
  blackId: string | null;
  result: TResult;
  repeated: boolean;
};
export type PlayerInputFull = PlayerInput & { id: string; active: boolean };

export type Standing = {
  id: string;
  alias: string;
  startRank: number;
  active: boolean;
  points: number;
  buchholz: number;
  feinbuchholz: number;
  sonnebornBerger: number;
  wins: number;
  games: number;
  byes: number;
  colorBalance: number;
  consecutiveColor: 'w' | 'b' | null;
};

export type ProposedPairing = {
  whiteId: string;
  blackId: string | null;
  repeated: boolean;
  note?: string;
};

export const RESULT_LABEL: Record<TResult, string> = {
  WHITE_WIN: '1–0',
  BLACK_WIN: '0–1',
  DRAW: '½–½',
  BYE: '1–0 Freilos',
  UNPLAYED: 'offen',
};

export const RANKING_RULES = [
  'Punkte',
  'Buchholz mit einem Streichergebnis',
  'Feinbuchholz mit einem Streichergebnis',
  'Sonneborn-Berger',
  'Zahl der Siege',
  'Startrangliste',
] as const;
