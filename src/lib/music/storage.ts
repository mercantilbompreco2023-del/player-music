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

// ---- Pastas conhecidas de cada música (sobrevive a recarregamentos e à lista da nuvem) ----
const HINTS_KEY = "pm:folder-hints:v1";

export interface FolderHint {
  folderName?: string | undefined;
  path?: string | undefined;
}

export function loadFolderHints(): Record<string, FolderHint> {
  try {
    const raw = localStorage.getItem(HINTS_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? (parsed as Record<string, FolderHint>) : {};
  } catch {
    return {};
  }
}

export function saveFolderHints(hints: Record<string, FolderHint>): boolean {
  try {
    localStorage.setItem(HINTS_KEY, JSON.stringify(hints));
    return true;
  } catch {
    return false;
  }
}

/** Solicita ao navegador que proteja os arquivos importados contra limpeza automática por falta de espaço. */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (typeof navigator === "undefined" || !navigator.storage?.persist) return false;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

// ---- Arquivos importados (IndexedDB) ----
export interface StoredFile {
  id: string;
  title: string;
  artist: string;
  album?: string | undefined;
  duration?: number | undefined;
  fingerprint?: string | undefined;
  path?: string | undefined;
  folderName?: string | undefined;
  blob: Blob;
  storagePath?: string | undefined;
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
    const transaction = db.transaction(STORE, mode);
    const req = fn(transaction.objectStore(STORE));
    transaction.oncomplete = () => { db.close(); resolve(req.result); };
    transaction.onabort = () => { db.close(); reject(transaction.error ?? req.error); };
    transaction.onerror = () => { db.close(); reject(transaction.error ?? req.error); };
  });
}

export const fileStore = {
  all: () => tx<StoredFile[]>("readonly", (s) => s.getAll() as IDBRequest<StoredFile[]>),
  get: (id: string) => tx<StoredFile | undefined>("readonly", (s) => s.get(id) as IDBRequest<StoredFile | undefined>),
  put: (f: StoredFile) => tx("readwrite", (s) => s.put(f)),
  remove: (id: string) => tx("readwrite", (s) => s.delete(id)),
};
