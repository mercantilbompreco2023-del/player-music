import type { RepeatMode } from "./types";

/** Índice da próxima faixa, ou null quando a fila termina. */
export function nextIndex(length: number, index: number, repeat: RepeatMode): number | null {
  if (length === 0) return null;
  if (index + 1 < length) return index + 1;
  return repeat === "all" ? 0 : null;
}

/** Índice da faixa anterior. */
export function prevIndex(length: number, index: number, repeat: RepeatMode): number {
  if (length === 0) return 0;
  if (index > 0) return index - 1;
  return repeat === "all" ? length - 1 : 0;
}

/** Embaralha mantendo a faixa atual em primeiro lugar. */
export function shuffleQueue(ids: string[], currentId: string | null, rand: () => number = Math.random): string[] {
  const rest = ids.filter((id) => id !== currentId);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = rest[i]!;
    rest[i] = rest[j]!;
    rest[j] = tmp;
  }
  return currentId && ids.includes(currentId) ? [currentId, ...rest] : rest;
}

/** "Artista - Título.mp3" → { artist, title } */
export function parseFileName(name: string): { title: string; artist: string } {
  const base = name.replace(/\.[^.]+$/, "").replace(/_/g, " ").trim();
  const parts = base.split(" - ");
  if (parts.length >= 2) return { artist: parts[0]!.trim(), title: parts.slice(1).join(" - ").trim() };
  return { title: base || "Sem título", artist: "Artista desconhecido" };
}

export function matchesSearch(t: { title: string; artist: string }, q: string): boolean {
  const n = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const query = n(q.trim());
  if (!query) return false;
  return n(t.title).includes(query) || n(t.artist).includes(query);
}

export function formatTime(sec: number | undefined): string {
  if (!sec || !isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Move um item da fila e devolve a nova fila e o novo índice da faixa atual. */
export function moveItem(queue: string[], current: number, from: number, dir: -1 | 1): { queue: string[]; index: number } {
  const to = from + dir;
  if (to < 0 || to >= queue.length) return { queue, index: current };
  const q = [...queue];
  [q[from], q[to]] = [q[to]!, q[from]!];
  const index = current === from ? to : current === to ? from : current;
  return { queue: q, index };
}
