'use client';

import { useEffect, useRef, useState } from 'react';
import { DEFAULT_EXTRAS, certPalette, type CertDefaults } from '@/lib/extras';

type Props = { achievementDefault: string; resetKey?: string; defaults?: CertDefaults };

const W = 1123;
const H = 794;
const SERIF = "Georgia, 'Times New Roman', serif";
const SQUARES = Array.from({ length: 45 }, (_, i) => i);

function star(cx: number, cy: number, outer: number, inner: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}

function wrap(text: string, max: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > max) {
      lines.push(cur);
      cur = w;
    } else {
      cur = cur ? cur + ' ' + w : w;
    }
  }
  if (cur) lines.push(cur);
  return lines.slice(0, 3);
}

function todayText(): string {
  return new Date().toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function CertificateEditor({ achievementDefault, resetKey, defaults = DEFAULT_EXTRAS.cert }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [name, setName] = useState('');
  const [occasion, setOccasion] = useState(defaults.occasion);
  const [achievement, setAchievement] = useState(achievementDefault);
  const [date, setDate] = useState('');
  const [signer, setSigner] = useState(defaults.signer);

  const pal = certPalette(defaults.color);
  const NAVY = pal.main;
  const GOLD = pal.gold;

  useEffect(() => {
    setDate(todayText());
  }, []);

  useEffect(() => {
    setAchievement(achievementDefault);
    setName('');
  }, [achievementDefault, resetKey]);

  function markup(): string | null {
    if (!svgRef.current) return null;
    return new XMLSerializer().serializeToString(svgRef.current);
  }

  function printIt() {
    const svg = markup();
    if (!svg) return;
    const w = window.open('', '_blank');
    if (!w) {
      window.alert('Das Pop-up wurde blockiert. Bitte erlaube Pop-ups für diese Seite und versuche es noch einmal.');
      return;
    }
    w.document.write(
      `<!doctype html><html><head><meta charset="utf-8"><title>Urkunde</title><style>@page{size:A4 landscape;margin:0}html,body{margin:0;height:100%}svg{width:100vw;height:100vh;display:block}</style></head><body>${svg}</body></html>`,
    );
    w.document.close();
    w.focus();
    setTimeout(() => w.print(), 400);
  }

  function download() {
    const svg = markup();
    if (!svg) return;
    const blob = new Blob(['<?xml version="1.0" encoding="UTF-8"?>\n' + svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'urkunde.svg';
    a.click();
    URL.revokeObjectURL(url);
  }

  const nameSize = name.length > 26 ? 40 : name.length > 20 ? 48 : name.length > 14 ? 56 : 64;
  const titleSize = defaults.title.length > 11 ? 56 : defaults.title.length > 8 ? 66 : 76;
  const lines = wrap(achievement, 58);

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

  return (
    <div>
      <div className="card" style={{ marginBottom: '1rem' }}>
        <p className="muted" style={{ marginTop: 0 }}>
          🔒 Der Name bleibt in diesem Browser-Fenster. Er wird weder gespeichert noch an den Server gesendet – auch nicht kurz.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.8rem' }}>
          <div>
            <label htmlFor="cert-name">Name</label>
            <input id="cert-name" type="text" autoComplete="off" spellCheck={false} value={name} onChange={(e) => setName(e.target.value)} style={field} />
          </div>
          <div>
            <label htmlFor="cert-occasion">Überschrift</label>
            <input id="cert-occasion" type="text" autoComplete="off" value={occasion} onChange={(e) => setOccasion(e.target.value)} style={field} />
          </div>
          <div>
            <label htmlFor="cert-date">Datum</label>
            <input id="cert-date" type="text" autoComplete="off" value={date} onChange={(e) => setDate(e.target.value)} style={field} />
          </div>
          <div>
            <label htmlFor="cert-signer">Unterschrift unter der Linie</label>
            <input id="cert-signer" type="text" autoComplete="off" value={signer} onChange={(e) => setSigner(e.target.value)} style={field} />
          </div>
        </div>
        <div style={{ marginTop: '0.8rem' }}>
          <label htmlFor="cert-text">Text</label>
          <input id="cert-text" type="text" autoComplete="off" value={achievement} onChange={(e) => setAchievement(e.target.value)} style={field} />
        </div>
        <div style={{ display: 'flex', gap: '0.7rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          <button type="button" className="btn" style={{ width: 'auto', marginTop: 0, padding: '0.6rem 1.2rem' }} onClick={printIt}>Drucken</button>
          <button type="button" className="btn" style={{ width: 'auto', marginTop: 0, padding: '0.6rem 1.2rem' }} onClick={download}>Als SVG speichern</button>
        </div>
      </div>

      <div style={{ maxWidth: 900, boxShadow: '0 4px 18px rgba(0,0,0,0.15)' }}>
        <svg ref={svgRef} xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${W} ${H}`} width="100%">
          <rect width={W} height={H} fill="#fffaf0" />
          <rect x="20" y="20" width="1083" height="754" fill="none" stroke={NAVY} strokeWidth="6" />
          <rect x="34" y="34" width="1055" height="726" fill="none" stroke={GOLD} strokeWidth="2" />
          {SQUARES.map((i) => (
            <rect key={`t${i}`} x={50 + i * 23} y={50} width={23} height={23} fill={i % 2 === 0 ? NAVY : pal.soft} />
          ))}
          {SQUARES.map((i) => (
            <rect key={`b${i}`} x={50 + i * 23} y={721} width={23} height={23} fill={i % 2 === 0 ? pal.soft : NAVY} />
          ))}

          <polygon points="545,152 525,207 544,198 556,214 566,155" fill="#b8860b" />
          <polygon points="578,152 598,207 579,198 567,214 557,155" fill="#b8860b" />
          <circle cx="561.5" cy="125" r="36" fill={GOLD} />
          <circle cx="561.5" cy="125" r="29" fill="#f3d675" stroke={NAVY} strokeWidth="2" />
          <polygon points={star(561.5, 125, 19, 8)} fill={NAVY} />

          <text x={W / 2} y="268" textAnchor="middle" fontSize={titleSize} fontWeight="bold" letterSpacing="14" fill={NAVY} fontFamily={SERIF}>{defaults.title}</text>
          <text x={W / 2} y="310" textAnchor="middle" fontSize="28" letterSpacing="3" fill={pal.occasion} fontFamily={SERIF}>{occasion}</text>
          <text x={W / 2} y="372" textAnchor="middle" fontSize="24" fontStyle="italic" fill="#555555" fontFamily={SERIF}>Diese Urkunde erhält</text>
          <text x={W / 2} y="450" textAnchor="middle" fontSize={nameSize} fontStyle="italic" fill={NAVY} fontFamily={SERIF}>{name}</text>
          <line x1="261" y1="468" x2="862" y2="468" stroke={NAVY} strokeWidth="1.5" />
          {lines.map((l, i) => (
            <text key={i} x={W / 2} y={524 + i * 36} textAnchor="middle" fontSize="27" fill="#333333" fontFamily={SERIF}>{l}</text>
          ))}

          <text x="275" y="668" textAnchor="middle" fontSize="22" fill="#333333" fontFamily={SERIF}>{date}</text>
          <line x1="150" y1="676" x2="400" y2="676" stroke={NAVY} strokeWidth="1.5" />
          <text x="275" y="698" textAnchor="middle" fontSize="18" fill="#777777" fontFamily={SERIF}>Datum</text>
          <line x1="723" y1="676" x2="973" y2="676" stroke={NAVY} strokeWidth="1.5" />
          <text x="848" y="698" textAnchor="middle" fontSize="18" fill="#777777" fontFamily={SERIF}>{signer}</text>
        </svg>
      </div>
    </div>
  );
}
