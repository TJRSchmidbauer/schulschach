import type { PairingInput, PlayerInputFull, Standing, TResult } from './types';

function points(result: TResult, side: 'w' | 'b'): number {
  if (result === 'BYE') return side === 'w' ? 1 : 0;
  if (result === 'DRAW') return 0.5;
  if (result === 'WHITE_WIN') return side === 'w' ? 1 : 0;
  if (result === 'BLACK_WIN') return side === 'b' ? 1 : 0;
  return 0;
}

function win(result: TResult, side: 'w' | 'b'): boolean {
  return (result === 'WHITE_WIN' && side === 'w') || (result === 'BLACK_WIN' && side === 'b') || (result === 'BYE' && side === 'w');
}

export function completed(pairs: PairingInput[]): PairingInput[] {
  return pairs.filter((p) => p.result !== 'UNPLAYED');
}

// FIDE-nahe Schulturnier-Wertung: ungespielte Partien zählen nicht;
// Buchholz/Feinbuchholz streichen die niedrigste gegnerische Punktzahl einmal.
export function standings(players: PlayerInputFull[], pairs: PairingInput[]): Standing[] {
  const done = completed(pairs);
  const byId = new Map(players.map((p) => [p.id, p]));
  const data = new Map<string, Standing>();
  const opponents = new Map<string, string[]>();
  const outcomes = new Map<string, { opponent: string; score: number }[]>();
  const colors = new Map<string, ('w' | 'b')[]>();

  for (const p of players) {
    data.set(p.id, {
      id: p.id,
      alias: p.alias,
      startRank: p.startRank,
      points: 0,
      buchholz: 0,
      feinbuchholz: 0,
      sonnebornBerger: 0,
      wins: 0,
      games: 0,
      byes: 0,
      colorBalance: 0,
      consecutiveColor: null,
    });
    opponents.set(p.id, []);
    outcomes.set(p.id, []);
    colors.set(p.id, []);
  }

  for (const pair of done) {
    const white = data.get(pair.whiteId);
    if (!white) continue;
    const wp = points(pair.result, 'w');
    white.points += wp;
    white.games++;
    if (win(pair.result, 'w')) white.wins++;

    if (!pair.blackId) {
      if (pair.result === 'BYE') white.byes++;
      continue;
    }
    const black = data.get(pair.blackId);
    if (!black) continue;
    const bp = points(pair.result, 'b');
    black.points += bp;
    black.games++;
    if (win(pair.result, 'b')) black.wins++;

    opponents.get(white.id)!.push(black.id);
    opponents.get(black.id)!.push(white.id);
    outcomes.get(white.id)!.push({ opponent: black.id, score: wp });
    outcomes.get(black.id)!.push({ opponent: white.id, score: bp });
    colors.get(white.id)!.push('w');
    colors.get(black.id)!.push('b');
  }

  for (const s of data.values()) {
    const os = (opponents.get(s.id) ?? []).map((id) => data.get(id)?.points ?? 0).sort((a, b) => a - b);
    const trimmed = os.length > 0 ? os.slice(1) : [];
    s.buchholz = trimmed.reduce((a, b) => a + b, 0);

    const feinValues = (opponents.get(s.id) ?? []).map((id) => {
      const oo = (opponents.get(id) ?? []).map((oid) => data.get(oid)?.points ?? 0).sort((a, b) => a - b);
      return (oo.length > 0 ? oo.slice(1) : []).reduce((a, b) => a + b, 0);
    }).sort((a, b) => a - b);
    s.feinbuchholz = (feinValues.length > 0 ? feinValues.slice(1) : []).reduce((a, b) => a + b, 0);

    s.sonnebornBerger = (outcomes.get(s.id) ?? []).reduce((sum, o) => sum + o.score * (data.get(o.opponent)?.points ?? 0), 0);
    const cs = colors.get(s.id) ?? [];
    s.colorBalance = cs.filter((c) => c === 'w').length - cs.filter((c) => c === 'b').length;
    if (cs.length >= 2 && cs[cs.length - 1] === cs[cs.length - 2]) s.consecutiveColor = cs[cs.length - 1];
  }

  return Array.from(data.values())
    .filter((s) => byId.get(s.id)?.active)
    .sort((a, b) =>
      b.points - a.points ||
      b.buchholz - a.buchholz ||
      b.feinbuchholz - a.feinbuchholz ||
      b.sonnebornBerger - a.sonnebornBerger ||
      b.wins - a.wins ||
      a.startRank - b.startRank,
    );
}

export function pointOf(result: TResult, side: 'w' | 'b'): number {
  return points(result, side);
}
