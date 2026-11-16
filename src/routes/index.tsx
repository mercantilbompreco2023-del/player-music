import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FolderOpen, Heart, Music, Play, Plus, Search, Settings, Headphones, Smartphone, ListMusic, Shuffle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HomePlayer } from "@/components/music/HomePlayer";
import { PhoneMusicSync } from "@/components/music/PhoneMusicSync";
import { ImportButton } from "@/components/music/ImportButton";
import { FolderImport } from "@/components/music/FolderImport";
import { Cover } from "@/components/music/Cover";
import { cardsQuery } from "@/lib/cards-query";
import { FUNCTIONS, ICONS, isFunctionKey, visibleCards } from "@/lib/cards";
import { useIsAdmin, useSession } from "@/lib/auth";
import { usePlayer } from "@/lib/music/player-context";
import { cn } from "@/lib/utils";
import { savedFolders } from "@/lib/music/folders";
import playerIcon from "@/assets/player-music-icon.jpg";
import artwork from "@/assets/music-headphones.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Player Music — Início" },
      { name: "description", content: "Ouça seus próprios arquivos de áudio com playlists, favoritos e fila." },
      { property: "og:title", content: "Player Music" },
      { property: "og:description", content: "Ouça seus próprios arquivos de áudio com playlists, favoritos e fila." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const p = usePlayer();
  const [category, setCategory] = useState("Todas");
  const { user } = useSession();
  const admin = useIsAdmin(user?.id);
  const cards = useQuery(cardsQuery);
  const folders = savedFolders(p.tracks);
  const phoneTracks = p.tracks.filter(t => t.source !== "demo" && (t.folderName === "Músicas do celular" || t.path?.startsWith("Músicas do celular/")));
  const list = cards.data ? visibleCards(cards.data.cards, admin.data === true).filter(c => c.function_key !== "descobrir" && c.function_key !== "buscar") : [];
  const ownTracks = p.tracks.filter(t => t.source !== "demo");
  return (
    <div className="home-purple space-y-7 pb-3">
      <header className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/70 px-3 py-3 shadow-sm backdrop-blur">
        <div className="flex min-w-0 items-center gap-3"><img src={playerIcon} alt="" width={44} height={44} className="size-11 rounded-2xl ring-1 ring-primary/20" /><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Seu som. Seu espaço.</p><h1 className="truncate text-xl font-extrabold tracking-tight">Player <span className="text-primary">Music</span></h1></div></div>
        <div className="flex shrink-0 items-center gap-1"><Button asChild size="icon" variant="ghost"><Link to="/buscar" aria-label="Buscar músicas"><Search /></Link></Button><Button asChild size="icon" variant="ghost"><Link to="/configuracoes" aria-label="Configurações"><Settings /></Link></Button></div>
      </header>
      <section className="space-y-3"><div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">Experiência de áudio</p><h2 className="text-xl font-extrabold tracking-tight">Tocando agora</h2></div><Link to="/player" className="text-xs font-semibold text-primary">Abrir player ↗</Link></div><HomePlayer variant="showcase" /></section>
      <section className="grid gap-3 sm:grid-cols-2" aria-label="Opções de reprodução">
        <article className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
          <div className="mb-3 flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><FolderOpen className="size-6" /></div><div><h2 className="font-bold">Reproduzir por pasta</h2><p className="text-xs text-muted-foreground">{folders.length} pasta(s) disponível(is)</p></div></div>
          <p className="mb-3 text-sm text-muted-foreground">Escolha uma pasta e toque todas as músicas em sequência ou aleatoriamente.</p>
          <Button asChild className="w-full rounded-full"><Link to="/pastas"><FolderOpen /> Abrir pastas</Link></Button>
        </article>
        <article className="rounded-2xl border border-border/80 bg-card p-4 shadow-sm transition-transform duration-200 hover:-translate-y-0.5">
          <div className="mb-3 flex items-center gap-3"><div className="flex size-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400"><Smartphone className="size-6" /></div><div><h2 className="font-bold">Músicas do celular</h2><p className="text-xs text-muted-foreground">{phoneTracks.length} música(s) vinculada(s)</p></div></div>
          <p className="mb-3 text-sm text-muted-foreground">Reproduza a coleção importada do armazenamento do seu aparelho.</p>
          {phoneTracks.length > 0 ? <div className="grid grid-cols-2 gap-2"><Button className="rounded-full" onClick={() => p.playList(phoneTracks.map(t => t.id), undefined, "ordered")}><Play /> Reproduzir</Button><Button variant="secondary" className="rounded-full" onClick={() => p.playList(phoneTracks.map(t => t.id), undefined, "shuffle")}><Shuffle /> Aleatório</Button></div> : <Button asChild variant="outline" className="w-full rounded-full"><Link to="/importar"><Smartphone /> Vincular músicas</Link></Button>}
        </article>
      </section>
      <section id="gerenciar-musicas" className="space-y-4 rounded-3xl border border-border/80 bg-card p-4 shadow-sm sm:p-5">
        <div>
          <h2 className="text-xl font-extrabold">Gerenciar músicas</h2>
          <p className="mt-1 text-sm text-muted-foreground">Faça tudo por aqui, sem precisar entrar em uma conta. Suas músicas ficam salvas neste aparelho.</p>
        </div>
        <PhoneMusicSync />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-sky-500/40 bg-sky-500/5 p-4 text-center">
            <div><h3 className="font-bold">Adicionar músicas</h3><p className="mt-1 text-xs text-muted-foreground">Escolha uma ou várias músicas do celular.</p></div>
            <ImportButton />
          </div>
          <FolderImport />
        </div>
      </section>
      <section className="relative min-h-40 overflow-hidden rounded-[1.7rem] border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-5 shadow-sm">
        <img src={artwork} alt="" className="absolute inset-y-0 right-0 h-full w-2/3 object-cover opacity-25 [mask-image:linear-gradient(to_right,transparent,black)]" />
        <div className="relative z-10 max-w-[70%]"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.22em] text-primary">Sua música, seu momento</p><h2 className="text-2xl font-extrabold leading-tight">Descubra suas músicas favoritas</h2><p className="mt-2 text-xs text-muted-foreground">Sua coleção sempre com você.</p><Button asChild size="sm" className="mt-4 rounded-full"><Link to="/biblioteca"><Headphones className="size-4" /> Começar a ouvir</Link></Button></div>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Categorias</h2><Link to="/biblioteca" className="text-xs font-semibold text-primary">Ver todas</Link></div>
        <div className="flex gap-2 overflow-x-auto pb-1">{["Todas","Favoritas","Recentes","Artistas"].map((item) => <button key={item} onClick={() => setCategory(item)} className={cn("shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-colors", category===item ? "border-primary bg-primary text-primary-foreground shadow-glow" : "border-border bg-card/70 text-muted-foreground")}>{item}</button>)}</div>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Músicas populares</h2><Link to="/biblioteca" className="text-xs font-semibold text-primary">Ver todas ›</Link></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {(category==="Favoritas" ? ownTracks.filter(t=>p.isFavorite(t.id)) : category==="Recentes" ? [...ownTracks].reverse() : category==="Artistas" ? ownTracks.filter((t,i)=>ownTracks.findIndex(x=>x.artist===t.artist)===i) : ownTracks).slice(0,6).map((track) => <button key={track.id} onClick={() => p.playList(ownTracks.map(t=>t.id),track.id)} className="group min-w-0 text-left">
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-sm"><Cover seed={track.id} className="aspect-square w-full rounded-none" /><span className="absolute bottom-2 right-2 flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground opacity-95 shadow-glow"><Play className="size-4 fill-current" /></span></div>
            <p className="mt-2 truncate text-sm font-bold">{track.title}</p><p className="truncate text-xs text-muted-foreground">{track.artist}</p>
          </button>)}
          {!ownTracks.length && <Link to="/importar" className="col-span-2 rounded-2xl border border-dashed border-primary/40 p-5 text-sm text-muted-foreground">Adicione suas músicas para montar sua coleção.</Link>}
        </div>
      </section>
      {cards.data && cards.data.source !== "servidor" && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="size-4 shrink-0" /> Cartões salvos no aparelho.</p>}
      <nav aria-label="Funções do app" className="grid grid-cols-4 gap-2 sm:gap-3">
        {cards.isPending ? Array.from({length: 4}, (_, i) => <Skeleton key={i} className="h-28" />) : list.map(c => {
          if (!isFunctionKey(c.function_key)) return null;
          const key = c.function_key;
          const Icon = ICONS[c.icon] ?? Music;
          return <Button asChild variant="outline" key={c.id} className="h-auto min-h-28 flex-col gap-2 whitespace-normal rounded-2xl border border-border/80 bg-card px-1 py-3 text-center shadow-sm transition-all hover:border-primary/50 hover:bg-accent/40 sm:px-3"><Link preload="intent" to={FUNCTIONS[key].route} aria-label={`${c.title}: ${c.description}`}><Icon className="size-7! text-primary" /><span className="w-full break-words text-[11px] font-bold leading-snug sm:text-sm">{c.title}</span></Link></Button>;
        })}
        <Button asChild variant="outline" className="neon-tile h-auto min-h-28 flex-col gap-2 whitespace-normal px-1 py-3 text-center"><Link to="/pastas"><FolderOpen className="size-7! text-primary" /><span className="text-[11px] font-bold sm:text-sm">Pastas</span><span className="text-[10px] text-muted-foreground">{folders.length} salvas</span></Link></Button>
      </nav>
      <section>
        <div className="mb-4 flex items-center justify-between gap-2"><h2 className="section-heading text-lg font-bold">Playlists favoritas</h2><Link to="/playlists" className="flex items-center gap-1 text-xs text-primary"><Plus className="size-4" /> Nova playlist</Link></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {p.prefs.playlists.map(pl => <article key={pl.id} className="flex items-center gap-3 rounded-2xl border border-border/80 bg-card p-3 shadow-sm"><Link to="/playlists/$id" params={{id: pl.id}} className="flex min-w-0 flex-1 items-center gap-3"><img src={artwork} alt="" width={1024} height={1024} loading="lazy" className="size-18 rounded-lg object-cover" /><div className="min-w-0"><h3 className="truncate text-sm font-bold">{pl.name}</h3><p className="mt-1 text-xs text-muted-foreground">{pl.trackIds.length} músicas</p></div></Link><Button size="icon" disabled={!pl.trackIds.some(id => p.byId(id))} className="shrink-0 rounded-full" onClick={() => p.playList(pl.trackIds.filter(id => p.byId(id)))} aria-label={`Ouvir playlist ${pl.name}`}><Play className="fill-current" /></Button></article>)}
          {!p.prefs.playlists.length && <Link to="/playlists" className="neon-tile flex items-center gap-4 rounded-lg border p-3"><img src={artwork} alt="" width={1024} height={1024} loading="lazy" className="size-20 rounded-lg object-cover" /><div><h3 className="font-bold">Minha primeira playlist</h3><span className="text-xs text-primary">Criar playlist ›</span></div></Link>}
        </div>
      </section>
      <p className="pb-2 text-center text-xs font-semibold text-primary">Feito por Adevaldo Marques</p>
    </div>
  );
}
