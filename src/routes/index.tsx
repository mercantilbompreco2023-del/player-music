import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FolderOpen, Heart, Music, Play, Plus, Search, Settings, Headphones, Smartphone, ListMusic, Shuffle, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { HomePlayer, ArtistPhoto } from "@/components/music/HomePlayer";
import { PhoneMusicSync } from "@/components/music/PhoneMusicSync";
import { ImportButton } from "@/components/music/ImportButton";
import { FolderImport } from "@/components/music/FolderImport";
import { Cover } from "@/components/music/Cover";
import { TrackRow } from "@/components/music/TrackRow";
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
      { title: "Música Player Pro — Início" },
      { name: "description", content: "Ouça seus próprios arquivos de áudio com playlists, favoritos e fila." },
      { property: "og:title", content: "Música Player Pro" },
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
    <div className="home-streaming space-y-8 pb-5">
      <header className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <img src={playerIcon} alt="" width={46} height={46} className="size-11 rounded-2xl object-cover shadow-lg ring-1 ring-primary/25" />
          <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-primary">DELÍCIA COXI’S MUSIC & VIDEO</p><h1 className="truncate text-2xl font-extrabold tracking-tight">Music & Video</h1></div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button asChild size="icon" variant="ghost"><Link to="/buscar" aria-label="Buscar músicas"><Search /></Link></Button>
          <Button asChild size="icon" variant="ghost"><Link to="/configuracoes" aria-label="Configurações"><Settings /></Link></Button>
        </div>
      </header>

      <section className="rounded-3xl border border-primary/35 bg-gradient-to-r from-[#10271a] to-[#09120d] p-3 shadow-[0_12px_36px_-24px_rgba(34,197,94,.65)]">
        <div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[.2em] text-primary">Tocando agora</span><Link to="/player" className="text-xs font-semibold text-primary">Abrir reprodução ↗</Link></div>
        <HomePlayer />
      </section>

      <section className="streaming-feature relative isolate overflow-hidden rounded-[1.8rem] border border-primary/35 bg-[#07110b] shadow-2xl shadow-primary/10">
        <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/70 to-black/10"/>
        <div className="relative grid min-h-[230px] grid-cols-[minmax(0,1fr)_42%] items-center gap-2 p-4 sm:min-h-[290px] sm:p-6">
          <div className="z-10 min-w-0 space-y-3">
            <p className="text-[10px] font-black uppercase tracking-[.24em] text-primary">Top músicas e vídeos</p>
            <h2 className="text-3xl font-black leading-[.95] tracking-tight sm:text-5xl">{ownTracks[0]?.artist || "Sua música"}</h2>
            <p className="text-xs font-bold uppercase tracking-wider text-white/80 sm:text-sm">Biblioteca atualizada</p>
            <p className="line-clamp-2 text-xs text-white/70 sm:text-sm">{ownTracks[0]?.title || "Suas músicas favoritas em um só lugar"}</p>
            <Button disabled={!ownTracks.length} onClick={()=>p.playList(ownTracks.map(track=>track.id),ownTracks[0]?.id)} className="rounded-full bg-primary px-5 font-extrabold text-primary-foreground shadow-[0_0_24px_-6px_var(--primary)]"><Play className="mr-1 size-4 fill-current"/> Ouvir agora</Button>
          </div>
          <div className="relative -mr-3 aspect-[4/5] overflow-hidden rounded-2xl border border-primary/35 shadow-xl sm:-mr-4">
            {ownTracks[0] ? <ArtistPhoto artist={ownTracks[0].artist} fallbackSeed={ownTracks[0].id}/> : <img src={artwork} alt="Player Music" className="size-full object-cover"/>}
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 to-transparent"/>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Acesso rápido">
        <Link to="/biblioteca" className="streaming-shortcut"><span className="streaming-shortcut-icon"><Headphones /></span><span><b>Biblioteca</b><small>{ownTracks.length} músicas</small></span></Link>
        <Link to="/pastas" className="streaming-shortcut"><span className="streaming-shortcut-icon"><FolderOpen /></span><span><b>Pastas</b><small>{folders.length} pastas</small></span></Link>
        <Link to="/videos" className="streaming-shortcut"><span className="streaming-shortcut-icon"><Video /></span><span><b>Vídeos</b><small>Clipes e shows</small></span></Link>
        <Link to="/playlists" className="streaming-shortcut"><span className="streaming-shortcut-icon"><ListMusic /></span><span><b>Playlists</b><small>{p.prefs.playlists.length} listas</small></span></Link>
      </section>

      <section className="space-y-3 rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/15 via-card to-card p-4">
        <div className="flex items-center justify-between gap-2"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Artistas da sua biblioteca</p><h2 className="text-xl font-extrabold">Cantores em destaque</h2></div><Link to="/biblioteca" className="text-xs font-semibold text-primary">Ver todos ›</Link></div>
        <div className="flex gap-4 overflow-x-auto pb-1">
          {ownTracks.filter((track,index,all)=>all.findIndex(item=>item.artist.trim().toLocaleLowerCase("pt-BR")===track.artist.trim().toLocaleLowerCase("pt-BR"))===index).slice(0,10).map(artist=>{
            const artistTracks=ownTracks.filter(track=>track.artist.trim().toLocaleLowerCase("pt-BR")===artist.artist.trim().toLocaleLowerCase("pt-BR"));
            return <button key={artist.artist} onClick={()=>p.playList(artistTracks.map(track=>track.id),artistTracks[0]?.id)} className="flex w-24 shrink-0 flex-col items-center gap-2 text-center">
              <span className="block size-20 overflow-hidden rounded-full border-2 border-primary/60 p-1 shadow-[0_0_18px_-8px_var(--primary)]"><ArtistPhoto artist={artist.artist} fallbackSeed={artist.id}/></span>
              <span className="w-full truncate text-xs font-bold">{artist.artist}</span><span className="text-[10px] text-muted-foreground">{artistTracks.length} músicas</span>
            </button>;
          })}
          {!ownTracks.length && <p className="text-sm text-muted-foreground">Seus cantores aparecem aqui depois que você importar músicas.</p>}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Sua biblioteca</p><h2 className="text-xl font-extrabold">Últimos adicionados</h2></div><Link to="/biblioteca" className="text-xs font-semibold text-primary">Ver todos ›</Link></div>
        <div className="space-y-2">
          {[...ownTracks].slice(-5).reverse().map(track => <TrackRow key={track.id} track={track} list={ownTracks.map(item=>item.id)} />)}
          {!ownTracks.length && <Link to="/importar" className="flex min-h-24 items-center justify-center rounded-2xl border border-dashed border-primary/35 p-4 text-sm text-muted-foreground">Importe suas músicas para vê-las aqui.</Link>}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Sua seleção</p><h2 className="text-xl font-extrabold">Favoritas</h2></div><Link to="/favoritos" className="text-xs font-semibold text-primary">Ver todas ›</Link></div>
        <div className="grid grid-cols-2 gap-3">
          {ownTracks.filter(track=>p.isFavorite(track.id)).slice(0,4).map(track=><button key={track.id} onClick={()=>p.playList(ownTracks.filter(item=>p.isFavorite(item.id)).map(item=>item.id),track.id)} className="streaming-playlist-card flex items-center gap-2 text-left"><Cover seed={track.id} className="size-14 shrink-0 rounded-xl"/><span className="min-w-0"><b className="block truncate text-xs">{track.title}</b><small className="block truncate text-muted-foreground">{track.artist}</small></span></button>)}
          {!ownTracks.some(track=>p.isFavorite(track.id)) && <Link to="/favoritos" className="col-span-2 rounded-2xl border border-dashed border-primary/30 p-4 text-center text-xs text-muted-foreground">Toque no coração das músicas para adicioná-las aos favoritos.</Link>}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Feitas por você</p><h2 className="text-xl font-extrabold">Suas playlists</h2></div><Link to="/playlists" className="text-xs font-semibold text-primary">Ver todas ›</Link></div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {p.prefs.playlists.slice(0,6).map(pl => <article key={pl.id} className="streaming-playlist-card">
            <Link to="/playlists/$id" params={{id:pl.id}} className="block min-w-0"><img src={artwork} alt="" loading="lazy" className="aspect-square w-full rounded-xl object-cover"/><h3 className="mt-2 truncate text-sm font-bold">{pl.name}</h3><p className="text-xs text-muted-foreground">{pl.trackIds.length} músicas</p></Link>
            <Button size="icon" disabled={!pl.trackIds.some(id=>p.byId(id))} onClick={()=>p.playList(pl.trackIds.filter(id=>p.byId(id)))} aria-label={`Ouvir playlist ${pl.name}`} className="absolute bottom-3 right-3 size-9 rounded-full"><Play className="size-4 fill-current"/></Button>
          </article>)}
          <Link to="/playlists" className="flex aspect-square flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-primary/35 bg-card/50 p-4 text-center"><span className="flex size-12 items-center justify-center rounded-full bg-primary/15 text-primary"><Plus/></span><b className="text-sm">Criar playlist</b><small className="text-xs text-muted-foreground">Organize suas músicas</small></Link>
        </div>
      </section>

      <section id="gerenciar-musicas" className="streaming-manage space-y-4 rounded-3xl border border-border bg-card p-4 shadow-lg sm:p-5">
        <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Organize sua coleção</p><h2 className="text-xl font-extrabold">Gerenciar músicas</h2><p className="mt-1 text-xs text-muted-foreground">Importe arquivos ou conecte músicas do celular.</p></div><Smartphone className="size-7 text-primary"/></div>
        <PhoneMusicSync />
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4 text-center"><div className="flex size-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><Plus/></div><div><h3 className="font-bold">Adicionar músicas</h3><p className="mt-1 text-xs text-muted-foreground">Escolha arquivos do aparelho.</p></div><ImportButton/></div>
          <FolderImport />
        </div>
        <div className="flex flex-wrap gap-2"><Button asChild variant="outline" className="flex-1"><Link to="/importar"><Smartphone/> Central de importação</Link></Button><Button asChild variant="outline" className="flex-1"><Link to="/armazenamento"><FolderOpen/> Armazenamento</Link></Button></div>
      </section>

      <section className="space-y-3">
        <div className="flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Explore o aplicativo</p><h2 className="text-xl font-extrabold">Todas as ferramentas</h2></div></div>
        <nav aria-label="Funções do app" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {cards.isPending ? Array.from({length:4},(_,i)=><Skeleton key={i} className="h-20"/>) : list.map(c=>{
            if(!isFunctionKey(c.function_key)) return null;
            const key=c.function_key; const Icon=ICONS[c.icon]??Music;
            return <Button asChild variant="outline" key={c.id} className="h-auto min-h-20 justify-start gap-3 rounded-2xl border-border bg-card px-3 py-3 text-left shadow-sm hover:border-primary/45"><Link preload="intent" to={FUNCTIONS[key].route} aria-label={`${c.title}: ${c.description}`}><span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/12 text-primary"><Icon className="size-5"/></span><span className="min-w-0 whitespace-normal text-xs font-bold leading-snug">{c.title}</span></Link></Button>;
          })}
          <Button asChild variant="outline" className="h-auto min-h-20 justify-start gap-3 rounded-2xl border-border bg-card px-3 py-3"><Link to="/pastas"><span className="flex size-10 items-center justify-center rounded-xl bg-primary/12 text-primary"><FolderOpen/></span><span className="text-xs font-bold">Pastas salvas</span></Link></Button>
        </nav>
      </section>
      {cards.data && cards.data.source!=="servidor" && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="size-4 shrink-0"/> Cartões salvos no aparelho.</p>}
      <p className="pb-2 text-center text-xs font-semibold text-muted-foreground">Player Music · Feito por Adevaldo Marques</p>
    </div>
  );
}
