import { Chess } from 'chess.js';

export type PuzzleLike = { fen: string; origin: string; solutionUci: string };

export function parseUci(uci: string) {
  return {
    from: uci.slice(0, 2),
    to: uci.slice(2, 4),
    promotion: uci.length > 4 ? uci[4] : undefined,
  };
}

export function movesOf(p: { solutionUci: string }): string[] {
  return p.solutionUci.trim().split(/\s+/).filter(Boolean);
}

export function firstSolverIndex(p: { origin: string }): number {
  return p.origin === 'lichess' ? 1 : 0;
}

export function positionBefore(p: PuzzleLike, idx: number): Chess {
  const chess = new Chess(p.fen);
  const moves = movesOf(p);
  for (let i = 0; i < idx; i++) {
    const m = parseUci(moves[i]);
    chess.move({ from: m.from, to: m.to, promotion: m.promotion });
  }
  return chess;
}

export function startFen(p: PuzzleLike): string {
  if (p.origin !== 'lichess') return p.fen;
  try {
    return positionBefore(p, 1).fen();
  } catch {
    return p.fen;
  }
}
