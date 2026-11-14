import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FolderOpen, Play, Shuffle } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/components/music/AppShell";
import { TrackRow } from "@/components/music/TrackRow";
import { Button } from "@/components/ui/button";
import { savedFolders } from "@/lib/music/folders";
import { usePlayer } from "@/lib/music/player-context";

export const Route = createFileRoute("/pastas")({
  head: () => ({ meta: [
    { title: "Ouvir por pasta — Player Music" },
    { name: "description", content: "Ouça suas pastas de músicas em sequência ou em ordem aleatória." },
    { property: "og:title", content: "Ouvir por pasta — Player Music" },
    { property: "og:description", content: "Suas pastas salvas com reprodução em sequência ou aleatória." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: FoldersPage,
});

function FoldersPage() {
  const p = usePlayer();
  const folders = savedFolders(p.tracks);
  const [selected, setSelected] = useState<string | null>(null);
  const folder = folders.find((f) => f.name === selected);
  return <div>
    <PageHeader title="Ouvir por pasta" />
    {!p.ready ? <p role="status">Carregando pastas…</p> : folder ? <section>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Voltar para pastas" onClick={() => setSelected(null)}><ArrowLeft /></Button>
        <h2 className="min-w-0 break-words text-xl font-semibold">{folder.name}</h2>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
        <Button onClick={() => p.playList(folder.tracks.map((t) => t.id), undefined, "ordered")}><Play /> Reproduzir pasta</Button>
        <Button variant="secondary" onClick={() => p.playList(folder.tracks.map((t) => t.id), undefined, "shuffle")}><Shuffle /> Aleatório</Button>
      </div>
      {folder.tracks.map((t) => <TrackRow key={t.id} track={t} list={folder.tracks.map((item) => item.id)} />)}
    </section> : folders.length ? <div className="grid gap-3 sm:grid-cols-2">
      {folders.map((f) => <article key={f.name} className="rounded-lg border bg-card p-4">
        <Button variant="ghost" className="h-auto min-h-20 w-full justify-start whitespace-normal p-0 text-left" onClick={() => setSelected(f.name)}>
          <FolderOpen className="shrink-0 text-primary" />
          <span className="min-w-0"><span className="block break-words text-lg font-semibold">{f.name}</span><span className="text-sm text-muted-foreground">{f.tracks.length} música(s)</span></span>
        </Button>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button aria-label={`Reproduzir pasta ${f.name}`} onClick={() => p.playList(f.tracks.map((t) => t.id), undefined, "ordered")}><Play /> Ouvir</Button>
          <Button variant="secondary" aria-label={`Aleatório na pasta ${f.name}`} onClick={() => p.playList(f.tracks.map((t) => t.id), undefined, "shuffle")}><Shuffle /> Aleatório</Button>
        </div>
      </article>)}
    </div> : <div className="space-y-4"><p className="text-muted-foreground">Nenhuma pasta salva ainda.</p><Button asChild><Link to="/importar"><FolderOpen /> Importar pasta de músicas</Link></Button></div>}
  </div>;
}