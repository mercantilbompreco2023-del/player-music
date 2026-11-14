import { Link } from "@tanstack/react-router";
import { Cover } from "@/components/music/Cover";
import { AudioLines, Heart, ListMusic, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { usePlayer } from "@/lib/music/player-context";
import { formatTime } from "@/lib/music/queue";
import { cn } from "@/lib/utils";
import artwork from "@/assets/music-headphones.jpg";

export function HomePlayer() {
  const p = usePlayer();
  const libraryTracks = p.tracks.filter((track) => track.source === "local" || track.source === "cloud");
  const previewTrack = libraryTracks[0] ?? null;
  const t = p.current ?? previewTrack;
  const hasCurrent = !!p.current;
  const startLibrary = () => {
    if (hasCurrent) p.toggle();
    else if (libraryTracks.length) p.playList(libraryTracks.map((track) => track.id), previewTrack?.id);
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
        <Link to={t ? "/biblioteca" : "/importar"} aria-label={t ? "Ver biblioteca de músicas" : "Importar músicas"} className="overflow-hidden rounded-xl border border-primary/40">{t ? <Cover seed={t.id} className="aspect-square w-full rounded-none" iconClass="size-1/3" /> : <img src={artwork} alt="Fones de ouvido" width={1024} height={1024} className="aspect-square w-full object-cover" />}</Link>
        <div className="min-w-0">
          <h2 className="truncate text-base font-bold sm:text-2xl">{t?.title ?? "Sua música aqui"}</h2>
          <p className="mt-1 truncate text-xs text-muted-foreground sm:text-base">{t?.artist ?? "Sua biblioteca pessoal"}</p>
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