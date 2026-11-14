import type { Playlist, RepeatMode } from "./types";

const PREFS_KEY = "pm:prefs:v1";

export interface Prefs {
  theme: "dark" | "light";
  volume: number;
  shuffle: boolean;
  repeat: RepeatMode;
  favorites: string[];
  playlists: Playlist[];
  recent: string[];
}

export const defaultPrefs: Prefs = {
  theme: "dark", volume: 0.8, shuffle: false, repeat: "off", favorites: [], playlists: [], recent: [],
};

export function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    return raw ? { ...defaultPrefs, ...JSON.parse(raw) } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
}

export function savePrefs(p: Prefs): boolean {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(p));
    return true;
  } catch {
    return false;
  }
}

// ---- Arquivos importados (IndexedDB) ----
export interface StoredFile {
  id: string;
  title: string;
  artist: string;
  duration?: number | undefined;
  blob: Blob;
  addedAt: number;
}

const DB = "player-music";
const STORE = "files";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB indisponível"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export const fileStore = {
  all: () => tx<StoredFile[]>("readonly", (s) => s.getAll() as IDBRequest<StoredFile[]>),
  put: (f: StoredFile) => tx("readwrite", (s) => s.put(f)),
  remove: (id: string) => tx("readwrite", (s) => s.delete(id)),
};
