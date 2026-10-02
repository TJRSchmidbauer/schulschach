'use client';

import { useEffect, useRef, useState } from 'react';
import { Engine, evalText, pvToSan, scoreOf, staticEval, type EngineInfo } from '@/lib/live/engine';

type Props = {
  fen: string;
  fens: string[];
  sans: string[];
  live: boolean;
  onSelect: (plyIndex: number) => void;
};

type Mistake = { ply: number; san: string; loss: number; label: string };

const smallBtn: React.CSSProperties = {
  padding: '0.45rem 0.9rem',
  border: 'none',
  borderRadius: 8,
  background: '#efe6d2',
  color: '#54452a',
  fontWeight: 700,
  cursor: 'pointer',
};

export default function AnalysisPanel({ fen, fens, sans, live, onSelect }: Props) {
  const engineRef = useRef<Engine | null>(null);
  const token = useRef(0);
  const cancelRef = useRef(false);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [errorText, setErrorText] = useState('');
  const [info, setInfo] = useState<EngineInfo | null>(null);
  const [batching, setBatching] = useState(false);
  const [evals, setEvals] = useState<number[]>([]);

  useEffect(() => {
    let cancelled = false;
    Engine.create()
      .then((engine) => {
        if (cancelled) {
          engine.destroy();
          return;
        }
        engineRef.current = engine;
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setErrorText(err instanceof Error ? err.message : 'Die Engine konnte nicht geladen werden.');
      });
    return () => {
      cancelled = true;
      cancelRef.current = true;
      if (engineRef.current) engineRef.current.destroy();
      engineRef.current = null;
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (status !== 'ready' || !engine || batching || !fen) return;
    let over: number | null = null;
    try {
      over = staticEval(fen);
    } catch {
      return;
    }
    if (over !== null) {
      setInfo(null);
      return;
    }
    const mine = ++token.current;
    void engine.analyse(fen, 1500, (i) => {
      if (token.current === mine) setInfo(i);
    });
  }, [fen, status, batching]);

  async function analyseAll() {
    const engine = engineRef.current;
    if (!engine || batching) return;
    cancelRef.current = false;
    setBatching(true);
    setEvals([]);
    const out: number[] = [];
    for (const f of fens) {
      if (cancelRef.current) break;
      const fixed = staticEval(f);
      if (fixed !== null) out.push(fixed);
      else out.push(scoreOf(await engine.analyse(f, 250)));
      setEvals([...out]);
    }
    setBatching(false);
  }

  const score = scoreOf(info);
  const whitePct = 50 + Math.max(-600, Math.min(600, score)) / 12;
  const bestLine = info ? pvToSan(fen, info.pv.slice(0, 6)) : [];

  const complete = evals.length === fens.length && evals.length > 1;
  const mistakes: Mistake[] = [];
  if (complete) {
    for (let i = 1; i < evals.length; i++) {
      const mover = fens[i - 1].split(' ')[1] === 'b' ? 'b' : 'w';
      const loss = mover === 'w' ? evals[i - 1] - evals[i] : evals[i] - evals[i - 1];
      if (loss >= 70) {
        mistakes.push({ ply: i, san: sans[i - 1], loss, label: loss >= 300 ? 'Patzer' : loss >= 150 ? 'Fehler' : 'Ungenauigkeit' });
      }
    }
  }

  const W = 600;
  const H = 90;
  const points = evals
    .map((e, i) => {
      const x = (i / Math.max(1, evals.length - 1)) * W;
      const y = H / 2 - (Math.max(-800, Math.min(800, e)) / 800) * (H / 2 - 4);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className='card' style={{ marginTop: '1.2rem' }}>
      <h2>{live ? 'Live-Analyse' : 'Analyse der Partie'}</h2>
      {status === 'loading' && <p className='muted'>Engine wird geladen … (beim ersten Mal kann das einige Sekunden dauern)</p>}
      {status === 'error' && <p className='error'>{errorText}</p>}

      {status === 'ready' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <div style={{ flex: 1, height: 16, background: '#333333', borderRadius: 8, overflow: 'hidden' }}>
              <div style={{ width: `${whitePct}%`, height: '100%', background: '#f4f0e6' }} />
            </div>
            <b style={{ minWidth: 60, textAlign: 'right' }}>{evalText(info)}</b>
          </div>
          <p className='muted' style={{ marginBottom: 0 }}>
            {info
              ? `Tiefe ${info.depth} · Beste Fortsetzung: ${bestLine.join(' ') || '–'}`
              : 'In dieser Stellung gibt es nichts mehr zu berechnen.'}
          </p>
          <p className='muted' style={{ marginTop: 0 }}>Die Bewertung gilt aus Sicht von Weiß: plus heißt, Weiß steht besser.</p>

          <div style={{ marginTop: '0.8rem' }}>
            <button style={smallBtn} disabled={batching || fens.length < 2} onClick={() => void analyseAll()}>
              {batching ? `Analysiere … ${evals.length}/${fens.length}` : 'Ganze Partie analysieren'}
            </button>
            {batching && (
              <button style={{ ...smallBtn, marginLeft: 8 }} onClick={() => { cancelRef.current = true; }}>
                Abbrechen
              </button>
            )}
          </div>

          {evals.length > 1 && (
            <svg viewBox={`0 0 ${W} ${H}`} width='100%' style={{ marginTop: '0.8rem', background: '#fbf7ee', borderRadius: 8 }}>
              <line x1='0' y1={H / 2} x2={W} y2={H / 2} stroke='#cdbf9f' strokeWidth='1' />
              <polyline points={points} fill='none' stroke='#2f7d5c' strokeWidth='2' />
            </svg>
          )}

          {complete && (
            <div style={{ marginTop: '0.8rem' }}>
              <h3 style={{ marginBottom: '0.3rem' }}>Auffällige Züge</h3>
              {mistakes.length === 0 && <p className='muted'>Keine groben Ungenauigkeiten gefunden. Stark gespielt!</p>}
              <ul style={{ margin: 0, paddingLeft: '1.2rem' }}>
                {mistakes.map((m) => (
                  <li key={m.ply}>
                    <button
                      style={{ background: 'none', border: 'none', color: '#245f46', fontWeight: 700, cursor: 'pointer', padding: 0 }}
                      onClick={() => onSelect(m.ply)}
                    >
                      Halbzug {m.ply}: {m.san}
                    </button>{' '}
                    – {m.label} (ca. {(m.loss / 100).toFixed(1)} Bauern)
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className='muted' style={{ fontSize: '0.8rem', marginBottom: 0 }}>
        Engine: Stockfish.js (GPL-3.0), sie rechnet in diesem Browser und sendet nichts an den Server. Lizenz und Quellcode: <a href='/engine/README.txt'>engine/README.txt</a>
      </p>
    </div>
  );
}
