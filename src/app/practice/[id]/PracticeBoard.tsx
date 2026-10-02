'use client';

import dynamic from 'next/dynamic';
import { Chess } from 'chess.js';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const Chessboard = dynamic(() => import('react-chessboard').then((m) => m.Chessboard), { ssr: false });

type Props = {
  puzzleId: string;
  fen: string;
  setupMove: string | null;
  title: string;
  hint: string;
  source?: 'SELF';
};

type SquareStyles = Record<string, React.CSSProperties>;

const YELLOW_DOT: React.CSSProperties = {
  background: 'radial-gradient(circle, rgba(255, 200, 60, 0.85) 22%, transparent 26%)',
  borderRadius: '50%',
};
const GREEN_DOT: React.CSSProperties = {
  background: 'radial-gradient(circle, rgba(60, 180, 110, 0.85) 22%, transparent 26%)',
  borderRadius: '50%',
};

function applyUci(position: string, uci: string): string | null {
  try {
    const chess = new Chess(position);
    chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.length > 4 ? uci[4] : undefined });
    return chess.fen();
  } catch {
    return null;
  }
}

export default function PracticeBoard({ puzzleId, fen, setupMove, title, hint, source }: Props) {
  const router = useRouter();
  const [position, setPosition] = useState(fen);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState(0);
  const [boardPx, setBoardPx] = useState(520);
  const [wrong, setWrong] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [stepHints, setStepHints] = useState(0);
  const [hintText, setHintText] = useState<string | null>(null);
  const [squareStyles, setSquareStyles] = useState<SquareStyles>({});
  const [feedback, setFeedback] = useState<{ ok?: boolean; text: string } | null>(null);
  const [done, setDone] = useState(false);
  const [startTs] = useState(() => Date.now());

  useEffect(() => {
    const resize = () => setBoardPx(Math.min(window.innerWidth - 32, 520));
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = fen;
      if (setupMove) {
        const next = applyUci(fen, setupMove);
        if (next) start = next;
      }
      setPosition(start);
      setOrientation(new Chess(start).turn() === 'w' ? 'white' : 'black');
      setReady(true);
    }, setupMove ? 700 : 0);
    return () => clearTimeout(timer);
  }, [fen, setupMove]);

  async function record(result: 'SOLVED_INDEPENDENT' | 'SOLVED_WITH_HINT' | 'SOLUTION_VIEWED', hints: number) {
    await fetch('/api/attempts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        puzzleId,
        result,
        source,
        hintsUsed: hints,
        wrongAttempts: wrong,
        durationSeconds: Math.round((Date.now() - startTs) / 1000),
      }),
    });
  }

  async function validateMove(sourceSq: string, targetSq: string): Promise<void> {
    if (!ready || busy || done) return;
    const chess = new Chess(position);
    const piece = chess.get(sourceSq as never) as { type: string } | null;
    const promotion = piece?.type === 'p' && (targetSq.endsWith('8') || targetSq.endsWith('1')) ? 'q' : undefined;
    const uci = sourceSq + targetSq + (promotion ?? '');
    setBusy(true);
    try {
      const res = await fetch(`/api/puzzles/${puzzleId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uci, step }),
      });
      const body = (await res.json()) as { correct: boolean; done: boolean; reply: string | null };
      if (!body.correct) {
        setPosition(position);
        setWrong((w) => w + 1);
        setFeedback({ ok: false, text: 'Noch nicht ganz – versuch es noch einmal!' });
        setBusy(false);
        return;
      }
      let next: string;
      try {
        chess.move({ from: sourceSq, to: targetSq, promotion });
        next = chess.fen();
      } catch {
        setBusy(false);
        return;
      }
      setPosition(next);
      setSquareStyles({});
      if (body.done) {
        setDone(true);
        setFeedback({ ok: true, text: 'Richtig! Gut gemacht.' });
        await record(hintsUsed === 0 && wrong === 0 ? 'SOLVED_INDEPENDENT' : 'SOLVED_WITH_HINT', hintsUsed);
        setBusy(false);
        return;
      }
      setFeedback({ ok: true, text: 'Richtig! Jetzt antwortet der Gegner …' });
      const reply = body.reply;
      setTimeout(() => {
        if (reply) {
          const after = applyUci(next, reply);
          if (after) setPosition(after);
        }
        setStep((s) => s + 1);
        setStepHints(0);
        setHintText(null);
        setFeedback({ ok: true, text: 'Du bist wieder dran – weiter so!' });
        setBusy(false);
      }, 600);
    } catch {
      setBusy(false);
    }
  }

  async function requestHint() {
    if (busy || done) return;
    const level = stepHints + 1;
    const res = await fetch(`/api/puzzles/${puzzleId}/hint?level=${level}&step=${step}`);
    const body = (await res.json()) as { text?: string; source?: string; target?: string; solution?: string; explanation?: string };
    setStepHints(level);
    setHintsUsed((h) => h + 1);
    if (level === 1) {
      setHintText(body.text ?? hint);
      if (body.source) setSquareStyles({ [body.source]: YELLOW_DOT });
    } else if (level === 2) {
      setHintText(`Ziehe die Figur von ${body.source?.toUpperCase()} nach ${body.target?.toUpperCase()}.`);
      const styles: SquareStyles = {};
      if (body.source) styles[body.source] = YELLOW_DOT;
      if (body.target) styles[body.target] = GREEN_DOT;
      setSquareStyles(styles);
    } else {
      setHintText(body.explanation ? `Lösung: ${body.solution} — ${body.explanation}` : `Lösung: ${body.solution}`);
      setDone(true);
      setFeedback({ ok: true, text: 'Lösung angezeigt. Schau sie dir in Ruhe an!' });
      await record('SOLUTION_VIEWED', 3);
    }
  }

  const sideName = orientation === 'white' ? 'Weiß' : 'Schwarz';

  return (
    <div className="grid grid-2">
      <div className="board-wrap">
        <Chessboard
          position={position}
          boardOrientation={orientation}
          onPieceDrop={(from, to) => { void validateMove(from, to); return true; }}
          boardWidth={boardPx}
          isDraggablePiece={({ piece }) => ready && !busy && !done && piece.startsWith(orientation === 'white' ? 'w' : 'b')}
          customSquareStyles={squareStyles}
        />
        <p className={`feedback ${feedback?.ok ? 'ok' : feedback ? 'err' : ''}`}>
          {feedback?.text ?? (ready ? `${sideName} ist am Zug – finde den besten Zug!` : 'Der Gegner zieht …')}
        </p>
      </div>
      <div className="card side-panel">
        <h2>{title}</h2>
        <p className="muted">Tipps helfen dir weiter – sie kosten keine Punkte.</p>
        {hintText && <div className="hint-box">{hintText}</div>}
        {!done && (
          <button className="hint-btn" onClick={() => void requestHint()}>
            {stepHints === 0 ? 'Tipp: Was ist gemeint?' : stepHints === 1 ? 'Tipp: Wohin damit?' : 'Lösung zeigen'}
          </button>
        )}
        {done && (
          <div className="good-box">
            <p style={{ marginTop: 0 }}>Aufgabe erledigt.</p>
            <button className="btn" onClick={() => router.push('/learn')}>Zur Übersicht</button>
          </div>
        )}
        <div className="stat-row">
          <div className="stat">Fehlversuche<b>{wrong}</b></div>
          <div className="stat">Tipps benutzt<b>{hintsUsed}</b></div>
        </div>
      </div>
    </div>
  );
}
