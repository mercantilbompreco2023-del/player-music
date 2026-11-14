const KEY = "pm:playback:v1";

export interface PlaybackMemory {
  queue: string[];
  trackId: string;
  position: number;
  wasPlaying: boolean;
}

export function loadPlaybackMemory(): PlaybackMemory | null {
  try {
    const value = JSON.parse(localStorage.getItem(KEY) ?? "null");
    if (!value || !Array.isArray(value.queue) || !value.queue.every((id: unknown) => typeof id === "string") ||
      typeof value.trackId !== "string" || !value.queue.includes(value.trackId) ||
      typeof value.position !== "number" || !Number.isFinite(value.position) || value.position < 0 ||
      typeof value.wasPlaying !== "boolean") return null;
    return value;
  } catch { return null; }
}

export function savePlaybackMemory(value: PlaybackMemory): void {
  try { localStorage.setItem(KEY, JSON.stringify(value)); } catch { /* armazenamento opcional */ }
}

export function clearPlaybackMemory(): void {
  try { localStorage.removeItem(KEY); } catch { /* armazenamento opcional */ }
}

export function availablePlayback(value: PlaybackMemory, availableIds: string[]): PlaybackMemory | null {
  const available = new Set(availableIds);
  if (!available.has(value.trackId)) return null;
  return { ...value, queue: value.queue.filter((id) => available.has(id)) };
}