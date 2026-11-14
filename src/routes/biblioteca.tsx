import { createFileRoute, Link } from "@tanstack/react-router";
import { FolderOpen } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/music/AppShell";
import { ImportButton } from "@/components/music/ImportButton";
import { TrackRow } from "@/components/music/TrackRow";
import { usePlayer } from "@/lib/music/player-context";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca — Player Music" },
      { name: "description", content: "Suas músicas importadas, favoritos e faixas de demonstração." },
      { property: "og:title", content: "Biblioteca — Player Music" },
      { property: "og:description", content: "Suas músicas importadas, favoritos e faixas de demonstração." },
    ],
  }),
  component: BibliotecaPage,
});

type Tab = "todas" | "minhas" | "favoritas" | "demo";

function BibliotecaPage() {
  const p = usePlayer();
  const [tab, setTab] = useState<Tab>("minhas");
  const list = p.tracks.filter((t) =>
    tab === "minhas" ? t.source === "local" || t.source === "cloud" : tab === "demo" ? t.source === "demo" : tab === "favoritas" ? p.isFavorite(t.id) : true,
  );
  const empty: Record<Tab, string> = {
    todas: "Sua biblioteca está vazia.",
    minhas: "Suas músicas importadas e salvas na nuvem aparecerão aqui. Importe arquivos ou salve uma música na nuvem para mantê-la na sua biblioteca.",
    favoritas: "Toque no coração de uma faixa para adicioná-la aos favoritos.",
    demo: "Sem faixas de demonstração.",
  };
  return (
    <div>
      <PageHeader title="Minhas músicas" description="Suas músicas ficam reunidas aqui. Salve na nuvem para acessar em outros aparelhos." action={<div className="flex gap-2"><Link to="/importar" className="inline-flex h-9 items-center gap-1 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground"><FolderOpen className="size-4" /> Pasta</Link><ImportButton variant="secondary" /></div>} />
      <div role="tablist" className="mb-4 grid grid-cols-4 gap-1 rounded-full bg-muted p-1">
        {(["todas", "minhas", "favoritas", "demo"] as Tab[]).map((k) => (
          <button
            key={k}
            role="tab"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn("rounded-full py-2 text-sm font-semibold capitalize", tab === k ? "bg-background text-foreground" : "text-muted-foreground")}
          >
            {k}
          </button>
        ))}
      </div>
      {!p.ready ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{empty[tab]}</p>
      ) : (
        list.map((t) => <TrackRow key={t.id} track={t} list={list.map((x) => x.id)} />)
      )}
    </div>
  );
}
