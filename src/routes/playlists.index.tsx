import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { AudioLines, Heart, ListMusic, Play, Plus, Search, Shuffle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomFolderCover } from "@/components/music/CustomFolderCover";
import { PageHeader } from "@/components/music/AppShell";
import { usePlayer } from "@/lib/music/player-context";
import { AiPlaylist } from "@/components/music/AiPlaylist";
import { artistFolders } from "@/lib/music/folders";

export const Route = createFileRoute("/playlists/")({
  head: () => ({ meta: [
    { title: "Playlists dos Cantores — Delícia Coxi’s Music & Video" },
    { name: "description", content: "Playlists organizadas por cantor, com reprodução de cada artista." },
  ] }),
  component: PlaylistsPage,
});

function PlaylistsPage() {
  const p = usePlayer();
  const [name, setName] = useState("");
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"artists" | "mine" | "favorites">("artists");
  const artists = useMemo(() => artistFolders(p.tracks).filter(a => a.tracks.length > 0), [p.tracks]);
  const filtered = artists.filter(a => a.name.toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR")));
  const favorites = p.tracks.filter(t => p.isFavorite(t.id));
  return <div className="artist-playlists-page space-y-5 pb-4">
    <PageHeader title="Delícia Coxi’s Music & Video" description="Playlists dos Cantores · Todas as playlists organizadas por artista"/>
    <AiPlaylist/>
    <div className="flex items-center gap-2 rounded-full border border-primary/35 bg-background/70 px-4 py-2.5 shadow-[0_0_20px_-14px_hsl(var(--primary))]"><Search className="size-5 shrink-0 text-primary"/><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cantor ou playlist..." aria-label="Buscar cantor ou playlist" className="h-8 border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"/></div>
    <div className="grid grid-cols-3 gap-2">
      <Button variant={tab==="artists" ? "default":"outline"} className="rounded-full px-2 text-xs sm:text-sm" onClick={() => setTab("artists")}><AudioLines className="size-4"/> Cantores</Button>
      <Button variant={tab==="mine" ? "default":"outline"} className="rounded-full px-2 text-xs sm:text-sm" onClick={() => setTab("mine")}><ListMusic className="size-4"/> Minhas listas</Button>
      <Button variant={tab==="favorites" ? "default":"outline"} className="rounded-full px-2 text-xs sm:text-sm" onClick={() => setTab("favorites")}><Heart className="size-4"/> Favoritas</Button>
    </div>
    {tab === "artists" && <>
      {filtered.length ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {filtered.map(artist => {
          const ids=artist.tracks.map(t=>t.id);
          return <article key={artist.name} className="artist-playlist-card relative overflow-hidden rounded-2xl border border-primary/35 bg-gradient-to-br from-[#102315] via-card to-[#080b09] p-3 shadow-[0_0_20px_-15px_hsl(var(--primary))]">
            <div className="flex items-center gap-3">
              <CustomFolderCover artistName={artist.name} editable className="size-[5.25rem] shrink-0 rounded-xl"/>
              <div className="min-w-0 flex-1"><p className="mb-1 text-[10px] font-black uppercase tracking-[.16em] text-primary">Playlist do cantor</p><h2 className="line-clamp-2 break-words text-base font-extrabold leading-tight">{artist.name}</h2><p className="mt-1 text-xs text-muted-foreground">{artist.tracks.length} {artist.tracks.length===1?"música":"músicas"}</p><div className="mt-2 flex flex-wrap gap-1.5"><Button size="sm" className="h-8 rounded-full px-3" onClick={() => p.playList(ids, undefined, "ordered")}><Play className="size-3.5 fill-current"/> Tocar</Button><Button size="sm" variant="outline" className="h-8 rounded-full px-3" onClick={() => p.playList(ids, undefined, "shuffle")} aria-label={"Reproduzir "+artist.name+" aleatoriamente"}><Shuffle className="size-3.5"/> Aleatório</Button></div></div>
            </div>
            <Link to="/biblioteca" className="mt-2 block text-right text-[11px] font-semibold text-primary">Ver músicas na biblioteca ›</Link>
          </article>;
        })}
      </div> : <div className="rounded-2xl border border-dashed border-primary/35 p-5 text-center"><AudioLines className="mx-auto mb-2 size-8 text-primary"/><p className="font-semibold">Ainda não há pastas de cantores</p><p className="mt-1 text-sm text-muted-foreground">Importe músicas com o nome do artista nos metadados ou organize suas faixas na Biblioteca. As playlists por cantor aparecerão automaticamente aqui.</p><Button asChild className="mt-3 rounded-full"><Link to="/biblioteca">Abrir biblioteca</Link></Button></div>}
    </>}
    {tab === "mine" && <>
      <form className="flex gap-2" onSubmit={e=>{e.preventDefault();if(!name.trim())return;p.createPlaylist(name);setName("");}}>
        <Input value={name} onChange={e=>setName(e.target.value)} placeholder="Nome da nova playlist" aria-label="Nome da nova playlist" className="h-11 rounded-full"/>
        <Button type="submit" className="h-11 rounded-full" disabled={!name.trim()}><Plus/> Criar</Button>
      </form>
      {p.prefs.playlists.length ? <div className="space-y-3">{p.prefs.playlists.filter(pl=>pl.name.toLowerCase().includes(search.toLowerCase())).map(pl=>{const tracks=pl.trackIds.map(p.byId).filter(Boolean);const ids=tracks.map(t=>t!.id);return <section key={pl.id} className="rounded-2xl border border-primary/25 bg-card/70 p-3"><div className="flex items-center gap-3"><CustomFolderCover folderName={`playlist-cover:${pl.id}`} entityLabel="playlist" editable className="size-14 shrink-0"/><div className="min-w-0 flex-1"><p className="truncate font-bold">{pl.name}</p><p className="text-xs text-muted-foreground">{tracks.length} músicas</p></div><Button size="icon" aria-label={"Tocar "+pl.name} disabled={!ids.length} onClick={()=>p.playList(ids)}><Play/></Button><Link to="/playlists/$id" params={{id:pl.id}} className="text-xs font-bold text-primary">Abrir ›</Link></div></section>;})}</div>:<p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Crie sua primeira playlist e adicione músicas pelo menu de cada faixa.</p>}
    </>}
    {tab === "favorites" && <section className="space-y-2">{favorites.length ? favorites.map(t=><button key={t.id} onClick={()=>p.playList(favorites.map(x=>x.id),t.id)} className="flex w-full items-center gap-3 rounded-xl border border-primary/20 bg-card p-3 text-left"><CustomFolderCover artistName={t.artist} className="size-12 shrink-0"/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-bold">{t.title}</span><span className="block truncate text-xs text-muted-foreground">{t.artist}</span></span><Play className="size-4 text-primary"/></button>):<p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Marque músicas com o coração para encontrá-las aqui.</p>}</section>}
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground"><Sparkles className="mr-1 inline size-4 text-primary"/> As playlists de cantores são montadas automaticamente com as músicas disponíveis na sua biblioteca. As músicas originais não são movidas nem duplicadas.</div>
  </div>;
}
