# Datensicherung

Alle Daten der AG liegen in der PostgreSQL-Datenbank (Dienst `db`): Schüler-Aliasse, Lernstand, Hausaufgaben, Live-Partien und Turniere. Diese Datenbank gehört regelmäßig gesichert, und zwar automatisch, damit es nicht vom Gedächtnis abhängt.

## Was gesichert werden muss

1. **Die Datenbank** `schulschach` (siehe unten).
2. **Die Einstellungen des Stacks** aus Portainer (Umgebungsvariablen, insbesondere der Schlüssel, mit dem die Schülercodes verschlüsselt sind, und der Trainer-Hash; siehe `.env.example`). Ohne diesen Schlüssel sind Codes aus einer Sicherung nicht lesbar. Bewahre sie getrennt von den Datenbank-Sicherungen auf, zum Beispiel in einem Passwortmanager.

## Variante A: Sicherungs-Container im Stack (empfohlen)

Ein zusätzlicher Dienst sichert die Datenbank nach Zeitplan und löscht alte Sicherungen selbst. Füge in `compose.portainer.yml` unter `services:` hinzu und passe die Werte an. Benutzer, Passwort und Datenbankname müssen zu deinem Dienst `db` passen, und die Hauptversion des Images muss zur Version deines Datenbank-Images passen.

```yaml
  pgbackups:
    image: prodrigestivill/postgres-backup-local:<Postgres-Hauptversion>
    restart: unless-stopped
    user: postgres:postgres
    depends_on:
      - db
    environment:
      POSTGRES_HOST: db
      POSTGRES_DB: schulschach
      POSTGRES_USER: <DB-Benutzer>
      POSTGRES_PASSWORD: <DB-Passwort>
      SCHEDULE: "@daily"
      BACKUP_ON_START: "TRUE"
      BACKUP_KEEP_DAYS: 7
      BACKUP_KEEP_WEEKS: 4
      BACKUP_KEEP_MONTHS: 3
    volumes:
      - /srv/schulschach-backups:/backups
```

Vorher auf dem Server den Ordner anlegen und Rechte vergeben: `mkdir -p /srv/schulschach-backups && chown -R 999:999 /srv/schulschach-backups`. Der Dienst legt Tages-, Wochen- und Monatsstände an und löscht ältere. Wenn dein Stack Netzwerke einzeln benennt, muss der Dienst im selben internen Netz wie `db` hängen.

## Variante B: Cron auf dem Server

Wer keinen zusätzlichen Container möchte, legt auf dem Server einen Cron-Eintrag an (`crontab -e`):

```
0 3 * * * docker exec <db-container> pg_dump -U <db-user> -Fc <db-name> > /srv/schulschach-backups/schulschach-$(date +\%F).dump && find /srv/schulschach-backups -name '*.dump' -mtime +14 -delete
```

Das sichert jede Nacht um 3 Uhr und löscht Dateien, die älter als 14 Tage sind.

## Zweiter Speicherort

Liegt die Sicherung nur auf demselben Server wie die Datenbank, geht bei einem Festplattenschaden beides verloren. Kopiere den Ordner deshalb zusätzlich regelmäßig auf ein anderes Gerät oder in einen Speicher außerhalb des Servers (zum Beispiel mit `rsync` oder `rclone`). Verschlüssele die Kopie, wenn sie den Server verlässt.

## Wiederherstellen

Teste das einmal in Ruhe, bevor du es brauchst. Eine Sicherung zählt erst, wenn sie sich zurückspielen lässt.

1. App stoppen (Container `schulschach_app` in Portainer anhalten), damit nichts in die Datenbank schreibt.
2. Bei Sicherungen aus Variante A (Dateien enden auf `.sql.gz`):
   `gunzip -c <datei>.sql.gz | docker exec -i <db-container> psql -U <db-user> -d <db-name>`
3. Bei Sicherungen aus Variante B (Dateien enden auf `.dump`):
   `docker exec -i <db-container> pg_restore -U <db-user> -d <db-name> --clean --if-exists < <datei>.dump`
4. App wieder starten und prüfen, ob Schüler, Turniere und Partien da sind.

Am sichersten übst du die Wiederherstellung zuerst in einer leeren Test-Datenbank.

## Datenschutz bei Sicherungen

- Sicherungen enthalten Aliasse, Lernstände, Partien und Turniere. Lege sie zugriffsgeschützt ab.
- Löschfristen der Anwendung (beendete Partien und Turniere nach 90 Tagen, manuell gelöschte Turniere) gelten nicht rückwirkend für bestehende Sicherungen. Halte die Aufbewahrung deshalb kurz. Die Voreinstellung oben bewahrt Tagesstände 7 Tage, Wochenstände 4 Wochen und Monatsstände 3 Monate auf. Kürze das, wenn deine Schule das verlangt.
- Wird ein Schüler auf eigenen Wunsch aus der Plattform gelöscht, steht er bis zum Ablauf der Sicherungen noch dort. Das ist bei der Information an Eltern und Schule zu nennen.
