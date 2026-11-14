import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/music/AppShell";
import { TrackRow } from "@/components/music/TrackRow";
import { usePlayer } from "@/lib/music/player-context";
import { matchesSearch } from "@/lib/music/queue";

export const Route = createFileRoute("/buscar")({
  head: () => ({
    meta: [
      { title: "Buscar — Player Music" },
      { name: "description", content: "Encontre faixas da sua biblioteca por título ou artista." },
      { property: "og:title", content: "Buscar — Player Music" },
      { property: "og:description", content: "Encontre faixas da sua biblioteca por título ou artista." },
    ],
  }),
  component: BuscarPage,
});

function BuscarPage() {
  const p = usePlayer();
  const [q, setQ] = useState("");
  const results = p.tracks.filter((t) => matchesSearch(t, q));
  return (
    <div>
      <PageHeader title="Buscar" />
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
        <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Título ou artista" className="h-12 rounded-full pl-12 text-base" aria-label="Buscar" />
      </div>
      {!q.trim() ? (
        <p className="text-sm text-muted-foreground">Digite para buscar entre as {p.tracks.length} faixas da sua biblioteca.</p>
      ) : results.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhuma faixa encontrada para “{q}”.</p>
      ) : (
        results.map((t) => <TrackRow key={t.id} track={t} list={results.map((r) => r.id)} />)
      )}
    </div>
  );
}
