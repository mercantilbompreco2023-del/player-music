import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [tab, setTab] = useState<Tab>("todas");
  const list = p.tracks.filter((t) =>
    tab === "minhas" ? t.source === "local" : tab === "demo" ? t.source === "demo" : tab === "favoritas" ? p.isFavorite(t.id) : true,
  );
  const empty: Record<Tab, string> = {
    todas: "Sua biblioteca está vazia.",
    minhas: "Você ainda não importou nenhum arquivo. Use “Importar músicas” para escolher áudios do seu aparelho.",
    favoritas: "Toque no coração de uma faixa para adicioná-la aos favoritos.",
    demo: "Sem faixas de demonstração.",
  };
  return (
    <div>
      <PageHeader title="Biblioteca" action={<ImportButton variant="secondary" />} />
      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} className="mb-4">
        <TabsList className="w-full">
          <TabsTrigger value="todas">Todas</TabsTrigger>
          <TabsTrigger value="minhas">Minhas</TabsTrigger>
          <TabsTrigger value="favoritas">Favoritas</TabsTrigger>
          <TabsTrigger value="demo">Demo</TabsTrigger>
        </TabsList>
      </Tabs>
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
