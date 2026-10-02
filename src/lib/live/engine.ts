import { Chess } from 'chess.js';

export type EngineInfo = { depth: number; cp: number | null; mate: number | null; pv: string[] };

export const MATE_SCORE = 10000;

// Weiß-Sicht: positiv = Weiß steht besser.
export function scoreOf(info: EngineInfo | null): number {
  if (!info) return 0;
  if (info.mate !== null) return info.mate > 0 ? MATE_SCORE - info.mate : -MATE_SCORE - info.mate;
  return info.cp ?? 0;
}

export function evalText(info: EngineInfo | null): string {
  if (!info) return '–';
  if (info.mate !== null) return `${info.mate > 0 ? '+' : '-'}M${Math.abs(info.mate)}`;
  const v = (info.cp ?? 0) / 100;
  return `${v > 0 ? '+' : ''}${v.toFixed(1)}`;
}

export function staticEval(fen: string): number | null {
  const chess = new Chess(fen);
  if (chess.isCheckmate()) return chess.turn() === 'w' ? -MATE_SCORE : MATE_SCORE;
  if (chess.isGameOver()) return 0;
  return null;
}

export function pvToSan(fen: string, pv: string[]): string[] {
  const chess = new Chess(fen);
  const out: string[] = [];
  for (const u of pv) {
    try {
      out.push(chess.move({ from: u.slice(0, 2), to: u.slice(2, 4), promotion: u.length > 4 ? u[4] : undefined }).san);
    } catch {
      break;
    }
  }
  return out;
}

function parseInfo(line: string, whiteToMove: boolean): EngineInfo | null {
  if (!line.startsWith('info ')) return null;
  const t = line.split(/\s+/);
  const si = t.indexOf('score');
  const pi = t.indexOf('pv');
  if (si < 0 || pi < 0) return null;
  if (t.includes('lowerbound') || t.includes('upperbound')) return null;
  const kind = t[si + 1];
  const value = Number(t[si + 2]);
  if (!Number.isFinite(value)) return null;
  const sign = whiteToMove ? 1 : -1;
  const di = t.indexOf('depth');
  return {
    depth: di >= 0 ? Number(t[di + 1]) : 0,
    cp: kind === 'cp' ? value * sign : null,
    mate: kind === 'mate' ? value * sign : null,
    pv: t.slice(pi + 1),
  };
}

// Schmale Umhüllung für Stockfish.js im Web Worker (UCI-Protokoll). Nur im Browser verwenden.
export class Engine {
  private worker: Worker;
  private handlers = new Set<(line: string) => void>();
  private chain: Promise<unknown> = Promise.resolve();
  private active = false;

  private constructor(worker: Worker) {
    this.worker = worker;
    worker.onmessage = (e: MessageEvent) => {
      const text = typeof e.data === 'string' ? e.data : String(e.data);
      for (const raw of text.split('\n')) {
        const line = raw.trim();
        if (!line) continue;
        for (const h of Array.from(this.handlers)) h(line);
      }
    };
  }

  static async create(): Promise<Engine> {
    const res = await fetch('/engine/manifest.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('Die Analyse-Engine ist auf diesem Server nicht installiert.');
    const manifest = (await res.json()) as { js?: string };
    if (!manifest.js) throw new Error('Die Analyse-Engine ist unvollständig installiert.');
    const engine = new Engine(new Worker(`/engine/${manifest.js}`));
    try {
      await engine.waitFor('uciok', 'uci', 30000);
      await engine.waitFor('readyok', 'isready', 15000);
    } catch (err) {
      engine.destroy();
      throw err;
    }
    return engine;
  }

  private send(cmd: string): void {
    this.worker.postMessage(cmd);
  }

  private waitFor(token: string, cmd: string, timeoutMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const handler = (line: string) => {
        if (line !== token) return;
        if (timer) clearTimeout(timer);
        this.handlers.delete(handler);
        resolve();
      };
      timer = setTimeout(() => {
        this.handlers.delete(handler);
        reject(new Error('Die Analyse-Engine antwortet nicht.'));
      }, timeoutMs);
      this.handlers.add(handler);
      this.send(cmd);
    });
  }

  analyse(fen: string, movetimeMs: number, onInfo?: (info: EngineInfo) => void): Promise<EngineInfo> {
    if (this.active) this.send('stop');
    const job = this.chain.then(() => this.run(fen, movetimeMs, onInfo));
    this.chain = job.catch(() => undefined);
    return job;
  }

  private run(fen: string, movetimeMs: number, onInfo?: (info: EngineInfo) => void): Promise<EngineInfo> {
    return new Promise((resolve) => {
      const whiteToMove = fen.split(' ')[1] !== 'b';
      let last: EngineInfo = { depth: 0, cp: 0, mate: null, pv: [] };
      this.active = true;
      const handler = (line: string) => {
        if (line.startsWith('bestmove')) {
          this.handlers.delete(handler);
          this.active = false;
          resolve(last);
          return;
        }
        const info = parseInfo(line, whiteToMove);
        if (info) {
          last = info;
          if (onInfo) onInfo(info);
        }
      };
      this.handlers.add(handler);
      this.send('position fen ' + fen);
      this.send('go movetime ' + movetimeMs);
    });
  }

  stop(): void {
    if (this.active) this.send('stop');
  }

  destroy(): void {
    this.handlers.clear();
    this.worker.terminate();
  }
}
