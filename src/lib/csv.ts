const HEADER_WORDS = new Set(['alias', 'aliasse', 'name', 'namen', 'nickname', 'nicknames', 'spitzname', 'spitznamen', 'teilnehmer']);

function firstCell(row: string): string {
  const s = row.trim();
  if (s.startsWith('"')) {
    let out = '';
    for (let i = 1; i < s.length; i++) {
      if (s[i] === '"') {
        if (s[i + 1] === '"') {
          out += '"';
          i++;
          continue;
        }
        break;
      }
      out += s[i];
    }
    return out;
  }
  const cut = s.search(/[;,\t]/);
  return cut === -1 ? s : s.slice(0, cut);
}

function allCells(row: string): string[] {
  return row.split(/[;,\t]/).map((c) => c.replace(/^"|"$/g, ''));
}

// Liest eine Namensliste aus CSV- oder Textdaten: ein Name pro Zeile (erste Spalte) oder alle Namen in einer
// einzigen Zeile, getrennt durch Semikolon, Komma oder Tab. Eine Kopfzeile wie "Alias" wird übersprungen.
export function parseNameList(text: string, max = 200): string[] {
  const rows = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter((r) => r.trim() !== '');
  if (rows.length === 0) return [];
  let cells: string[];
  if (rows.length === 1 && /[;,\t]/.test(rows[0])) cells = allCells(rows[0]);
  else cells = rows.map(firstCell);
  const seen = new Set<string>();
  const out: string[] = [];
  cells.forEach((cell, index) => {
    const name = cell.replace(/\s+/g, ' ').trim();
    if (!name) return;
    if (index === 0 && HEADER_WORDS.has(name.toLocaleLowerCase('de-DE'))) return;
    const key = name.toLocaleLowerCase('de-DE');
    if (seen.has(key) || out.length >= max) return;
    seen.add(key);
    out.push(name);
  });
  return out;
}
