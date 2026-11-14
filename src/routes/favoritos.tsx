import { createFileRoute, Link } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/music/AppShell";
import { TrackRow } from "@/components/music/TrackRow";
import { usePlayer } from "@/lib/music/player-context";

export const Route = createFileRoute("/favoritos")({
  head: () => ({
    meta: [
      { title: "Favoritos — Player Music" },
      { name: "description", content: "Suas faixas favoritas." },
      { property: "og:title", content: "Favoritos — Player Music" },
      { property: "og:description", content: "Suas faixas favoritas." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FavPage,
});

function FavPage() {
  const p = usePlayer();
  const list = p.prefs.favorites.map(p.byId).filter((t) => !!t);
  const ids = list.map((t) => t.id);
  return (
    <div>
      <PageHeader
        title="Favoritos"
        action={ids.length > 0 ? <Button className="rounded-full" onClick={() => p.playList(ids)}><Play /> Tocar</Button> : undefined}
      />
      {list.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Nenhuma favorita ainda. Na <Link to="/biblioteca" className="font-semibold text-primary">Biblioteca</Link>, toque no coração de uma faixa.
        </p>
      ) : (
        list.map((t) => <TrackRow key={t.id} track={t} list={ids} />)
      )}
    </div>
  );
}
