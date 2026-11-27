import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, ChevronRight, Download, FolderOpen, Heart, ListPlus, Music2, Play, Shuffle, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/music/AppShell";
import { ImportButton } from "@/components/music/ImportButton";
import { TrackRow } from "@/components/music/TrackRow";
import { CustomFolderCover } from "@/components/music/CustomFolderCover";
import { usePlayer } from "@/lib/music/player-context";
import { addTracksToCustomFolder, createCustomFolder, customFolders, savedFolders, artistFolders } from "@/lib/music/folders";
import { allSelected, toggleAll, toggleOne } from "@/lib/music/selection";
import { Button } from "@/components/ui/button";
import { exportAudioTracks, exportLibrary } from "@/lib/music/export";
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

type Tab = "todas" | "minhas" | "oficiais" | "favoritas" | "demo" | "pastas" | "artistas" | "albuns";

function BibliotecaPage() {
  const p = usePlayer();
  const [tab, setTab] = useState<Tab>("minhas");
  const [folderName, setFolderName] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [newFolderName, setNewFolderName] = useState("");
  const [showFolderCreator, setShowFolderCreator] = useState(false);
  const [targetFolder, setTargetFolder] = useState("");
  const folders = savedFolders(p.tracks);
  const artistGroups = artistFolders(p.tracks).filter((a) => a.tracks.length > 0);
  const albumGroups = [...new Set(p.tracks.filter((t) => t.source !== "demo").map((t) => t.album?.trim() || "Sem álbum"))].map((album) => ({ album, tracks: p.tracks.filter((t) => t.source !== "demo" && (t.album?.trim() || "Sem álbum") === album) }));
  const manualFolders = customFolders(p.tracks);
  const folder = [...folders, ...manualFolders].find((item) => item.name === folderName);
  const list = p.tracks.filter((t) =>
    tab === "minhas" ? t.source === "local" || t.source === "cloud" : tab === "oficiais" ? t.source === "official" : tab === "demo" ? t.source === "demo" : tab === "favoritas" ? p.isFavorite(t.id) : tab === "artistas" || tab === "albuns" ? false : true,
  );
  const empty: Record<Tab, string> = {
    todas: "Sua biblioteca está vazia.",
    minhas: "Suas músicas importadas e salvas na nuvem aparecerão aqui. Importe arquivos ou salve uma música na nuvem para mantê-la na sua biblioteca.",
    oficiais: "As músicas publicadas pelo administrador aparecerão aqui para ouvir e baixar no aparelho.",
    favoritas: "Toque no coração de uma faixa para adicioná-la aos favoritos.",
    demo: "Sem faixas de demonstração.",
    pastas: "Nenhuma pasta salva ainda. Importe uma pasta de músicas para vê-la aqui.",
    artistas: "Nenhuma música com artista identificado ainda.",
    albuns: "Nenhuma música com álbum identificado ainda.",
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
          <Check /> {tudo ? "Desmarcar todas" : "SELECIONAR TUDO"}
        </Button>
        {selected.size > 0 && <span className="text-xs text-muted-foreground">{selected.size} selecionada(s)</span>}
      </div>
      {selected.size > 0 && (
        <div className="flex flex-wrap gap-2 rounded-xl border border-primary/40 bg-card p-2">
          <Button size="sm" onClick={() => p.playList(selecionadas, selecionadas[0])}><Play /> Tocar</Button>
          <Button size="sm" variant="secondary" onClick={() => { selecionadas.forEach((id) => p.addToQueue(id)); toast.success(`${selecionadas.length} adicionada(s) à fila.`); }}><ListPlus /> Adicionar selecionadas à fila</Button>
          <Button size="sm" variant="secondary" onClick={() => { const novas = selecionadas.filter((id) => !p.isFavorite(id)); novas.forEach((id) => p.toggleFavorite(id)); toast.success(novas.length ? `${novas.length} adicionada(s) aos favoritos.` : "Já estavam nos favoritos."); }}><Heart /> Favoritar selecionadas</Button>
          {manualFolders.length > 0 && <div className="flex flex-wrap items-center gap-2">
            <select aria-label="Escolher pasta existente" value={targetFolder} onChange={(event) => setTargetFolder(event.target.value)} className="max-w-44 rounded-lg border bg-background px-2 py-2 text-xs">
              <option value="">Escolher pasta</option>
              {manualFolders.map((folder) => <option key={folder.name} value={folder.name}>{folder.name}</option>)}
            </select>
            <Button size="sm" variant="secondary" disabled={!targetFolder} onClick={() => {
              if (addTracksToCustomFolder(targetFolder, [...selected])) { toast.success("Músicas adicionadas à pasta."); setTargetFolder(""); limpar(); }
              else toast.error("Não foi possível atualizar a pasta.");
            }}>Adicionar à pasta</Button>
          </div>}
          <Button size="sm" variant="secondary" onClick={() => setShowFolderCreator(true)}><FolderOpen /> Criar pasta com selecionadas</Button>
          <Button size="sm" variant="ghost" onClick={limpar}><X /> Limpar</Button>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <PageHeader title="Delícia Coxi’s Music & Video" description="Músicas, pastas, artistas e álbuns em sua biblioteca." action={<div className="flex gap-2"><Link to="/importar" className="inline-flex h-9 items-center gap-1 rounded-full bg-primary px-3 text-sm font-semibold text-primary-foreground"><FolderOpen className="size-4" /> Pasta</Link><ImportButton variant="secondary" /></div>} />
      <div className="sticky top-2 z-20 mb-5 flex flex-wrap gap-2 rounded-xl border border-primary/30 bg-background/95 p-3 shadow-lg backdrop-blur">
        <Button disabled={!p.ready || !p.tracks.some((t) => t.source !== "demo")} onClick={() => { void exportAudioTracks(p.tracks).then((count) => count ? toast.success(`${count} arquivo(s) de música exportado(s).`) : toast.message("Exportação cancelada.")).catch((error) => toast.error(error instanceof Error ? error.message : "Não foi possível exportar as músicas.")); }}><Download /> Exportar músicas</Button>
        <Button variant="outline" disabled={!p.ready || !p.tracks.some((t) => t.source !== "demo")} onClick={() => { void exportLibrary(p.tracks).catch(() => toast.error("Não foi possível exportar a lista.")); }}><Download /> Exportar lista (CSV)</Button>
      </div>
      {showFolderCreator && selected.size > 0 && (
        <section className="mb-5 rounded-xl border border-primary/40 bg-card p-3">
          <h3 className="mb-2 font-semibold">Criar pasta com {selected.size} música(s)</h3>
          <form className="flex flex-wrap gap-2" onSubmit={(event) => {
            event.preventDefault();
            const ok = createCustomFolder(newFolderName, [...selected]);
            if (!ok) { toast.error("Digite um nome novo para a pasta."); return; }
            toast.success("Pasta criada com as músicas selecionadas.");
            setNewFolderName(""); setShowFolderCreator(false); limpar();
          }}>
            <input value={newFolderName} onChange={(event) => setNewFolderName(event.target.value)} placeholder="Nome do cantor ou da pasta" aria-label="Nome da nova pasta" className="min-w-0 flex-1 rounded-lg border bg-background px-3 py-2 text-sm" maxLength={60} />
            <Button type="submit" disabled={!newFolderName.trim()}>Salvar pasta</Button>
            <Button type="button" variant="ghost" onClick={() => setShowFolderCreator(false)}>Cancelar</Button>
          </form>
        </section>
      )}
      {p.ready && (
        <section aria-label="Pastas salvas" className="mb-6">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><FolderOpen className="size-5 text-primary" /> Pastas salvas</h2>
          {[...manualFolders, ...folders].length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {[...manualFolders, ...folders].map((item) => (
                <Button key={item.name} variant="outline" className="h-auto min-h-24 w-full justify-start gap-3 whitespace-normal rounded-lg p-4 text-left" onClick={() => { setFolderName(item.name); setTab("pastas"); limpar(); }}>
                  <FolderOpen className="size-8 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1"><span className="block break-words text-base font-semibold">{item.name}</span><span className="block text-xs text-muted-foreground">{item.tracks.length} música(s)</span></span>
                  <ChevronRight className="shrink-0" />
                </Button>
              ))}
            </div>
          ) : <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Selecione músicas na biblioteca e toque em “Criar pasta com selecionadas” para montar uma pasta por cantor.</p>}
        </section>
      )}
      <div role="tablist" className="mb-4 grid grid-cols-3 gap-1 rounded-xl bg-muted p-1 sm:grid-cols-6">
        {(["todas", "minhas", "pastas", "artistas", "albuns", "favoritas"] as Tab[]).map((k) => (
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
      {tab === "pastas" && !folder && <section className="mb-5"><h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><FolderOpen className="size-5 text-primary"/> Pastas salvas</h2><div className="space-y-2">{[...manualFolders, ...folders].map((item) => <button key={item.name} className="flex w-full items-center gap-3 rounded-xl border border-primary/35 bg-card/70 p-3 text-left" onClick={() => { setFolderName(item.name); limpar(); }}><CustomFolderCover folderName={"folder:"+item.name} entityLabel="pasta" className="size-12 shrink-0 rounded-lg"/><span className="min-w-0 flex-1"><span className="block truncate font-bold">{item.name}</span><span className="text-xs text-muted-foreground">{item.tracks.length} músicas</span></span><ChevronRight className="text-primary"/></button>)}</div></section>}
      {tab === "artistas" && <section className="mb-5"><h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><FolderOpen className="size-5 text-primary"/> Pastas dos Cantores</h2><div className="library-artist-grid">{artistGroups.map((artist) => <button key={artist.name} className="library-artist-card p-2 text-left" onClick={() => p.playList(artist.tracks.map((track) => track.id), undefined, "ordered")}><CustomFolderCover artistName={artist.name} className="mb-2 aspect-square w-full rounded-xl"/><span className="block truncate text-sm font-extrabold">{artist.name}</span><span className="text-xs text-muted-foreground">{artist.tracks.length} músicas</span></button>)}</div></section>}
      {tab === "albuns" && <section className="mb-5 space-y-2"><h2 className="mb-3 flex items-center gap-2 text-lg font-extrabold"><Music2 className="size-5 text-primary"/> Álbuns</h2>{albumGroups.map((album) => <button key={album.album} className="flex w-full items-center gap-3 rounded-xl border border-primary/35 bg-card/70 p-3 text-left" onClick={() => p.playList(album.tracks.map(t=>t.id), undefined, "ordered")}><CustomFolderCover folderName={"album:"+album.album} entityLabel="álbum" className="size-12 shrink-0 rounded-lg"/><span className="min-w-0 flex-1"><span className="block truncate font-bold">{album.album}</span><span className="text-xs text-muted-foreground">{album.tracks.length} músicas</span></span><Play className="size-5 text-primary"/></button>)}</section>}
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
      {tab !== "pastas" && tab !== "artistas" && tab !== "albuns" && (
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
