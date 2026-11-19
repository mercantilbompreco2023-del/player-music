import { Check, Cloud, CloudUpload, Download, FolderOpen, Heart, ListPlus, MoreVertical, Plus, Share2, Trash2, X } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
  DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/music/player-context";
import { formatTime } from "@/lib/music/queue";
import type { Track } from "@/lib/music/types";
import { Cover } from "./Cover";
import { CustomFolderCover } from "./CustomFolderCover";
import { TrackVisual } from "./TrackVisual";
import { addTracksToCustomFolder, createCustomFolder, readCustomFolders } from "@/lib/music/folders";
import { toast } from "sonner";

export function TrackRow({ track, list, playlistId, selectable, selected, onToggleSelect }: { track: Track; list: string[]; playlistId?: string; selectable?: boolean; selected?: boolean; onToggleSelect?: () => void }) {
  const p = usePlayer();
  const active = p.current?.id === track.id;
  const fav = p.isFavorite(track.id);
  const folderName = track.folderName || track.path?.replace(/\\/g, "/").split("/")[0];
  return (
    <div className={cn("group flex items-center gap-3 rounded-2xl border border-border/60 bg-card/65 px-3 py-3 shadow-sm transition-all hover:border-primary/35 hover:bg-accent/45 hover:shadow-md", active && "border-primary/50 bg-primary/8 shadow-md")}>
      {selectable && (
        <button
          type="button"
          role="checkbox"
          aria-checked={!!selected}
          aria-label={`Selecionar ${track.title}`}
          onClick={onToggleSelect}
          className={cn("flex size-6 shrink-0 items-center justify-center rounded-md border-2", selected ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/50")}
        >
          {selected && <Check className="size-4" />}
        </button>
      )}
      <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => p.playList(list, track.id)} aria-label={`Tocar ${track.title}`}>
        <div className="relative">
          <TrackVisual track={track} fallback={<CustomFolderCover {...(folderName ? { folderName } : {})} trackId={track.id} fallbackSeed={track.id} className="size-12 border-0" />} />
          {active && p.isPlaying && (
            <div className="absolute inset-0 flex items-end justify-center gap-0.5 rounded-lg bg-background/50 pb-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="eq-bar h-4 w-1 rounded bg-primary" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
        </div>
        <div className="min-w-0">
          <p className={cn("truncate font-semibold", active && "text-primary")}>{track.title}</p>
          <div className="flex items-center gap-1.5 truncate text-sm text-muted-foreground">
            {track.source === "demo" && <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">DEMO</Badge>}
            {track.source === "cloud" && <Badge variant="outline" className="h-4 gap-1 px-1.5 text-[10px]"><Cloud className="size-3" /> NUVEM</Badge>}\n            {track.source === "official" && <Badge className="h-4 bg-emerald-600 px-1.5 text-[10px] text-white">OFICIAL</Badge>}
            <span className="truncate">{track.artist}</span>
          </div>
        </div>
      </button>
      <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">{formatTime(track.duration)}</span>
      {track.source !== "demo" && (
        <button
          onClick={() => track.source === "local" ? void p.saveTrackLocally(track.id) : void p.saveTrackLocally(track.id)}
          aria-label={track.source === "local" ? `${track.title} já está salva no aplicativo` : `Salvar ${track.title} no aplicativo para ouvir offline`}
          title={track.source === "local" ? "Salva no aplicativo — funciona sem login" : "Salvar no aplicativo para ouvir sem internet"}
          className={cn("flex items-center gap-1 rounded-full px-2 py-2 text-xs font-semibold", track.source === "local" ? "bg-primary/10 text-primary" : "bg-primary text-primary-foreground hover:opacity-90")}
        >
          {track.source === "local" ? <Check className="size-4" /> : <Download className="size-4" />}
          <span className="hidden sm:inline">{track.source === "local" ? "Salva no app" : "Salvar no app"}</span>
        </button>
      )}
      {track.source === "local" && (
        <button onClick={() => void p.saveTrackToCloud(track.id).catch(() => {})} aria-label={`Fazer backup de ${track.title} na nuvem (opcional)`} title="Backup na nuvem (opcional; exige conta)" className="rounded-full p-2 text-muted-foreground hover:bg-primary/10 hover:text-primary">
          <CloudUpload className="size-5" />
        </button>
      )}
      {track.source !== "demo" && <button onClick={() => void p.shareTrack(track.id).catch(() => {})} aria-label={`Compartilhar ${track.title}`} title="Compartilhar música" className="rounded-full p-2 text-primary hover:bg-primary/10"><Share2 className="size-5" /></button>}
      <button onClick={() => p.toggleFavorite(track.id)} aria-label={fav ? "Remover dos favoritos" : "Favoritar"} className="rounded-full p-2 text-muted-foreground hover:text-foreground">
        <Heart className={cn("size-5", fav && "fill-primary text-primary")} />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full p-2 text-muted-foreground hover:text-foreground" aria-label="Mais opções">
          <MoreVertical className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => p.addToQueue(track.id)}><ListPlus /> Adicionar à fila</DropdownMenuItem>
          <DropdownMenuItem onClick={() => {
            const name = window.prompt("Nome da nova pasta");
            if (!name?.trim()) return;
            if (!createCustomFolder(name, [track.id])) { toast.error("Já existe uma pasta com esse nome ou não foi possível salvar."); return; }
            toast.success(`Música adicionada à pasta "${name.trim()}". Pasta salva neste aparelho.`);
          }}><Plus /> Criar pasta com esta música</DropdownMenuItem>
          {Object.keys(readCustomFolders()).length > 0 && <DropdownMenuSub>
            <DropdownMenuSubTrigger><FolderOpen className="mr-2 size-4" /> Adicionar a uma pasta</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {Object.keys(readCustomFolders()).map((name) => <DropdownMenuItem key={name} onClick={() => {
                if (addTracksToCustomFolder(name, [track.id])) toast.success(`Adicionada à pasta "${name}".`);
                else toast.error("Não foi possível adicionar a música à pasta.");
              }}>{name}</DropdownMenuItem>)}
            </DropdownMenuSubContent>
          </DropdownMenuSub>}

          {track.source !== "demo" && <DropdownMenuItem onClick={() => void p.shareTrack(track.id).catch(() => {})}><Share2 /> Compartilhar música</DropdownMenuItem>}
          {track.source !== "demo" && <DropdownMenuItem onClick={() => void p.saveTrackLocally(track.id)}><Download /> Salvar no aplicativo para ouvir offline</DropdownMenuItem>}
          <DropdownMenuSub>
            <DropdownMenuSubTrigger><Plus className="mr-2 size-4" /> Adicionar à playlist</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              {p.prefs.playlists.map((pl) => (
                <DropdownMenuItem key={pl.id} onClick={() => p.addToPlaylist(pl.id, track.id)}>{pl.name}</DropdownMenuItem>
              ))}
              {p.prefs.playlists.length > 0 && <DropdownMenuSeparator />}
              <DropdownMenuItem
                onClick={() => {
                  const name = window.prompt("Nome da nova playlist");
                  if (name?.trim()) p.addToPlaylist(p.createPlaylist(name).id, track.id);
                }}
              >
                Nova playlist…
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          {playlistId && (
            <DropdownMenuItem onClick={() => p.removeFromPlaylist(playlistId, track.id)}><X /> Remover da playlist</DropdownMenuItem>
          )}
          {track.source === "local" && (
            <DropdownMenuItem onClick={() => void p.saveTrackToCloud(track.id).catch(() => {})}><CloudUpload /> Fazer backup na nuvem (opcional; exige conta)</DropdownMenuItem>
          )}
          {(track.source === "local" || track.source === "cloud") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => { if (window.confirm(track.source === "cloud" ? `Remover “${track.title}” da sua biblioteca na nuvem?` : `Remover “${track.title}” do app? O arquivo original no seu aparelho não é apagado.`)) void p.removeTrack(track.id); }}><Trash2 /> {track.source === "cloud" ? "Remover da nuvem" : "Remover do app"}</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
