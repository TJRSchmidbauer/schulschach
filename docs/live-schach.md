# Live-Schach

Schüler spielen in der AG gegeneinander, Trainer sehen zu und analysieren mit einer Engine. Dieses Dokument erklärt Bedienung, Regeln und Technik.

## Für Schüler

1. Auf der Startseite **Live-Partie** öffnen (Lobby).
2. Entweder selbst herausfordern (Bedenkzeit und Farbe wählen) oder eine offene Herausforderung annehmen.
3. Ein Schüler kann gleichzeitig nur eine offene oder laufende Partie haben.
4. Während der Partie: ziehen, Remis anbieten oder annehmen, aufgeben. Es gibt keinen Chat.
5. Nach der Partie: Zug für Zug ansehen und mit der Engine analysieren (Patzer, Fehler und Ungenauigkeiten werden markiert).

Liveanalyse durch die Engine gibt es für Schüler bewusst nicht. So bleibt die Partie fair.

## Für Trainer

- **Partie ansetzen:** Trainer-Bereich → Live-Partien. Zwei Schüler wählen, Bedenkzeit festlegen, optional eine Startstellung (Voreinstellungen oder eigene FEN mit Brettvorschau). Die beiden werden in ihrer Lobby automatisch zur Partie geleitet.
- **Zusehen:** In der Liste „Zuschauen“ wählen. Die Engine zeigt eine Bewertungsleiste und die beste Fortsetzung. Das Brett lässt sich drehen und durch die Züge blättern.
- **Eingreifen:** Eine Partie abbrechen (ohne Ergebnis) oder ein Ergebnis eintragen.
- Auch selbst gestartete Herausforderungen der Schüler sind in der Liste sichtbar.

## Regeln

- Schachregeln, Matt, Patt, zu wenig Material, dreifache Stellungswiederholung und 50-Züge-Regel werden automatisch erkannt. Die Wiederholung wird ohne Antrag gewertet.
- Umwandlung erfolgt automatisch in eine Dame.
- **Uhr:** Sie startet nach dem zweiten Halbzug. Danach läuft die Zeit des Spielers am Zug. Das Inkrement wird nach jedem Zug gutgeschrieben. Der Server entscheidet über die Zeit.
- Läuft die Zeit ab, verliert der Spieler. Hat der Gegner nicht genug Material zum Mattsetzen, ist es Remis.
- Ein Remis-Angebot erlischt, sobald ein Zug gespielt wird.
- Eine Herausforderung läuft nach 30 Minuten ab. Eine Partie ohne zwei Halbzüge wird nach 10 Minuten Inaktivität abgebrochen.

## Startstellungen

Die Voreinstellungen decken typische Übungen ab (zum Beispiel Dame gegen König, Leitermatt, König und Bauer gegen König). Eigene Stellungen als FEN sind möglich. Der Server prüft, dass jede Seite genau einen König hat und die Partie nicht schon beendet ist.

## Daten und Datenschutz

- Es werden Alias, Züge, Ergebnis, Bedenkzeit und Zeitpunkte gespeichert. Keine Klarnamen, kein Chat.
- Beendete Partien werden nach **90 Tagen** automatisch gelöscht (die Bereinigung läuft bei Aufrufen der Lobby).
- Die Analyse läuft vollständig im Browser. Es werden keine Stellungen an externe Dienste geschickt.

## Technik

- Züge gehen als normale Anfragen an den Server (`/api/games/[id]`). Der Server prüft sie mit chess.js und speichert sie in PostgreSQL (Tabelle `Game`).
- Änderungen kommen per Server-Sent Events (`/api/games/[id]/stream`) bei allen Beteiligten an. Der Nachrichtenverteiler arbeitet im Speicher. **Deshalb darf nur eine Instanz der App laufen.** Bei mehreren Instanzen würden Updates verloren gehen.
- Der Live-Stream prüft jede Sekunde auf Zeitüberschreitung. Läuft kein Stream, wird die Zeit beim nächsten Zugriff geprüft.
- Die Engine ist Stockfish.js (Lite, ein Thread) als WebAssembly in einem Web Worker. Sie wird beim Build aus dem npm-Paket `stockfish` nach `public/engine` kopiert (Skript `scripts/copy-engine.mjs`).

## Fehlersuche

- **Analyse zeigt „nicht installiert“:** Im Build-Log nach `[engine]` suchen. Dort steht, ob die Engine kopiert wurde. Ohne Engine funktionieren Live-Partien trotzdem.
- **Live-Stream bricht ab:** Ein Reverse-Proxy darf Antworten vom Typ `text/event-stream` nicht puffern. Traefik tut das standardmäßig nicht.
- **Partie hängt:** Der Trainer kann sie unter Live-Partien abbrechen oder ein Ergebnis eintragen.

## Lizenz der Engine

Stockfish.js steht unter GPL-3.0. Lizenztext, Autorenliste und Quellverweis liegen im ausgelieferten Ordner `public/engine` (`COPYING.txt`, `AUTHORS.txt`, `README.txt`). Die Engine wird unverändert und als getrennte Datei ausgeliefert. Details: [quellen-und-lizenzen.md](quellen-und-lizenzen.md).
