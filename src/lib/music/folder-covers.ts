import { readCustomFolders } from "./folders";

const COVER_DB = "player-music-folder-covers";
const COVER_STORE = "covers";

function openCoverDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(COVER_DB, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(COVER_STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function writeCover(key: string, blob: Blob | null): Promise<boolean> {
  try {
    const db = await openCoverDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(COVER_STORE, "readwrite");
      const store = tx.objectStore(COVER_STORE);
      if (blob) store.put(blob, key);
      else store.delete(key);
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = tx.onabort = () => { db.close(); resolve(false); };
    });
  } catch { return false; }
}

export async function saveCustomFolderCover(folderName: string, file: File): Promise<boolean> {
  if (!file.type.startsWith("image/")) return false;
  try {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 640 / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const context = canvas.getContext("2d");
    if (!context) { bitmap.close(); return false; }
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.82));
    return blob ? writeCover(folderName, blob) : false;
  } catch { return false; }
}

export async function removeCustomFolderCover(folderName: string): Promise<boolean> {
  return writeCover(folderName, null);
}

export async function loadCustomFolderCover(folderName: string): Promise<string | null> {
  try {
    const db = await openCoverDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(COVER_STORE, "readonly");
      const request = tx.objectStore(COVER_STORE).get(folderName);
      request.onsuccess = () => resolve(request.result as Blob | undefined);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
    return blob ? URL.createObjectURL(blob) : null;
  } catch { return null; }
}

const ARTIST_COVER_PREFIX = "artist:";

export async function saveArtistFolderCover(artistName: string, file: File): Promise<boolean> {
  return saveCustomFolderCover(ARTIST_COVER_PREFIX + artistName.trim().toLocaleLowerCase("pt-BR"), file);
}

export async function loadArtistFolderCover(artistName: string): Promise<string | null> {
  return loadCustomFolderCover(ARTIST_COVER_PREFIX + artistName.trim().toLocaleLowerCase("pt-BR"));
}

export async function removeArtistFolderCover(artistName: string): Promise<boolean> {
  return removeCustomFolderCover(ARTIST_COVER_PREFIX + artistName.trim().toLocaleLowerCase("pt-BR"));
}

export async function loadFolderCoverForTrack(track: { id: string; folderName?: string; path?: string }): Promise<string | null> {
  const folderName = track.folderName || track.path?.replace(/\\/g, "/").split("/")[0];
  if (folderName) {
    const cover = await loadCustomFolderCover(folderName);
    if (cover) return cover;
  }
  return loadCustomFolderCoverForTrack(track.id);
}

export async function loadCustomFolderCoverForTrack(trackId: string): Promise<string | null> {
  const folders = readCustomFolders();
  const match = Object.entries(folders).find(([, ids]) => ids.includes(trackId));
  return match ? loadCustomFolderCover(match[0]) : null;
}

export function findCustomFolderForTrack(trackId: string): string | null {
  const match = Object.entries(readCustomFolders()).find(([, ids]) => ids.includes(trackId));
  return match?.[0] ?? null;
}
