import type { Track } from "./types";

/** O mínimo que uma faixa precisa expor para entrar na lista de pastas. */
export interface FolderSource {
  source: string;
  path?: string | undefined;
  folderName?: string | undefined;
}

export interface MusicFolder<T extends FolderSource = Track> {
  name: string;
  tracks: T[];
}

const AI_ARTIST_FOLDERS_KEY = "player-music-ai-artist-folders";

export function saveAiArtistFolders(assignments: Array<{ id: string; artist: string }>): boolean {
  try {
    const current = JSON.parse(localStorage.getItem(AI_ARTIST_FOLDERS_KEY) || "{}") as Record<string, string>;
    for (const item of assignments) current[item.id] = item.artist;
    localStorage.setItem(AI_ARTIST_FOLDERS_KEY, JSON.stringify(current));
    return true;
  } catch { return false; }
}

function loadAiArtistFolders(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(AI_ARTIST_FOLDERS_KEY) || "{}") as Record<string, string>; }
  catch { return {}; }
}

/** Agrupa artistas da biblioteca sem alterar as pastas físicas dos arquivos. */
export function artistFolders<T extends FolderSource & { artist: string }>(tracks: T[]): MusicFolder<T>[] {
  const groups = new Map<string, MusicFolder<T>>();
  const aiFolders = loadAiArtistFolders();
  for (const track of tracks) {
    const name = (aiFolders[track.id] || track.artist).trim();
    if (track.source === "demo" || !name) continue;
    const key = name.toLocaleLowerCase("pt-BR");
    const group = groups.get(key) ?? { name, tracks: [] };
    group.tracks.push(track);
    groups.set(key, group);
  }
  return Array.from(groups.values()).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}

/** Pastas são derivadas dos arquivos salvos, sem conceder novo acesso ao dispositivo. */
export function savedFolders<T extends FolderSource>(tracks: T[]): MusicFolder<T>[] {
  const groups = new Map<string, T[]>();
  for (const track of tracks) {
    if (track.source === "demo") continue;
    const path = track.path?.replace(/\\/g, "/");
    const name = track.folderName || (path?.includes("/") ? path.split("/")[0] : undefined);
    if (!name) continue;
    const list = groups.get(name) ?? [];
    list.push(track);
    groups.set(name, list);
  }
  return Array.from(groups, ([name, items]) => ({ name, tracks: items }))
    .sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
}
