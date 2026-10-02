export type ModuleSpec = {
  title: string;
  text: string;
  themes: string[];
  min: number;
  max: number;
  count: number;
};

export type PathSpec = {
  slug: string;
  title: string;
  description: string;
  sortOrder: number;
  modules: ModuleSpec[];
};

// Eigene Struktur und eigene Texte. Aufgaben stammen aus der Lichess Open Database (CC0).
// Themen-Schlüssel entsprechen den Lichess-Themen, siehe docs/quellen-und-lizenzen.md.
export const PATHS: PathSpec[] = [
  {
    slug: 'matt-muster',
    title: 'Matt-Muster',
    description: 'Vom Matt in einem Zug bis zu klassischen Mattbildern.',
    sortOrder: 2,
    modules: [
      {
        title: 'Matt in 1',
        text: 'Prüfe vor jedem Zug: Welche Figuren können den König angreifen? Wohin könnte er fliehen? Wenn es kein Fluchtfeld gibt und der Angreifer nicht geschlagen oder blockiert werden kann, ist es Matt.',
        themes: ['mateIn1'],
        min: 400,
        max: 1000,
        count: 12,
      },
      {
        title: 'Grundreihenmatt',
        text: 'Steht der König hinter seinen eigenen Bauern auf der Grundreihe, hat er kein Fluchtfeld. Ein Turm oder eine Dame auf der Grundreihe kann dann Matt setzen. Als Verteidiger hilft ein frühes Luftloch.',
        themes: ['backRankMate'],
        min: 400,
        max: 1300,
        count: 10,
      },
      {
        title: 'Matt in 2',
        text: 'Zähle zuerst alle Schachgebote auf. Oft beginnt die Lösung mit einem Schach oder mit einem Zug, nach dem der Gegner keine gute Antwort mehr hat. Danach folgt das Matt.',
        themes: ['mateIn2'],
        min: 600,
        max: 1400,
        count: 12,
      },
      {
        title: 'Klassische Mattbilder',
        text: 'Manche Mattbilder tauchen immer wieder auf, zum Beispiel das Ersticktes Matt mit dem Springer. Wer sie kennt, erkennt sie in Partien viel schneller.',
        themes: ['smotheredMate', 'arabianMate', 'anastasiaMate', 'hookMate', 'doubleBishopMate', 'dovetailMate', 'bodenMate'],
        min: 700,
        max: 1600,
        count: 8,
      },
      {
        title: 'Matt in 3',
        text: 'Hier musst du weiter vorausdenken. Suche zuerst Zwangszüge wie Schachgebote, damit der Gegner nur wenige Antworten hat. Dann lassen sich die Varianten überblicken.',
        themes: ['mateIn3'],
        min: 800,
        max: 1600,
        count: 8,
      },
    ],
  },
  {
    slug: 'taktik',
    title: 'Taktik-Werkzeugkasten',
    description: 'Die wichtigsten Gewinnmotive: Gabel, Fesselung, Spieß und mehr.',
    sortOrder: 3,
    modules: [
      {
        title: 'Ungedeckte Figuren',
        text: 'Bevor du ziehst, schau dir alle Figuren an: Welche stehen ungedeckt, deine und die des Gegners? Eine ungedeckte Figur kann man oft umsonst schlagen. Manchmal lohnt es sich auch, erst einen Verteidiger zu schlagen.',
        themes: ['hangingPiece', 'capturingDefender', 'trappedPiece'],
        min: 400,
        max: 1200,
        count: 12,
      },
      {
        title: 'Gabel',
        text: 'Eine Gabel greift zwei Ziele gleichzeitig an. Der Gegner kann nur eines retten. Springer sind darin besonders gut, weil man ihre Sprünge leicht übersieht.',
        themes: ['fork'],
        min: 400,
        max: 1200,
        count: 12,
      },
      {
        title: 'Fesselung',
        text: 'Eine gefesselte Figur darf nicht ziehen, weil sonst eine wertvollere Figur oder der König angegriffen wäre. Ist es der König, darf die Figur gar nicht ziehen. Gefesselte Figuren sind oft leichte Ziele.',
        themes: ['pin'],
        min: 400,
        max: 1200,
        count: 10,
      },
      {
        title: 'Spieß',
        text: 'Beim Spieß wird eine wertvolle Figur angegriffen. Wenn sie ausweicht, steht dahinter eine weitere Figur, die dann geschlagen werden kann. Es ist quasi das Gegenstück zur Fesselung.',
        themes: ['skewer'],
        min: 600,
        max: 1400,
        count: 8,
      },
      {
        title: 'Abzug und Doppelschach',
        text: 'Beim Abzugsangriff zieht eine Figur weg und gibt dadurch der Figur dahinter die Linie frei. Beim Doppelschach geben zwei Figuren gleichzeitig Schach. Dann hilft nur ein Königszug.',
        themes: ['discoveredAttack', 'doubleCheck'],
        min: 600,
        max: 1500,
        count: 10,
      },
      {
        title: 'Ablenken und Eingreifen',
        text: 'Du lockst eine Verteidigerfigur weg oder auf ein ungünstiges Feld, räumst eine Linie frei oder unterbrichst die Verbindung deines Gegners. Frage dich: Wer verteidigt das wichtige Feld, und wie bekomme ich ihn weg?',
        themes: ['deflection', 'attraction', 'clearance', 'interference'],
        min: 800,
        max: 1600,
        count: 10,
      },
    ],
  },
  {
    slug: 'endspiel',
    title: 'Endspiel-Grundlagen',
    description: 'Bauern umwandeln, König aktiv einsetzen, Endspiele sicher gewinnen.',
    sortOrder: 4,
    modules: [
      {
        title: 'Umwandlung',
        text: 'Ein Bauer, der die letzte Reihe erreicht, wird zu einer anderen Figur, meist zur Dame. Achte auf Bauern, die schon weit vorgerückt sind, und auf Felder, die sie am Vormarsch hindern.',
        themes: ['promotion', 'advancedPawn'],
        min: 400,
        max: 1300,
        count: 10,
      },
      {
        title: 'Bauernendspiel',
        text: 'Im Bauernendspiel zählt jeder Zug. Der König ist hier eine starke Figur: Bring ihn nach vorn und in die Nähe der wichtigen Bauern. Zähle genau, wer zuerst ankommt.',
        themes: ['pawnEndgame'],
        min: 600,
        max: 1500,
        count: 8,
      },
      {
        title: 'Turmendspiel',
        text: 'Eine bekannte Faustregel lautet: Der Turm gehört hinter den Freibauern, egal ob er dir oder dem Gegner gehört. Aktive Türme sind im Endspiel meist besser als passive.',
        themes: ['rookEndgame'],
        min: 700,
        max: 1600,
        count: 8,
      },
      {
        title: 'Läufer- und Springerendspiele',
        text: 'Der Läufer ist auf offenem Brett oft stark, der Springer fühlt sich in engeren Stellungen wohler. Achte auf die Bauernstruktur und darauf, welche Figur mehr Felder kontrolliert.',
        themes: ['bishopEndgame', 'knightEndgame'],
        min: 800,
        max: 1600,
        count: 8,
      },
    ],
  },
  {
    slug: 'verteidigung',
    title: 'Verteidigung und Geduld',
    description: 'Gefahren erkennen, ruhige Züge finden und den Gegner in Bedrängnis bringen.',
    sortOrder: 5,
    modules: [
      {
        title: 'Gut verteidigen',
        text: 'Manchmal ist der beste Zug einer, der eine Drohung des Gegners verhindert. Frage dich vor jedem Zug: Was will mein Gegner eigentlich? Dann suche den Zug, der das entschärft.',
        themes: ['defensiveMove'],
        min: 600,
        max: 1500,
        count: 10,
      },
      {
        title: 'Stille Züge',
        text: 'Nicht jeder starke Zug ist ein Schach oder ein Schlagzug. Ein stiller Zug bereitet eine Drohung vor oder nimmt dem Gegner alle guten Antworten. Genau diese Züge sind schwerer zu finden.',
        themes: ['quietMove'],
        min: 700,
        max: 1600,
        count: 8,
      },
      {
        title: 'Zugzwang',
        text: 'Im Zugzwang verschlechtert jeder mögliche Zug des Gegners seine Stellung, aber er muss ziehen. Besonders im Endspiel kann man so Material oder die Partie gewinnen.',
        themes: ['zugzwang'],
        min: 900,
        max: 1600,
        count: 6,
      },
    ],
  },
];

export function pathThemes(): string[] {
  return Array.from(new Set(PATHS.flatMap((p) => p.modules.flatMap((m) => m.themes))));
}
