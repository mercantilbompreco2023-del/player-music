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
    { property: "og:description", content: "Ouça suas pastas de músicas em sequência ou em ordem aleatória." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: FoldersPage,
});

const ARTIST_FOLDERS = [
  { name: "Marília Tavares", aliases: ["marilia tavares"] },
  { name: "Mariana Fagundes", aliases: ["mariana fagundes", "marina fagundes"] },
  { name: "Ana Castela", aliases: ["ana castela"] },
  { name: "Grelo", aliases: ["grelo"] },
  { name: "Theuzinho", aliases: ["theuzinho"] },
  { name: "Mari Fernandez", aliases: ["mari fernandez", "mariana fernandes"] },
  { name: "Wesley Safadão", aliases: ["wesley safadao"] },
] as const;

function normalizeArtist(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("pt-BR").trim();
}

function FoldersPage() {
  const p = usePlayer();
  const folders = savedFolders(p.tracks);
  const [selected, setSelected] = useState<string | null>(null);
  const physicalFolder = folders.find((f) => f.name === selected);
  const artistFolder = ARTIST_FOLDERS.find((f) => f.name === selected);
  const shownTracks = physicalFolder?.tracks ?? (artistFolder
    ? p.tracks.filter((t) => t.source !== "demo" && artistFolder.aliases.some((alias) => normalizeArtist(t.artist).includes(normalizeArtist(alias))))
    : selected === "Mais artistas"
      ? p.tracks.filter((t) => t.source !== "demo" && !ARTIST_FOLDERS.some((f) => f.aliases.some((alias) => normalizeArtist(t.artist).includes(normalizeArtist(alias)))))
      : []);
  return <div>
    <PageHeader title="Ouvir por pasta" description="Pastas dos seus artistas e pastas importadas do aparelho." />
    {!p.ready ? <p role="status">Carregando pastas…</p> : selected ? <section>
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="icon" aria-label="Voltar para pastas" onClick={() => setSelected(null)}><ArrowLeft /></Button>
        <h2 className="min-w-0 break-words text-xl font-semibold">{selected}</h2>
      </div>
      {shownTracks.length > 0 && <div className="mb-4 flex flex-wrap gap-2">
        <Button onClick={() => p.playList(shownTracks.map((t) => t.id), undefined, "ordered")}><Play /> Reproduzir pasta</Button>
        <Button variant="secondary" onClick={() => p.playList(shownTracks.map((t) => t.id), undefined, "shuffle")}><Shuffle /> Aleatório</Button>
      </div>}
      {shownTracks.length ? shownTracks.map((t) => <TrackRow key={t.id} track={t} list={shownTracks.map((item) => item.id)} />) : <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Esta pasta ainda está vazia. Importe as músicas desse artista para que elas apareçam aqui.</p>}
    </section> : <div className="space-y-6">
      <section>
        <h2 className="mb-3 text-base font-semibold">Pastas dos artistas</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {ARTIST_FOLDERS.map((artist) => {
            const count = p.tracks.filter((t) => t.source !== "demo" && artist.aliases.some((alias) => normalizeArtist(t.artist).includes(normalizeArtist(alias)))).length;
            return <article key={artist.name} className="rounded-lg border bg-card p-4">
              <Button variant="ghost" className="h-auto min-h-16 w-full justify-start whitespace-normal p-0 text-left" onClick={() => setSelected(artist.name)}>
                <FolderOpen className="shrink-0 text-primary" />
                <span className="min-w-0"><span className="block break-words text-base font-semibold">{artist.name}</span><span className="text-sm text-muted-foreground">{count} música(s)</span></span>
              </Button>
            </article>;
          })}
          <article className="rounded-lg border bg-card p-4">
            <Button variant="ghost" className="h-auto min-h-16 w-full justify-start whitespace-normal p-0 text-left" onClick={() => setSelected("Mais artistas")}>
              <FolderOpen className="shrink-0 text-primary" />
              <span className="min-w-0"><span className="block text-base font-semibold">Mais artistas</span><span className="text-sm text-muted-foreground">Outros artistas da sua biblioteca</span></span>
            </Button>
          </article>
        </div>
      </section>
      {folders.length > 0 && <section>
        <h2 className="mb-3 text-base font-semibold">Pastas importadas do aparelho</h2>
        <div className="grid gap-3 sm:grid-cols-2">
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
        </div>
      </section>}
      <div><Button asChild><Link to="/importar"><FolderOpen /> Importar pasta de músicas</Link></Button></div>
    </div>}
  </div>;
}
