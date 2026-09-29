# SchulSchach AG

Datensparsame, selbst gehostete Schach-Lernplattform für eine heterogene Schul-Schach-AG.

## Architektur & Features
- **Schüler-Login**: Nur persönlicher Code & Alias (keine E-Mail, kein Passwort)
- **Trainer-Login**: Unter `/trainer` via starkem Trainer-Code (als Argon2id-Hash in Portainer hinterlegt)
- **Zero Serverload**: Schachbrett, Zugvalidierung (chess.js), Hilfesystem & Animationen laufen 100 % im Browser
- **Datenschutz**: Keine Klarnamenpflicht, keine Tracker, keine externen CDN-Abhängigkeiten im Produktivbetrieb
- **Infrastruktur**: Next.js 15, PostgreSQL (isoliert), Traefik (web_net) auf `chess.schmidbauer.jetzt`

## Portainer Deployment
1. Stack in Portainer anlegen (Repository-Modus oder Compose aus `compose.portainer.yml`)
2. Stack-Environment-Variablen setzen (`APP_URL`, `AUTH_SECRET`, `POSTGRES_PASSWORD`, `TRAINER_CODE_HASH`)
3. Deploy the stack.
