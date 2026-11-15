import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cover } from "@/components/music/Cover";
import { loadArtistFolderCover, loadFolderCoverForTrack, saveArtistFolderCover } from "@/lib/music/folder-covers";
import { AudioLines, Camera, Heart, ListMusic, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, UserRound, Sparkles, ListOrdered, Download, CloudUpload } from "lucide-react";
import { TrackVisual } from "./TrackVisual";
import { useSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayer } from "@/lib/music/player-context";
import { formatTime } from "@/lib/music/queue";
import { cn } from "@/lib/utils";
import { identifyArtistForPhoto } from "@/lib/music/artist-photo.functions";
import { toast } from "sonner";
import artwork from "@/assets/music-headphones.jpg";


const ARTIST_PHOTO_PREF = "player-music-show-artist-photo";
const artistPhotoCache = new Map<string, string | null>();

export function ArtistPhoto({ artist, fallbackSeed }: { artist: string; fallbackSeed: string }) {
  const p = usePlayer();
  const [enabled, setEnabled] = useState(true);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loadedArtist, setLoadedArtist] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [searchArtist, setSearchArtist] = useState("");
  const [folderPhoto, setFolderPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  useEffect(() => {
    let active = true;
    void loadArtistFolderCover(artist).then(async (url) => {
      const track = p.tracks.find((item) => item.id === fallbackSeed);
      const chosen = url ?? await loadFolderCoverForTrack({
        id: fallbackSeed,
        ...(track?.folderName ? { folderName: track.folderName } : {}),
        ...(track?.path ? { path: track.path } : {}),
      });
      if (active) setFolderPhoto(chosen);
      else if (chosen) URL.revokeObjectURL(chosen);
    });
    return () => { active = false; };
  }, [artist, fallbackSeed, p.tracks]);
  const uploadArtistPhoto = async (file?: File) => {
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const ok = await saveArtistFolderCover(artist, file);
      if (!ok) { toast.error("Não foi possível salvar a foto do cantor neste aparelho."); return; }
      const next = await loadArtistFolderCover(artist);
      setFolderPhoto((previous) => { if (previous) URL.revokeObjectURL(previous); return next; });
      toast.success(`Foto de ${artist} salva. Ela aparecerá ao tocar as músicas desse cantor.`);
    } finally { setUploadingPhoto(false); }
  };
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ARTIST_PHOTO_PREF);
      if (saved === "false") setEnabled(false);
    } catch { /* usa padrão */ }
  }, []);
  useEffect(() => {
    let active = true;
    const name = (searchArtist || artist).trim();
    if (!enabled || !name) { setPhoto(null); return () => { active = false; }; }
    setLoadedArtist(name);
    const cached = artistPhotoCache.get(name.toLocaleLowerCase("pt-BR"));
    if (cached !== undefined) { setPhoto(cached); return () => { active = false; }; }
    setPhoto(null);
    const normalize = (value: string) => value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9 ]/g, " ").replace(/\\s+/g, " ").trim();
    const findPhoto = async () => {
      let url: string | null = null;
      try {
        const params = new URLSearchParams({ action: "query", generator: "search", gsrsearch: name, gsrnamespace: "0", gsrlimit: "8", prop: "pageimages", piprop: "thumbnail", pithumbsize: "600", format: "json", origin: "*" });
        const response = await fetch(`https://pt.wikipedia.org/w/api.php?${params.toString()}`);
        if (!response.ok) throw new Error("Falha ao buscar foto na Wikipédia");
        const data = await response.json() as { query?: { pages?: Record<string, { title?: string; thumbnail?: { source?: string } }> } };
        const pages = Object.values(data.query?.pages ?? {}).filter((page) => page.title && page.thumbnail?.source);
        const wanted = normalize(name);
        const match = pages.find((page) => normalize(page.title!) === wanted) ?? pages.find((page) => normalize(page.title!).includes(wanted) || wanted.includes(normalize(page.title!)));
        url = match?.thumbnail?.source ?? null;
      } catch { /* tenta o Wikimedia Commons */ }
      if (!url) {
        try {
          const response = await fetch(`https://api.deezer.com/search/artist?q=${encodeURIComponent(name)}&limit=10`);
          if (!response.ok) throw new Error("Falha ao buscar artista no Deezer");
          const data = await response.json() as { data?: Array<{ name?: string; picture_big?: string; picture_xl?: string }> };
          const wanted = normalize(name);
          const exact = (data.data ?? []).find((artist) => artist.name && normalize(artist.name) === wanted);
          url = exact?.picture_xl ?? exact?.picture_big ?? null;
        } catch { /* tenta o Wikimedia Commons */ }
      }
      if (!url) {
        try {
          const params = new URLSearchParams({ action: "query", generator: "search", gsrsearch: `filetype:bitmap "${name}"`, gsrnamespace: "6", gsrlimit: "12", prop: "imageinfo", iiprop: "url", iiurlwidth: "600", format: "json", origin: "*" });
          const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`);
          if (!response.ok) throw new Error("Falha ao buscar foto no Commons");
          const data = await response.json() as { query?: { pages?: Record<string, { title?: string; imageinfo?: Array<{ thumburl?: string; url?: string }> }> } };
          const wanted = normalize(name);
          const pages = Object.values(data.query?.pages ?? []).filter((page) => page.title && page.imageinfo?.length);
          const exact = pages.find((page) => normalize(page.title!.replace(/^File:/i, "").replace(/\\.[^.]+$/, "")).includes(wanted));
          url = exact?.imageinfo?.[0]?.thumburl ?? exact?.imageinfo?.[0]?.url ?? null;
        } catch { /* usa a capa neutra se não houver foto identificável */ }
      }
      artistPhotoCache.set(name.toLocaleLowerCase("pt-BR"), url);
      if (active) setPhoto(url);
    };
    void findPhoto();
    return () => { active = false; };
  }, [artist, enabled, searchArtist]);
  const findWithAi = async () => {
    if (!artist.trim()) return;
    setAiBusy(true);
    try {
      const result = await identifyArtistForPhoto({ data: { artist } });
      if (result.error) toast.error(result.error);
      setSearchArtist(result.canonicalName);
      setEnabled(true);
      try { localStorage.setItem(ARTIST_PHOTO_PREF, "true"); } catch { /* preferência opcional */ }
      toast.success("Artista identificado. Procurando foto…");
    } catch { toast.error("Entre na sua conta para usar a busca de fotos com IA."); }
    finally { setAiBusy(false); }
  };
  const toggle = () => setEnabled((current) => {
    const next = !current;
    try { localStorage.setItem(ARTIST_PHOTO_PREF, String(next)); } catch { /* preferência opcional */ }
    return next;
  });
  return (
    <div className="relative">
      {folderPhoto ? <img src={folderPhoto} alt={`Foto da pasta de ${artist}`} className="aspect-square w-full rounded-xl object-cover" /> : enabled && photo && loadedArtist === (searchArtist || artist) ? <img src={photo} alt={`Foto de ${artist}`} className="aspect-square w-full rounded-xl object-cover" loading="lazy" referrerPolicy="no-referrer" /> : <Cover seed={fallbackSeed} className="aspect-square w-full rounded-none" iconClass="size-1/3" />}
      <div className="absolute bottom-2 right-2 flex gap-1">
        <button type="button" onClick={findWithAi} disabled={aiBusy} aria-label="Localizar foto do cantor com IA" title="Localizar foto com IA" className="rounded-full border border-white/30 bg-black/70 p-2 text-white backdrop-blur disabled:opacity-50"><Sparkles className={`size-4 ${aiBusy ? "animate-pulse text-primary" : "text-fuchsia-300"}`} /></button>
        <label aria-label="Adicionar ou trocar foto do cantor" title="Adicionar ou trocar foto do cantor" className={`cursor-pointer rounded-full border border-white/30 bg-black/70 p-2 text-white backdrop-blur ${uploadingPhoto ? "opacity-50" : ""}`}>
          <Camera className="size-4 text-primary" />
          <input type="file" accept="image/*" disabled={uploadingPhoto} className="sr-only" onChange={(event) => { void uploadArtistPhoto(event.target.files?.[0]); event.currentTarget.value = ""; }} />
        </label>
      </div>
    </div>
  );
}

export function HomePlayer({ variant = "classic" }: { variant?: "classic" | "showcase" }) {
  const p = usePlayer();
  const { user } = useSession();
  const [saving, setSaving] = useState(false);
  const [showArtistName, setShowArtistName] = useState(true);
  useEffect(() => {
    try { setShowArtistName(localStorage.getItem("player-music-show-artist-name") !== "false"); } catch { /* usa padrão */ }
  }, []);
  const toggleArtistName = () => setShowArtistName((current) => {
    const next = !current;
    try { localStorage.setItem("player-music-show-artist-name", String(next)); } catch { /* preferência opcional */ }
    return next;
  });
  const libraryTracks = p.tracks.filter((track) => track.source === "local" || track.source === "cloud");
  const previewTrack = libraryTracks[0] ?? null;
  const t = p.current ?? previewTrack;
  const hasCurrent = !!p.current;
  const startLibrary = () => {
    if (hasCurrent) p.toggle();
    else if (libraryTracks.length) p.playList(libraryTracks.map((track) => track.id), previewTrack?.id, "ordered");
  };
  return (
    <section aria-label="Tocando agora" className={cn("neon-panel rounded-2xl border border-primary/60 p-3 sm:p-5", variant === "showcase" && "rounded-[2rem] bg-gradient-to-br from-fuchsia-950/50 via-card to-background p-4 shadow-[0_0_32px_-8px_hsl(var(--primary)/0.65)] sm:p-6")}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary"><AudioLines className="size-4" /> {p.isPlaying ? "TOCANDO AGORA" : hasCurrent ? "REPRODUÇÃO PAUSADA" : previewTrack ? "MÚSICA DISPONÍVEL" : "SEU PLAYER"}</span>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" disabled={!t} onClick={() => t && p.toggleFavorite(t.id)} aria-label={t && p.isFavorite(t.id) ? "Remover dos favoritos" : "Favoritar"}><Heart className={cn(t && p.isFavorite(t.id) && "fill-primary text-primary")} /></Button>
          <Button asChild size="icon" variant="ghost"><Link to="/fila" aria-label="Abrir fila"><ListMusic /></Link></Button>
        </div>
      </div>
      <div className={cn("grid items-center gap-3 sm:gap-6", variant === "showcase" ? "grid-cols-[minmax(116px,0.9fr)_minmax(0,1.1fr)] sm:grid-cols-[minmax(220px,0.9fr)_minmax(0,1.1fr)]" : "grid-cols-[112px_minmax(0,1fr)] sm:grid-cols-[220px_minmax(0,1fr)]")}>
        <div className={cn("overflow-hidden border border-primary/40", variant === "showcase" ? "rounded-2xl shadow-[0_0_22px_-8px_hsl(var(--primary)/0.8)]" : "rounded-xl")}>{t ? <TrackVisual track={t} fallback={<ArtistPhoto artist={t.artist} fallbackSeed={t.id} />} /> : <Link to="/importar" aria-label="Importar músicas"><img src={artwork} alt="Fones de ouvido" width={1024} height={1024} className="aspect-square w-full object-cover" /></Link>}</div>
        <div className="min-w-0">
          <h2 className={cn("truncate font-bold", variant === "showcase" ? "text-lg sm:text-3xl" : "text-base sm:text-2xl")}>{t?.title ?? "Sua música aqui"}</h2>
          <div className="mt-1 flex items-center gap-1"><p className="min-w-0 flex-1 truncate text-xs text-muted-foreground sm:text-base">{showArtistName ? (t?.artist ?? "Sua biblioteca pessoal") : ""}</p><Button type="button" size="icon" variant="ghost" className="size-7 shrink-0" onClick={toggleArtistName} aria-label={showArtistName ? "Ocultar nome do cantor" : "Mostrar nome do cantor"} aria-pressed={showArtistName} title={showArtistName ? "Nome do cantor visível" : "Nome do cantor oculto"}><UserRound className={cn("size-4", showArtistName && "text-primary")} /></Button></div>
          <div className="mt-4"><Slider aria-label="Progresso da música" value={[p.currentTime]} max={p.duration || 1} step={0.5} disabled={!hasCurrent} onValueChange={([v]) => p.seek(v ?? 0)} /><div className="mt-2 flex justify-between text-[10px] tabular-nums text-muted-foreground sm:text-xs"><span>{formatTime(p.currentTime)}</span><span>{formatTime(p.duration || t?.duration)}</span></div></div>
          <div className={cn("mt-2 flex items-center justify-between gap-0.5 sm:mt-4", variant === "showcase" && "mt-4 sm:mt-5")}>
            <Button variant="ghost" size="icon" onClick={p.toggleShuffle} aria-label="Aleatório" aria-pressed={p.prefs.shuffle} className={cn("size-8 sm:size-10", p.prefs.shuffle && "text-primary")}><Shuffle /></Button>
            <Button variant="ghost" size="icon" disabled={!hasCurrent} onClick={p.prev} aria-label="Anterior" className="size-8 sm:size-10"><SkipBack className="fill-current" /></Button>
            {t ? <Button size="icon" onClick={startLibrary} aria-label={p.isPlaying ? "Pausar" : "Tocar"} className="size-11 shrink-0 rounded-full shadow-glow sm:size-14">{p.isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current" />}</Button> : <Button asChild size="icon" className="size-11 shrink-0 rounded-full shadow-glow"><Link to="/biblioteca" aria-label="Escolher música"><Play /></Link></Button>}
            <Button variant="ghost" size="icon" disabled={!hasCurrent} onClick={p.next} aria-label="Próxima" className="size-8 sm:size-10"><SkipForward className="fill-current" /></Button>
            <Button variant="ghost" size="icon" onClick={p.cycleRepeat} aria-label={`Repetir: ${p.prefs.repeat}`} className={cn("size-8 sm:size-10", p.prefs.repeat !== "off" && "text-primary")}>{p.prefs.repeat === "one" ? <Repeat1 /> : <Repeat />}</Button>
          </div>
        </div>
      </div>
      <div className="mt-4 flex h-12 items-end justify-center gap-1 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-fuchsia-950/20 via-primary/10 to-cyan-950/20 px-3 py-2" role="img" aria-label={p.isPlaying ? "Equalizador animado acompanhando a reprodução" : "Equalizador em repouso"}>
        {Array.from({ length: 30 }, (_, index) => index).map((index) => {
          const heights = [18, 30, 45, 24, 58, 36, 72, 48, 88, 54, 76, 42, 96, 60, 82, 38, 68, 48, 90, 56, 74, 34, 62, 42, 80, 28, 52, 36, 66, 22];
          return <span key={index} className={cn("eq-bar w-1 rounded-full bg-gradient-to-t from-fuchsia-600 via-primary to-cyan-300 shadow-[0_0_9px_hsl(var(--primary)/0.7)]", !p.isPlaying && "animate-none opacity-40")} style={{ height: `${heights[index]}%`, animationDelay: `${index * 0.055}s`, animationDuration: `${0.55 + (index % 5) * 0.13}s` }} />;
        })}
      </div>
      {!!libraryTracks.length && <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={p.autoNext ? "default" : "outline"}
          aria-pressed={p.autoNext}
          onClick={() => p.setAutoNext(!p.autoNext)}
          title="Avançar automaticamente quando a música terminar"
        >
          <SkipForward /> {p.autoNext ? "Próxima automática: ligada" : "Próxima automática: desligada"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => { p.setAutoNext(true); p.playList(libraryTracks.map((track) => track.id), t?.id, "ordered"); }}><ListOrdered /> Tocar em sequência</Button>
        {t && t.source !== "demo" && <Button size="sm" variant="outline" onClick={() => void p.saveTrackLocally(t.id)}><Download /> Salvar no aparelho</Button>}
        {t && t.source === "local" && (user ? <Button size="sm" variant="outline" disabled={saving} onClick={() => { setSaving(true); void p.saveTrackToCloud(t.id).catch(() => {}).finally(() => setSaving(false)); }}><CloudUpload /> {saving ? "Salvando…" : "Salvar na conta"}</Button> : <Button size="sm" variant="outline" asChild><Link to="/auth"><CloudUpload /> Entrar para salvar na conta</Link></Button>)}
      </div>}
      {t?.license && <p className="mt-3 text-[10px] text-muted-foreground">{t.license}</p>}
    </section>
  );
}