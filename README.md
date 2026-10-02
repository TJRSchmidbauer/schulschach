# SchulSchach AG

Datensparsame, selbst gehostete Schach-Lernplattform für eine Schul-AG: Aufgaben lösen, Hausaufgaben vergeben, live gegeneinander spielen, Fortschritt sehen, Medaillen sammeln.

> **Hinweis zu KI und Verantwortung (bitte lesen)**
> Dieses Projekt wurde mit Unterstützung von KI-Assistenz (Perplexity) entwickelt. Der Code wurde nicht durch eine unabhängige Sicherheits- oder Datenschutzprüfung geprüft und kann Fehler enthalten.
> **Jede Person und Einrichtung, die dieses Projekt einsetzt, ist selbst für ihre Version verantwortlich**: für Konfiguration, Betrieb, Sicherheitsupdates, Backups, Datenschutz (zum Beispiel DSGVO, Einwilligungen, Verzeichnis der Verarbeitungstätigkeiten) und die Einhaltung der Regeln der eigenen Schule oder Organisation. Das ist keine Rechtsberatung.
> Die Software wird ohne Gewährleistung bereitgestellt (siehe [LICENSE](LICENSE)).

## Inhalt

- [Funktionen](#funktionen)
- [Schnellstart mit Portainer](#schnellstart-mit-portainer)
- [Konfiguration](#konfiguration)
- [Betrieb](#betrieb)
- [Lokale Entwicklung](#lokale-entwicklung)
- [Projektstruktur](#projektstruktur)
- [Datenschutz und Sicherheit](#datenschutz-und-sicherheit)
- [Quellen und Lizenzen](#quellen-und-lizenzen)
- [Eigene Version betreiben](#eigene-version-betreiben)

## Funktionen

**Für Schülerinnen und Schüler**

- Anmeldung nur mit persönlichem Code (kein Passwort, keine E-Mail, kein Klarname)
- Lernpfade mit Modulen, zum Beispiel Startklar, Matt-Muster, Taktik-Werkzeugkasten, Endspiel-Grundlagen, Verteidigung und Geduld
- Interaktives Schachbrett, auch mit mehrzügigen Aufgaben (der Gegner antwortet automatisch)
- Dreistufige Hilfe: Hinweis, Zielfeld, Lösung
- Hausaufgaben des Trainers und freies Üben nach Thema und Schwierigkeit
- Live-Partien gegen andere aus der AG mit Schachuhr, ohne Chat; nach der Partie Analyse mit Markierung von Patzern
- Medaillen als digitales Belohnungssystem (Aufgabenzahl, Aufgaben ohne Tipp, Tage in Folge, Themenmeister)

**Für den Trainer / die Trainerin**

- Anmeldung unter `/trainer` mit einem starken Trainer-Code
- Schüler mit Alias anlegen, Codes anzeigen oder neu ausstellen
- Übungsdatenbank mit Filtern (Thema, Rating, Suche) und Brettvorschau
- Hausaufgaben für alle oder ausgewählte Schüler, mit Fälligkeitsdatum
- Live-Partien ansetzen (auch mit eigener Startstellung), live zusehen mit Engine-Analyse, Partien beenden
- Statistik je Schüler und Thema inklusive Schwachstellen
- Urkunden als SVG: Der echte Name wird nur im Browser eingetragen und nie an den Server gesendet

## Schnellstart mit Portainer

Voraussetzungen: ein Server mit Docker und Portainer, ein Traefik-Reverse-Proxy mit externem Docker-Netz `web_net` und ein Domainname.

1. In Portainer einen neuen **Stack** im Modus **Repository** anlegen: Repository-URL dieses Projekts, Branch `main`, Compose-Pfad `compose.portainer.yml`.
2. Die Stack-Variablen setzen (siehe [Konfiguration](#konfiguration)).
3. Domain anpassen: In `compose.portainer.yml` steht die Domain in den Traefik-Labels (`Host(...)`). Für deine Version dort deine eigene Domain eintragen.
4. **Deploy the stack** starten. Beim ersten Start legt der Container die Datenbanktabellen an (`prisma db push`) und führt den Seed aus. Das Bauen des Images dauert einige Minuten, weil auch die Analyse-Engine installiert wird.
5. Die drei Test-Schülercodes aus dem Seed stehen einmalig im Container-Log (Portainer → Container `schulschach_app` → Logs). Sie dienen nur zum Ausprobieren.
6. Unter `https://<deine-domain>/trainer` mit dem Trainer-Code anmelden.

### Trainer-Code erzeugen

Der Klartext des Trainer-Codes wird nirgends gespeichert. Erzeuge lokal einen Hash (mindestens 20 Zeichen):

```bash
git clone <dieses-repository>
cd schulschach
npm install
npm run hash:trainer -- "DEIN_LANGER_TRAINER_CODE"
```

Die ausgegebene Zeile `TRAINER_CODE_HASH=scrypt:...` trägst du als Stack-Variable in Portainer ein.

## Konfiguration

| Variable | Pflicht | Bedeutung |
|---|---|---|
| `APP_URL` | ja | Öffentliche Adresse, zum Beispiel `https://chess.example.org` |
| `AUTH_SECRET` | ja | Zufälliger Wert mit mindestens 32 Zeichen |
| `POSTGRES_PASSWORD` | ja | Passwort der Datenbank |
| `TRAINER_CODE_HASH` | ja | Hash des Trainer-Codes, siehe oben |
| `CODE_ENC_KEY` | nein | Schlüssel zum Verschlüsseln der Schülercodes in der Datenbank. Ohne Angabe wird `AUTH_SECRET` verwendet |

**Wichtig:** Ändere `AUTH_SECRET` nach dem Start nicht mehr. Die Schüler-Anmeldung und die Entschlüsselung der Codes hängen daran. Bei einer Änderung sind alle Schülercodes ungültig und müssen über „Neu ausstellen“ im Trainer-Bereich neu erzeugt werden. Bewahre die Werte sicher auf (zum Beispiel im Passwortmanager).

## Betrieb

### Schüler anlegen

Trainer-Bereich → Schüler → Alias eingeben. Nimm Aliasse statt Klarnamen (zum Beispiel „Bauer-Mia“). Der Code lässt sich in der Tabelle jederzeit anzeigen oder neu ausstellen.

### Aufgaben importieren und Lernpfade bauen

In Portainer → Container `schulschach_app` → Console (`/bin/sh`):

```sh
sh scripts/import-lichess.sh --themes=paths --per-theme=60 --max=6000
```

Das lädt gefiltert Aufgaben aus der Lichess Open Database (CC0), speichert nur die Auswahl und baut die Lernpfade. Details und Parameter: [docs/lichess-import.md](docs/lichess-import.md).

### Hausaufgaben, Statistik, Urkunden

- **Hausaufgaben:** Trainer-Bereich → Übungen → Aufgaben auswählen → „Hausaufgabe freischalten“.
- **Statistik:** Trainer-Bereich → Statistik. Zeigt je Thema, wie oft Aufgaben selbstständig, mit Tipp oder mit angesehener Lösung gelöst wurden.
- **Urkunden:** Trainer-Bereich → Urkunden → Alias wählen → echten Namen eintragen → Drucken oder als SVG speichern. Der Name bleibt im Browser. Schüler sehen die Urkunden nicht, nur Medaillen.

### Live-Partien

Schüler öffnen auf der Startseite die Spiel-Lobby und fordern sich heraus. Der Trainer kann unter Live-Partien Paarungen ansetzen (auch mit eigener Startstellung), zusehen und mit der Engine analysieren. Regeln, Uhr, Datenhaltung und Technik: [docs/live-schach.md](docs/live-schach.md).

Wichtig: Es darf nur **eine** Instanz der App laufen, weil der Live-Nachrichtenverteiler im Speicher arbeitet.

### Aktualisieren

In Portainer den Stack mit „Pull and redeploy“ neu bereitstellen. Datenbankdaten bleiben im Volume erhalten. Prüfe vor größeren Updates das Backup.

### Backup

Die Datenbank läuft als eigener Container (Dienst `db` in `compose.portainer.yml`). Beispiel für einen Dump (Benutzer, Datenbankname und Containername aus deiner Compose-Datei einsetzen):

```sh
docker exec <db-container> pg_dump -U <db-user> <db-name> > schulschach-backup.sql
```

Bewahre Backups verschlüsselt und zugriffsgeschützt auf. Sie enthalten Aliasse, Lernstand und Partien.

## Lokale Entwicklung

```bash
npm install
cp .env.example .env     # Werte ausfüllen, DATABASE_URL auf eine lokale PostgreSQL zeigen lassen
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Hinweis: Das Setzen des Session-Cookies erwartet HTTPS. Lokal ohne HTTPS kann die Anmeldung daher scheitern. Teste in diesem Fall hinter einem lokalen HTTPS-Proxy. Beim Start (`npm run dev`) und beim Build kopiert ein Skript die Analyse-Engine nach `public/engine`.

## Projektstruktur

```
compose.portainer.yml   Stack (App, Datenbank, Netze, Traefik-Labels)
Dockerfile              Build der App
docker/entrypoint.sh    Start: Datenbank anlegen, Seed, App starten
prisma/                 Datenbankschema und Seed
scripts/                Trainer-Hash, Lichess-Import, Lernpfade bauen, Engine kopieren
src/app/                Seiten und API (Schüler, Trainer, Übung, Medaillen, Statistik, Live-Partien)
src/lib/                Anmeldung, Verschlüsselung, Medaillen, Statistik, Themen, Lernpfade, Live-Logik
src/components/         Urkunden-Editor (SVG), Live-Brett und Analyse-Panel
docs/                   Import-Anleitung, Live-Schach, Quellen und Lizenzen
```

## Datenschutz und Sicherheit

- Keine Klarnamen im System: Schüler haben nur Alias und Code. Der Name auf Urkunden wird ausschließlich im Browser eingegeben und nicht gesendet oder gespeichert.
- Keine Tracker, keine externen Schriften oder CDNs im Betrieb. Das Schachbrett und die Zugprüfung laufen im Browser, die endgültige Prüfung erfolgt serverseitig. Die Engine-Analyse läuft im Browser und sendet keine Stellungen an externe Dienste.
- Codes und Trainer-Code werden mit scrypt gehasht. Schülercodes liegen zusätzlich verschlüsselt (AES-256-GCM), damit der Trainer sie anzeigen kann. Sitzungen laufen über HttpOnly-, Secure- und SameSite-Cookies (12 Stunden).
- Geschützte Container-Einstellungen: `no-new-privileges`, `cap_drop: ALL`, CPU- und RAM-Limits, Datenbank nur im internen Docker-Netz, TLS über Traefik.
- Gespeichert werden Alias, Anmeldezeitpunkt, Lösungsversuche (Ergebnis, Tipps, Fehlversuche, Dauer, Zeitpunkt) und Live-Partien (Alias, Züge, Ergebnis, Bedenkzeit). Beendete Partien werden nach 90 Tagen automatisch gelöscht. Es gibt keinen Chat. Prüfe mit deiner Schule, ob dafür eine Einwilligung oder eine andere Rechtsgrundlage nötig ist, und ob Eltern informiert werden müssen.
- Sicherheitslücken bitte nicht öffentlich melden, sondern über eine private Nachricht an den Repository-Inhaber.

## Quellen und Lizenzen

- Aufgaben: Lichess Open Database, **CC0 1.0**, <https://database.lichess.org>
- Analyse-Engine: Stockfish.js, **GPL-3.0**, als getrennte Datei im Browser; Lizenztext und Quellverweis werden mitgeliefert
- Lernpfade: eigene Zusammenstellung, eigene Texte; keine Inhalte geschützter Lehrwerke
- Code und eigene Texte: **MIT**, siehe [LICENSE](LICENSE)
- Drittsoftware und Details: [docs/quellen-und-lizenzen.md](docs/quellen-und-lizenzen.md)

## Eigene Version betreiben

Du kannst das Projekt forken und für deine Gruppe anpassen. Beachte dabei:

- Trage deine eigene Domain, eigene Geheimnisse und einen eigenen Trainer-Code ein. Nutze nie die Werte aus Beispielen oder Logs weiter.
- Du bist für deine Instanz und die darauf gespeicherten Daten selbst verantwortlich.
- Prüfe Lizenzen, bevor du eigene Inhalte (Texte, Aufgaben, Bilder) ergänzt, und nenne die Quellen. Bei der mitgelieferten Engine (GPL-3.0) gelten besondere Bedingungen; siehe die Lizenzdoku.
- Änderungen am Code prüfst du bitte selbst, besonders bei Anmeldung, Datenbank und Rechten.
