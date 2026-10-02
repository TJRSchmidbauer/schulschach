'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CERT_COLORS, EXTRAS_LIMITS, MEDAL_LEVELS, type CertColorId, type Extras, type MedalLevel } from '@/lib/extras';
import { CONTROLS, controlLabel } from '@/lib/live/types';

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

export default function ExtrasForm({ initial }: { initial: Extras }) {
  const router = useRouter();
  const [x, setX] = useState<Extras>(initial);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function setCert<K extends keyof Extras['cert']>(key: K, value: Extras['cert'][K]) {
    setX((prev) => ({ ...prev, cert: { ...prev.cert, [key]: value } }));
    setMsg(null);
  }

  function toggleControl(id: string, on: boolean) {
    setX((prev) => {
      const set = new Set(prev.live.controls);
      if (on) set.add(id);
      else set.delete(id);
      if (set.size === 0) return prev;
      const controls = CONTROLS.map((c) => c.id as string).filter((cid) => set.has(cid));
      const defaultControl = controls.includes(prev.live.defaultControl) ? prev.live.defaultControl : controls[0];
      return { ...prev, live: { controls, defaultControl } };
    });
    setMsg(null);
  }

  async function save() {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch('/api/trainer/settings/extras', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(x),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setMsg({ ok: false, text: body.error ?? 'Das hat nicht geklappt.' });
        return;
      }
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
        <h2>Medaillen: Schwierigkeit</h2>
        <p className='muted'>
          Bestimmt, wie viele Aufgaben, Tage oder Themen für die Medaillen nötig sind. Bereits verdiente Medaillen können dadurch wieder verschwinden oder neu hinzukommen, weil sie aus dem Lernstand berechnet werden. „Erster Schritt“ und „Allrounder“ bleiben immer gleich.
        </p>
        {MEDAL_LEVELS.map((l) => (
          <label key={l.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', margin: '0.7rem 0', fontWeight: 400 }}>
            <input type='radio' name='medal-level' checked={x.medalLevel === l.id} onChange={() => { setX((p) => ({ ...p, medalLevel: l.id as MedalLevel })); setMsg(null); }} style={{ marginTop: 4 }} />
            <span>
              <b>{l.label}</b>
              <br />
              <span className='muted'>{l.hint}</span>
            </span>
          </label>
        ))}
      </div>

      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h2>Live-Partien: Bedenkzeiten</h2>
        <p className='muted'>
          Diese Bedenkzeiten dürfen Schüler in der Lobby wählen. Mindestens eine muss erlaubt bleiben. Beim Ansetzen einer Partie im Trainer-Bereich stehen weiterhin alle Zeiten zur Verfügung.
        </p>
        {CONTROLS.map((c) => (
          <label key={c.id} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', margin: '0.5rem 0', fontWeight: 400 }}>
            <input type='checkbox' checked={x.live.controls.includes(c.id)} onChange={(e) => toggleControl(c.id, e.target.checked)} />
            <span>{controlLabel(c.initial, c.increment)}</span>
          </label>
        ))}
        <label htmlFor='dc'>Vorausgewählte Bedenkzeit</label>
        <select id='dc' value={x.live.defaultControl} onChange={(e) => { setX((p) => ({ ...p, live: { ...p.live, defaultControl: e.target.value } })); setMsg(null); }} style={{ ...field, width: 'auto' }}>
          {CONTROLS.filter((c) => x.live.controls.includes(c.id)).map((c) => (
            <option key={c.id} value={c.id}>{controlLabel(c.initial, c.increment)}</option>
          ))}
        </select>
      </div>

      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <h2>Urkunden-Vorlage</h2>
        <p className='muted'>Diese Werte sind die Voreinstellung im Urkunden-Editor. Den Namen der Schüler trägst du weiterhin nur im Browser ein.</p>

        <label htmlFor='ct'>Titel (höchstens {EXTRAS_LIMITS.title} Zeichen, zum Beispiel URKUNDE oder ANERKENNUNG)</label>
        <input id='ct' type='text' value={x.cert.title} maxLength={EXTRAS_LIMITS.title} onChange={(e) => setCert('title', e.target.value)} style={field} autoComplete='off' />

        <label htmlFor='co'>Standard-Überschrift unter dem Titel</label>
        <input id='co' type='text' value={x.cert.occasion} maxLength={EXTRAS_LIMITS.occasion} onChange={(e) => setCert('occasion', e.target.value)} style={field} autoComplete='off' />

        <label htmlFor='cs'>Standard-Unterschrift unter der Linie</label>
        <input id='cs' type='text' value={x.cert.signer} maxLength={EXTRAS_LIMITS.signer} onChange={(e) => setCert('signer', e.target.value)} style={field} autoComplete='off' />

        <label>Farben</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '0.7rem' }}>
          {CERT_COLORS.map((c) => {
            const active = x.cert.color === c.id;
            return (
              <button
                key={c.id}
                type='button'
                aria-pressed={active}
                onClick={() => setCert('color', c.id as CertColorId)}
                style={{ textAlign: 'left', padding: '0.6rem', borderRadius: 12, cursor: 'pointer', background: '#fff', border: active ? '3px solid #26221c' : '3px solid #e8ddc8', color: '#26221c', font: 'inherit' }}
              >
                <span style={{ display: 'flex', height: 22, borderRadius: 6, overflow: 'hidden', marginBottom: 6 }}>
                  <span style={{ flex: 3, background: c.main }} />
                  <span style={{ flex: 1, background: c.gold }} />
                  <span style={{ flex: 2, background: c.soft }} />
                </span>
                <b>{c.label}</b>
                {active ? ' ✓' : ''}
              </button>
            );
          })}
        </div>
      </div>

      <div className='card' style={{ marginBottom: '1.2rem' }}>
        <button className='btn' style={{ width: 'auto', marginTop: 0, padding: '0.8rem 1.8rem' }} disabled={busy} onClick={() => void save()}>
          Medaillen, Live-Partien und Urkunde speichern
        </button>
        {msg && <p className={msg.ok ? 'info' : 'error'}>{msg.text}</p>}
      </div>
    </div>
  );
}
