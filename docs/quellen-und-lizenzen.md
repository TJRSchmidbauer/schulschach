# Quellen, Urheberrecht und Lizenzen

Stand: Oktober 2026. Dieses Dokument erklärt, woher Inhalte stammen und warum sie hier verwendet werden dürfen. Es ist keine Rechtsberatung.

## Aufgaben (Schachpuzzles)

- Quelle: Lichess Open Database, <https://database.lichess.org/#puzzles>
- Lizenz: **CC0 1.0** (Public Domain Dedication). Lichess veröffentlicht Partien und Puzzles unter CC0; Nutzung, Änderung und Weitergabe sind ohne Nachfrage erlaubt.
- Eine Namensnennung ist bei CC0 nicht erforderlich. Wir nennen die Quelle trotzdem.
- Importierte Aufgaben haben in der Datenbank `origin = 'lichess'` und die ID-Vorlage `li-<LichessPuzzleId>`.
- Hinweis: Andere Lichess-Datensätze (zum Beispiel Turnierübertragungen) stehen unter anderen Lizenzen (CC BY-SA 4.0). Diese werden hier **nicht** verwendet.
- Der Lichess-Quellcode steht unter AGPL-3.0. Dieses Projekt enthält keinen Lichess-Quellcode.

## Schach-Engine (Analyse)

- Verwendet wird **Stockfish.js** (WebAssembly-Fassung der Engine Stockfish) aus dem npm-Paket `stockfish`, Lizenz **GPL-3.0**.
- Die Engine wird beim Build aus dem Paket nach `public/engine` kopiert und unverändert als getrennte Datei ausgeliefert. Sie läuft im Browser als Web Worker und wird nur über Textnachrichten (UCI-Protokoll) angesprochen.
- Zusammen mit der Engine werden `COPYING.txt` (Lizenztext), `AUTHORS.txt` und `README.txt` mit dem Quellverweis ausgeliefert (<https://github.com/nmrugg/stockfish.js>, <https://github.com/official-stockfish/Stockfish>). Die Analyse-Oberfläche verweist darauf.
- Der übrige Code dieses Projekts steht weiter unter MIT. Ob das für deinen Einsatz ausreicht, musst du für deine Version selbst bewerten. Wer die Engine nicht ausliefern möchte, entfernt die Abhängigkeit `stockfish` und das Skript `scripts/copy-engine.mjs`. Live-Partien funktionieren auch ohne Engine.

## Turnier-Auslosung

- Die Schweizer-System-Auslosung und die Wertungen (Buchholz, Feinbuchholz, Sonneborn-Berger) sind eine **eigene Implementierung** (`src/lib/tournament`). Es wird keine Fremdbibliothek und kein fremder Quelltext eingebunden.
- Als fachliche Orientierung dienten die allgemein bekannten Regeln aus Jugendspielordnungen und Feinwertungs-Beschreibungen. Regeln und Rechenverfahren sind nicht urheberrechtlich geschützt; Texte aus diesen Ordnungen wurden nicht übernommen.

## Lernpfade

Die vier zusätzlichen Lernpfade (Matt-Muster, Taktik-Werkzeugkasten, Endspiel-Grundlagen, Verteidigung und Geduld) sind eine **eigene Zusammenstellung**:

- Struktur und Reihenfolge sind eigene didaktische Entscheidungen (Datei `src/lib/paths-config.ts`).
- Alle Erklärtexte sind selbst formuliert. Es wurden keine Texte, Übungen oder Hefte Dritter kopiert.
- Die Aufgaben selbst kommen aus der CC0-Datenbank (siehe oben). Die Auswahl erfolgt automatisch nach Thema und Rating (`scripts/build-paths.ts`).
- Die Themenbezeichnungen (zum Beispiel Gabel, Fesselung, Spieß, Matt in 2) entsprechen den bei Lichess üblichen Themen-Schlüsseln. Deutsche Bezeichnungen und Erklärungen sind eigene Formulierungen.

### Was bewusst nicht verwendet wird

Bei der Recherche wurden bekannte Lehrmethoden und Materialien gesichtet. Als didaktische Anregung dienten allgemein bekannte Ideen (zum Beispiel: erst Figuren und Grundregeln, dann einfache Mattbilder und Taktik, später Endspiele). Inhalte dieser Quellen werden **nicht** übernommen, weil sie urheberrechtlich geschützt sind oder die Lizenz nicht eindeutig offen ist:

| Quelle | Grund |
|---|---|
| Stappenmethode (Brunia / van Wijgerden), Hefte und Handbücher | Kommerzielle, urheberrechtlich geschützte Lehrwerke |
| Leitfäden und Kurspläne einzelner Schulen oder Anbieter (zum Beispiel Lehrplan-PDFs, Kursleitfäden) | Keine offene Lizenz erkennbar |
| Wikibooks / Wikipedia (CC BY-SA) | Wäre mit Namensnennung und Weitergabe unter gleichen Bedingungen möglich, wird aber nicht verwendet, damit der eigene Text unter MIT bleiben kann |

Wer eigene Materialien ergänzt, prüft bitte selbst deren Lizenz und nennt die Quelle.

## Eigener Code und eigene Texte

- Lizenz: MIT (siehe `LICENSE`). Ausgenommen ist die mitgelieferte Engine (siehe oben).

## Drittsoftware (Auswahl)

| Bestandteil | Zweck | Lizenz |
|---|---|---|
| Next.js, React | Web-Framework | MIT |
| chess.js | Schachregeln und Zugprüfung | BSD-2-Clause |
| react-chessboard | Schachbrett-Darstellung | MIT |
| Prisma | Datenbankzugriff | Apache-2.0 |
| tsx | Skripte ausführen | MIT |
| Stockfish.js | Analyse-Engine im Browser | GPL-3.0 |
| PostgreSQL | Datenbank | PostgreSQL License |
| zstd | Entpacken der Lichess-Datei | BSD-3-Clause (alternativ GPL-2.0) |

Die genauen Lizenztexte stehen in den jeweiligen Paketen unter `node_modules` beziehungsweise bei den Projekten. Prüfe bei Updates die Lizenzen der neuen Versionen selbst.

## Wenn du etwas melden möchtest

Falls du in diesem Repository Inhalte findest, die gegen Urheberrecht oder Lizenzen verstoßen, öffne bitte ein Issue. Die betroffenen Inhalte werden dann entfernt.
