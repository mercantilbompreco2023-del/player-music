import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FolderOpen, Heart, Music, Play, Plus, Search, Settings, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArtistPhoto, HomePlayer } from "@/components/music/HomePlayer";
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
  const list = cards.data ? visibleCards(cards.data.cards, admin.data === true).filter(c => c.function_key !== "descobrir" && c.function_key !== "buscar") : [];
  const ownTracks = p.tracks.filter(t => t.source !== "demo");
  const artists = [...new Set(ownTracks.map(t => t.artist))];
  return (
    <div className="home-purple space-y-6">
      <header className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3"><img src={playerIcon} alt="" width={44} height={44} className="size-10 rounded-xl" /><div className="min-w-0"><p className="text-xs text-muted-foreground">Bom dia!</p><h1 className="truncate text-xl font-extrabold">Player <span className="text-primary">Music</span></h1></div></div>
        <div className="flex shrink-0 items-center gap-1"><Button asChild size="icon" variant="ghost"><Link to="/buscar" aria-label="Buscar músicas"><Search /></Link></Button><Button asChild size="icon" variant="ghost"><Link to="/configuracoes" aria-label="Configurações"><Settings /></Link></Button></div>
      </header>
      <section className="space-y-2"><h2 className="text-lg font-bold">Tocando agora</h2><HomePlayer variant="classic" /></section>
      <section className="relative min-h-40 overflow-hidden rounded-[1.7rem] border border-primary/30 bg-gradient-to-r from-primary/25 via-card to-background p-5 shadow-[0_12px_36px_-18px_hsl(var(--primary)/.65)]">
        <img src={artwork} alt="" className="absolute inset-y-0 right-0 h-full w-2/3 object-cover opacity-45 [mask-image:linear-gradient(to_right,transparent,black)]" />
        <div className="relative z-10 max-w-[70%]"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.22em] text-primary">Sua música, seu momento</p><h2 className="text-2xl font-extrabold leading-tight">Descubra suas músicas favoritas</h2><p className="mt-2 text-xs text-muted-foreground">Sua coleção sempre com você.</p><Button asChild size="sm" className="mt-4 rounded-full"><Link to="/biblioteca"><Headphones className="size-4" /> Começar a ouvir</Link></Button></div>
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between"><h2 className="text-lg font-bold">Cantores e sucessos</h2><span className="text-xs text-muted-foreground">Abrir músicas oficiais</span></div>
        <div className="space-y-3">
          {[
            {artist:"Ana Castela", songs:["Nosso Quadro","Pipoco","Solteiro Forçado","Dona de Mim","Bombonzinho"]},
            {artist:"Nadson O Ferinha", songs:["Cadê Seu Namorado Moça?","Sinal","Não Digita","Ponta do Pé","Só Falta Eu"]},
            {artist:"João Gomes", songs:["Meu Pedaço de Pecado","Dengo","Se For Amor"]},
            {artist:"Luan Pereira", songs:["Dentro da Hilux","Ela Pirou na Dodge Ram","Morena"]},
            {artist:"Mari Fernandez", songs:["Comunicação Falhou","Não, Não Vou","Parada Louca"]},
            {artist:"Zé Vaqueiro", songs:["Letícia","Tenho Medo","Volta Comigo BB"]},
            {artist:"Netto Brito", songs:[]},
            {artist:"Marília Tavares", songs:[]},
            {artist:"Theuzinho", songs:[]}
          ].map((group) => <article key={group.artist} className="flex gap-3 rounded-2xl border border-primary/20 bg-card/70 p-3">
            <div className="w-24 shrink-0 overflow-hidden rounded-xl border border-primary/20">
              <ArtistPhoto artist={group.artist} fallbackSeed={`artist-${group.artist}`} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-2 font-bold">{group.artist}</h3>
              <div className="flex flex-wrap gap-2">{group.songs.map((song) => <a key={song} href={`https://www.youtube.com/results?search_query=${encodeURIComponent(group.artist+" "+song+" oficial")}`} target="_blank" rel="noreferrer" className="rounded-full border border-primary/30 px-3 py-2 text-xs font-medium hover:bg-primary/10">{song} ↗</a>)}</div>
            </div>
          </article>)}
        </div>
        <p className="text-[11px] text-muted-foreground">Os links abrem resultados de músicas oficiais no YouTube. Para tocar dentro do Player Music, importe os arquivos de áudio que você possui ou tem autorização para usar.</p>
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
          return <Button asChild variant="outline" key={c.id} className="neon-tile h-auto min-h-28 flex-col gap-2 whitespace-normal px-1 py-3 text-center sm:px-3"><Link preload="intent" to={FUNCTIONS[key].route} aria-label={`${c.title}: ${c.description}`}><Icon className="size-7! text-primary" /><span className="w-full break-words text-[11px] font-bold leading-snug sm:text-sm">{c.title}</span></Link></Button>;
        })}
        <Button asChild variant="outline" className="neon-tile h-auto min-h-28 flex-col gap-2 whitespace-normal px-1 py-3 text-center"><Link to="/pastas"><FolderOpen className="size-7! text-primary" /><span className="text-[11px] font-bold sm:text-sm">Pastas</span><span className="text-[10px] text-muted-foreground">{folders.length} salvas</span></Link></Button>
      </nav>
      <section className="space-y-3">
        <div className="mb-4 flex items-center justify-between gap-2"><h2 className="section-heading text-lg font-bold">Seus artistas</h2><Link to="/buscar" className="text-xs text-primary">Ver todos ›</Link></div>
        {artists.length ? <div className="flex gap-4 overflow-x-auto pb-2">{artists.map(artist => { const tracks = ownTracks.filter(t => t.artist === artist); const first = tracks[0]; return <Button key={artist} variant="ghost" className="h-auto w-20 shrink-0 flex-col gap-2 whitespace-normal p-0 hover:bg-transparent" onClick={() => first && p.playList(tracks.map(t => t.id), first.id)} aria-label={`Ouvir ${artist}`}><div className="w-18 overflow-hidden rounded-full border-2 border-primary shadow-[0_0_14px_-5px_hsl(var(--primary)/0.8)]"><ArtistPhoto artist={artist} fallbackSeed={artist} /></div><span className="w-full break-words text-center text-xs">{artist}</span></Button>; })}</div> : <Button asChild variant="outline" className="w-full justify-start gap-3"><Link to="/importar"><Plus /> Adicionar minhas músicas</Link></Button>}
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between gap-2"><h2 className="section-heading text-lg font-bold">Playlists favoritas</h2><Link to="/playlists" className="flex items-center gap-1 text-xs text-primary"><Plus className="size-4" /> Nova playlist</Link></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {p.prefs.playlists.map(pl => <article key={pl.id} className="neon-tile flex items-center gap-3 rounded-lg border p-3"><Link to="/playlists/$id" params={{id: pl.id}} className="flex min-w-0 flex-1 items-center gap-3"><img src={artwork} alt="" width={1024} height={1024} loading="lazy" className="size-18 rounded-lg object-cover" /><div className="min-w-0"><h3 className="truncate text-sm font-bold">{pl.name}</h3><p className="mt-1 text-xs text-muted-foreground">{pl.trackIds.length} músicas</p></div></Link><Button size="icon" disabled={!pl.trackIds.some(id => p.byId(id))} className="shrink-0 rounded-full" onClick={() => p.playList(pl.trackIds.filter(id => p.byId(id)))} aria-label={`Ouvir playlist ${pl.name}`}><Play className="fill-current" /></Button></article>)}
          {!p.prefs.playlists.length && <Link to="/playlists" className="neon-tile flex items-center gap-4 rounded-lg border p-3"><img src={artwork} alt="" width={1024} height={1024} loading="lazy" className="size-20 rounded-lg object-cover" /><div><h3 className="font-bold">Minha primeira playlist</h3><span className="text-xs text-primary">Criar playlist ›</span></div></Link>}
        </div>
      </section>
      <p className="pb-2 text-center text-xs font-semibold text-primary">Feito por Adevaldo Marques</p>
    </div>
  );
}
