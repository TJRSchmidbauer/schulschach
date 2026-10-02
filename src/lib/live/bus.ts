type Listener = () => void;

const g = globalThis as unknown as { __gameBus?: Map<string, Set<Listener>> };
const listeners: Map<string, Set<Listener>> = (g.__gameBus ??= new Map());

// Einfacher Nachrichtenverteiler im Speicher. Das genügt, solange genau eine App-Instanz läuft.
export function subscribe(gameId: string, fn: Listener): () => void {
  let set = listeners.get(gameId);
  if (!set) {
    set = new Set();
    listeners.set(gameId, set);
  }
  set.add(fn);
  return () => {
    const current = listeners.get(gameId);
    if (!current) return;
    current.delete(fn);
    if (current.size === 0) listeners.delete(gameId);
  };
}

export function publish(gameId: string): void {
  const set = listeners.get(gameId);
  if (!set) return;
  for (const fn of Array.from(set)) fn();
}
