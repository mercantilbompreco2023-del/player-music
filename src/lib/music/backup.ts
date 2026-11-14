import type { Playlist, Track } from "./types";
import type { Prefs } from "./storage";

/** Faixa no arquivo de backup: só metadados, nunca URL de reprodução, token ou áudio. */
export interface BackupTrack {
  title: string;
  artist: string;
  duration?: number | undefined;
  fingerprint?: string | undefined;
  path?: string | undefined;
  folderName?: string | undefined;
  source: "local" | "cloud";
}

export interface BackupPlaylist {
  id: string;
  name: string;
  /** IDs de impressão digital (ou o id da faixa quando ela não tem digital). */
  trackIds: string[];
  createdAt: number;
}

export interface BackupPayload {
  version: 1;
  savedAt: number;
  tracks: BackupTrack[];
  playlists: BackupPlaylist[];
  /** Favoritos guardados por impressão digital (ou id). */
  favorites: string[];
}

const isDemo = (t: Track) => t.source === "demo";
const keyOf = (t: Track) => t.fingerprint ?? t.id;

/** Monta o conteúdo que vai para a conta: metadados das faixas próprias, playlists e favoritos. */
export function buildBackup(tracks: Track[], prefs: Prefs): BackupPayload {
  const mine = tracks.filter((t) => !isDemo(t));
  const byTrackId = new Map(mine.map((t) => [t.id, t]));
  const keyOfId = (id: string) => keyOf(byTrackId.get(id) ?? ({ id } as Track));
  return {
    version: 1,
    savedAt: Date.now(),
    tracks: mine.map((t) => ({
      title: t.title,
      artist: t.artist,
      duration: t.duration,
      fingerprint: t.fingerprint,
      path: t.path,
      folderName: t.folderName,
      source: t.source === "cloud" ? "cloud" : "local",
    })),
    playlists: prefs.playlists.map((pl) => ({
      id: pl.id,
      name: pl.name,
      createdAt: pl.createdAt,
      trackIds: pl.trackIds.map(keyOfId),
    })),
    favorites: prefs.favorites.map(keyOfId),
  };
}

export interface MergeResult {
  /** Pastas e caminhos de origem a anexar às faixas que já estão no aparelho. */
  folderInfo: Array<{ id: string; folderName?: string | undefined; path?: string | undefined }>;
  playlists: Playlist[];
  favorites: string[];
  /** O que não pôde ser aproveitado: faixas sem áudio neste aparelho. */
  missing: string[];
}

/**
 * Junta o backup da conta com o que o aparelho já tem.
 * Nada é inventado: só reaproveita faixas cujo áudio realmente existe aqui.
 */
export function mergeBackup(payload: BackupPayload, currentTracks: Track[], currentPrefs: Prefs): MergeResult {
  const byKey = new Map(currentTracks.filter((t) => !isDemo(t)).map((t) => [keyOf(t), t]));
  const folderInfo: MergeResult["folderInfo"] = [];
  const missing: string[] = [];

  for (const saved of payload.tracks) {
    const key = saved.fingerprint ?? saved.title;
    const live = byKey.get(key);
    if (!live) { missing.push(saved.folderName ? `${saved.folderName}/${saved.title}` : saved.title); continue; }
    if ((saved.folderName && saved.folderName !== live.folderName) || (saved.path && saved.path !== live.path)) {
      folderInfo.push({ id: live.id, folderName: saved.folderName ?? live.folderName, path: saved.path ?? live.path });
    }
  }

  const resolve = (key: string) => byKey.get(key)?.id ?? null;

  const playlists: Playlist[] = [...currentPrefs.playlists];
  for (const saved of payload.playlists) {
    const ids = saved.trackIds.map(resolve).filter((id): id is string => !!id);
    if (!ids.length) continue;
    const existing = playlists.find((pl) => pl.name === saved.name);
    if (existing) {
      const union = [...new Set([...existing.trackIds, ...ids])];
      playlists[playlists.indexOf(existing)] = { ...existing, trackIds: union };
    } else {
      playlists.push({ id: `restored-${saved.id}`, name: saved.name, trackIds: ids, createdAt: saved.createdAt });
    }
  }

  const favorites = [...new Set([...currentPrefs.favorites, ...payload.favorites.map(resolve).filter((id): id is string => !!id)])];

  return { folderInfo, playlists, favorites, missing };
}
