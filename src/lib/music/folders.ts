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
