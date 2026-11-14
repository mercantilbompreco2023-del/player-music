export type TrackVisual = { blob: Blob; kind: "image" | "video" };

export function visualKind(type: string): TrackVisual["kind"] | null {
  if (type.startsWith("image/")) return "image";
  if (type.startsWith("video/")) return "video";
  return null;
}

async function transaction<T>(key: string, value?: TrackVisual | null): Promise<T> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("player-music-track-visuals", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("visuals");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  return new Promise((resolve, reject) => {
    const tx = db.transaction("visuals", value === undefined ? "readonly" : "readwrite");
    const store = tx.objectStore("visuals");
    const request = value === undefined ? store.get(key) : value === null ? store.delete(key) : store.put(value, key);
    tx.oncomplete = () => { db.close(); resolve(request.result as T); };
    tx.onabort = tx.onerror = () => { db.close(); reject(tx.error ?? request.error); };
  });
}

export const trackVisualStore = {
  get: (key: string) => transaction<TrackVisual | undefined>(key),
  put: (key: string, value: TrackVisual) => transaction(key, value),
  remove: (key: string) => transaction(key, null),
};