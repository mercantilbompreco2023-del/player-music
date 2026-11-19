import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ChevronDown, FolderOpen, Heart, ListMusic, Music2, Pause, Play, Plus, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, X, Download, Settings2, ShieldCheck, Library, Check } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Cover } from "@/components/music/Cover";
import { CustomFolderCover } from "@/components/music/CustomFolderCover";
import { TrackVisual } from "@/components/music/TrackVisual";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/music/player-context";
import { formatTime } from "@/lib/music/queue";
import { useIsAdmin, useSession } from "@/lib/auth";

export const Route = createFileRoute("/player")({
  head: () => ({
    meta: [
      { title: "Tocando agora — PLAYER MUSIC PRO" },
      { name: "description", content: "Controles completos de reprodução e fila." },
      { property: "og:title", content: "Tocando agora — PLAYER MUSIC PRO" },
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
  const { user } = useSession();
  const admin = useIsAdmin(user?.id);
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
  const normalizeArtist = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/nett?o/g, "neto").replace(/\s+/g, " ").trim();
  const netoTracks = p.tracks.filter((track) => track.source !== "demo" && normalizeArtist(track.artist).includes("neto brito"));

  return (
    <div className="player-purple player-immersive player-reworked player-exclusive relative mx-auto min-h-screen w-full max-w-none space-y-5 overflow-hidden rounded-none border-0 px-4 pb-10 pt-3 text-foreground shadow-none sm:px-6">
      <style>{"@keyframes pm-wave { 0%,100% { transform:scaleY(.28); opacity:.62 } 50% { transform:scaleY(1); opacity:1 } }"}</style>
      <div className="flex items-center justify-between gap-2 px-1">
        <button onClick={() => router.history.back()} aria-label="Voltar" className="rounded-full p-2"><ChevronDown className="size-6" /></button>
        <div className="text-center"><p className="text-[10px] font-bold uppercase tracking-[.22em] text-primary">Reprodutor de Música</p><p className="text-lg font-extrabold tracking-tight"><span className="bg-gradient-to-r from-fuchsia-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent">PLAYER MUSIC PRO</span></p></div>
        <div className="flex items-center gap-1.5">
          <Link to="/" title="Sair da interface de reprodução" className="inline-flex items-center gap-1 rounded-full border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-bold text-foreground hover:bg-primary/20">
            <ChevronDown className="size-4 rotate-90" /> <span>Sair da reprodução</span>
          </Link>
          {admin.data === true && <Link to="/admin" aria-label="Painel do ADM" title="Painel do ADM" className="rounded-full border border-amber-500/40 bg-amber-500/10 p-2 text-amber-500"><ShieldCheck className="size-5" /></Link>}
          <Link to="/biblioteca" aria-label="Buscar músicas" title="Buscar músicas" className="rounded-full p-2"><Music2 className="size-5" /></Link>
        </div>
      </div>
      <div className="player-main-layout grid grid-cols-1 items-center gap-5 px-1 pt-3 text-center md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8 md:text-left">
        <div className="player-artwork mx-auto w-[66vw] max-w-[290px] overflow-hidden rounded-[1.6rem] border border-primary/35 bg-card shadow-2xl shadow-primary/20 [&_img]:!rounded-[1.4rem]">
          <TrackVisual track={t} fallback={<CustomFolderCover artistName={t.artist} editable fallbackSeed={t.id} className="w-full rounded-full" />} />
        </div>
        <div className="flex w-full items-center gap-3 text-left md:items-start"><div className="min-w-0 flex-1"><h1 className="line-clamp-2 break-words text-2xl font-black leading-tight sm:text-3xl">{t.title?.trim() || t.path?.split("/").pop()?.replace(/\\.[^.]+$/, "") || "Faixa sem nome"}</h1><p className="mt-1 truncate text-base text-muted-foreground">{t.artist}</p>{t.license && <p className="mt-1 truncate text-xs text-muted-foreground">{t.license}</p>}<p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-primary">{t.source === "local" ? "Salva neste aparelho · Offline" : t.source === "cloud" ? "Biblioteca na nuvem" : t.source === "official" ? "Música oficial · disponível para baixar" : "Faixa de demonstração"}</p></div><button onClick={() => p.toggleFavorite(t.id)} aria-label={fav ? "Remover dos favoritos" : "Favoritar"} className="rounded-full border border-primary/30 p-3"><Heart className={cn("size-7", fav && "fill-primary text-primary")} /></button></div>
      </div>
      <div aria-label="Visualização animada da música" className="player-waveform mx-auto flex h-12 items-center justify-center gap-[3px] overflow-hidden rounded-2xl border border-primary/20 bg-primary/5 px-4 md:max-w-xl">
        {Array.from({ length: 32 }, (_, i) => <span key={i} className="w-[5px] max-w-[2.2%] rounded-full bg-gradient-to-t from-emerald-500 via-primary to-lime-300 shadow-[0_0_9px_hsl(var(--primary)/.65)]" style={{ height: `${8 + ((i * 17 + 13) % 25)}px`, transformOrigin: "center", animation: `pm-wave ${0.55 + (i % 7) * 0.13}s ease-in-out ${i * 0.035}s infinite` }} />)}
      </div>
      <div className="player-progress-panel rounded-2xl border border-primary/20 bg-card/70 p-4 px-3"><Slider aria-label="Progresso" value={[p.currentTime]} max={p.duration || 1} step={0.5} onValueChange={([v]) => p.seek(v ?? 0)} /><div className="mt-2 flex justify-between text-xs tabular-nums text-muted-foreground"><span>{formatTime(p.currentTime)}</span><span>{formatTime(p.duration || t.duration)}</span></div></div>
      <div className="player-controls flex items-center justify-between rounded-2xl border border-primary/20 bg-card/65 px-2 py-3 sm:px-5">
        <button onClick={p.toggleShuffle} aria-label="Aleatório" title="Embaralhar músicas" aria-pressed={p.prefs.shuffle} className={cn("rounded-full p-2", p.prefs.shuffle ? "text-primary" : "text-muted-foreground")}><Shuffle className="size-6" /></button>
        <button onClick={p.prev} aria-label="Anterior" className="p-2"><SkipBack className="size-7 fill-current" /></button>
        <button onClick={p.toggle} aria-label={p.isPlaying ? "Pausar" : "Tocar"} className="flex size-[4.5rem] items-center justify-center rounded-full border border-primary/50 bg-primary text-primary-foreground shadow-[0_0_28px_hsl(var(--primary)/.45)]">{p.isPlaying ? <Pause className="size-7 fill-current" /> : <Play className="ml-1 size-7 fill-current" />}</button>
        <button onClick={p.next} aria-label="Próxima" className="p-2"><SkipForward className="size-7 fill-current" /></button>
        <button onClick={p.cycleRepeat} aria-label={`Repetir: ${{ off: "desligado", all: "fila", one: "uma música" }[p.prefs.repeat]}`} title="Alternar repetição" className={cn("p-2", p.prefs.repeat !== "off" ? "text-primary" : "text-muted-foreground")}>{p.prefs.repeat === "one" ? <Repeat1 className="size-6" /> : <Repeat className="size-6" />}</button>
      </div>
      <div className="grid grid-cols-1 gap-2 pt-1 sm:grid-cols-3">
        <button type="button" onClick={() => { void p.saveTrackLocally(t.id); }} disabled={t.source === "demo" || t.source === "local"} className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-3 text-sm font-bold text-emerald-300 disabled:opacity-60">
          {t.source === "local" ? <Check className="size-4"/> : <Library className="size-4"/>}
          {t.source === "local" ? "Salva na biblioteca" : "Salvar na biblioteca"}
        </button>
        <Link to="/biblioteca" className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-3 py-3 text-sm font-semibold"><Library className="size-4"/> Abrir biblioteca</Link>
        <Link to="/armazenamento" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 px-2 py-3 text-xs font-semibold"><Download className="size-4"/> Salvar e organizar</Link>
      </div><div className="grid grid-cols-2 gap-2 pt-1"><Link to="/configuracoes" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 bg-primary/10 px-2 py-3 text-xs font-semibold"><Settings2 className="size-4"/> Opções do player</Link><Link to="/armazenamento" className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-primary/40 px-2 py-3 text-xs font-semibold"><Download className="size-4"/> Salvar e organizar</Link></div><div className="grid grid-cols-3 gap-2 pt-1">
        <Link to="/fila" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/70 px-2 py-2.5 text-xs font-semibold"><ListMusic className="size-4" /> Fila ({p.queue.length})</Link>
        <Link to="/biblioteca" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/70 px-2 py-2.5 text-xs font-semibold"><Plus className="size-4" /> Adicionar</Link>
        <Link to="/pastas" className="inline-flex items-center justify-center gap-1.5 rounded-full border border-primary/70 px-2 py-2.5 text-xs font-semibold"><FolderOpen className="size-4" /> Pastas</Link>
      </div>
      <div className="sr-only"><span>{p.prefs.repeat === "one" ? "Repetindo esta música" : p.prefs.repeat === "all" ? "Repetindo a fila" : "Repetição desligada"}</span></div>
      <section className="rounded-3xl border border-primary/35 bg-gradient-to-br from-primary/15 via-card to-card p-4">
        <div className="mb-3 flex items-center gap-3">
          <CustomFolderCover artistName="Neto Brito" editable entityLabel="pasta do cantor" className="w-20 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[.18em] text-primary">Pasta do cantor</p>
            <h2 className="text-xl font-extrabold">Neto Brito</h2>
            <p className="text-xs text-muted-foreground">{netoTracks.length} música(s) na biblioteca deste aparelho</p>
          </div>
        </div>
        {netoTracks.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <button onClick={() => p.playList(netoTracks.map((track) => track.id), netoTracks[0]?.id, "ordered")} className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><Play className="size-4 fill-current" /> Ouvir Neto Brito</button>
            <button onClick={() => p.addManyToQueue(netoTracks.map((track) => track.id))} className="inline-flex items-center justify-center gap-2 rounded-full border border-primary/50 px-4 py-2.5 text-sm font-semibold"><ListMusic className="size-4" /> Adicionar à fila</button>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">As músicas de Neto Brito aparecerão nesta pasta assim que forem publicadas pelo ADM ou importadas para a biblioteca.</p>
        )}
      </section>
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
