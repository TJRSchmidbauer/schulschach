# Lichess-Aufgaben importieren und Lernpfade bauen

Die offene Lichess-Puzzle-Datenbank (CC0) wird gefiltert und gestreamt in die lokale Datenbank übernommen. Danach braucht der Betrieb keine Verbindung zu Lichess mehr. Quellen und Lizenz: [quellen-und-lizenzen.md](quellen-und-lizenzen.md).

## Empfohlener Aufruf

Portainer → Container `schulschach_app` → Console (Command `/bin/sh`):

```sh
sh scripts/import-lichess.sh --themes=paths --per-theme=60 --max=6000
```

Das holt gezielt Aufgaben zu den Themen der Lernpfade (je Thema bis zu 60) und baut anschließend die Lernpfade. Der Lauf kann einige Minuten dauern, weil die ganze Datei gelesen wird, bis alle Themen gefüllt sind.

## Parameter

| Parameter | Standard | Bedeutung |
|---|---|---|
| `--themes` | alle | `paths` (Themen der Lernpfade) oder kommaseparierte Liste, zum Beispiel `fork,pin` |
| `--max` | 5000 | Höchstzahl ausgewählter Aufgaben |
| `--min-rating` | 400 | Untergrenze Rating |
| `--max-rating` | 1600 | Obergrenze Rating |
| `--min-popularity` | 90 | Mindest-Beliebtheit (0-100) |
| `--min-plays` | 500 | Mindestanzahl Spielversuche |
| `--per-theme` | 250 | Höchstzahl je Thema |

Der Import ist wiederholbar: vorhandene Aufgaben werden übersprungen.

## Nur Lernpfade neu bauen

```sh
npx tsx scripts/build-paths.ts
```

Das Skript legt Pfade und Module aus `src/lib/paths-config.ts` an und füllt sie mit passenden Aufgaben. Es meldet pro Modul die Anzahl. Steht dort „nur X von Y“, importiere mehr Aufgaben (größeres `--per-theme` oder `--max`). Bereits zugeordnete Aufgaben bleiben erhalten.

## Eigene Lernpfade

`src/lib/paths-config.ts` bearbeiten (Titel, Text, Themen, Rating-Bereich, Anzahl), neu deployen und `build-paths` ausführen. Eigene Texte bitte selbst formulieren oder nur lizenzfreie Quellen verwenden.

## Hinweise

- Der Container braucht Internetzugang (Netz `web_net`).
- Der Download wird nicht zwischengespeichert; gespeichert wird nur die gefilterte Auswahl.
- Lichess-Aufgaben beginnen mit einem Gegnerzug. Die Aufgabenansicht spielt ihn automatisch ab.
