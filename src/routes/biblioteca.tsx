import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronRight, FolderOpen, Play, Shuffle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/music/AppShell";
import { ImportButton } from "@/components/music/ImportButton";
import { TrackRow } from "@/components/music/TrackRow";
import { usePlayer } from "@/lib/music/player-context";
import { savedFolders } from "@/lib/music/folders";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/biblioteca")({
  head: () => ({
    meta: [
      { title: "Biblioteca — Player Music" },
      { name: "description", content: "Suas músicas importadas, favoritos e faixas de demonstração." },
      { property: "og:title", content: "Biblioteca — Player Music" },
      { property: "og:description", content: "Suas músicas importadas, favoritos e faixas de demonstração." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BibliotecaPage,
});

type Tab = "todas" | "minhas" | "favoritas" | "demo" | "pastas";

function BibliotecaPage() {
  const p = usePlayer();
  const [tab, setTab] = useState<Tab>("minhas");
  const [folderName, setFolderName] = useState<string | null>(null);
  const folders = savedFolders(p.tracks);
  const folder = folders.find((item) => item.name === folderName);
  const list = p.tracks.filter((t) =>
    tab === "minhas" ? t.source === "local" || t.source === "cloud" : tab === "demo" ? t.source === "demo" : tab === "favoritas" ? p.isFavorite(t.id) : true,
  );
  const empty: Record<Tab, string> = {
    todas: "Sua biblioteca está vazia.",
    minhas: "Suas músicas importadas e salvas na nuvem aparecerão aqui. Importe arquivos ou salve uma música na nuvem para mantê-la na sua biblioteca.",
    favoritas: "Toque no coração de uma faixa para adicioná-la aos favoritos.",
    demo: "Sem faixas de demonstração.",
    pastas: "Nenhuma pasta salva ainda. Importe uma pasta de músicas para vê-la aqui.",
  };
  return (
    <div>
      <PageHeader title="Minhas músicas" description="Suas músicas ficam reunidas aqui. Salve na nuvem para acessar em outros aparelhos." action={<div className="flex gap-2"><Link to="/importar" className="inline-flex h-9 items-center gap-1 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground"><FolderOpen className="size-4" /> Pasta</Link><ImportButton variant="secondary" /></div>} />
      {p.ready && (
        <section aria-label="Pastas salvas" className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><FolderOpen className="size-5 text-primary" /> Pastas salvas</h2>
          {folders.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {folders.map((item) => (
                <Button key={item.name} variant="outline" className="h-auto min-h-24 w-full justify-start gap-3 whitespace-normal rounded-lg p-4 text-left" onClick={() => { setFolderName(item.name); setTab("pastas"); }}>
                  <FolderOpen className="size-8 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1"><span className="block break-words text-base font-semibold">{item.name}</span><span className="block text-xs text-muted-foreground">{item.tracks.length} música(s)</span></span>
                  <ChevronRight className="shrink-0" />
                </Button>
              ))}
            </div>
          ) : <Button variant="outline" asChild className="h-20 w-full justify-start whitespace-normal"><Link to="/importar"><FolderOpen /> Importar pasta de músicas</Link></Button>}
        </section>
      )}
      <div role="tablist" className="mb-4 grid grid-cols-4 gap-1 rounded-full bg-muted p-1">
        {(["todas", "minhas", "favoritas", "demo"] as Tab[]).map((k) => (
          <Button
            key={k}
            role="tab"
            aria-selected={tab === k}
            variant="ghost"
            onClick={() => { setTab(k); setFolderName(null); }}
            className={cn("rounded-full py-2 text-sm font-semibold capitalize", tab === k ? "bg-background text-foreground" : "text-muted-foreground")}
          >
            {k}
          </Button>
        ))}
      </div>
      {tab === "pastas" && folder && (
        <section aria-label={`Músicas de ${folder.name}`}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Voltar para minhas músicas" onClick={() => { setTab("minhas"); setFolderName(null); }}><ArrowLeft /></Button>
            <h2 className="min-w-0 flex-1 break-words text-lg font-semibold">{folder.name}</h2>
            <Button onClick={() => p.playList(folder.tracks.map((track) => track.id), undefined, "ordered")}><Play /> Reproduzir pasta</Button>
            <Button variant="secondary" onClick={() => p.playList(folder.tracks.map((track) => track.id), undefined, "shuffle")}><Shuffle /> Aleatório</Button>
          </div>
          {folder.tracks.map((track) => <TrackRow key={track.id} track={track} list={folder.tracks.map((item) => item.id)} />)}
        </section>
      )}
      {tab !== "pastas" && (
      !p.ready ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{empty[tab]}</p>
      ) : (
        list.map((t) => <TrackRow key={t.id} track={t} list={list.map((x) => x.id)} />)
      )
      )}
    </div>
  );
}
