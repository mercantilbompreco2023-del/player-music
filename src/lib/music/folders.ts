import type { Track } from "./types";

export interface MusicFolder {
  name: string;
  tracks: Track[];
}

/** Pastas são derivadas dos arquivos salvos, sem conceder novo acesso ao dispositivo. */
export function savedFolders(tracks: Track[]): MusicFolder[] {
  const groups = new Map<string, Track[]>();
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