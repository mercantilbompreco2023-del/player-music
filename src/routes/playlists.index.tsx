import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronDown, Play, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cover } from "@/components/music/Cover";
import { PageHeader } from "@/components/music/AppShell";
import { usePlayer } from "@/lib/music/player-context";
import { AiPlaylist } from "@/components/music/AiPlaylist";

export const Route = createFileRoute("/playlists/")({
  head: () => ({
    meta: [
      { title: "Playlists — Player Music" },
      { name: "description", content: "Crie e organize suas playlists." },
      { property: "og:title", content: "Playlists — Player Music" },
      { property: "og:description", content: "Crie e organize suas playlists." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlaylistsPage,
});

function PlaylistsPage() {
  const p = usePlayer();
  const [name, setName] = useState("");
  const [expanded, setExpanded] = useState<string[]>([]);
  return (
    <div>
      <PageHeader title="Playlists" />
      <AiPlaylist />
      <form
        className="mb-6 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (!name.trim()) return;
          p.createPlaylist(name);
          setName("");
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nome da nova playlist" className="h-11 rounded-full" aria-label="Nome da nova playlist" />
        <Button type="submit" className="h-11 rounded-full" disabled={!name.trim()}><Plus /> Criar</Button>
      </form>
      {p.prefs.playlists.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Nenhuma playlist criada. Dê um nome acima e toque em Criar.</p>
      ) : (
        <div className="space-y-3">
          {p.prefs.playlists.map((pl) => {
            const tracks = pl.trackIds.map(p.byId).filter((track) => !!track);
            const isExpanded = expanded.includes(pl.id);
            const ids = tracks.map((track) => track.id);
            return (
              <section key={pl.id} className="overflow-hidden rounded-2xl border border-primary/20 bg-card/70">
                <div className="flex items-center gap-3 p-3">
                  <Link to="/playlists/$id" params={{ id: pl.id }} className="flex min-w-0 flex-1 items-center gap-3">
                    <Cover seed={pl.id} className="size-14 rounded-xl" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{pl.name}</p>
                      <p className="text-sm text-muted-foreground">{tracks.length} músicas disponíveis</p>
                    </div>
                  </Link>
                  <Button size="icon" variant="ghost" aria-label={`Tocar playlist ${pl.name}`} disabled={!ids.length} onClick={() => p.playList(ids)}>
                    <Play className="size-5" />
                  </Button>
                  <Button size="icon" variant="ghost" aria-label={isExpanded ? "Ocultar músicas" : "Mostrar músicas"} aria-expanded={isExpanded} onClick={() => setExpanded((current) => isExpanded ? current.filter((id) => id !== pl.id) : [...current, pl.id])}>
                    <ChevronDown className={`size-5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                  </Button>
                </div>
                {isExpanded && (
                  <div className="border-t border-primary/15 px-3 py-2">
                    {tracks.length ? (
                      <div className="divide-y divide-border/60">
                        {tracks.map((track) => (
                          <button key={track.id} onClick={() => p.playList(ids, track.id)} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-accent/60">
                            <Play className="size-4 shrink-0 text-primary" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{track.title}</span>
                              <span className="block truncate text-xs text-muted-foreground">{track.artist}</span>
                            </span>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="px-2 py-3 text-sm text-muted-foreground">Esta playlist ainda não tem músicas. Abra a playlist para adicionar faixas.</p>
                    )}
                    <Link to="/playlists/$id" params={{ id: pl.id }} className="mt-2 inline-block px-2 text-xs font-semibold text-primary hover:underline">Abrir playlist completa</Link>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
