'use client';

import dynamic from 'next/dynamic';
import { Chess } from 'chess.js';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const Chessboard = dynamic(() => import('react-chessboard').then((m) => m.Chessboard), { ssr: false });

type Props = {
  puzzleId: string;
  fen: string;
  title: string;
  hint: string;
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

export default function PracticeBoard({ puzzleId, fen, title, hint }: Props) {
  const router = useRouter();
  const [position, setPosition] = useState(fen);
  const [boardPx, setBoardPx] = useState(520);
  const [wrong, setWrong] = useState(0);
  const [hintsUsed, setHintsUsed] = useState(0);
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

  async function validateMove(source: string, target: string): Promise<void> {
    const gameCopy = new Chess(position);
    const piece = gameCopy.get(source as never) as { type: string } | null;
    const promotion = piece?.type === 'p' && (target.endsWith('8') || target.endsWith('1')) ? 'q' : undefined;
    const uci = source + target + (promotion ?? '');
    const res = await fetch(`/api/puzzles/${puzzleId}/move`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uci }),
    });
    const body = (await res.json()) as { correct: boolean };
    if (body.correct) {
      gameCopy.move({ from: source, to: target, promotion: promotion as 'q' | undefined });
      setPosition(gameCopy.fen());
      setDone(true);
      setFeedback({ ok: true, text: 'Richtig! Gut gemacht.' });
      setSquareStyles({});
      const result = hintsUsed === 0 && wrong === 0 ? 'SOLVED_INDEPENDENT' : hintsUsed === 3 ? 'SOLUTION_VIEWED' : 'SOLVED_WITH_HINT';
      await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId,
          result,
          hintsUsed,
          wrongAttempts: wrong,
          durationSeconds: Math.round((Date.now() - startTs) / 1000),
        }),
      });
      return;
    }
    setPosition(position);
    setWrong((w) => w + 1);
    setFeedback({ ok: false, text: 'Noch nicht ganz – versuch es noch einmal!' });
  }

  async function requestHint() {
    const next = hintsUsed + 1;
    const res = await fetch(`/api/puzzles/${puzzleId}/hint?level=${next}`);
    const body = (await res.json()) as { text?: string; source?: string; target?: string; solution?: string; explanation?: string };
    setHintsUsed(next);
    if (next === 1) {
      setHintText(body.text ?? hint);
      if (body.source) setSquareStyles({ [body.source]: YELLOW_DOT });
    } else if (next === 2) {
      setHintText(`Ziehe die Figur auf ${body.source?.toUpperCase()} nach ${body.target?.toUpperCase()}.`);
      const styles: SquareStyles = {};
      if (body.source) styles[body.source] = YELLOW_DOT;
      if (body.target) styles[body.target] = GREEN_DOT;
      setSquareStyles(styles);
    } else {
      setHintText(body.explanation ? `Lösung: ${body.solution} — ${body.explanation}` : `Lösung: ${body.solution}`);
      setDone(true);
      setFeedback({ ok: true, text: 'Lösung angezeigt. Schau sie dir in Ruhe an!' });
      await fetch('/api/attempts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          puzzleId,
          result: 'SOLUTION_VIEWED',
          hintsUsed: 3,
          wrongAttempts: wrong,
          durationSeconds: Math.round((Date.now() - startTs) / 1000),
        }),
      });
    }
  }

  return (
    <div className="grid grid-2">
      <div className="board-wrap">
        <Chessboard
          position={position}
          onPieceDrop={(source, target) => { void validateMove(source, target); return true; }}
          boardWidth={boardPx}
          arePiecesDraggable={!done}
          customSquareStyles={squareStyles}
        />
        <p className={`feedback ${feedback?.ok ? 'ok' : feedback ? 'err' : ''}`}>
          {feedback?.text ?? 'Weiß zieht – finde den besten Zug!'}
        </p>
      </div>
      <div className="card side-panel">
        <h2>{title}</h2>
        <p className="muted">Tipps helfen dir weiter – sie kosten keine Punkte.</p>
        {hintText && <div className="hint-box">{hintText}</div>}
        {!done && (
          <button className="hint-btn" onClick={requestHint}>
            {hintsUsed === 0 ? 'Tipp: Was ist gemeint?' : hintsUsed === 1 ? 'Tipp: Wohin damit?' : 'Lösung zeigen'}
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
