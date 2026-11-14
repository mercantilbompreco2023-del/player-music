import type React from "react";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { DEMO_TRACKS } from "./catalog";
import { moveItem, nextIndex, parseFileName, prevIndex, shuffleQueue } from "./queue";
import { nativeMedia } from "./native-media";
import { supabase } from "@/integrations/supabase/client";
import { defaultPrefs, fileStore, loadPrefs, savePrefs, type Prefs } from "./storage";
import type { Playlist, RepeatMode, Track } from "./types";
import { fingerprint, formatProblem, type ImportItem, type ImportProgress, type ImportReport } from "./import";

interface PlayerCtx {
  ready: boolean;
  tracks: Track[];
  byId: (id: string) => Track | undefined;
  queue: string[];
  index: number;
  current: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  prefs: Prefs;
  playList: (ids: string[], startId?: string, mode?: "ordered" | "shuffle") => void;
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (t: number) => void;
  setVolume: (v: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  addToQueue: (id: string) => void;
  removeFromQueue: (pos: number) => void;
  playAt: (pos: number) => void;
  importFiles: (files: FileList | File[]) => Promise<ImportReport>;
  importItems: (items: ImportItem[], opts?: { signal?: AbortSignal; onProgress?: (p: ImportProgress) => void; quiet?: boolean }) => Promise<ImportReport>;
  saveTrackToCloud: (id: string) => Promise<void>;
  removeTrack: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  createPlaylist: (name: string) => Playlist;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (pid: string, tid: string) => void;
  removeFromPlaylist: (pid: string, tid: string) => void;
  setTheme: (t: "dark" | "light") => void;
  clearRecent: () => void;
  clearUpcoming: () => void;
  moveInQueue: (pos: number, dir: -1 | 1) => void;
}

// Mantém o mesmo contexto entre recarregamentos de módulo (HMR), evitando "usePlayer fora do PlayerProvider".
const g = globalThis as typeof globalThis & { __pmPlayerCtx?: React.Context<PlayerCtx | null> };
const Ctx = g.__pmPlayerCtx ?? (g.__pmPlayerCtx = createContext<PlayerCtx | null>(null));

export function usePlayer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePlayer fora do PlayerProvider");
  return c;
}

function probeDuration(url: string): Promise<number | undefined> {
  return new Promise((resolve) => {
    const a = new Audio();
    a.preload = "metadata";
    a.onloadedmetadata = () => resolve(isFinite(a.duration) ? a.duration : undefined);
    a.onerror = () => resolve(undefined);
    a.src = url;
  });
}

async function fetchCloudTracks(userId: string): Promise<Track[]> {
  const { data: objects, error } = await supabase.storage.from("player-music").list(userId, { limit: 1000, sortBy: { column: "name", order: "asc" } });
  if (error || !objects?.length) return [];
  const files = objects.filter((o) => o.name && !o.name.endsWith("/"));
  const paths = files.map((o) => `${userId}/${o.name}`);
  if (!paths.length) return [];
  const { data: signed, error: signedError } = await supabase.storage.from("player-music").createSignedUrls(paths, 60 * 60 * 24);
  if (signedError || !signed) return [];
  return signed.flatMap((entry, i) => {
    if (!entry.signedUrl || !entry.path) return [];
    const meta = (files[i]?.metadata ?? {}) as Record<string, unknown>;
    const name = files[i]?.name ?? entry.path.split("/").pop() ?? "Música";
    return [{
      id: typeof meta["fingerprint"] === "string" ? `cloud-${meta["fingerprint"]}` : `cloud-${entry.path}`,
      title: typeof meta["title"] === "string" ? meta["title"] : name.replace(/\.[^.]+$/, ""),
      artist: typeof meta["artist"] === "string" ? meta["artist"] : "Biblioteca na nuvem",
      duration: typeof meta["duration"] === "number" ? meta["duration"] : undefined,
      fingerprint: typeof meta["fingerprint"] === "string" ? meta["fingerprint"] : undefined,
      path: typeof meta["originalPath"] === "string" ? meta["originalPath"] : undefined,
      storagePath: entry.path,
      url: entry.signedUrl,
      source: "cloud" as const,
    }];
  });
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [ready, setReady] = useState(false);
  const [localTracks, setLocalTracks] = useState<Track[]>([]);
  const [prefs, setPrefs] = useState<Prefs>(defaultPrefs);
  const [queue, setQueue] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [demosOn, setDemosOn] = useState(true);
  useEffect(() => {
    supabase.from("app_settings").select("value").eq("key", "demo_tracks_enabled").maybeSingle()
      .then(({ data }) => { if (data && data.value === false) setDemosOn(false); }, () => {});
  }, []);
  const tracks = useMemo(() => [...localTracks, ...(demosOn ? DEMO_TRACKS : [])], [localTracks, demosOn]);
  const map = useMemo(() => new Map(tracks.map((t) => [t.id, t])), [tracks]);
  const byId = useCallback((id: string) => map.get(id), [map]);
  const currentId = queue[index] ?? null;
  const current = currentId ? map.get(currentId) ?? null : null;

  // refs para handlers do elemento de áudio
  const stateRef = useRef({ queue, index, repeat: prefs.repeat });
  stateRef.current = { queue, index, repeat: prefs.repeat };

  // Carregar preferências e arquivos
  useEffect(() => {
    setPrefs(loadPrefs());
    const localPromise = fileStore.all()
      .then((files) => files
        .sort((a, b) => b.addedAt - a.addedAt)
        .map((f) => ({ id: f.id, title: f.title, artist: f.artist, duration: f.duration, fingerprint: f.fingerprint, path: f.path, folderName: f.folderName, url: URL.createObjectURL(f.blob), source: "local" as const })))
      .catch(() => {
        toast.error("Não foi possível abrir os arquivos salvos neste aparelho.");
        return [] as Track[];
      });
    const cloudPromise = supabase.auth.getUser()
      .then(({ data }) => data.user ? fetchCloudTracks(data.user.id) : [])
      .catch(() => [] as Track[]);
    Promise.all([localPromise, cloudPromise])
      .then(([local, cloud]) => setLocalTracks([...local, ...cloud]))
      .finally(() => setReady(true));
  }, []);

  // Atualiza a biblioteca quando o usuário entra ou sai da conta.
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        void fetchCloudTracks(session.user.id).then((cloud) =>
          setLocalTracks((current) => [...current.filter((t) => t.source !== "cloud"), ...cloud]),
        );
      }
      if (event === "SIGNED_OUT") {
        setLocalTracks((current) => current.filter((t) => t.source !== "cloud"));
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const updatePrefs = useCallback((fn: (p: Prefs) => Prefs) => {
    setPrefs((p) => {
      const n = fn(p);
      if (!savePrefs(n)) toast.error("Não foi possível salvar suas preferências neste dispositivo.");
      return n;
    });
  }, []);

  // Tema
  useEffect(() => {
    document.documentElement.classList.toggle("dark", prefs.theme === "dark");
  }, [prefs.theme]);

  // Elemento de áudio único
  useEffect(() => {
    const a = new Audio();
    a.preload = "auto";
    audioRef.current = a;
    a.ontimeupdate = () => setCurrentTime(a.currentTime);
    a.ondurationchange = () => setDuration(isFinite(a.duration) ? a.duration : 0);
    a.onplay = () => setIsPlaying(true);
    a.onpause = () => setIsPlaying(false);
    a.onended = () => {
      const { queue: q, index: i, repeat } = stateRef.current;
      if (repeat === "one") {
        a.currentTime = 0;
        void a.play();
        return;
      }
      const n = nextIndex(q.length, i, repeat);
      if (n === null) setIsPlaying(false);
      else setIndex(n);
    };
    a.onerror = () => {
      if (!a.src) return;
      toast.error("Este arquivo não pôde ser reproduzido (formato não suportado ou corrompido). Pulando.");
      const { queue: q, index: i } = stateRef.current;
      const n = nextIndex(q.length, i, "off");
      if (n !== null) setIndex(n);
      else setIsPlaying(false);
    };
    return () => {
      a.pause();
      a.src = "";
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = prefs.volume;
  }, [prefs.volume]);

  // Trocar faixa
  const wantPlay = useRef(false);
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!current) {
      a.pause();
      a.removeAttribute("src");
      setCurrentTime(0);
      setDuration(0);
      return;
    }
    if (a.src !== new URL(current.url, location.href).href) {
      a.src = current.url;
      setCurrentTime(0);
    }
    if (wantPlay.current) {
      a.play().catch((e) => {
        if (e?.name !== "AbortError") toast.error("O navegador bloqueou a reprodução. Toque em play novamente.");
      });
    }
    updatePrefs((p) => ({ ...p, recent: [current.id, ...p.recent.filter((r) => r !== current.id)].slice(0, 12) }));
  }, [current?.id, current?.url]); // eslint-disable-line react-hooks/exhaustive-deps

  const playList = useCallback(
    (ids: string[], startId?: string, mode?: "ordered" | "shuffle") => {
      if (!ids.length) return;
      const shuffled = mode ? mode === "shuffle" : prefs.shuffle;
      const q = shuffled ? shuffleQueue(ids, startId ?? (mode === "shuffle" ? null : ids[0] ?? null)) : [...ids];
      const start = startId ?? q[0];
      if (!start) return;
      if (mode) updatePrefs((p) => ({ ...p, shuffle: shuffled }));
      wantPlay.current = true;
      setQueue(q);
      const i = q.indexOf(start);
      setIndex(i < 0 ? 0 : i);
      const a = audioRef.current;
      if (a && queue[index] === start) {
        a.currentTime = 0;
        void a.play().catch(() => {});
      }
    },
    [prefs.shuffle, queue, index, updatePrefs],
  );

  const toggle = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (!current) {
      playList(tracks.map((t) => t.id));
      return;
    }
    wantPlay.current = true;
    if (a.paused) a.play().catch(() => toast.error("Não foi possível reproduzir esta faixa."));
    else {
      wantPlay.current = false;
      a.pause();
    }
  }, [current, tracks, playList]);

  const next = useCallback(() => {
    const n = nextIndex(queue.length, index, prefs.repeat === "one" ? "all" : prefs.repeat);
    if (n !== null) {
      wantPlay.current = true;
      setIndex(n);
    }
  }, [queue.length, index, prefs.repeat]);

  const prev = useCallback(() => {
    const a = audioRef.current;
    if (a && a.currentTime > 3) {
      a.currentTime = 0;
      return;
    }
    wantPlay.current = true;
    setIndex(prevIndex(queue.length, index, prefs.repeat === "one" ? "all" : prefs.repeat));
  }, [queue.length, index, prefs.repeat]);

  const seek = useCallback((t: number) => {
    const a = audioRef.current;
    if (a && isFinite(t)) {
      a.currentTime = t;
      setCurrentTime(t);
    }
  }, []);

  // Media Session API
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.metadata = current ? new MediaMetadata({ title: current.title, artist: current.artist, album: "Player Music" }) : null;
    const set = (a: MediaSessionAction, h: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(a, h);
      } catch {
        /* ação não suportada */
      }
    };
    set("play", () => toggle());
    set("pause", () => toggle());
    set("nexttrack", () => next());
    set("previoustrack", () => prev());
    set("seekto", (d) => d.seekTime !== undefined && seek(d.seekTime));
  }, [current, toggle, next, prev, seek]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    if (duration > 0 && navigator.mediaSession.setPositionState) {
      try {
        navigator.mediaSession.setPositionState({ duration, position: Math.min(currentTime, duration), playbackRate: 1 });
      } catch {
        /* ignore */
      }
    }
  }, [isPlaying, duration, Math.floor(currentTime)]); // eslint-disable-line react-hooks/exhaustive-deps

  // Serviço de mídia nativo (somente no APK Android)
  const actionsRef = useRef({ toggle, next, prev, isPlaying });
  actionsRef.current = { toggle, next, prev, isPlaying };
  useEffect(() => {
    if (!nativeMedia) return;
    const h = nativeMedia.addListener("action", ({ action }) => {
      const a = actionsRef.current;
      if (action === "next") a.next();
      else if (action === "previous") a.prev();
      else if ((action === "play") !== a.isPlaying) a.toggle();
    });
    return () => { void h.then((x) => x.remove()); };
  }, []);
  useEffect(() => {
    if (!nativeMedia) return;
    if (!current) { void nativeMedia.stop().catch(() => {}); return; }
    void nativeMedia
      .update({ title: current.title, artist: current.artist, isPlaying, position: currentTime, duration })
      .catch(() => {});
  }, [current?.id, isPlaying, Math.floor(duration)]); // eslint-disable-line react-hooks/exhaustive-deps

  const localRef = useRef<Track[]>([]);
  localRef.current = localTracks;

  /** Importa itens um a um. Cada faixa é salva de forma atômica: cancelar nunca deixa registros pela metade. */
  const importItems = useCallback(
    async (items: ImportItem[], opts: { signal?: AbortSignal; onProgress?: (p: ImportProgress) => void; quiet?: boolean } = {}): Promise<ImportReport> => {
      const probe = document.createElement("audio");
      const report: ImportReport = { found: items.length, imported: 0, duplicates: 0, skipped: [], cancelled: false };
      // impressões digitais já existentes (faixas antigas sem impressão são calculadas agora)
      const known = new Set<string>();
      for (const t of localRef.current) {
        if (t.fingerprint) known.add(t.fingerprint);
      }
      if (localRef.current.some((t) => !t.fingerprint)) {
        try {
          const stored = await fileStore.all();
          for (const f of stored) {
            const fp = f.fingerprint ?? (await fingerprint(f.blob));
            known.add(fp);
            if (!f.fingerprint) await fileStore.put({ ...f, fingerprint: fp });
          }
        } catch { /* segue sem a checagem dos antigos */ }
      }
      let processed = 0;
      for (const { file, path, folderName } of items) {
        if (opts.signal?.aborted) { report.cancelled = true; break; }
        opts.onProgress?.({ phase: "importando", found: items.length, processed, imported: report.imported, current: path });
        processed++;
        const problem = formatProblem(file.name, file.type, (m) => probe.canPlayType(m));
        if (problem) { report.skipped.push({ path, reason: problem }); continue; }
        let fp: string;
        try {
          fp = await fingerprint(file);
        } catch {
          report.skipped.push({ path, reason: "Erro de leitura do arquivo" });
          continue;
        }
        if (known.has(fp)) { report.duplicates++; report.skipped.push({ path, reason: "Já está na biblioteca (duplicado)" }); continue; }
        const url = URL.createObjectURL(file);
        const duration = await probeDuration(url);
        if (duration === undefined) {
          URL.revokeObjectURL(url);
          report.skipped.push({ path, reason: "Arquivo corrompido ou codificação não suportada" });
          continue;
        }
        if (opts.signal?.aborted) { URL.revokeObjectURL(url); report.cancelled = true; break; }
        const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
        const meta = parseFileName(file.name);
        const t: Track = { id, ...meta, duration, url, source: "local", fingerprint: fp, path, folderName };
        try {
          await fileStore.put({ id, ...meta, duration, fingerprint: fp, path, folderName, blob: file, addedAt: Date.now() });
        } catch {
          if (!opts.quiet) toast.warning(`"${meta["title"]}" ficará disponível só nesta sessão (sem espaço para salvar).`);
        }
        known.add(fp);
        report.imported++;
        setLocalTracks((p) => [t, ...p]);
      }
      opts.onProgress?.({ phase: "concluido", found: items.length, processed, imported: report.imported });
      return report;
    },
    [],
  );

  const saveTrackToCloud = useCallback(async (id: string) => {
    const track = localRef.current.find((t) => t.id === id);
    if (!track || track.source !== "local") return;
    const { data: auth, error: authError } = await supabase.auth.getUser();
    if (authError || !auth.user) {
      toast.error("Entre na sua conta para salvar músicas na nuvem.");
      return;
    }
    toast.info("Enviando música para a nuvem…");
    try {
      const stored = (await fileStore.all()).find((f) => f.id === id);
      const response = stored ? stored.blob : await fetch(track.url).then((r) => {
        if (!r.ok) throw new Error("Não foi possível ler o arquivo importado.");
        return r.blob();
      });
      const extension = (stored?.path ?? track.path ?? track.title).match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase() ?? "audio";
      const fingerprintKey = (track.fingerprint ?? id).replace(/[^a-z0-9_-]/gi, "").slice(0, 48);
      const storagePath = `${auth.user.id}/${fingerprintKey}.${extension}`;
      const { error: uploadError } = await supabase.storage.from("player-music").upload(storagePath, response, {
        upsert: true,
        contentType: response.type || "application/octet-stream",
        metadata: { title: track.title, artist: track.artist, duration: track.duration, fingerprint: track.fingerprint, originalPath: track.path },
      });
      if (uploadError) throw uploadError;
      const { data: signed, error: signedError } = await supabase.storage.from("player-music").createSignedUrl(storagePath, 60 * 60 * 24);
      if (signedError || !signed?.signedUrl) throw signedError ?? new Error("Não foi possível abrir a música salva.");
      try { await fileStore.remove(id); } catch { /* a cópia da nuvem já está segura */ }
      URL.revokeObjectURL(track.url);
      const cloudId = track.fingerprint ? `cloud-${track.fingerprint}` : `cloud-${storagePath}`;
      const cloudTrack: Track = { ...track, id: cloudId, source: "cloud", storagePath, url: signed.signedUrl };
      setLocalTracks((current) => current.map((t) => t.id === id ? cloudTrack : t));
      // Migra as referências para que favoritos, playlists e fila continuem funcionando.
      setQueue((current) => current.map((trackId) => trackId === id ? cloudId : trackId));
      updatePrefs((p) => ({
        ...p,
        favorites: p.favorites.map((trackId) => trackId === id ? cloudId : trackId),
        recent: p.recent.map((trackId) => trackId === id ? cloudId : trackId),
        playlists: p.playlists.map((playlist) => ({ ...playlist, trackIds: playlist.trackIds.map((trackId) => trackId === id ? cloudId : trackId) })),
      }));
      toast.success("Música salva na nuvem. A cópia local foi liberada.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao salvar na nuvem.";
      toast.error(message);
    }
  }, [updatePrefs]);

  const importFiles = useCallback(
    async (files: FileList | File[]) => {
      const items = Array.from(files).map((file) => ({ file, path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name }));
      const r = await importItems(items);
      if (r.imported) toast.success(`${r.imported} faixa(s) importada(s).`);
      if (r.duplicates) toast.info(`${r.duplicates} já estava(m) na biblioteca.`);
      const other = r.skipped.length - r.duplicates;
      if (other) toast.error(`${other} arquivo(s) ignorado(s): ${r.skipped.find((s) => !s.reason.includes("duplicado"))?.reason}.`);
      return r;
    },
    [importItems],
  );

  const removeTrack = useCallback(
    async (id: string) => {
      const t = map.get(id);
      if (!t || (t.source !== "local" && t.source !== "cloud")) return;
      if (t.source === "cloud" && t.storagePath) {
        const { error } = await supabase.storage.from("player-music").remove([t.storagePath]);
        if (error) { toast.error("Não foi possível remover a música da nuvem."); return; }
      } else {
        try { await fileStore.remove(id); } catch { /* pode não estar salvo */ }
      }
      URL.revokeObjectURL(t.url);
      setLocalTracks((p) => p.filter((x) => x.id !== id));
      setQueue((q) => {
        const pos = q.indexOf(id);
        if (pos === -1) return q;
        const nq = q.filter((x) => x !== id);
        setIndex((i) => (pos < i ? i - 1 : Math.min(i, Math.max(nq.length - 1, 0))));
        return nq;
      });
      updatePrefs((p) => ({
        ...p,
        favorites: p.favorites.filter((f) => f !== id),
        recent: p.recent.filter((f) => f !== id),
        playlists: p.playlists.map((pl) => ({ ...pl, trackIds: pl.trackIds.filter((x) => x !== id) })),
      }));
      toast.success("Faixa removida.");
    },
    [map, updatePrefs],
  );

  const value: PlayerCtx = {
    ready, tracks, byId, queue, index, current, isPlaying, currentTime, duration, prefs,
    playList, toggle, next, prev, seek,
    setVolume: (v) => updatePrefs((p) => ({ ...p, volume: Math.max(0, Math.min(1, v)) })),
    toggleShuffle: () => {
      const on = !prefs.shuffle;
      updatePrefs((p) => ({ ...p, shuffle: on }));
      if (on && queue.length > 1) {
        const q = shuffleQueue(queue, currentId);
        setQueue(q);
        setIndex(0);
      }
    },
    cycleRepeat: () => updatePrefs((p) => ({ ...p, repeat: ({ off: "all", all: "one", one: "off" } as Record<RepeatMode, RepeatMode>)[p.repeat] })),
    addToQueue: (id) => {
      if (!queue.length) return playList([id]);
      setQueue((q) => [...q, id]);
      toast.success("Adicionada à fila.");
    },
    removeFromQueue: (pos) => {
      if (pos === index) return;
      setQueue((q) => q.filter((_, i) => i !== pos));
      if (pos < index) setIndex((i) => i - 1);
    },
    playAt: (pos) => {
      wantPlay.current = true;
      setIndex(pos);
    },
    importFiles, importItems, saveTrackToCloud, removeTrack,
    toggleFavorite: (id) =>
      updatePrefs((p) => ({ ...p, favorites: p.favorites.includes(id) ? p.favorites.filter((f) => f !== id) : [id, ...p.favorites] })),
    isFavorite: (id) => prefs.favorites.includes(id),
    createPlaylist: (name) => {
      const pl: Playlist = { id: `pl-${Date.now()}`, name: name.trim() || "Nova playlist", trackIds: [], createdAt: Date.now() };
      updatePrefs((p) => ({ ...p, playlists: [pl, ...p.playlists] }));
      return pl;
    },
    renamePlaylist: (id, name) =>
      updatePrefs((p) => ({ ...p, playlists: p.playlists.map((pl) => (pl.id === id ? { ...pl, name: name.trim() || pl.name } : pl)) })),
    deletePlaylist: (id) => updatePrefs((p) => ({ ...p, playlists: p.playlists.filter((pl) => pl.id !== id) })),
    addToPlaylist: (pid, tid) => {
      updatePrefs((p) => ({
        ...p,
        playlists: p.playlists.map((pl) => (pl.id === pid && !pl.trackIds.includes(tid) ? { ...pl, trackIds: [...pl.trackIds, tid] } : pl)),
      }));
      toast.success("Adicionada à playlist.");
    },
    removeFromPlaylist: (pid, tid) =>
      updatePrefs((p) => ({ ...p, playlists: p.playlists.map((pl) => (pl.id === pid ? { ...pl, trackIds: pl.trackIds.filter((x) => x !== tid) } : pl)) })),
    setTheme: (t) => updatePrefs((p) => ({ ...p, theme: t })),
    clearRecent: () => updatePrefs((p) => ({ ...p, recent: [] })),
    clearUpcoming: () => setQueue((q) => q.slice(0, index + 1)),
    moveInQueue: (pos, dir) => {
      const r = moveItem(queue, index, pos, dir);
      setQueue(r.queue);
      setIndex(r.index);
    },
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
