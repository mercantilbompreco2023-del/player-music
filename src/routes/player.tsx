import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ChevronDown, FolderOpen, Heart, ListMusic, Music2, Pause, Play, Plus, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, X, Download, Settings2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Cover } from "@/components/music/Cover";
import { CustomFolderCover } from "@/components/music/CustomFolderCover";
import { TrackVisual } from "@/components/music/TrackVisual";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/music/player-context";
import { formatTime } from "@/lib/music/queue";

export const Route = createFileRoute("/player")({
  head: () => ({
    meta: [
      { title: "Tocando agora — Player Music" },
      { name: "description", content: "Controles completos de reprodução e fila." },
      { property: "og:title", content: "Tocando agora — Player Music" },
      { property: "og:description", content: "Controles completos de reprodução e fila." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlayerPage,
});

function PlayerPage() {
  const p = usePlayer();
  const router = useRouter();
  const t = p.current;
  if (!t) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
        <p className="text-muted-foreground">Nada tocando no momento.</p>
        <Link to="/biblioteca" className="font-semibold text-primary">Escolher uma música</Link>
      </div>
    );
  }
  const fav = p.isFavorite(t.id);
  const upcoming = p.queue.map((id, pos) => ({ pos, track: p.byId(id) })).filter((x) => x.pos > p.index && x.track);

  return (
    <div className="player-purple player-immersive relative mx-auto min-h-[calc(100dvh-5rem)] max-w-xl space-y-6 overflow-hidden rounded-[2rem] border border-primary/25 px-4 pb-8 pt-3 text-foreground shadow-2xl shadow-primary/10 sm:px-6">
      <style>{"@keyframes pm-wave { 0%,100% { transform:scaleY(.28); opacity:.62 } 50% { transform:scaleY(1); opacity:1 } }"}</style>
      <div className="flex items-center justify-between gap-2 px-1">
        <button onClick={() => router.history.back()} aria-label="Voltar" className="rounded-full p-2"><ChevronDown className="size-6" /></button>
        <div className="text-center"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-primary">Tocando agora</p><p className="text-lg font-extrabold tracking-tight">Player <span className="text-primary">Music</span></p></div>
        <Link to="/biblioteca" aria-label="Buscar músicas" title="Buscar músicas" className="rounded-full p-2"><Music2 className="size-5" /></Link>
      </div>
      <div className="flex flex-col items-center gap-6 px-2 pt-5 text-center">
        <div className="w-[72vw] max-w-[320px] overflow-hidden rounded-[1.8rem] border border-primary/25 bg-card shadow-2xl shadow-primary/15 [&_img]:!rounded-[1.5rem]">
          <TrackVisual track={t} fallback={<CustomFolderCover artistName={t.artist} editable fallbackSeed={t.id} className="w-full rounded-full" />} />
        </div>
        <div className="flex w-full items-center gap-3 text-left"><div className="min-w-0 flex-1"><h1 className="line-clamp-2 break-words text-2xl font-extrabold leading-tight">{t.title?.trim() || t.path?.split("/").pop()?.replace(/\\.[^.]+$/, "") || "Faixa sem nome"}</h1><p className="mt-1 truncate text-base text-muted-foreground">{t.artist}</p>{t.license && <p className="mt-1 truncate text-xs text-muted-foreground">{t.license}</p>}<p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-primary">{t.source === "local" ? "Salva neste aparelho · Offline" : t.source === "cloud" ? "Biblioteca na nuvem" : "Faixa de demonstração"}</p></div><button onClick={() => p.toggleFavorite(t.id)} aria-label={fav ? "Remover dos favoritos" : "Favoritar"} className="rounded-full border border-primary/30 p-3"><Heart className={cn("size-7", fav && "fill-primary text-primary")} /></button></div>
      </div>
      <div aria-label="Visualização animada da música" className="flex h-9 items-center justify-center gap-[3px] overflow-hidden px-4">
        {Array.from({ length: 32 }, (_, i) => <span key={i} className="w-[5px] max-w-[2.2%] rounded-full bg-gradient-to-t from-emerald-500 via-primary to-lime-300 shadow-[0_0_9px_hsl(var(--primary)/.65)]" style={{ height: `${8 + ((i * 17 + 13) % 25)}px`, transformOrigin: "center", animation: `pm-wave ${0.55 + (i % 7) * 0.13}s ease-in-out ${i * 0.035}s infinite` }} />)}
      </div>
      <div className="px-1"><Slider aria-label="Progresso" value={[p.currentTime]} max={p.duration || 1} step={0.5} onValueChange={([v]) => p.seek(v ?? 0)} /><div className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground"><span>{formatTime(p.currentTime)}</span><span>{formatTime(p.duration || t.duration)}</span></div></div>
      <div className="flex items-center justify-between px-1">
        <button onClick={p.toggleShuffle} aria-label="Aleatório" title="Embaralhar músicas" aria-pressed={p.prefs.shuffle} className={cn("rounded-full p-2", p.prefs.shuffle ? "text-primary" : "text-muted-foreground")}><Shuffle className="size-6" /></button>
        <button onClick={p.prev} aria-label="Anterior" className="p-2"><SkipBack className="size-7 fill-current" /></button>
        <button onClick={p.toggle} aria-label={p.isPlaying ? "Pausar" : "Tocar"} className="flex size-[4.5rem] items-center justify-center rounded-full border border-primary/50 bg-primary text-primary-foreground shadow-[0_0_28px_hsl(var(--primary)/.45)]">{p.isPlaying ? <Pause className="size-7 fill-current" /> : <Play className="ml-1 size-7 fill-current" />}</button>
        <button onClick={p.next} aria-label="Próxima" className="p-2"><SkipForward className="size-7 fill-current" /></button>
        <button onClick={p.cycleRepeat} aria-label={`Repetir: ${{ off: "desligado", all: "fila", one: "uma música" }[p.prefs.repeat]}`} title="Alternar repetição" className={cn("p-2", p.prefs.repeat !== "off" ? "text-primary" : "text-muted-foreground")}>{p.prefs.repeat === "one" ? <Repeat1 className="size-6" /> : <Repeat className="size-6" />}</button>
      </div>
      <div className="grid grid-cols-2 gap-2 pt-1"><Link to="/configuracoes" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-2 py-3 text-xs font-semibold"><Settings2 className="size-4"/> Opções do player</Link><Link to="/armazenamento" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 px-2 py-3 text-xs font-semibold"><Download className="size-4"/> Salvar e organizar</Link></div><div className="grid grid-cols-3 gap-2 pt-1">
        <Link to="/fila" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/70 px-2 py-2.5 text-xs font-semibold"><ListMusic className="size-4" /> Fila ({p.queue.length})</Link>
        <Link to="/biblioteca" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/70 px-2 py-2.5 text-xs font-semibold"><Plus className="size-4" /> Adicionar</Link>
        <Link to="/pastas" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/70 px-2 py-2.5 text-xs font-semibold"><FolderOpen className="size-4" /> Pastas</Link>
      </div>
      <div className="sr-only"><span>{p.prefs.repeat === "one" ? "Repetindo esta música" : p.prefs.repeat === "all" ? "Repetindo a fila" : "Repetição desligada"}</span></div>
      <section>
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-bold">A seguir na fila</h2><Link to="/fila" className="text-sm font-semibold text-primary">Editar fila</Link></div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">{p.prefs.repeat === "all" ? "A fila recomeça do início." : "Fim da fila."}</p>
        ) : (
          upcoming.map(({ pos, track }) => (
            <div key={`${pos}-${track!.id}`} className="flex items-center gap-3 rounded-xl border-b border-primary/15 px-2 py-2 hover:bg-primary/10">
              <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => p.playAt(pos)}>
                <Cover seed={track!.id} className="size-10" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{track!.title}</p>
                  <p className="truncate text-xs text-muted-foreground">{track!.artist}</p>
                </div>
              </button>
              <button onClick={() => p.removeFromQueue(pos)} aria-label={`Tirar ${track!.title} da fila`} className="p-2 text-muted-foreground"><X className="size-4" /></button>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
