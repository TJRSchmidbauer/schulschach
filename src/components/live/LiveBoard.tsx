'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { controlLabel, resultText, type Color, type GameView } from '@/lib/live/types';
import AnalysisPanel from './AnalysisPanel';

const Chessboard = dynamic(() => import('react-chessboard').then((m) => m.Chessboard), { ssr: false });

type Props = { gameId: string; role: 'player' | 'trainer'; myId?: string; backHref: string };

function useGame(gameId: string) {
  const [game, setGame] = useState<GameView | null>(null);
  const [offset, setOffset] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const es = new EventSource(`/api/games/${gameId}/stream`);
    es.onmessage = (e) => {
      const view = JSON.parse(e.data) as GameView;
      setGame(view);
      setOffset(view.serverNow - Date.now());
      setConnected(true);
    };
    es.onerror = () => setConnected(false);
    return () => es.close();
  }, [gameId]);

  return { game, offset, connected };
}

function useClock(game: GameView | null, offset: number) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 200);
    return () => clearInterval(t);
  }, []);
  if (!game) return { w: 0, b: 0 };
  let w = game.whiteMs;
  let b = game.blackMs;
  if (game.clockRunning && game.turnStartedAt !== null) {
    const elapsed = Math.max(0, Date.now() + offset - game.turnStartedAt);
    if (game.turn === 'w') w = Math.max(0, w - elapsed);
    else b = Math.max(0, b - elapsed);
  }
  return { w, b };
}

function fmt(ms: number): string {
  if (ms < 20000) return (ms / 1000).toFixed(1);
  const s = Math.ceil(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

const smallBtn: React.CSSProperties = {
  padding: '0.35rem 0.7rem',
  border: 'none',
  borderRadius: 8,
  background: '#efe6d2',
  color: '#54452a',
  fontWeight: 700,
  cursor: 'pointer',
};

function ClockBox({ label, ms, active }: { label: string; ms: number; active: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0.5rem 0.9rem',
        borderRadius: 10,
        background: active ? '#2f7d5c' : '#e7dfd0',
        color: active ? '#ffffff' : '#26221c',
        fontWeight: 700,
      }}
    >
      <span>{label}</span>
      <span style={{ fontVariantNumeric: 'tabular-nums', fontSize: '1.2rem' }}>{fmt(ms)}</span>
    </div>
  );
}

export default function LiveBoard({ gameId, role, myId, backHref }: Props) {
  const router = useRouter();
  const { game, offset, connected } = useGame(gameId);
  const clock = useClock(game, offset);
  const [viewIdx, setViewIdx] = useState<number | null>(null);
  const [flipped, setFlipped] = useState(false);
  const [pending, setPending] = useState<{ fen: string; len: number } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [boardPx, setBoardPx] = useState(520);

  useEffect(() => {
    const resize = () => setBoardPx(Math.min(window.innerWidth - 32, 560));
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const startFen = game?.startFen ?? '';
  const movesKey = game ? game.moves.join(' ') : '';
  const movesLen = game ? game.moves.length : 0;

  const timeline = useMemo(() => {
    const fens: string[] = [];
    const sans: string[] = [];
    const squares: ({ from: string; to: string } | null)[] = [];
    if (!startFen) return { fens, sans, squares };
    const chess = new Chess(startFen);
    fens.push(chess.fen());
    squares.push(null);
    for (const m of movesKey ? movesKey.split(' ') : []) {
      try {
        const mv = chess.move({ from: m.slice(0, 2), to: m.slice(2, 4), promotion: m.length > 4 ? m[4] : undefined });
        sans.push(mv.san);
        fens.push(chess.fen());
        squares.push({ from: mv.from, to: mv.to });
      } catch {
        break;
      }
    }
    return { fens, sans, squares };
  }, [startFen, movesKey]);

  async function post(url: string, body: Record<string, unknown>, onFail?: () => void): Promise<boolean> {
    setMessage(null);
    try {
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMessage(data.error ?? 'Das hat nicht geklappt.');
        if (onFail) onFail();
        return false;
      }
      return true;
    } catch {
      setMessage('Keine Verbindung zum Server.');
      if (onFail) onFail();
      return false;
    }
  }

  if (!game) {
    return (
      <div className='card'>
        <p className='muted'>{connected ? 'Lade Partie …' : 'Verbindung wird aufgebaut …'}</p>
      </div>
    );
  }

  const latest = Math.max(0, timeline.fens.length - 1);
  const idx = viewIdx === null || viewIdx > latest ? latest : viewIdx;
  const atLive = idx === latest;
  const myColor: Color | null =
    role === 'player' ? (game.white?.id === myId ? 'w' : game.black?.id === myId ? 'b' : null) : null;
  const active = game.status === 'ACTIVE';
  const canMove = active && myColor !== null && game.turn === myColor && atLive;
  const orientation: 'white' | 'black' = (myColor === 'b') !== flipped ? 'black' : 'white';
  const topColor: Color = orientation === 'white' ? 'b' : 'w';
  const bottomColor: Color = orientation === 'white' ? 'w' : 'b';
  const nameOf = (c: Color) => (c === 'w' ? game.white?.alias : game.black?.alias) ?? 'wartet …';
  const msOf = (c: Color) => (c === 'w' ? clock.w : clock.b);
  const shownFen =
    atLive && pending && pending.len === movesLen ? pending.fen : timeline.fens[idx] ?? game.fen;

  const last = timeline.squares[idx];
  const squareStyles: Record<string, React.CSSProperties> = {};
  if (last) {
    squareStyles[last.from] = { background: 'rgba(255, 213, 79, 0.55)' };
    squareStyles[last.to] = { background: 'rgba(255, 213, 79, 0.55)' };
  }

  let opponentAlias = 'dein Gegner';
  if (myColor) opponentAlias = (myColor === 'w' ? game.black?.alias : game.white?.alias) ?? 'dein Gegner';
  let statusText: string;
  if (game.status === 'WAITING') statusText = 'Warte auf einen Gegner …';
  else if (game.status === 'FINISHED') statusText = resultText(game);
  else if (myColor) statusText = game.turn === myColor ? 'Du bist am Zug.' : `${opponentAlias} ist am Zug.`;
  else statusText = `${game.turn === 'w' ? 'Weiß' : 'Schwarz'} ist am Zug.`;

  function handleDrop(from: string, to: string, piece: string): boolean {
    if (!canMove || !game) return false;
    const chess = new Chess(game.fen);
    const promotion = piece[1] === 'P' && (to[1] === '8' || to[1] === '1') ? 'q' : undefined;
    let mv;
    try {
      mv = chess.move({ from, to, promotion });
    } catch {
      return false;
    }
    const uci = mv.from + mv.to + (mv.promotion ?? '');
    setPending({ fen: chess.fen(), len: game.moves.length });
    void post(`/api/games/${gameId}`, { action: 'move', uci }, () => setPending(null));
    return true;
  }

  const act = (action: string) => post(`/api/games/${gameId}`, { action });
  const trainerAct = (body: Record<string, unknown>) => post(`/api/trainer/games/${gameId}`, body);

  const startTurn = startFen.split(' ')[1] === 'b' ? 'b' : 'w';
  const startNo = Number(startFen.split(' ')[5]) || 1;

  return (
    <div>
      <p>
        <Link href={backHref}>← Zurück</Link>
      </p>
      <div className='grid grid-2'>
        <div className='board-wrap'>
          <ClockBox label={nameOf(topColor)} ms={msOf(topColor)} active={active && game.turn === topColor} />
          <div style={{ margin: '0.5rem 0' }}>
            <Chessboard
              position={shownFen}
              boardOrientation={orientation}
              boardWidth={boardPx}
              onPieceDrop={handleDrop}
              isDraggablePiece={({ piece }) => canMove && piece.startsWith(myColor ?? 'x')}
              customSquareStyles={squareStyles}
            />
          </div>
          <ClockBox label={nameOf(bottomColor)} ms={msOf(bottomColor)} active={active && game.turn === bottomColor} />
          <p className='feedback'>{message ?? statusText}</p>
          {!connected && <p className='error'>Verbindung unterbrochen – es wird neu verbunden …</p>}
        </div>

        <div className='card side-panel'>
          <h2>
            {game.white?.alias ?? '?'} – {game.black?.alias ?? '?'}
          </h2>
          <p className='muted'>
            {controlLabel(game.initialSeconds, game.incrementSeconds)}
            {game.customStart ? ' · Startstellung vom Trainer' : ''}
          </p>
          <p style={{ fontWeight: 700 }}>{statusText}</p>
          {active && !game.clockRunning && (
            <p className='muted'>Die Uhr startet nach dem zweiten Halbzug.</p>
          )}

          {game.status === 'WAITING' && myColor && (
            <button
              className='hint-btn'
              onClick={() => {
                void act('cancel').then((ok) => {
                  if (ok) router.push(backHref);
                });
              }}
            >
              Herausforderung zurückziehen
            </button>
          )}

          {active && myColor && (
            <div>
              {game.drawOffer && game.drawOffer !== myColor ? (
                <div className='hint-box'>
                  Remis angeboten.
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <button style={smallBtn} onClick={() => void act('draw-accept')}>Annehmen</button>
                    <button style={smallBtn} onClick={() => void act('draw-decline')}>Ablehnen</button>
                  </div>
                </div>
              ) : game.drawOffer === myColor ? (
                <p className='muted'>Du hast Remis angeboten.</p>
              ) : (
                <button className='hint-btn' onClick={() => void act('draw-offer')}>Remis anbieten</button>
              )}
              <button
                className='hint-btn'
                onClick={() => {
                  if (window.confirm('Wirklich aufgeben?')) void act('resign');
                }}
              >
                Aufgeben
              </button>
            </div>
          )}

          {role === 'trainer' && game.status !== 'FINISHED' && (
            <div>
              <p className='muted' style={{ marginBottom: 0 }}>Trainer-Steuerung</p>
              <button
                className='hint-btn'
                onClick={() => {
                  if (window.confirm('Partie abbrechen (ohne Ergebnis)?')) void trainerAct({ action: 'abort' });
                }}
              >
                Partie abbrechen
              </button>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                <button style={smallBtn} onClick={() => window.confirm('Sieg für Weiß eintragen?') && void trainerAct({ action: 'result', result: '1-0' })}>Weiß gewinnt</button>
                <button style={smallBtn} onClick={() => window.confirm('Remis eintragen?') && void trainerAct({ action: 'result', result: '1/2-1/2' })}>Remis</button>
                <button style={smallBtn} onClick={() => window.confirm('Sieg für Schwarz eintragen?') && void trainerAct({ action: 'result', result: '0-1' })}>Schwarz gewinnt</button>
              </div>
            </div>
          )}

          {game.status === 'FINISHED' && role === 'player' && (
            <Link className='btn' href={backHref} style={{ marginTop: '0.8rem' }}>Zur Lobby</Link>
          )}

          <div style={{ display: 'flex', gap: '0.4rem', margin: '1rem 0 0.5rem', flexWrap: 'wrap' }}>
            <button style={smallBtn} onClick={() => setViewIdx(0)} title='Zum Anfang'>⏮</button>
            <button style={smallBtn} onClick={() => setViewIdx(Math.max(0, idx - 1))} title='Ein Zug zurück'>◀</button>
            <button style={smallBtn} onClick={() => setViewIdx(idx + 1 >= latest ? null : idx + 1)} title='Ein Zug vor'>▶</button>
            <button style={smallBtn} onClick={() => setViewIdx(null)} title='Zur aktuellen Stellung'>⏭</button>
            <button style={smallBtn} onClick={() => setFlipped((f) => !f)} title='Brett drehen'>⇅ Drehen</button>
          </div>

          <div style={{ lineHeight: 2, maxHeight: 220, overflowY: 'auto' }}>
            {timeline.sans.length === 0 && <span className='muted'>Noch kein Zug gespielt.</span>}
            {timeline.sans.map((san, i) => {
              const ply = i + 1;
              const isWhite = (startTurn === 'w') === (i % 2 === 0);
              const no = startNo + Math.floor((i + (startTurn === 'b' ? 1 : 0)) / 2);
              return (
                <span key={i}>
                  {(isWhite || i === 0) && (
                    <span className='muted'>{no}{isWhite ? '.' : '…'} </span>
                  )}
                  <button
                    style={{ ...smallBtn, background: idx === ply ? '#2f7d5c' : '#efe6d2', color: idx === ply ? '#ffffff' : '#54452a', marginRight: 4 }}
                    onClick={() => setViewIdx(ply >= latest ? null : ply)}
                  >
                    {san}
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {game.status !== 'WAITING' && (role === 'trainer' || game.status === 'FINISHED') && (
        <AnalysisPanel
          fen={shownFen}
          fens={timeline.fens}
          sans={timeline.sans}
          live={game.status !== 'FINISHED'}
          onSelect={(i) => setViewIdx(i >= latest ? null : i)}
        />
      )}
    </div>
  );
}
