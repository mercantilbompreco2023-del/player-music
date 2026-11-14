import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ChevronDown, Heart, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume1, Volume2, VolumeX, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Cover } from "@/components/music/Cover";
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
  const VolIcon = p.prefs.volume === 0 ? VolumeX : p.prefs.volume < 0.5 ? Volume1 : Volume2;
  const upcoming = p.queue.map((id, pos) => ({ pos, track: p.byId(id) })).filter((x) => x.pos > p.index && x.track);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => router.history.back()} aria-label="Voltar" className="rounded-full p-2"><ChevronDown className="size-6" /></button>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tocando agora</p>
        <span className="size-10" />
      </div>

      <Cover seed={t.id} className="mx-auto aspect-square w-full max-w-sm rounded-3xl shadow-glow" iconClass="size-1/4" />

      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-2xl font-bold">{t.title}</h1>
          <p className="truncate text-muted-foreground">{t.artist}</p>
          {t.license && <p className="mt-1 text-xs text-muted-foreground">{t.license}</p>}
        </div>
        <button onClick={() => p.toggleFavorite(t.id)} aria-label={fav ? "Remover dos favoritos" : "Favoritar"} className="p-2">
          <Heart className={cn("size-7", fav && "fill-primary text-primary")} />
        </button>
      </div>

      <div>
        <Slider aria-label="Progresso" value={[p.currentTime]} max={p.duration || 1} step={0.5} onValueChange={([v]) => p.seek(v ?? 0)} />
        <div className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground">
          <span>{formatTime(p.currentTime)}</span>
          <span>{formatTime(p.duration || t.duration)}</span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <button onClick={p.toggleShuffle} aria-label="Aleatório" aria-pressed={p.prefs.shuffle} className={cn("p-2", p.prefs.shuffle ? "text-primary" : "text-muted-foreground")}>
          <Shuffle className="size-6" />
        </button>
        <button onClick={p.prev} aria-label="Anterior" className="p-2"><SkipBack className="size-8 fill-current" /></button>
        <button onClick={p.toggle} aria-label={p.isPlaying ? "Pausar" : "Tocar"} className="flex size-18 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow">
          {p.isPlaying ? <Pause className="size-8 fill-current" /> : <Play className="ml-1 size-8 fill-current" />}
        </button>
        <button onClick={p.next} aria-label="Próxima" className="p-2"><SkipForward className="size-8 fill-current" /></button>
        <button
          onClick={p.cycleRepeat}
          aria-label={`Repetir: ${{ off: "desligado", all: "todas", one: "uma" }[p.prefs.repeat]}`}
          className={cn("p-2", p.prefs.repeat !== "off" ? "text-primary" : "text-muted-foreground")}
        >
          {p.prefs.repeat === "one" ? <Repeat1 className="size-6" /> : <Repeat className="size-6" />}
        </button>
      </div>

      <div className="flex items-center gap-3">
        <button onClick={() => p.setVolume(p.prefs.volume === 0 ? 0.8 : 0)} aria-label="Silenciar" className="text-muted-foreground"><VolIcon className="size-5" /></button>
        <Slider aria-label="Volume" value={[p.prefs.volume]} max={1} step={0.01} onValueChange={([v]) => p.setVolume(v ?? 0)} />
      </div>
      <p className="text-xs text-muted-foreground">No Android, o volume físico do aparelho também controla o som.</p>

      <section>
        <div className="mb-2 flex items-center justify-between"><h2 className="text-lg font-bold">A seguir na fila</h2><Link to="/fila" className="text-sm font-semibold text-primary">Editar fila</Link></div>
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">{p.prefs.repeat === "all" ? "A fila recomeça do início." : "Fim da fila."}</p>
        ) : (
          upcoming.map(({ pos, track }) => (
            <div key={`${pos}-${track!.id}`} className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-accent/60">
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
