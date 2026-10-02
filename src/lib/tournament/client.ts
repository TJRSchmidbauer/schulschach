import type { Standing, TResult, TStatus } from './types';

export type TView = {
  id: string;
  title: string;
  status: TStatus;
  rounds: number;
  createdAt: number;
  finishedAt: number | null;
  players: { id: string; alias: string; startRank: number; active: boolean }[];
  standings: Standing[];
  roundsList: {
    id: string;
    number: number;
    published: boolean;
    pairings: {
      id: string;
      board: number;
      whiteId: string;
      blackId: string | null;
      result: TResult;
      repeated: boolean;
    }[];
  }[];
};

export function fmtPts(n: number): string {
  return String(Math.round(n * 100) / 100).replace('.', ',');
}

export function nameMap(t: TView): Map<string, string> {
  return new Map(t.players.map((p) => [p.id, p.alias]));
}
