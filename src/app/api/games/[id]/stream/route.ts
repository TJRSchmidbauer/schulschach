import { getSession } from '@/lib/auth';
import { getGame, settle, toView } from '@/lib/live/game';
import { subscribe } from '@/lib/live/bus';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return new Response('unauthorized', { status: 401 });
  const { id } = await params;

  const first = await getGame(id);
  if (!first) return new Response('not found', { status: 404 });
  if (session.role === 'STUDENT' && first.whiteId !== session.userId && first.blackId !== session.userId) {
    return new Response('forbidden', { status: 403 });
  }

  const encoder = new TextEncoder();
  let cleanup: () => void = () => {};

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      let closed = false;
      const write = (text: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          closed = true;
        }
      };

      const sendState = async () => {
        if (closed) return;
        const g = await getGame(id);
        if (!g) return;
        write(`data: ${JSON.stringify(toView(g))}\n\n`);
      };

      const unsubscribe = subscribe(id, () => {
        void sendState();
      });

      let ticks = 0;
      const timer = setInterval(() => {
        void (async () => {
          const g = await getGame(id);
          if (g) await settle(g);
          ticks++;
          if (ticks % 15 === 0) write(': ping\n\n');
        })();
      }, 1000);

      cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(timer);
        unsubscribe();
        try {
          controller.close();
        } catch {
          // bereits geschlossen
        }
      };

      req.signal.addEventListener('abort', cleanup);
      write('retry: 3000\n\n');
      void sendState();
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
