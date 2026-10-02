# Turniere (Schweizer System)

Für Brettturniere in der AG: Auslosung, Ergebniseingabe, Rangliste und eine große Ansicht für den Beamer. Es spielen keine Computerpartien; die Partien finden am echten Brett statt und der Trainer trägt die Ergebnisse ein.

## Ablauf

1. Trainer-Bereich → Turniere → **Neues Turnier**.
2. Teilnehmer aus der AG ankreuzen und bei Bedarf Gast-Aliasse eintragen (ein Eintrag pro Zeile, 3 bis 100 Teilnehmer). Gast-Aliasse bleiben im Browser, bis du „Turnier anlegen“ drückst.
3. Rundenzahl prüfen (empfohlen: aufgerundeter Zweierlogarithmus der Teilnehmerzahl).
4. **Nächste Runde auslosen** und den Vorschlag prüfen. Wiederholungspaarungen sind mit einem Warnzeichen markiert.
5. **Runde für den Beamer veröffentlichen.** Die Beamer-Ansicht zeigt nur veröffentlichte Runden.
6. Ergebnisse am Ende der Partien eintragen (1–0, ½–½, 0–1). Erst wenn alle Ergebnisse der Runde da sind, kann die nächste ausgelost werden.
7. Nach der letzten Runde **Turnier abschließen.**

## Beamer-Ansicht

Unter „Beamer-Ansicht öffnen“ (Anmeldung als Trainer erforderlich). Vollbild, große Schrift, aktualisiert sich alle 5 Sekunden, wechselt auf Wunsch alle 15 Sekunden zwischen Paarungen und Rangliste. Weiß steht links, Schwarz rechts. Bei mehr als 14 Brettern werden die Paarungen in zwei Spalten gezeigt.

## Paarungsregeln

- Gleiche Punktgruppen werden bevorzugt gepaart.
- Bereits gespielte Paarungen werden vermieden; ist das nicht möglich, wird die Paarung als Wiederholung markiert.
- Farben werden möglichst ausgeglichen; dreimal die gleiche Farbe in Folge wird stark vermieden.
- Bei ungerader Teilnehmerzahl gibt es ein Freilos (ein Punkt). Es trifft nach Möglichkeit niemanden zweimal.
- Die erste Runde paart nach Startrangliste (Reihenfolge der Eintragung).

## Rangfolge

1. Punkte
2. Buchholz mit einem Streichergebnis
3. Feinbuchholz mit einem Streichergebnis
4. Sonneborn-Berger
5. Zahl der Siege
6. Startrangliste

Die Reihenfolge orientiert sich an den üblichen Jugendspielordnungen. Je nach Ausschreibung können andere Kriterien gelten; prüfe bei offiziellen Meisterschaften die Ausschreibung.

## Grenzen

- Der Paarungsalgorithmus ist eine eigene, nachvollziehbare Umsetzung für Schulturniere. Er ist **nicht** durch einen Schachverband zertifiziert und ersetzt für offizielle Meisterschaften kein anerkanntes Auslosungsprogramm.
- Noch nicht enthalten: manuelles Tauschen einzelner Paarungen, Nachmelden und Abmelden von Spielern während des Turniers, Direktvergleich als Feinwertung.
- Die Paarungslogik ist ungetestet ausgeliefert. Prüfe die ersten Auslosungen von Hand.

## Datenschutz

- Es werden nur Aliasse, Paarungen und Ergebnisse gespeichert. Keine echten Namen.
- Beendete Turniere werden nach 90 Tagen automatisch gelöscht.
