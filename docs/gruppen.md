# Gruppen mit eigenem Lernpfad

Mit Gruppen teilst du die AG ein, zum Beispiel in „Anfänger“ und „Fortgeschrittene“, und legst fest, welche Lernpfade jede Gruppe sieht. Du erreichst die Seite über das Zahnrad ⚙️ → Einstellungen → „Zu den Gruppen“ (`/trainer/groups`).

## Bedienung

1. **Gruppe anlegen:** Name eingeben (2 bis 40 Zeichen, jeder Name nur einmal, Groß- und Kleinschreibung zählt nicht).
2. **Lernpfade wählen:** In der Karte der Gruppe die Lernpfade ankreuzen und „Lernpfade speichern“ drücken.
3. **Schüler zuordnen:** Unten steht eine Tabelle mit allen aktiven Schülern. Die Auswahl in der Zeile speichert sofort.
4. **Umbenennen und Löschen:** Beim Löschen einer Gruppe bleiben die Mitglieder erhalten. Sie sehen danach wieder alle Lernpfade.

## Was die Schüler sehen

- Hat die Gruppe eines Schülers Lernpfade zugeordnet, zeigt die Lernseite nur diese. Unter der Begrüßung steht der Gruppenname.
- Hat die Gruppe **keine** Lernpfade zugeordnet, sehen die Mitglieder alle Lernpfade.
- Schüler ohne Gruppe sehen alle Lernpfade.

## Grenzen

- Die Gruppe steuert nur die **Anzeige** der Lernpfade auf der Lernseite. Wer die Adresse eines Moduls aus einem nicht zugeordneten Lernpfad kennt, kann es trotzdem öffnen.
- Hausaufgaben, freies Üben, Live-Partien und Turniere sind unabhängig von Gruppen. Hausaufgaben vergibst du weiterhin an alle oder an ausgewählte Schüler.
- Ein Schüler gehört höchstens zu einer Gruppe.

## Daten

Gruppen liegen in der Datenbank (Tabellen `Group` und `GroupPath`, Feld `groupId` beim Schüler) und sind Teil der Datensicherung. Gruppennamen sollten keine Klarnamen oder Klassenlisten mit personenbezogenen Angaben enthalten. Nimm besser neutrale Namen wie „Gruppe A“.
