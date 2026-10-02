# Einstellungen (Trainer-Bereich)

Über das Zahnrad ⚙️ oben rechts (nur für angemeldete Trainer) erreichst du die Seite `/trainer/settings`. Dort passt du die Plattform an deine AG an. Die Einstellungen liegen in der Datenbank (Tabelle `AppSetting`) und sind damit Teil der Datensicherung.

## Name und Aussehen

- **Name links oben:** 2 bis 40 Zeichen. Das letzte Wort wird farbig hervorgehoben (zum Beispiel „SchulSchach **AG**“). Der Name steht auch im Titel des Browser-Tabs.
- **Untertitel:** Optional, erscheint rechts oben (zum Beispiel der Schulname).
- **Farbschema:** Holz und Grün (Standard), Ozean, Beere, Sonne, Kirsche, Schiefer. Die Auswahl zeigt sofort eine Vorschau und wird erst mit „Einstellungen speichern“ übernommen. Alle Schemata sind hell und erreichen für Text mindestens 4,5:1 Kontrast (WCAG 2.2, Kriterium 1.4.3).

Hinweis: Einige Bereiche haben ihre Farben noch fest im Code (Turnierverwaltung, Beamer-Ansicht, Live-Brett, Übungsbrett). Dort bleibt zum Beispiel das Grün der gewählten Knöpfe auch in anderen Schemata. Das wird schrittweise angepasst.

## Funktionen ein- und ausschalten

Freies Üben, Live-Partien, Turniere und Medaillen lassen sich einzeln ausschalten. Links dorthin verschwinden, und beim direkten Aufruf erscheint ein Hinweis (Trainer sehen einen Link zu den Einstellungen). Wichtig: Das blendet die Oberfläche aus. Die Schnittstellen im Hintergrund bleiben aktiv.

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

## CSV-Import

- **Schüler:** Einstellungen → „Zum CSV-Import“ (`/trainer/import`). Eine Text- oder CSV-Datei mit einem Alias pro Zeile (erste Spalte) oder allen Aliassen in einer Zeile, getrennt durch Semikolon, Komma oder Tab. Eine Kopfzeile wie „Alias“ wird übersprungen. Du siehst eine Vorschau, danach werden die Konten angelegt (höchstens 150 auf einmal). Aliasse, die es schon gibt (Groß- und Kleinschreibung zählt nicht), werden übersprungen. Die erzeugten Codes erscheinen als Tabelle und lassen sich als CSV speichern (`Alias;Code`). Du findest sie später auch in der Schülertabelle.
- **Turnier-Teilnehmer:** Beim Anlegen eines Turniers gibt es unter den Gast-Aliassen einen Datei-Knopf. Die Namen werden zu den Gast-Aliassen hinzugefügt.

Verwende nur Spitznamen und keine Klarnamen. Importierte Dateien werden nicht gespeichert, sie werden im Browser gelesen.
