# Datensicherung

Alle Daten der AG liegen in der PostgreSQL-Datenbank (Dienst `db`, Container `schulschach_db`): Schüler-Aliasse, Lernstand, Hausaufgaben, Live-Partien und Turniere. Ein eigener Dienst im Stack sichert sie automatisch.

## So funktioniert die automatische Sicherung

In `compose.portainer.yml` läuft der Dienst `pgbackups` (Container `schulschach_pgbackups`, Image `prodrigestivill/postgres-backup-local:16`). Er legt

- jede Nacht (und beim Start des Stacks) eine Sicherung an,
- hebt 7 Tagesstände, 4 Wochenstände und 3 Monatsstände auf und löscht ältere selbst.

Die Dateien liegen im Docker-Volume `schulschach_backups` (in Portainer unter Volumes; der Stackname steht davor). Im Container sind sie unter `/backups` in den Ordnern `last`, `daily`, `weekly` und `monthly` zu finden und enden auf `.sql.gz`. Die Fristen änderst du in der Compose-Datei (`BACKUP_KEEP_DAYS`, `BACKUP_KEEP_WEEKS`, `BACKUP_KEEP_MONTHS`). Prüfe nach dem ersten Deploy in Portainer, dass der Container läuft und im Log eine Sicherung gemeldet wird. Die Lizenz des Images steht auf der Projektseite <https://github.com/prodrigestivill/docker-postgres-backup-local>.

## Was außerdem gesichert werden muss

Die **Stack-Variablen** aus Portainer, vor allem `AUTH_SECRET` (und `CODE_ENC_KEY`, falls gesetzt). Ohne diesen Schlüssel sind die verschlüsselten Schülercodes aus einer Sicherung nicht lesbar. Bewahre sie getrennt von den Datenbank-Sicherungen auf, zum Beispiel in einem Passwortmanager. Auch `POSTGRES_PASSWORD` und `TRAINER_CODE_HASH` gehören dazu.

## Zweiter Speicherort

Das Volume liegt auf demselben Server wie die Datenbank. Bei einem Festplattenschaden geht beides verloren. Kopiere die Sicherungen deshalb regelmäßig auf ein anderes Gerät oder in einen Speicher außerhalb des Servers:

```sh
docker cp schulschach_pgbackups:/backups ./schulschach-backups-kopie
```

Das kopiert den ganzen Sicherungsordner in das aktuelle Verzeichnis. Diese Kopie kannst du dann mit `rsync` oder `rclone` verschieben (und per Cron automatisieren). Verschlüssele sie, wenn sie den Server verlässt.

## Wiederherstellen

Teste das einmal in Ruhe, bevor du es brauchst. Eine Sicherung zählt erst, wenn sie sich zurückspielen lässt.

### Erst testen, ohne etwas zu gefährden

```sh
docker exec schulschach_db createdb -U schulschach restoretest
docker exec schulschach_pgbackups cat /backups/last/schulschach-latest.sql.gz | gunzip -c | docker exec -i schulschach_db psql -U schulschach -d restoretest
docker exec schulschach_db psql -U schulschach -d restoretest -c "SELECT count(*) FROM \"Tournament\";"
docker exec schulschach_db dropdb -U schulschach restoretest
```

Die Zahl im dritten Befehl sollte zu den Turnieren passen, die du in der Anwendung siehst. Meldet `ls /backups/last` im Container (`docker exec schulschach_pgbackups ls /backups/last`) einen anderen Dateinamen, setze ihn ein. Ein paar Hinweise zu bereits vorhandenen Einträgen sind beim Wiederherstellen normal.

### Echte Wiederherstellung

1. App anhalten: `docker stop schulschach_app` (oder in Portainer den Container stoppen), damit nichts in die Datenbank schreibt.
2. Aktuelle Daten verwerfen: `docker exec schulschach_db psql -U schulschach -d schulschach -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"`
3. Sicherung einspielen (Datei nach Bedarf aus `daily`, `weekly` oder `monthly` wählen):
   `docker exec schulschach_pgbackups cat /backups/last/schulschach-latest.sql.gz | gunzip -c | docker exec -i schulschach_db psql -U schulschach -d schulschach`
4. App wieder starten: `docker start schulschach_app`. Sie legt fehlende Tabellen beim Start selbst an.
5. Prüfen, ob Schüler, Turniere und Partien da sind.

Wenn du die Sicherung auf einen neuen Server zurückspielst, muss `AUTH_SECRET` derselbe Wert sein wie vorher.

## Datenschutz bei Sicherungen

- Sicherungen enthalten Aliasse, Lernstände, Partien und Turniere. Sie liegen nur im Docker-Volume und nicht im Internet. Lege Kopien zugriffsgeschützt ab.
- Löschfristen der Anwendung (beendete Partien und Turniere nach 90 Tagen, manuell gelöschte Turniere) gelten nicht rückwirkend für bestehende Sicherungen. Die Voreinstellung bewahrt Tagesstände 7 Tage, Wochenstände 4 Wochen und Monatsstände 3 Monate auf. Kürze das, wenn deine Schule das verlangt.
- Wird ein Schüler auf eigenen Wunsch aus der Plattform gelöscht, steht er bis zum Ablauf der Sicherungen noch dort. Das ist bei der Information an Eltern und Schule zu nennen.
