import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, FolderOpen, ListPlus, Play, Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "@/lib/auth";
import { organizeArtistFolders } from "@/lib/music/artist-folders.functions";
import { saveAiArtistFolders } from "@/lib/music/folders";
import { PageHeader } from "@/components/music/AppShell";
import { CustomFolderCover } from "@/components/music/CustomFolderCover";
import { TrackRow } from "@/components/music/TrackRow";
import { Button } from "@/components/ui/button";
import { artistFolders, customFolders, savedFolders } from "@/lib/music/folders";
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

function FoldersPage() {
  const p = usePlayer();
  const { user } = useSession();
  const organize = useServerFn(organizeArtistFolders);
  const [organizing, setOrganizing] = useState(false);
  const organizeWithAi = async () => {
    const tracks = p.tracks.filter((track) => track.source !== "demo");
    if (!tracks.length) { toast.message("Importe músicas primeiro."); return; }
    if (tracks.length > 500) { toast.error("A organização por IA aceita até 500 músicas por vez."); return; }
    setOrganizing(true);
    try {
      const result = await organize({ data: { tracks: tracks.map(({ id, title, artist, path }) => ({ id, title, artist, path })) } });
      if (result.error) { toast.error(result.error); return; }
      if (!result.assignments.length) { toast.message("A IA não encontrou artistas para organizar."); return; }
      if (!saveAiArtistFolders(result.assignments)) { toast.error("Não foi possível salvar a organização neste aparelho."); return; }
      toast.success(`${result.assignments.length} música(s) organizada(s) em pastas por cantor.`);
      setSelected(null);
    } catch { toast.error("Entre na sua conta e confira a conexão para usar a organização por IA."); }
    finally { setOrganizing(false); }
  };
  const folders = savedFolders(p.tracks);
  const manualFolders = customFolders(p.tracks);
  const [selected, setSelected] = useState<{ kind: "artist" | "physical" | "custom"; name: string } | null>(() => {
    try {
      const saved = sessionStorage.getItem("player-music-open-folder");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  useEffect(() => {
    try {
      if (selected) sessionStorage.setItem("player-music-open-folder", JSON.stringify(selected));
      else sessionStorage.removeItem("player-music-open-folder");
    } catch { /* armazenamento de sessão opcional */ }
  }, [selected]);
  const artistGroups = artistFolders(p.tracks);
  const selectedFolder = (selected?.kind === "physical" ? folders : selected?.kind === "custom" ? manualFolders : artistGroups)
    .find((folder) => folder.name === selected?.name);
  const shownTracks = selectedFolder?.tracks ?? [];
  return <div>
    <PageHeader title="Ouvir por pasta" description="Pastas automáticas por cantor e pastas importadas do aparelho." />
    {!p.ready ? <p role="status">Carregando pastas…</p> : selected ? <section>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="outline" size="sm" aria-label="Voltar para todas as pastas" onClick={() => setSelected(null)}><ArrowLeft /> Todas as pastas</Button>
        <h2 className="min-w-0 break-words text-xl font-semibold">{selected.name}</h2>
      </div>
      {selected.kind === "custom" && <div className="mb-4 max-w-xs"><CustomFolderCover folderName={selected.name} editable /></div>}
      {selected.kind === "physical" && <div className="mb-4 max-w-xs"><CustomFolderCover folderName={selected.name} editable /></div>}
      {selected.kind === "artist" && <div className="mb-4 max-w-xs"><CustomFolderCover artistName={selected.name} editable /></div>}
      {shownTracks.length > 0 && <div className="mb-4 flex flex-wrap gap-2">
        <Button onClick={() => p.playList(shownTracks.map((t) => t.id), undefined, "ordered")}><Play /> Ouvir pasta</Button>
        <Button variant="outline" onClick={() => p.addManyToQueue(shownTracks.map((t) => t.id))}><ListPlus /> Adicionar pasta à sequência</Button>
        <Button variant="secondary" onClick={() => p.playList(shownTracks.map((t) => t.id), undefined, "shuffle")}><Shuffle /> Aleatório</Button>
      </div>}
      {shownTracks.length ? shownTracks.map((t) => <TrackRow key={t.id} track={t} list={shownTracks.map((item) => item.id)} />) : <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Esta pasta ainda está vazia. Importe as músicas desse artista para que elas apareçam aqui.</p>}
    </section> : <div className="space-y-6">
      <section>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">Pastas por cantor</h2><Button size="sm" onClick={organizeWithAi} disabled={organizing || !p.ready || !user}>{organizing ? <Loader2 className="animate-spin" /> : <Sparkles />} {organizing ? "Organizando…" : "Organizar com IA"}</Button></div>
        {!user && <p className="mb-2 text-xs text-muted-foreground">Entre na sua conta para organizar com IA.</p>}
        <p className="mb-3 text-sm text-muted-foreground">Cada cantor tem sua própria pasta, criada automaticamente com as músicas da sua biblioteca.</p>
        {artistGroups.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {artistGroups.map((artist) => (
              <article key={artist.name} className="rounded-lg border bg-card p-4">
                <Button variant="ghost" aria-label={`Abrir cantor ${artist.name}`} className="h-auto min-h-16 w-full justify-start whitespace-normal p-0 text-left" onClick={() => setSelected({ kind: "artist", name: artist.name })}>
                  <FolderOpen className="shrink-0 text-primary" />
                  <span className="min-w-0"><span className="block break-words text-base font-semibold">{artist.name}</span><span className="text-sm text-muted-foreground">{artist.tracks.length} música(s)</span></span>
                </Button>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button size="sm" aria-label={`Ouvir cantor ${artist.name}`} onClick={() => p.playList(artist.tracks.map((track) => track.id), undefined, "ordered")}><Play /> Ouvir pasta</Button>
                  <Button size="sm" variant="secondary" aria-label={`Aleatório do cantor ${artist.name}`} onClick={() => p.playList(artist.tracks.map((track) => track.id), undefined, "shuffle")}><Shuffle /> Aleatório</Button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Importe músicas com o nome do cantor preenchido para criar as pastas automaticamente.</p>
        )}
      </section>
      {manualFolders.length > 0 && <section>
        <h2 className="mb-3 text-base font-semibold">Pastas criadas por você</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {manualFolders.map((folder) => <article key={folder.name} className="rounded-lg border bg-card p-4">
            <Button variant="ghost" className="h-auto min-h-16 w-full justify-start whitespace-normal p-0 text-left" onClick={() => setSelected({ kind: "custom", name: folder.name })}>
              <CustomFolderCover folderName={folder.name} className="w-16 shrink-0" />
              <span className="min-w-0"><span className="block break-words text-base font-semibold">{folder.name}</span><span className="text-sm text-muted-foreground">{folder.tracks.length} música(s)</span></span>
            </Button>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button size="sm" onClick={() => p.playList(folder.tracks.map((track) => track.id), undefined, "ordered")}><Play /> Ouvir pasta</Button>
              <Button size="sm" variant="outline" onClick={() => p.addManyToQueue(folder.tracks.map((track) => track.id))}><ListPlus /> Adicionar à sequência</Button>
              <Button size="sm" variant="secondary" onClick={() => p.playList(folder.tracks.map((track) => track.id), undefined, "shuffle")}><Shuffle /> Aleatório</Button>
            </div>
          </article>)}
        </div>
      </section>}
      {folders.length > 0 && <section>
        <h2 className="mb-3 text-base font-semibold">Pastas importadas do aparelho</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {folders.map((f) => <article key={f.name} className="rounded-lg border bg-card p-4">
            <Button variant="ghost" aria-label={`Abrir pasta ${f.name}`} className="h-auto min-h-20 w-full justify-start whitespace-normal p-0 text-left" onClick={() => setSelected({ kind: "physical", name: f.name })}>
              <FolderOpen className="shrink-0 text-primary" />
              <span className="min-w-0"><span className="block break-words text-lg font-semibold">{f.name}</span><span className="text-sm text-muted-foreground">{f.tracks.length} música(s)</span></span>
            </Button>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button aria-label={`Reproduzir pasta ${f.name}`} onClick={() => p.playList(f.tracks.map((t) => t.id), undefined, "ordered")}><Play /> Ouvir</Button>
              <Button variant="outline" onClick={() => p.addManyToQueue(f.tracks.map((t) => t.id))}><ListPlus /> Adicionar à sequência</Button>
              <Button variant="secondary" aria-label={`Aleatório na pasta ${f.name}`} onClick={() => p.playList(f.tracks.map((t) => t.id), undefined, "shuffle")}><Shuffle /> Aleatório</Button>
            </div>
          </article>)}
        </div>
      </section>}
      <div><Button asChild><Link to="/importar"><FolderOpen /> Importar pasta de músicas</Link></Button></div>
    </div>}
  </div>;
}
