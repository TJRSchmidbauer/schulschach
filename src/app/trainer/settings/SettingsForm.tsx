'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FEATURE_LIST, LIMITS, THEMES, themeVars, type Settings, type ThemeId } from '@/lib/branding';
import { Markdown } from '@/lib/markdown';

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
};

const area: React.CSSProperties = { ...field, fontFamily: 'inherit', minHeight: 200, lineHeight: 1.5 };

const SKELETON_IMPRESSUM = [
  '## Verantwortlich',
  '',
  '[Name der Schule oder des Vereins]',
  '[Straße und Hausnummer]',
  '[Postleitzahl und Ort]',
  '',
  '## Kontakt',
  '',
  'E-Mail: [E-Mail-Adresse]',
  'Telefon: [Telefonnummer]',
  '',
  '## Hinweis',
  '',
  'Diese Vorlage ist ein Platzhalter. Ergänze die Pflichtangaben für deine Einrichtung und lass sie bei Bedarf prüfen.',
].join('\n');

const SKELETON_DATENSCHUTZ = [
  '## Verantwortliche Stelle',
  '',
  '[Name und Kontakt der Schule oder des Vereins]',
  '',
  '## Welche Daten werden gespeichert?',
  '',
  '- Alias (Spitzname) und Anmeldecode der Teilnehmenden',
  '- Lösungsversuche bei Aufgaben (Ergebnis, Tipps, Dauer)',
  '- Live-Partien (Züge, Ergebnis, Bedenkzeit) und Turniere (Alias, Paarungen, Ergebnisse)',
  '',
  '## Aufbewahrung',
  '',
  'Beendete Partien und Turniere werden nach 90 Tagen automatisch gelöscht. Datensicherungen werden nach spätestens drei Monaten gelöscht.',
  '',
  '## Keine Tracker',
  '',
  'Es werden keine Tracker, keine externen Schriften und keine externen Dienste eingebunden.',
  '',
  '## Rechte',
  '',
  '[Hinweise zu Auskunft, Berichtigung und Löschung sowie Ansprechperson für Datenschutz]',
].join('\n');

export default function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [s, setS] = useState<Settings>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const savedRef = useRef(false);

  // Live-Vorschau des gewählten Farbschemas. Ohne Speichern wird der alte Zustand wiederhergestellt.
  useEffect(() => {
    savedRef.current = false;
    const root = document.documentElement;
    const vars = themeVars(s.theme);
    const keys = Object.keys(vars);
    const prev = keys.map((k) => root.style.getPropertyValue(k));
    keys.forEach((k) => root.style.setProperty(k, vars[k]));
    return () => {
      if (savedRef.current) return;
      keys.forEach((k, i) => root.style.setProperty(k, prev[i]));
    };
  }, [s.theme]);

  function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    setS((prev) => ({ ...prev, [key]: value }));
    setMsg(null);
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/trainer/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(s),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg({ ok: false, text: body.error ?? 'Das hat nicht geklappt.' });
        return;
      }
      savedRef.current = true;
      setMsg({ ok: true, text: 'Gespeichert.' });
      router.refresh();
    } catch {
      setMsg({ ok: false, text: 'Keine Verbindung zum Server.' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h2>Name und Aussehen</h2>
        <label htmlFor='sn'>Name links oben (2 bis {LIMITS.siteName} Zeichen)</label>
        <input id='sn' type='text' value={s.siteName} maxLength={LIMITS.siteName} onChange={(e) => set('siteName', e.target.value)} style={field} autoComplete='off' />
        <p className='muted' style={{ margin: '0.3rem 0 0' }}>Das letzte Wort wird farbig hervorgehoben, zum Beispiel „SchulSchach AG“.</p>

        <label htmlFor='st'>Untertitel rechts oben (optional, zum Beispiel Schulname)</label>
        <input id='st' type='text' value={s.subtitle} maxLength={LIMITS.subtitle} onChange={(e) => set('subtitle', e.target.value)} style={field} autoComplete='off' />

        <label>Farbschema (Vorschau sofort sichtbar, gespeichert wird mit dem Knopf unten)</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.7rem' }}>
          {THEMES.map((t) => {
            const active = s.theme === t.id;
            return (
              <button
                key={t.id}
                type='button'
                aria-pressed={active}
                onClick={() => set('theme', t.id as ThemeId)}
                style={{ textAlign: 'left', padding: '0.6rem', borderRadius: 12, cursor: 'pointer', background: '#fff', border: active ? `3px solid ${t.vars['--accent']}` : '3px solid #e8ddc8', color: '#26221c', font: 'inherit' }}
              >
                <span style={{ display: 'flex', height: 26, borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
                  <span style={{ flex: 2, background: t.vars['--navy'] }} />
                  <span style={{ flex: 2, background: t.vars['--accent'] }} />
                  <span style={{ flex: 1, background: t.vars['--bg'] }} />
                </span>
                <b>{t.label}</b>
                {active ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h2>Funktionen ein- und ausschalten</h2>
        <p className='muted'>Ausgeschaltete Funktionen verschwinden aus der Navigation und zeigen beim direkten Aufruf einen Hinweis.</p>
        {FEATURE_LIST.map((f) => (
          <label key={f.key} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', margin: '0.7rem 0', fontWeight: 400 }}>
            <input type='checkbox' checked={s.features[f.key]} onChange={(e) => set('features', { ...s.features, [f.key]: e.target.checked })} style={{ marginTop: 4 }} />
            <span>
              <b>{f.label}</b>
              <br />
              <span className='muted'>{f.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h2>Impressum und Datenschutz (Markdown)</h2>
        <p className='muted'>
          Die Texte erscheinen über Links in der Fußzeile auf allen Seiten. Leere Felder blenden den Link aus. Erlaubt sind Überschriften (## Titel), Listen (- Punkt), **fett**, *kursiv* und Links [Text](https://beispiel.de). Die Vorlagen sind nur Platzhalter und ersetzen keine Rechtsberatung.
        </p>

        <label htmlFor='imp'>Impressum</label>
        <textarea id='imp' value={s.impressumMd} maxLength={LIMITS.text} onChange={(e) => set('impressumMd', e.target.value)} style={area} />
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
          {!s.impressumMd.trim() && (
            <button type='button' className='logout-link' style={{ color: 'var(--accent-dark)' }} onClick={() => set('impressumMd', SKELETON_IMPRESSUM)}>Vorlage einfügen</button>
          )}
        </div>
        {s.impressumMd.trim() && (
          <details style={{ marginTop: '0.4rem' }}>
            <summary>Vorschau</summary>
            <Markdown source={s.impressumMd} />
          </details>
        )}

        <label htmlFor='ds'>Datenschutz</label>
        <textarea id='ds' value={s.datenschutzMd} maxLength={LIMITS.text} onChange={(e) => set('datenschutzMd', e.target.value)} style={area} />
        <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
          {!s.datenschutzMd.trim() && (
            <button type='button' className='logout-link' style={{ color: 'var(--accent-dark)' }} onClick={() => set('datenschutzMd', SKELETON_DATENSCHUTZ)}>Vorlage einfügen</button>
          )}
        </div>
        {s.datenschutzMd.trim() && (
          <details style={{ marginTop: '0.4rem' }}>
            <summary>Vorschau</summary>
            <Markdown source={s.datenschutzMd} />
          </details>
        )}
      </div>

      <div className='card'>
        <button className='btn' style={{ width: 'auto', marginTop: 0, padding: '0.8rem 1.8rem' }} disabled={busy} onClick={() => void save()}>
          Einstellungen speichern
        </button>
        {msg && <p className={msg.ok ? 'info' : 'error'}>{msg.text}</p>}
      </div>
    </div>
  );
}
