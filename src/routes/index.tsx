import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FolderOpen, Heart, Music, Play, Plus, Search, Settings, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArtistPhoto, HomePlayer } from "@/components/music/HomePlayer";
import { Cover } from "@/components/music/Cover";
import { cardsQuery } from "@/lib/cards-query";
import { FUNCTIONS, ICONS, isFunctionKey, visibleCards } from "@/lib/cards";
import { useIsAdmin, useSession } from "@/lib/auth";
import { usePlayer } from "@/lib/music/player-context";
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
  const [homeStyle, setHomeStyle] = useState<"classic" | "showcase">("showcase");
  useEffect(() => { try { setHomeStyle(localStorage.getItem("player-music-home-style") === "classic" ? "classic" : "showcase"); } catch { /* usa padrão */ } }, []);
  const toggleHomeStyle = () => setHomeStyle((current) => { const next = current === "showcase" ? "classic" : "showcase"; try { localStorage.setItem("player-music-home-style", next); } catch { /* preferência opcional */ } return next; });
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
        <Link to="/" className="flex min-w-0 items-center gap-2"><img src={playerIcon} alt="" width={48} height={48} className="size-11 rounded-lg" /><h1 className="text-xl font-bold sm:text-3xl">Player <span className="text-primary">Music</span></h1></Link>
        <div className="flex shrink-0 items-center gap-1">
          <Button type="button" size="icon" variant="ghost" onClick={toggleHomeStyle} aria-label={homeStyle === "showcase" ? "Voltar ao modelo clássico" : "Ativar modelo visual da segunda foto"} title={homeStyle === "showcase" ? "Modelo clássico" : "Modelo vitrine"} className={homeStyle === "showcase" ? "text-primary" : ""}><Sparkles /></Button>
          <Button asChild size="icon" variant="ghost"><Link to="/buscar" aria-label="Buscar músicas"><Search /></Link></Button>
          <Button asChild size="icon" variant="ghost"><Link to="/configuracoes" aria-label="Configurações"><Settings /></Link></Button>
        </div>
      </header>
      <div className="flex items-center justify-between gap-2"><p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{homeStyle === "showcase" ? "Modelo vitrine ativado" : "Modelo clássico"}</p><button type="button" onClick={toggleHomeStyle} className="rounded-full border border-primary/40 px-3 py-1.5 text-xs font-semibold text-primary">{homeStyle === "showcase" ? "Usar modelo clássico" : "Ver modelo da 2ª foto"}</button></div>
      <HomePlayer variant={homeStyle} />
      {cards.data && cards.data.source !== "servidor" && <p role="status" className="flex items-center gap-2 text-xs text-muted-foreground"><AlertTriangle className="size-4 shrink-0" /> Cartões salvos no aparelho.</p>}
      <nav aria-label="Funções do app" className="grid grid-cols-4 gap-2 sm:gap-3">
        {cards.isPending ? Array.from({length: 4}, (_, i) => <Skeleton key={i} className="h-28" />) : list.map(c => {
          if (!isFunctionKey(c.function_key)) return null;
          const key = c.function_key;
          const Icon = ICONS[c.icon] ?? Music;
          return <Button asChild variant="outline" key={c.id} className="neon-tile h-auto min-h-28 flex-col gap-2 whitespace-normal px-1 py-3 text-center sm:px-3"><Link to={FUNCTIONS[key].route} aria-label={`${c.title}: ${c.description}`}><Icon className="size-7! text-primary" /><span className="w-full break-words text-[11px] font-bold leading-snug sm:text-sm">{c.title}</span></Link></Button>;
        })}
        <Button asChild variant="outline" className="neon-tile h-auto min-h-28 flex-col gap-2 whitespace-normal px-1 py-3 text-center"><Link to="/pastas"><FolderOpen className="size-7! text-primary" /><span className="text-[11px] font-bold sm:text-sm">Pastas</span><span className="text-[10px] text-muted-foreground">{folders.length} salvas</span></Link></Button>
      </nav>
      <section>
        <div className="mb-4 flex items-center justify-between gap-2"><h2 className="section-heading text-lg font-bold">Seus artistas</h2><Link to="/buscar" className="text-xs text-primary">Ver todos ›</Link></div>
        {artists.length ? <div className="flex gap-4 overflow-x-auto pb-2">{artists.map(artist => { const tracks = ownTracks.filter(t => t.artist === artist); const first = tracks[0]; return <Button key={artist} variant="ghost" className="h-auto w-20 shrink-0 flex-col gap-2 whitespace-normal p-0 hover:bg-transparent" onClick={() => first && p.playList(tracks.map(t => t.id), first.id)} aria-label={`Ouvir ${artist}`}><div className="w-18 overflow-hidden rounded-full border-2 border-primary shadow-[0_0_14px_-5px_hsl(var(--primary)/0.8)]"><ArtistPhoto artist={artist} fallbackSeed={artist} /></div><span className="w-full break-words text-center text-xs">{artist}</span></Button>; })}</div> : <Button asChild variant="outline" className="w-full justify-start gap-3"><Link to="/importar"><Plus /> Adicionar minhas músicas</Link></Button>}
      </section>
      <section>
        <div className="mb-4 flex items-center justify-between gap-2"><h2 className="section-heading text-lg font-bold">Playlists</h2><Link to="/playlists" className="flex items-center gap-1 text-xs text-primary"><Plus className="size-4" /> Nova playlist</Link></div>
        <div className="grid gap-3 sm:grid-cols-2">
          {p.prefs.playlists.map(pl => <article key={pl.id} className="neon-tile flex items-center gap-3 rounded-lg border p-3"><Link to="/playlists/$id" params={{id: pl.id}} className="flex min-w-0 flex-1 items-center gap-3"><img src={artwork} alt="" width={1024} height={1024} loading="lazy" className="size-18 rounded-lg object-cover" /><div className="min-w-0"><h3 className="truncate text-sm font-bold">{pl.name}</h3><p className="mt-1 text-xs text-muted-foreground">{pl.trackIds.length} músicas</p></div></Link><Button size="icon" disabled={!pl.trackIds.some(id => p.byId(id))} className="shrink-0 rounded-full" onClick={() => p.playList(pl.trackIds.filter(id => p.byId(id)))} aria-label={`Ouvir playlist ${pl.name}`}><Play className="fill-current" /></Button></article>)}
          {!p.prefs.playlists.length && <Link to="/playlists" className="neon-tile flex items-center gap-4 rounded-lg border p-3"><img src={artwork} alt="" width={1024} height={1024} loading="lazy" className="size-20 rounded-lg object-cover" /><div><h3 className="font-bold">Minha primeira playlist</h3><span className="text-xs text-primary">Criar playlist ›</span></div></Link>}
        </div>
      </section>
      <p className="pb-2 text-center text-xs font-semibold text-primary">Feito por Adevaldo Marques</p>
    </div>
  );
}
