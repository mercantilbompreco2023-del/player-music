import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Pencil, Play, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomFolderCover } from "@/components/music/CustomFolderCover";
import { TrackRow } from "@/components/music/TrackRow";
import { usePlayer } from "@/lib/music/player-context";

export const Route = createFileRoute("/playlists/$id")({
  head: () => ({
    meta: [
      { title: "Playlist — Player Music" },
      { name: "description", content: "Veja e toque as faixas desta playlist." },
      { property: "og:title", content: "Playlist — Player Music" },
      { property: "og:description", content: "Veja e toque as faixas desta playlist." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PlaylistPage,
});

function PlaylistPage() {
  const { id } = Route.useParams();
  const p = usePlayer();
  const navigate = useNavigate();
  const pl = p.prefs.playlists.find((x) => x.id === id);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  if (!pl) {
    return (
      <div className="space-y-4">
        <p className="text-muted-foreground">{p.ready ? "Esta playlist não existe mais." : "Carregando…"}</p>
        <Link to="/playlists" className="font-semibold text-primary">Voltar para playlists</Link>
      </div>
    );
  }
  const tracks = pl.trackIds.map(p.byId).filter((t) => !!t);
  const ids = tracks.map((t) => t.id);

  return (
    <div>
      <Link to="/playlists" className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Playlists</Link>
      <div className="mb-5 flex items-end gap-4">
        <CustomFolderCover folderName={`playlist-cover:${pl.id}`} editable className="size-28 shrink-0 rounded-2xl shadow-glow" />
        <div className="min-w-0 flex-1">
          {editing ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                p.renamePlaylist(pl.id, name);
                setEditing(false);
              }}
            >
              <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} aria-label="Novo nome" />
              <Button type="submit" size="sm">Salvar</Button>
            </form>
          ) : (
            <h1 className="truncate text-2xl font-bold">{pl.name}</h1>
          )}
          <p className="text-sm text-muted-foreground">{tracks.length} faixas</p>
        </div>
      </div>
      <div className="mb-5 flex flex-wrap gap-2">
        <Button className="rounded-full" disabled={!ids.length} onClick={() => p.playList(ids)}><Play /> Tocar</Button>
        <Button variant="secondary" className="rounded-full" onClick={() => { setName(pl.name); setEditing(true); }}><Pencil /> Renomear</Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="ghost" className="rounded-full text-destructive"><Trash2 /> Excluir</Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir “{pl.name}”?</AlertDialogTitle>
              <AlertDialogDescription>As músicas continuam na sua biblioteca. Só a playlist é apagada.</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => { p.deletePlaylist(pl.id); navigate({ to: "/playlists" }); }}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {tracks.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          Playlist vazia. Na <Link to="/biblioteca" className="font-semibold text-primary">Biblioteca</Link>, toque nos três pontos de uma faixa e escolha “Adicionar à playlist”.
        </p>
      ) : (
        tracks.map((t) => <TrackRow key={t.id} track={t} list={ids} playlistId={pl.id} />)
      )}
    </div>
  );
}
