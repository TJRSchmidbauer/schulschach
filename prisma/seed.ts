import crypto from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { scryptHash, codeLookupHash } from '../src/lib/auth';

const db = new PrismaClient();

const PUZZLES = [
  { id: 'bauern-01', fen: '6k1/pp3ppp/8/4r3/8/8/1B3PPP/6K1 w - - 0 1', solutionUci: 'b2e5', rating: 650, themes: ['hangingPiece', 'bishop'], title: 'Läufer schlägt Turm', hint: 'Der Turm auf e5 ist ungedeckt. Dein Läufer zieht diagonal.', explanation: 'Der Turm auf e5 wird von keiner schwarzen Figur gedeckt. Dein Läufer auf b2 greift e5 über die Diagonale an und gewinnt den Turm.' },
  { id: 'bauern-02', fen: 'r6k/8/8/8/8/8/8/R6K w - - 0 1', solutionUci: 'a1a8', rating: 650, themes: ['hangingPiece', 'rook'], title: 'Turm frisst Turm', hint: 'Der gegnerische Turm auf a8 steht allein auf der a-Linie.', explanation: 'Der schwarze Turm a8 wird von niemandem gedeckt. Dein Turm zieht auf derselben Linie a1 nach a8 und schlägt ihn.' },
  { id: 'matt-01', fen: 'k7/2Q5/2K5/8/8/8/8/8 w - - 0 1', solutionUci: 'c7b7', rating: 700, themes: ['mateIn1'], title: 'Dame und König netzen zu', hint: 'Ziehe die Dame direkt neben den gegnerischen König – dein eigener König schützt sie.', explanation: 'Qb7 ist Matt: Die Dame bedroht den König, alle Fluchtfelder sind durch Dame und König abgedeckt.' },
  { id: 'matt-02', fen: '6k1/5ppp/8/8/8/8/8/4R1K1 w - - 0 1', solutionUci: 'e1e8', rating: 700, themes: ['mateIn1', 'backRankMate'], title: 'Die offene Linie', hint: 'Der König wird von seinen eigenen Bauern auf der Grundreihe eingesperrt.', explanation: 'Re8 setzt Matt, weil die Bauern f7, g7 und h7 dem König jedes Entkommen verwehren.' },
  { id: 'matt-03', fen: '6k1/6pp/8/8/8/8/8/4Q1K1 w - - 0 1', solutionUci: 'e1e8', rating: 720, themes: ['mateIn1', 'backRankMate'], title: 'Damenschach auf der Grundreihe', hint: 'Die Dame deckt die komplette letzte Reihe ab, wenn sie auf die achte Reihe zieht.', explanation: 'Qe8 ist Matt: Die Dame kontrolliert die ganze achte Reihe; die Bauern f7 und h7 bleiben Fesseln.' },
  { id: 'matt-04', fen: 'r1bqkbnr/pppp1ppp/2n5/4p3/2B1P3/5Q2/PPPP1PPP/RNB1K1NR w KQkq - 0 1', solutionUci: 'f3f7', rating: 750, themes: ['mateIn1', 'scholarsMate'], title: 'Dame und Läufer im Duett', hint: 'Dame und Läufer zielen beide auf den Bauern f7 direkt neben dem König.', explanation: 'Das berühmte Schäfermatt: Qxf7 wird durch den Läufer c4 gedeckt und ist sofort Matt.' },
  { id: 'matt-05', fen: '7k/8/3R4/8/8/8/8/R6K w - - 0 1', solutionUci: 'd6d8', rating: 760, themes: ['mateIn1', 'ladderMate'], title: 'Leitermatt', hint: 'Der eine Turm sperrt schon die siebte Reihe ab, der andere liefert auf der achten Reihe das Matt.', explanation: 'Rd8 ist Matt, weil der Turm d7 das Entkommen auf Reihe 7 verhindert – ein typisches Leitermatt.' },
  { id: 'taktik-01', fen: '4k3/8/4b3/8/8/8/8/4R1K1 w - - 0 1', solutionUci: 'e1e6', rating: 850, themes: ['pin'], title: 'Gefesselt!', hint: 'Der Läufer auf e6 darf nicht wegziehen – dahinter steht der König.', explanation: 'Der schwarze Läufer e6 ist durch den Turm gefesselt, weil der König dahinter steht. Du kannst ihn einfach schlagen.' },
  { id: 'taktik-02', fen: '8/4P3/8/8/1k6/8/8/1K6 w - - 0 1', solutionUci: 'e7e8q', rating: 800, themes: ['promotion'], title: 'Aufstieg des Bauern', hint: 'Der Bauer möchte bis zur letzten Reihe durchmarschieren.', explanation: 'Ein Bauer, der die letzte Reihe erreicht, verwandelt sich – hier zur Dame. Das nennt man Umwandlung.' },
  { id: 'taktik-03', fen: '8/8/8/3r1k2/6N1/8/8/6K1 w - - 0 1', solutionUci: 'g4e3', rating: 950, themes: ['fork', 'knight'], title: 'Die Springergabel', hint: 'Bringe den Springer auf ein Feld, von dem aus er zwei Ziele gleichzeitig bedroht.', explanation: 'Ne3+ greift den König auf f5 und den Turm auf d5 gleichzeitig an – eine klassische Gabel. Nach dem Königszug gewinnst du den Turm.' },
  { id: 'taktik-04', fen: 'rnbqkbnr/pppp1ppp/8/4p3/2B1P2q/5N2/PPPP1PPP/RNBQK2R w KQkq - 0 1', solutionUci: 'f3h4', rating: 920, themes: ['hangingPiece', 'queen'], title: 'Dame im Übermut', hint: 'Du stehst im Schach – und kannst die Dame dabei mit einer Figur schlagen!', explanation: 'Die schwarze Dame auf h4 steht ungedeckt. Dein Springer f3 schlägt sie und beendet das Schach gegen deinen König.' },
];

async function main() {
  const path = await db.learningPath.upsert({
    where: { slug: 'startklar' },
    update: {},
    create: {
      slug: 'startklar',
      title: 'Startklar',
      description: 'Grundlagen für den Einstieg: Figuren, Mattbilder und erste Taktiken.',
      sortOrder: 1,
    },
  });

  const modules = [
    { title: 'Das Brett und die Figuren', contentMd: 'Jede Figur zieht auf ihre eigene Art. Halte Ausschau nach **ungedeckten** gegnerischen Figuren – sie kannst du umsonst schlagen.', puzzleIds: ['bauern-01', 'bauern-02'] },
    { title: 'Schach und Matt', contentMd: 'Im **Schach** steht der König unter direktem Angriff. **Matt** bedeutet: Der König hat kein Entrinnen mehr.', puzzleIds: ['matt-01', 'matt-02'] },
    { title: 'Matt in einem Zug', contentMd: 'Oft steht Matt zum Greifen nah. Prüfe immer: Wohin könnte der König fliehen?', puzzleIds: ['matt-03', 'matt-04', 'matt-05'] },
    { title: 'Taktik entdecken', contentMd: 'Fesselung, Umwandlung und Gabel sind die wichtigsten Gewinnwerkzeuge.', puzzleIds: ['taktik-01', 'taktik-02', 'taktik-03', 'taktik-04'] },
  ];

  for (const p of PUZZLES) {
    await db.puzzle.upsert({ where: { id: p.id }, update: {}, create: p });
  }

  for (let i = 0; i < modules.length; i++) {
    const m = modules[i];
    const mod = await db.module.upsert({
      where: { id: `startklar-m${i + 1}` },
      update: {},
      create: {
        id: `startklar-m${i + 1}`,
        learningPathId: path.id,
        title: m.title,
        contentMd: m.contentMd,
        sortOrder: i + 1,
      },
    });
    for (let j = 0; j < m.puzzleIds.length; j++) {
      await db.modulePuzzle.upsert({
        where: { moduleId_puzzleId: { moduleId: mod.id, puzzleId: m.puzzleIds[j] } },
        update: {},
        create: { moduleId: mod.id, puzzleId: m.puzzleIds[j], sortOrder: j + 1 },
      });
    }
  }

  const aliases = ['Springer-01', 'Turm-Leo', 'Bauer-Mia'];
  console.log('\n=== Test-Schüler (Codes werden nur hier einmalig angezeigt) ===');
  for (const alias of aliases) {
    const existing = await db.user.findUnique({ where: { alias } });
    if (existing) {
      console.log(`- ${alias}: bereits vorhanden (Code unverändert)`);
      continue;
    }
    const code = crypto.randomBytes(5).toString('hex').toUpperCase();
    await db.user.create({
      data: {
        alias,
        codeLookup: codeLookupHash(code),
        codeHash: scryptHash(code),
      },
    });
    console.log(`- ${alias}: ${code}`);
  }
  console.log('===========================================================\n');
}

main().finally(() => db.$disconnect());
