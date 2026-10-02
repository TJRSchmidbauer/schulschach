// Kopiert die Stockfish.js-Engine (Lite, Single-Thread) aus node_modules nach public/engine.
// Stockfish.js steht unter GPL-3.0. Lizenztext und Quellverweis werden mitkopiert.
// Dieses Skript bricht den Build nie ab: ohne Engine laufen Live-Partien, nur die Analyse fehlt.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const pkgDir = path.join(root, 'node_modules', 'stockfish');
const outDir = path.join(root, 'public', 'engine');

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') walk(full, out);
    } else {
      out.push(full);
    }
  }
  return out;
}

try {
  if (!fs.existsSync(pkgDir)) throw new Error('Paket stockfish ist nicht installiert (npm install ausführen).');
  const files = walk(pkgDir);
  const js = files
    .filter((f) => /lite-single/.test(path.basename(f)) && f.endsWith('.js'))
    .sort()[0];
  if (!js) throw new Error('Keine Engine-Variante lite-single im Paket gefunden.');

  fs.mkdirSync(outDir, { recursive: true });
  const dir = path.dirname(js);
  const stem = path.basename(js, '.js');
  const copied = [];
  for (const name of fs.readdirSync(dir)) {
    if (name === stem + '.js' || (name.startsWith(stem) && name.endsWith('.wasm'))) {
      fs.copyFileSync(path.join(dir, name), path.join(outDir, name));
      copied.push(name);
    }
  }

  for (const f of files) {
    const base = path.basename(f).toLowerCase();
    if (base === 'copying.txt') fs.copyFileSync(f, path.join(outDir, 'COPYING.txt'));
    if (base === 'authors') fs.copyFileSync(f, path.join(outDir, 'AUTHORS.txt'));
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ js: path.basename(js) }));
  fs.writeFileSync(
    path.join(outDir, 'README.txt'),
    [
      'Stockfish.js (c) Chess.com, LLC und Mitwirkende, Lizenz GPL-3.0 (siehe COPYING.txt).',
      'Quellcode: https://github.com/nmrugg/stockfish.js',
      'Stockfish-Engine: https://github.com/official-stockfish/Stockfish',
      'Die Engine wird unverändert und als getrennte Datei ausgeliefert. Sie läuft im Browser als Web Worker.',
      '',
    ].join('\n'),
  );
  console.log('[engine] kopiert: ' + copied.join(', '));
} catch (err) {
  console.warn('[engine] Analyse-Engine nicht eingerichtet: ' + (err && err.message ? err.message : err));
}
