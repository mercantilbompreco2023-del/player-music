import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronRight, Download, FolderOpen, Heart, ListPlus, Play, Shuffle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/music/AppShell";
import { ImportButton } from "@/components/music/ImportButton";
import { TrackRow } from "@/components/music/TrackRow";
import { usePlayer } from "@/lib/music/player-context";
import { savedFolders } from "@/lib/music/folders";
import { allSelected, toggleAll, toggleOne } from "@/lib/music/selection";
import { Button } from "@/components/ui/button";
import { exportLibrary } from "@/lib/music/export";
import { toast } from "sonner";

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
  const [selected, setSelected] = useState<Set<string>>(new Set());
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

  const activeList = tab === "pastas" && folder ? folder.tracks : list;
  const ids = activeList.map((t) => t.id);
  const tudo = allSelected(ids, selected);
  const marcar = () => setSelected((s) => toggleAll(ids, s));
  const alternar = (id: string) => setSelected((s) => toggleOne(id, s));
  const limpar = () => setSelected(new Set());
  const selecionadas = [...selected];

  const rows = activeList.map((t) => (
    <TrackRow key={t.id} track={t} list={ids} selectable selected={selected.has(t.id)} onToggleSelect={() => alternar(t.id)} />
  ));

  const selectionBar = activeList.length > 0 && (
    <div className="mb-3 space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={marcar}>
          <Check /> {tudo ? "Nenhuma selecionada" : "Selecionar todas"}
        </Button>
        {selected.size > 0 && <span className="text-xs text-muted-foreground">{selected.size} selecionada(s)</span>}
      </div>
      {selected.size > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-primary/40 bg-card p-2">
          <Button size="sm" onClick={() => p.playList(selecionadas, selecionadas[0])}><Play /> Tocar</Button>
          <Button size="sm" variant="secondary" onClick={() => { selecionadas.forEach((id) => p.addToQueue(id)); toast.success(`${selecionadas.length} adicionada(s) à fila.`); }}><ListPlus /> Adicionar à fila</Button>
          <Button size="sm" variant="secondary" onClick={() => { const novas = selecionadas.filter((id) => !p.isFavorite(id)); novas.forEach((id) => p.toggleFavorite(id)); toast.success(novas.length ? `${novas.length} adicionada(s) aos favoritos.` : "Já estavam nos favoritos."); }}><Heart /> Favoritar</Button>
          <Button size="sm" variant="ghost" onClick={limpar}><X /> Limpar</Button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader title="Minhas músicas" description="Suas músicas ficam reunidas aqui. Salve na nuvem para acessar em outros aparelhos." action={<div className="flex gap-2"><Link to="/importar" className="inline-flex h-9 items-center gap-1 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground"><FolderOpen className="size-4" /> Pasta</Link><ImportButton variant="secondary" /></div>} />
      <div className="mb-5 space-y-2">
        <Button variant="outline" disabled={!p.ready || !p.tracks.some((t) => t.source !== "demo")} onClick={() => { void exportLibrary(p.tracks).catch(() => toast.error("Não foi possível exportar a lista.")); }}><Download /> Exportar lista da biblioteca</Button>
        <p className="text-xs text-muted-foreground">A cópia contém a lista de pastas e músicas, não os arquivos de áudio.</p>
      </div>
      {p.ready && (
        <section aria-label="Pastas salvas" className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><FolderOpen className="size-5 text-primary" /> Pastas salvas</h2>
          {folders.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {folders.map((item) => (
                <Button key={item.name} variant="outline" className="h-auto min-h-24 w-full justify-start gap-3 whitespace-normal rounded-lg p-4 text-left" onClick={() => { setFolderName(item.name); setTab("pastas"); limpar(); }}>
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
            onClick={() => { setTab(k); setFolderName(null); limpar(); }}
            className={cn("rounded-full py-2 text-sm font-semibold capitalize", tab === k ? "bg-background text-foreground" : "text-muted-foreground")}
          >
            {k}
          </Button>
        ))}
      </div>
      {tab === "pastas" && folder && (
        <section aria-label={`Músicas de ${folder.name}`}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Button variant="ghost" size="icon" aria-label="Voltar para minhas músicas" onClick={() => { setTab("minhas"); setFolderName(null); limpar(); }}><ArrowLeft /></Button>
            <h2 className="min-w-0 flex-1 break-words text-lg font-semibold">{folder.name}</h2>
            <Button onClick={() => p.playList(folder.tracks.map((track) => track.id), undefined, "ordered")}><Play /> Reproduzir pasta</Button>
            <Button variant="secondary" onClick={() => p.playList(folder.tracks.map((track) => track.id), undefined, "shuffle")}><Shuffle /> Aleatório</Button>
          </div>
          {selectionBar}
          {rows}
        </section>
      )}
      {tab !== "pastas" && (
      !p.ready ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">{empty[tab]}</p>
      ) : (
        <>
          {selectionBar}
          {rows}
        </>
      )
      )}
    </div>
  );
}
