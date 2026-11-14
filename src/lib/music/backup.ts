import type { Playlist, Track } from "./types";
import type { Prefs } from "./storage";

/**
 * Chave canônica de uma música: a mesma usada no nome do arquivo guardado na nuvem
 * (impressão digital sem símbolos, até 48 caracteres). Quando o áudio volta pela nuvem
 * sem metadados, a chave é recuperada do próprio nome do arquivo.
 */
export function trackKey(t: { fingerprint?: string | undefined; id: string }): string {
  const fp = t.fingerprint?.replace(/[^a-z0-9_-]/gi, "").slice(0, 48);
  if (fp) return fp;
  const m = t.id.match(/^cloud-(?:.*\/)?([a-z0-9_-]{16,48})\.[a-z0-9]{2,5}$/i);
  return m?.[1] ?? t.id;
}

/** Faixa guardada na conta: só metadados, nunca URL de reprodução nem blob de áudio. */
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
  createdAt: number;
  trackIds: string[];
}

export interface BackupPayload {
  version: 1;
  savedAt: number;
  tracks: BackupTrack[];
  playlists: BackupPlaylist[];
  favorites: string[];
}

export interface RestoreResult {
  /** Pastas/caminhos a anexar às faixas que já têm áudio neste aparelho. */
  folderInfo: Array<{ id: string; folderName?: string | undefined; path?: string | undefined }>;
  playlists: Playlist[];
  favorites: string[];
  /** Títulos das faixas da conta que ainda não têm áudio neste aparelho. */
  missing: string[];
}

/** Monta o conteúdo do backup a partir do estado local (sem faixas de demonstração). */
export function buildBackup(tracks: Track[], prefs: Prefs): BackupPayload {
  const mine = tracks.filter((t) => t.source !== "demo");
  // A mesma música pode existir como importação local e cópia na nuvem: guarda uma vez, com a pasta.
  const byKey = new Map<string, Track>();
  for (const t of mine) {
    const k = trackKey(t);
    const prev = byKey.get(k);
    const richer = !prev || ((!prev.folderName && !prev.path) && !!(t.folderName || t.path));
    if (richer) byKey.set(k, t);
  }
  const keyById = new Map(mine.map((t) => [t.id, trackKey(t)]));
  const keyOfId = (id: string) => keyById.get(id) ?? id;
  return {
    version: 1,
    savedAt: Date.now(),
    tracks: Array.from(byKey.values()).map((t) => ({
      title: t.title,
      artist: t.artist,
      duration: t.duration,
      fingerprint: trackKey(t),
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

/**
 * Junta a lista vinda da conta com o que existe neste aparelho.
 * Só entra na lista final a faixa que tem áudio aqui; o resto é informado ao usuário.
 */
export function mergeBackup(payload: BackupPayload, tracks: Track[], prefs: Prefs): RestoreResult {
  const mine = tracks.filter((t) => t.source !== "demo");
  const byKey = new Map(mine.map((t) => [trackKey(t), t]));
  const resolve = (key: string) => byKey.get(key)?.id ?? null;

  const folderInfo: RestoreResult["folderInfo"] = [];
  const missing: string[] = [];
  for (const bt of payload.tracks) {
    const live = byKey.get(bt.fingerprint ?? "");
    if (!live) { missing.push(bt.title); continue; }
    if (bt.folderName || bt.path) folderInfo.push({ id: live.id, folderName: bt.folderName, path: bt.path });
  }

  const existing = new Map(prefs.playlists.map((pl) => [pl.id, pl]));
  for (const bp of payload.playlists) {
    const ids = bp.trackIds.map(resolve).filter((id): id is string => !!id);
    if (ids.length === 0) continue;
    const current = existing.get(bp.id);
    existing.set(bp.id, current
      ? { ...current, trackIds: Array.from(new Set([...current.trackIds, ...ids])) }
      : { id: bp.id, name: bp.name, createdAt: bp.createdAt, trackIds: ids });
  }

  const favorites = Array.from(new Set([
    ...prefs.favorites,
    ...payload.favorites.map(resolve).filter((id): id is string => !!id),
  ]));

  return { folderInfo, playlists: Array.from(existing.values()), favorites, missing };
}
