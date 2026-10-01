const LABELS: Record<string, string> = {
  mateIn1: 'Matt in 1',
  backRankMate: 'Grundreihenmatt',
  scholarsMate: 'Schäfermatt',
  ladderMate: 'Leitermatt',
  fork: 'Gabel',
  pin: 'Fesselung',
  skewer: 'Spieß',
  hangingPiece: 'Ungedeckte Figur',
  promotion: 'Umwandlung',
  bishop: 'Läufer',
  rook: 'Turm',
  queen: 'Dame',
  knight: 'Springer',
};

export function themeLabel(theme: string): string {
  return LABELS[theme] ?? theme;
}
