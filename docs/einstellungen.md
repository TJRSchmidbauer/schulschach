# Einstellungen (Trainer-Bereich)

Über das Zahnrad ⚙️ oben rechts (nur für angemeldete Trainer) erreichst du die Seite `/trainer/settings`. Dort passt du die Plattform an deine AG an. Die Einstellungen liegen in der Datenbank (Tabelle `AppSetting`) und sind damit Teil der Datensicherung.

## Name und Aussehen

- **Name links oben:** 2 bis 40 Zeichen. Das letzte Wort wird farbig hervorgehoben (zum Beispiel „SchulSchach **AG**“). Der Name steht auch im Titel des Browser-Tabs.
- **Untertitel:** Optional, erscheint rechts oben (zum Beispiel der Schulname).
- **Farbschema:** Holz und Grün (Standard), Ozean, Beere, Sonne, Kirsche, Schiefer. Die Auswahl zeigt sofort eine Vorschau und wird erst mit „Einstellungen speichern“ übernommen. Alle Schemata sind hell und erreichen für Text mindestens 4,5:1 Kontrast (WCAG 2.2, Kriterium 1.4.3). Das Schema gilt auch für die Turnierverwaltung und die Beamer-Ansicht.
- **Brettfarben:** Klassisch (Holz), Grün, Blau, Lila, Grau, Hoher Kontrast. Sie gelten für alle Schachbretter. Im Live-Brett werden sie direkt gesetzt, bei den übrigen Brettern über Stylesheet-Regeln für die Felder (`data-square`). Der letzte Zug im Live-Brett wird mit einem gelben Schatten markiert, damit er auf jedem Brett sichtbar bleibt.
- **Begrüßungstext:** Markdown, höchstens 2000 Zeichen. Er erscheint auf der Anmeldeseite und auf der Lernseite der Schüler. Ein leeres Feld zeigt nichts an.

Hinweis: Einige Bereiche haben ihre Farben noch fest im Code (Turnierverwaltung, Beamer-Ansicht, Übungsbrett-Knöpfe). Dort bleibt zum Beispiel das Grün der gewählten Knöpfe auch in anderen Schemata. Das wird schrittweise angepasst.

## Funktionen ein- und ausschalten

Freies Üben, Live-Partien, Turniere und Medaillen lassen sich einzeln ausschalten. Links dorthin verschwinden, und beim direkten Aufruf erscheint ein Hinweis (Trainer sehen einen Link zu den Einstellungen).

- **Live-Partien und Turniere** sind zusätzlich im Server gesperrt: Ist die Funktion ausgeschaltet, werden keine neuen Partien angelegt, angenommen oder angesetzt und keine neuen Turniere oder Turnierrunden erzeugt. Bereits laufende Partien können zu Ende gespielt werden, vorhandene Turniere lassen sich ansehen, abschließen oder löschen.
- **Freies Üben und Medaillen** werden nur in der Oberfläche ausgeblendet. Die Schnittstellen im Hintergrund bleiben aktiv.

## Live-Partien: Bedenkzeiten

Du legst fest, welche der fünf Bedenkzeiten (5 Min + 3 Sek, 10 Min, 10 Min + 5 Sek, 15 Min + 10 Sek, 30 Min) Schüler in der Lobby wählen dürfen und welche vorausgewählt ist. Mindestens eine Zeit muss erlaubt bleiben. Der Server prüft die Auswahl ebenfalls: Eine nicht erlaubte Bedenkzeit wird auch dann abgelehnt, wenn jemand die Oberfläche umgeht. Beim Ansetzen einer Partie im Trainer-Bereich stehen weiterhin alle Zeiten zur Verfügung. Bereits laufende oder wartende Partien bleiben unverändert.

## Medaillen: Schwierigkeit

Die Stufe bestimmt, wie viele Aufgaben, Tage oder Themen für eine Medaille nötig sind: **Leicht** (halbe Zielwerte), **Normal** (Standard) oder **Schwer** (doppelte Zielwerte). Die Beschreibungen der Medaillen passen sich an, zum Beispiel „Löse 5 Aufgaben“ statt „Löse 10 Aufgaben“. „Erster Schritt“ und „Allrounder“ bleiben immer gleich. Medaillen werden aus dem Lernstand berechnet: Wechselst du die Stufe, können bereits verdiente Medaillen verschwinden oder neu hinzukommen. Auch die Zahl auf der Urkunde („Medaillen gesammelt“) folgt der Stufe.

## Urkunden-Vorlage

Titel (zum Beispiel URKUNDE oder ANERKENNUNG, höchstens 14 Zeichen), Standard-Überschrift, Standard-Unterschrift und vier Farbpaletten (Marineblau, Tannengrün, Bordeaux, Schwarz, jeweils mit Gold). Die Werte sind die Voreinstellung im Urkunden-Editor und lassen sich dort pro Urkunde ändern (Überschrift und Unterschrift). Der Name der Schüler wird weiterhin nur im Browser eingetragen und nie an den Server gesendet.

## Aufbewahrung

Beendete Live-Partien und beendete Turniere werden nach einer einstellbaren Zeit automatisch gelöscht (7 bis 365 Tage, Standard 90). Die beiden Fristen sind getrennt einstellbar. Die Bereinigung läuft höchstens einmal pro Stunde, wenn die Lobby, die Turnierliste oder eine Turnierseite aufgerufen wird. Bereits erstellte Datensicherungen enthalten gelöschte Daten bis zu ihrem eigenen Ablauf weiter, siehe [datensicherung.md](datensicherung.md). Laufende Turniere und Entwürfe werden nie automatisch gelöscht.

Wo in anderen Dokumenten noch „90 Tage“ steht, ist der Standardwert gemeint.

## Impressum und Datenschutz

Beide Texte werden als Markdown eingegeben und erscheinen über Links in der Fußzeile auf allen Seiten (`/impressum` und `/datenschutz`, auch ohne Anmeldung sichtbar). Ein leeres Feld blendet den jeweiligen Link aus. Über „Vorlage einfügen“ erhältst du ein Gerüst mit Platzhaltern. Die Vorlagen sind keine Rechtsberatung: Trage die Pflichtangaben deiner Einrichtung ein und lass sie bei Bedarf prüfen.

Unterstützte Markdown-Elemente:

| Eingabe | Ergebnis |
|---|---|
| `## Titel` | Überschrift (auch `###`) |
| `- Punkt` oder `1. Punkt` | Liste |
| `**fett**`, `*kursiv*`, `` `Code` `` | Hervorhebungen |
| `[Text](https://beispiel.de)` | Link (erlaubt sind http, https, mailto und Adressen dieser Seite) |
| `---` | Trennlinie |

Roh-HTML wird nicht ausgeführt, sondern als Text angezeigt.

## CSV-Import und Alias-Generator

- **Schüler:** Einstellungen → „Zum CSV-Import“ (`/trainer/import`). Eine Text- oder CSV-Datei mit einem Alias pro Zeile (erste Spalte) oder allen Aliassen in einer Zeile, getrennt durch Semikolon, Komma oder Tab. Eine Kopfzeile wie „Alias“ wird übersprungen. Du siehst eine Vorschau, danach werden die Konten angelegt (höchstens 150 auf einmal). Aliasse, die es schon gibt (Groß- und Kleinschreibung zählt nicht), werden übersprungen. Die erzeugten Codes erscheinen als Tabelle und lassen sich als CSV speichern (`Alias;Code`). Du findest sie später auch in der Schülertabelle.
- **Alias-Generator:** Auf derselben Seite erzeugt „Namen erzeugen“ bis zu 60 Spitznamen auf einmal, wahlweise als Schachfigur und Zahl (Springer-17), Tier und Zahl (Fuchs-42) oder Figur, Tier und Zahl (Springer-Fuchs-07). Die Namen landen in der Liste und lassen sich vor dem Anlegen bearbeiten. Doppelte Namen innerhalb der Liste werden vermieden. Ob ein Name schon in der Datenbank existiert, prüft erst das Anlegen.
- **Turnier-Teilnehmer:** Beim Anlegen eines Turniers gibt es unter den Gast-Aliassen einen Datei-Knopf. Die Namen werden zu den Gast-Aliassen hinzugefügt.

Verwende nur Spitznamen und keine Klarnamen. Importierte Dateien werden nicht gespeichert, sie werden im Browser gelesen.
