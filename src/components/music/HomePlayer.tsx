import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Cover } from "@/components/music/Cover";
import { AudioLines, Camera, Heart, ListMusic, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayer } from "@/lib/music/player-context";
import { formatTime } from "@/lib/music/queue";
import { cn } from "@/lib/utils";
import artwork from "@/assets/music-headphones.jpg";


const ARTIST_PHOTO_PREF = "player-music-show-artist-photo";
const artistPhotoCache = new Map<string, string | null>();

function ArtistPhoto({ artist, fallbackSeed }: { artist: string; fallbackSeed: string }) {
  const [enabled, setEnabled] = useState(true);
  const [preferenceReady, setPreferenceReady] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [loadedArtist, setLoadedArtist] = useState("");
  useEffect(() => {
    try {
      const saved = localStorage.getItem(ARTIST_PHOTO_PREF);
      if (saved === "false") setEnabled(false);
    } catch { /* usa padrão */ }
    setPreferenceReady(true);
  }, []);
  useEffect(() => {
    let active = true;
    const name = artist.trim();
    if (!preferenceReady || !enabled || !name) { setPhoto(null); return () => { active = false; }; }
    setLoadedArtist(name);
    const cached = artistPhotoCache.get(name.toLocaleLowerCase("pt-BR"));
    if (cached !== undefined) { setPhoto(cached); return () => { active = false; }; }
    setPhoto(null);
    const params = new URLSearchParams({
      action: "query",
      generator: "search",
      gsrsearch: name,
      gsrnamespace: "0",
      gsrlimit: "5",
      prop: "pageimages",
      piprop: "thumbnail",
      pithumbsize: "600",
      format: "json",
      origin: "*",
    });
    fetch(`https://pt.wikipedia.org/w/api.php?${params.toString()}`)
      .then((response) => response.ok ? response.json() : Promise.reject(new Error("Falha ao buscar imagem")))
      .then((data: { query?: { pages?: Record<string, { title?: string; thumbnail?: { source?: string } }> } }) => {
        const pages = Object.values(data.query?.pages ?? {});
        const normalized = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR");
        const firstName = normalized.split(" ")[0] ?? normalized;
        const match = pages.find((page) => page.thumbnail?.source && page.title?.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").includes(firstName));
        const url = match?.thumbnail?.source ?? null;
        artistPhotoCache.set(name.toLocaleLowerCase("pt-BR"), url);
        if (active) setPhoto(url);
      })
      .catch(() => { artistPhotoCache.set(name.toLocaleLowerCase("pt-BR"), null); if (active) setPhoto(null); });
    return () => { active = false; };
  }, [artist, enabled, preferenceReady]);
  const toggle = () => setEnabled((current) => {
    const next = !current;
    try { localStorage.setItem(ARTIST_PHOTO_PREF, String(next)); } catch { /* preferência opcional */ }
    return next;
  });
  return (
    <div className="relative">
      {enabled && photo && loadedArtist === artist.trim() ? <img src={photo} alt={`Foto de ${artist}`} className="aspect-square w-full rounded-xl object-cover" loading="lazy" referrerPolicy="no-referrer" onError={() => setPhoto(null)} /> : <Cover seed={fallbackSeed} className="aspect-square w-full rounded-none" iconClass="size-1/3" />}
      <Button type="button" size="icon" variant="outline" onClick={toggle} aria-label={enabled ? "Desativar foto automática do cantor" : "Ativar foto automática do cantor"} aria-pressed={enabled} title={enabled ? "Foto automática ativada" : "Foto automática desativada"} className="absolute bottom-2 right-2 rounded-full bg-background/80 backdrop-blur">
        <Camera className={cn("size-4", enabled && "text-primary")} />
      </Button>
    </div>
  );
}

export function HomePlayer() {
  const p = usePlayer();
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
    <section aria-label="Tocando agora" className="neon-panel rounded-2xl border border-primary/60 p-3 sm:p-5">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 rounded-full bg-primary/20 px-3 py-1.5 text-xs font-bold text-primary"><AudioLines className="size-4" /> {p.isPlaying ? "TOCANDO AGORA" : hasCurrent ? "REPRODUÇÃO PAUSADA" : previewTrack ? "MÚSICA DISPONÍVEL" : "SEU PLAYER"}</span>
        <div className="flex gap-1">
          <Button size="icon" variant="ghost" disabled={!t} onClick={() => t && p.toggleFavorite(t.id)} aria-label={t && p.isFavorite(t.id) ? "Remover dos favoritos" : "Favoritar"}><Heart className={cn(t && p.isFavorite(t.id) && "fill-primary text-primary")} /></Button>
          <Button asChild size="icon" variant="ghost"><Link to="/fila" aria-label="Abrir fila"><ListMusic /></Link></Button>
        </div>
      </div>
      <div className="grid grid-cols-[112px_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[220px_minmax(0,1fr)] sm:gap-6">
        <div className="overflow-hidden rounded-xl border border-primary/40">{t ? <ArtistPhoto artist={t.artist} fallbackSeed={t.id} /> : <Link to="/importar" aria-label="Importar músicas"><img src={artwork} alt="Fones de ouvido" width={1024} height={1024} className="aspect-square w-full object-cover" /></Link>}</div>
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold sm:text-2xl">{t?.title ?? "Sua música aqui"}</h2>
          <div className="mt-1 flex items-center gap-1"><p className="min-w-0 flex-1 truncate text-xs text-muted-foreground sm:text-base">{showArtistName ? (t?.artist ?? "Sua biblioteca pessoal") : ""}</p><Button type="button" size="icon" variant="ghost" className="size-7 shrink-0" onClick={toggleArtistName} aria-label={showArtistName ? "Ocultar nome do cantor" : "Mostrar nome do cantor"} aria-pressed={showArtistName} title={showArtistName ? "Nome do cantor visível" : "Nome do cantor oculto"}><UserRound className={cn("size-4", showArtistName && "text-primary")} /></Button></div>
          <div className="mt-4"><Slider aria-label="Progresso da música" value={[p.currentTime]} max={p.duration || 1} step={0.5} disabled={!hasCurrent} onValueChange={([v]) => p.seek(v ?? 0)} /><div className="mt-2 flex justify-between text-[10px] tabular-nums text-muted-foreground sm:text-xs"><span>{formatTime(p.currentTime)}</span><span>{formatTime(p.duration || t?.duration)}</span></div></div>
          <div className="mt-2 flex items-center justify-between gap-0.5 sm:mt-4">
            <Button variant="ghost" size="icon" onClick={p.toggleShuffle} aria-label="Aleatório" aria-pressed={p.prefs.shuffle} className={cn("size-8 sm:size-10", p.prefs.shuffle && "text-primary")}><Shuffle /></Button>
            <Button variant="ghost" size="icon" disabled={!hasCurrent} onClick={p.prev} aria-label="Anterior" className="size-8 sm:size-10"><SkipBack className="fill-current" /></Button>
            {t ? <Button size="icon" onClick={startLibrary} aria-label={p.isPlaying ? "Pausar" : "Tocar"} className="size-11 shrink-0 rounded-full shadow-glow sm:size-14">{p.isPlaying ? <Pause className="fill-current" /> : <Play className="fill-current" />}</Button> : <Button asChild size="icon" className="size-11 shrink-0 rounded-full shadow-glow"><Link to="/biblioteca" aria-label="Escolher música"><Play /></Link></Button>}
            <Button variant="ghost" size="icon" disabled={!hasCurrent} onClick={p.next} aria-label="Próxima" className="size-8 sm:size-10"><SkipForward className="fill-current" /></Button>
            <Button variant="ghost" size="icon" onClick={p.cycleRepeat} aria-label={`Repetir: ${p.prefs.repeat}`} className={cn("size-8 sm:size-10", p.prefs.repeat !== "off" && "text-primary")}>{p.prefs.repeat === "one" ? <Repeat1 /> : <Repeat />}</Button>
          </div>
        </div>
      </div>
      {t?.license && <p className="mt-3 text-[10px] text-muted-foreground">{t.license}</p>}
    </section>
  );
}