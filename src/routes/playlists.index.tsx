import { createFileRoute, Link } from "@tanstack/react-router";
import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Cover } from "@/components/music/Cover";
import { PageHeader } from "@/components/music/AppShell";
import { usePlayer } from "@/lib/music/player-context";

export const Route = createFileRoute("/playlists/")({
  head: () => ({
    meta: [
      { title: "Playlists — Player Music" },
      { name: "description", content: "Crie e organize suas playlists." },
      { property: "og:title", content: "Playlists — Player Music" },
      { property: "og:description", content: "Crie e organize suas playlists." },
    ],
  }),
  component: PlaylistsPage,
});

function PlaylistsPage() {
  const p = usePlayer();
  const [name, setName] = useState("");
  return (
    <div>
      <PageHeader title="Playlists" />
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
        <div className="space-y-2">
          {p.prefs.playlists.map((pl) => (
            <Link key={pl.id} to="/playlists/$id" params={{ id: pl.id }} className="flex items-center gap-3 rounded-xl p-2 hover:bg-accent/60">
              <Cover seed={pl.id} className="size-14" />
              <div className="min-w-0">
                <p className="truncate font-semibold">{pl.name}</p>
                <p className="text-sm text-muted-foreground">{pl.trackIds.length} faixas</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
