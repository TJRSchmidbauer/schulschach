# SchulSchach AG

Datensparsame, selbst gehostete Schach-Lernplattform für eine heterogene Schul-AG.

## Funktionen
- Schüler-Login nur per persönlichem Code (kein Passwort, keine E-Mail)
- Individuelle Aliasse statt echter Namen
- Trainer-Login unter `/trainer` über starken, per scrypt-Hash hinterlegten Code
- Erster Lernpfad **Startklar** mit 4 Modulen und 11 kuratierten Aufgaben
- Interaktives Schachbrett (`react-chessboard`) + Zugprüfung im Browser (`chess.js`), finale Validierung serverseitig
- 3-stufiges Hilfesystem (Hinweis → Zielfeld → Lösung mit Erklärung)
- Trainer-Dashboard mit Fortschrittsübersicht und Schüleranlage (Code einmalig sichtbar)
- Touch-optimiert für iPad/Android-Tablets und Smartphones

## Stack
Next.js 15, React 19, PostgreSQL 16, Prisma, deploybar als gehärteter Docker-Stack hinter Traefik (`web_net`, Resolver `myresolver`, Host `chess.schmidbauer.jetzt`).

## Portainer-Deployment
1. Neuer Stack → **Repository**-Modus, URL `https://github.com/TJRSchmidbauer/schulschach.git`, Branch `main`, Compose-Pfad `compose.portainer.yml` (privates Repo → GitHub-Token hinterlegen).
2. Environment-Variablen im Stack setzen: `APP_URL`, `AUTH_SECRET`, `POSTGRES_PASSWORD`, `TRAINER_CODE_HASH`.
3. **Deploy the stack**. Beim ersten Start führt der Container automatisch `prisma db push` und den Seed aus.
4. Die drei Test-Schülercodes stehen **einmalig** im Container-Log (`docker logs schulschach_app` bzw. Portainer → Container → Logs).

## Trainer-Code erzeugen
Der Klartext wird nirgends gespeichert. Hash lokal erzeugen:

```bash
git clone https://github.com/TJRSchmidbauer/schulschach.git
cd schulschach
npm install
npm run hash:trainer -- "DEIN_LANGER_TRAINER_CODE"
```

Die ausgegebene Zeile `TRAINER_CODE_HASH=scrypt:...` in Portainer als Stack-Variable eintragen.

## Lokale Entwicklung
```bash
npm install
cp .env.example .env        # Variablen ausfüllen
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

## Sicherheit
- scrypt-Hashes, HttpOnly/Secure/SameSite-Sessions (12 h)
- Keine Geheimnisse im Repository, DB nur im internen Docker-Netz
- `no-new-privileges`, `cap_drop: ALL`, CPU/RAM-Limits, Traefik-TLS+HSTS

## Lizenz
MIT. Eigene Inhalte; spätere Lichess-Puzzle-Importe werden separat mit Quellen-/Lizenzvermerk geführt.
