'use client';

import { useMemo, useState } from 'react';
import { ALIAS_STYLES, generateAliases, type AliasStyle } from '@/lib/aliasgen';
import { parseNameList } from '@/lib/csv';

const field: React.CSSProperties = {
  textTransform: 'none',
  letterSpacing: 'normal',
  padding: '0.55rem 0.75rem',
  border: '2px solid #ddd3c3',
  borderRadius: 10,
  fontSize: '1rem',
  background: '#fdfbf7',
  width: '100%',
  boxSizing: 'border-box',
  fontFamily: 'inherit',
  minHeight: 160,
};

type Result = { created: { alias: string; code: string }[]; skipped: { alias: string; reason: string }[] };

function csvCell(v: string): string {
  const safe = /^[=+\-@]/.test(v) ? `'${v}` : v;
  return /[;"\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export default function ImportStudents() {
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [genCount, setGenCount] = useState(10);
  const [genStyle, setGenStyle] = useState<AliasStyle>('figuren');

  const names = useMemo(() => parseNameList(text, 150), [text]);
  const tooShort = names.filter((n) => n.length < 2 || n.length > 50);
  const valid = names.filter((n) => n.length >= 2 && n.length <= 50);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;
    if (file.size > 500_000) {
      setError('Die Datei ist zu groß (höchstens 500 KB).');
      input.value = '';
      return;
    }
    setError(null);
    setText(await file.text());
    input.value = '';
  }

  function generate() {
    const existing = parseNameList(text, 500);
    const count = Math.max(1, Math.min(60, Math.floor(genCount) || 1));
    const fresh = generateAliases(count, genStyle, existing);
    setText([...existing, ...fresh].join('\n'));
    setError(null);
  }

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/trainer/students/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aliases: valid }),
      });
      const body = (await res.json().catch(() => ({}))) as Partial<Result> & { error?: string };
      if (!res.ok) {
        setError(body.error ?? 'Das hat nicht geklappt.');
        return;
      }
      setResult({ created: body.created ?? [], skipped: body.skipped ?? [] });
    } catch {
      setError('Keine Verbindung zum Server.');
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!result) return;
    const rows = ['Alias;Code', ...result.created.map((r) => `${csvCell(r.alias)};${r.code}`)];
    const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'schueler-codes.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (result) {
    return (
      <div className='card'>
        <h1>Import abgeschlossen</h1>
        <p className='info'>{result.created.length} Schüler angelegt, {result.skipped.length} übersprungen.</p>
        {result.created.length > 0 && (
          <>
            <p className='muted'>Die Codes kannst du später auch in der Schülertabelle ansehen. Gib sie nur an die jeweiligen Schüler weiter.</p>
            <button className='btn' style={{ width: 'auto', marginTop: 0, padding: '0.6rem 1.2rem' }} onClick={download}>Alias und Codes als CSV speichern</button>
            <div style={{ overflowX: 'auto' }}>
              <table className='results'>
                <thead><tr><th>Alias</th><th>Code</th></tr></thead>
                <tbody>{result.created.map((r) => <tr key={r.alias}><td><b>{r.alias}</b></td><td style={{ fontFamily: 'monospace' }}>{r.code}</td></tr>)}</tbody>
              </table>
            </div>
          </>
        )}
        {result.skipped.length > 0 && (
          <>
            <h2 style={{ marginTop: '1.2rem' }}>Übersprungen</h2>
            <ul>{result.skipped.map((r, i) => <li key={i}><b>{r.alias || '(leer)'}</b>: {r.reason}</li>)}</ul>
          </>
        )}
        <button className='btn btn-secondary' style={{ width: 'auto', padding: '0.6rem 1.2rem' }} onClick={() => { setResult(null); setText(''); }}>Weiteren Import starten</button>
      </div>
    );
  }

  return (
    <div className='card'>
      <h1>Schüler per CSV importieren</h1>
      <p className='muted'>
        Eine Textdatei oder CSV-Datei mit einem Alias pro Zeile (erste Spalte), oder alle Aliasse in einer Zeile getrennt durch Semikolon oder Komma. Eine Kopfzeile wie „Alias“ wird übersprungen. Verwende bitte nur Spitznamen und keine Klarnamen. Höchstens 150 Namen auf einmal.
      </p>
      <label htmlFor='csvf'>CSV- oder Textdatei wählen</label>
      <input id='csvf' type='file' accept='.csv,.txt,text/csv,text/plain' onChange={(e) => void onFile(e)} />

      <label>Oder Spitznamen erzeugen lassen</label>
      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input type='number' min={1} max={60} value={genCount} onChange={(e) => setGenCount(Number(e.target.value))} aria-label='Anzahl' style={{ ...field, width: 90, minHeight: 0 }} />
        <select value={genStyle} onChange={(e) => setGenStyle(e.target.value as AliasStyle)} aria-label='Stil' style={{ ...field, width: 'auto', minHeight: 0 }}>
          {ALIAS_STYLES.map((a) => <option key={a.id} value={a.id}>{a.label} (z. B. {a.example})</option>)}
        </select>
        <button type='button' className='btn btn-secondary' style={{ width: 'auto', marginTop: 0, padding: '0.6rem 1.2rem' }} onClick={generate}>Namen erzeugen</button>
      </div>

      <label htmlFor='csvt'>Namen hier einfügen oder bearbeiten</label>
      <textarea id='csvt' value={text} onChange={(e) => setText(e.target.value)} style={field} placeholder={'Springer-01\nTurm-Leo\nBauer-Mia'} />
      <p><b>{valid.length}</b> Namen erkannt{tooShort.length > 0 ? `, ${tooShort.length} ungültig (2 bis 50 Zeichen)` : ''}.</p>
      {valid.length > 0 && <p className='muted'>Vorschau: {valid.slice(0, 12).join(', ')}{valid.length > 12 ? ' …' : ''}</p>}
      <button className='btn' style={{ width: 'auto', padding: '0.7rem 1.4rem' }} disabled={busy || valid.length === 0} onClick={() => void submit()}>
        {valid.length} Schüler anlegen
      </button>
      {error && <p className='error'>{error}</p>}
    </div>
  );
}
