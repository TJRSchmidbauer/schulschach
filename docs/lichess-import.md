# Lichess-Aufgaben importieren

Die offene Lichess-Puzzle-Datenbank (CC0) wird gefiltert und gestreamt in die lokale Datenbank übernommen. Nach dem Import braucht der Betrieb keine Verbindung zu Lichess mehr.

## Aufruf (Portainer → Container `schulschach_app` → Console, Command `/bin/sh`)

```sh
sh scripts/import-lichess.sh --max=3000
```

Optionale Parameter:

| Parameter | Standard | Bedeutung |
|---|---|---|
| `--max` | 5000 | Höchstzahl neu gespeicherter Aufgaben |
| `--min-rating` | 400 | Untergrenze Rating |
| `--max-rating` | 1600 | Obergrenze Rating |
| `--min-popularity` | 90 | Mindest-Beliebtheit (0-100) |
| `--min-plays` | 500 | Mindestanzahl Spielversuche |
| `--per-theme` | 250 | Höchstzahl je Thema, damit alle Themen vertreten sind |

Der Import ist wiederholbar: bereits vorhandene Aufgaben werden übersprungen.

## Hinweise

- Der Container braucht Internetzugang (er hängt im Netz `web_net`).
- Der Download wird nicht zwischengespeichert; es wird nur die gefilterte Auswahl abgelegt.
- Lichess-Aufgaben beginnen mit einem Gegnerzug. Die Aufgabenansicht spielt ihn automatisch ab und führt dann durch die Lösungszüge.
- Quelle und Lizenz: Lichess Open Database, CC0.
