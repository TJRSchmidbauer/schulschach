# Turniere (Schweizer System)

Für Brettturniere in der AG: Auslosung, Ergebniseingabe, Rangliste und eine große Ansicht für den Beamer. Es spielen keine Computerpartien; die Partien finden am echten Brett statt und der Trainer trägt die Ergebnisse ein.

## Ablauf

1. Trainer-Bereich → Turniere → **Neues Turnier**.
2. Teilnehmer aus der AG ankreuzen und bei Bedarf Gast-Aliasse eintragen (ein Eintrag pro Zeile, 3 bis 100 Teilnehmer). Gast-Aliasse bleiben im Browser, bis du „Turnier anlegen“ drückst.
3. Rundenzahl prüfen (empfohlen: aufgerundeter Zweierlogarithmus der Teilnehmerzahl).
4. **Nächste Runde auslosen** und den Vorschlag prüfen.
5. **Runde für den Beamer veröffentlichen.** Die Beamer-Ansicht zeigt nur veröffentlichte Runden.
6. Ergebnisse am Ende der Partien eintragen (1–0, ½–½, 0–1). Erst wenn alle Ergebnisse der Runde da sind, kann die nächste ausgelost werden.
7. Wer zwischendurch gehen muss, wird unter **Teilnehmer** abgemeldet (siehe unten).
8. Nach der letzten Runde **Turnier abschließen.**

## Beamer-Ansicht

Unter „Beamer-Ansicht öffnen“ (Anmeldung als Trainer erforderlich). Vollbild, große Schrift, aktualisiert sich alle 5 Sekunden, wechselt auf Wunsch alle 15 Sekunden zwischen Paarungen und Rangliste. Weiß steht links, Schwarz rechts. Bei mehr als 14 Brettern werden die Paarungen in zwei Spalten gezeigt. Abgemeldete Spieler stehen in der Rangliste abgeblendet mit dem Hinweis „abgemeldet“.

## Auslosung

Die Auslosung folgt dem **FIDE-Holländischen System (C.04.3)**. Sie wird von der Bibliothek `@echecs/swiss` (MIT-Lizenz) berechnet, nicht von eigenem Code. Zu den Grundregeln gehören: kein erneutes Aufeinandertreffen, ein Freilos nur einmal je Spieler (mit einem Punkt), Paarung möglichst innerhalb der Punktgruppe, Farbausgleich und nie dreimal dieselbe Farbe hintereinander.

- Die Startrangliste ist die Reihenfolge, in der die Teilnehmer beim Anlegen eingetragen wurden (die Bibliothek bekommt dafür eine künstliche Wertzahl).
- Die Anwendung prüft das Ergebnis der Bibliothek: Alle aktiven Spieler müssen genau einmal vorkommen, niemand darf einen alten Gegner wiederbekommen, und niemand darf ein zweites Freilos erhalten.
- Schlägt die Berechnung oder diese Prüfung fehl, benutzt das System eine einfachere Notlösung (gleiche Punktgruppe, Wiederholungen vermeiden, Farben ausgleichen). Eine dann unvermeidbare Wiederholungspaarung ist mit ⚠ markiert. Im Server-Log steht in diesem Fall eine Zeile, die mit `[turnier] FIDE-Auslosung fehlgeschlagen` beginnt.

## Abmelden und Wiederanmelden

Im Turnier gibt es unten die Karte **Teilnehmer**. Dort kannst du jeden Teilnehmer mit **Abmelden** aus dem Turnier nehmen, zum Beispiel bei Krankheit oder wenn jemand früher abgeholt wird.

- Die Abmeldung gilt nur für künftige Runden. Bisherige Partien und Punkte bleiben erhalten, und der Spieler bleibt mit seinem Stand in der Rangliste (gekennzeichnet als „abgemeldet“).
- Ab der nächsten Auslosung wird der Spieler nicht mehr berücksichtigt. Dadurch kann sich die Zahl der Spieler ändern: Wird sie ungerade, gibt es ein Freilos.
- Hat ein abgemeldeter Spieler in der **aktuellen** Runde noch eine offene Partie, bleibt sie bestehen. Trage dafür ein Ergebnis ein (zum Beispiel einen Sieg für den Gegner), sonst kann die nächste Runde nicht ausgelost werden.
- Mit **Wieder anmelden** nimmst du die Abmeldung zurück. Der Spieler wird dann ab der nächsten Auslosung wieder gepaart. Für verpasste Runden bekommt er keine Punkte.
- Es müssen mindestens 2 aktive Teilnehmer im Turnier bleiben. In beendeten Turnieren sind Änderungen nicht mehr möglich.
- Für die Auslosung werden Partien zwischen einem aktiven und einem abgemeldeten Spieler der Bibliothek als Freilos mit den erzielten Punkten übergeben, damit die Punktgruppen stimmen. Die Farbhistorie dieser Partien geht dabei verloren. Das ist eine Vereinfachung.

## Turnier löschen

In der Turnierliste und auf der Turnierseite gibt es den Knopf **Löschen**. Nach einer Sicherheitsabfrage werden das Turnier mit allen Teilnehmern, Runden und Ergebnissen sofort und endgültig gelöscht. So räumst du Probeturniere auf.

- Beendete Turniere werden zusätzlich nach 90 Tagen automatisch gelöscht. Laufende Turniere und Entwürfe werden nie automatisch gelöscht, sie verschwinden nur durch **Löschen**.
- Gelöschte Turniere sind nur über eine Datensicherung wiederherstellbar, siehe [datensicherung.md](datensicherung.md).

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
- Noch nicht enthalten: manuelles Tauschen einzelner Paarungen, Nachmelden neuer Teilnehmer nach dem Start, Direktvergleich als Feinwertung.
- Prüfe die ersten Auslosungen von Hand, besonders nach Abmeldungen.

## Datenschutz

- Es werden nur Aliasse, Paarungen und Ergebnisse gespeichert. Keine echten Namen.
- Beendete Turniere werden nach 90 Tagen automatisch gelöscht, jedes Turnier lässt sich jederzeit von Hand löschen. Bereits erstellte Datensicherungen enthalten gelöschte Turniere bis zu ihrem Ablauf weiter, siehe [datensicherung.md](datensicherung.md).
