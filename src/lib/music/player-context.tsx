import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { DEMO_TRACKS } from "./catalog";
import { nextIndex, parseFileName, prevIndex, shuffleQueue } from "./queue";
import { defaultPrefs, fileStore, loadPrefs, savePrefs, type Prefs } from "./storage";
import type { Playlist, RepeatMode, Track } from "./types";

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
  playList: (ids: string[], startId?: string) => void;
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
  importFiles: (files: FileList | File[]) => Promise<void>;
  removeTrack: (id: string) => Promise<void>;
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  createPlaylist: (name: string) => Playlist;
  renamePlaylist: (id: string, name: string) => void;
  deletePlaylist: (id: string) => void;
  addToPlaylist: (pid: string, tid: string) => void;
  removeFromPlaylist: (pid: string, tid: string) => void;
  setTheme: (t: "dark" | "light") => void;
}

const Ctx = createContext<PlayerCtx | null>(null);

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

  const tracks = useMemo(() => [...localTracks, ...DEMO_TRACKS], [localTracks]);
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
    fileStore
      .all()
      .then((files) =>
        setLocalTracks(
          files
            .sort((a, b) => b.addedAt - a.addedAt)
            .map((f) => ({ id: f.id, title: f.title, artist: f.artist, duration: f.duration, url: URL.createObjectURL(f.blob), source: "local" as const })),
        ),
      )
      .catch(() => toast.error("Não foi possível abrir o armazenamento local. Arquivos importados valem só nesta sessão."))
      .finally(() => setReady(true));
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
    (ids: string[], startId?: string) => {
      if (!ids.length) return;
      const start = startId ?? ids[0];
      const q = prefs.shuffle ? shuffleQueue(ids, start) : ids;
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
    [prefs.shuffle, queue, index],
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

  const importFiles = useCallback(async (files: FileList | File[]) => {
    const list = Array.from(files);
    const probe = document.createElement("audio");
    const added: Track[] = [];
    let rejected = 0;
    for (const file of list) {
      const looksAudio = file.type.startsWith("audio/") || /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/i.test(file.name);
      if (!looksAudio || (file.type && probe.canPlayType(file.type) === "")) {
        rejected++;
        continue;
      }
      const id = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const url = URL.createObjectURL(file);
      const duration = await probeDuration(url);
      if (duration === undefined) {
        URL.revokeObjectURL(url);
        rejected++;
        continue;
      }
      const meta = parseFileName(file.name);
      const t: Track = { id, ...meta, duration, url, source: "local" };
      added.push(t);
      try {
        await fileStore.put({ id, ...meta, duration, blob: file, addedAt: Date.now() });
      } catch {
        toast.warning(`"${meta.title}" ficará disponível só nesta sessão (sem espaço para salvar).`);
      }
    }
    if (added.length) {
      setLocalTracks((p) => [...added, ...p]);
      toast.success(`${added.length} faixa(s) importada(s).`);
    }
    if (rejected) toast.error(`${rejected} arquivo(s) ignorado(s): formato não suportado neste navegador.`);
  }, []);

  const removeTrack = useCallback(
    async (id: string) => {
      const t = map.get(id);
      if (!t || t.source !== "local") return;
      try {
        await fileStore.remove(id);
      } catch {
        /* pode não estar salvo */
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
    importFiles, removeTrack,
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
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
