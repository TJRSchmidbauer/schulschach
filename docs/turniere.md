# Turniere (Schweizer System)

Für Brettturniere in der AG: Auslosung, Ergebniseingabe, Rangliste und eine große Ansicht für den Beamer. Es spielen keine Computerpartien; die Partien finden am echten Brett statt und der Trainer trägt die Ergebnisse ein.

## Ablauf

1. Trainer-Bereich → Turniere → **Neues Turnier**.
2. Teilnehmer aus der AG ankreuzen und bei Bedarf Gast-Aliasse eintragen (ein Eintrag pro Zeile, 3 bis 100 Teilnehmer). Gast-Aliasse bleiben im Browser, bis du „Turnier anlegen“ drückst.
3. Rundenzahl prüfen (empfohlen: aufgerundeter Zweierlogarithmus der Teilnehmerzahl).
4. **Nächste Runde auslosen** und den Vorschlag prüfen.
5. **Runde für den Beamer veröffentlichen.** Die Beamer-Ansicht zeigt nur veröffentlichte Runden.
6. Ergebnisse am Ende der Partien eintragen (1–0, ½–½, 0–1). Erst wenn alle Ergebnisse der Runde da sind, kann die nächste ausgelost werden.
7. Nach der letzten Runde **Turnier abschließen.**

## Beamer-Ansicht

Unter „Beamer-Ansicht öffnen“ (Anmeldung als Trainer erforderlich). Vollbild, große Schrift, aktualisiert sich alle 5 Sekunden, wechselt auf Wunsch alle 15 Sekunden zwischen Paarungen und Rangliste. Weiß steht links, Schwarz rechts. Bei mehr als 14 Brettern werden die Paarungen in zwei Spalten gezeigt.

## Auslosung

Die Auslosung folgt dem **FIDE-Holländischen System (C.04.3)**. Sie wird von der Bibliothek `@echecs/swiss` (MIT-Lizenz) berechnet, nicht von eigenem Code. Zu den Grundregeln gehören: kein erneutes Aufeinandertreffen, ein Freilos nur einmal je Spieler (mit einem Punkt), Paarung möglichst innerhalb der Punktgruppe, Farbausgleich und nie dreimal dieselbe Farbe hintereinander.

- Die Startrangliste ist die Reihenfolge, in der die Teilnehmer beim Anlegen eingetragen wurden (die Bibliothek bekommt dafür eine künstliche Wertzahl).
- Schlägt die Berechnung fehl, benutzt das System eine einfachere Notlösung (gleiche Punktgruppe, Wiederholungen vermeiden, Farben ausgleichen). Eine dann unvermeidbare Wiederholungspaarung ist mit ⚠ markiert.

## Rangfolge

1. Punkte
2. Buchholz mit einem Streichergebnis
3. Feinbuchholz mit einem Streichergebnis
4. Sonneborn-Berger
5. Zahl der Siege
6. Startrangliste

Die Reihenfolge orientiert sich an den üblichen Jugendspielordnungen. Je nach Ausschreibung können andere Kriterien gelten; prüfe bei offiziellen Meisterschaften die Ausschreibung.

## Grenzen

- Die Bibliothek ist jung und wenig verbreitet. Sie steht **nicht** auf der Liste der von der FIDE anerkannten Auslosungsprogramme, und diese Anwendung wurde nicht gegen ein anerkanntes Programm geprüft. Für offizielle Meisterschaften oder FIDE-Wertungsturniere ersetzt sie weder ein anerkanntes Programm noch einen Schiedsrichter. Vergleiche in diesem Fall die Auslosung mit einem anerkannten Programm.
- Die Feinwertungen (Buchholz, Feinbuchholz, Sonneborn-Berger) sind eine einfache Umsetzung. Sie behandeln Freilose und nicht gespielte Partien vereinfacht und entsprechen nicht in allen Randfällen der FIDE-Regel für Feinwertungen.
- Noch nicht enthalten: manuelles Tauschen einzelner Paarungen, Nachmelden und Abmelden von Spielern während des Turniers, Direktvergleich als Feinwertung.
- Prüfe die ersten Auslosungen von Hand.

## Datenschutz

- Es werden nur Aliasse, Paarungen und Ergebnisse gespeichert. Keine echten Namen.
- Beendete Turniere werden nach 90 Tagen automatisch gelöscht.
