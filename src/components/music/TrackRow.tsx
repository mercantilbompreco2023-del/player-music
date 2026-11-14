import { Heart, ListPlus, MoreVertical, Plus, Trash2, X } from "lucide-react";
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

export function TrackRow({ track, list, playlistId }: { track: Track; list: string[]; playlistId?: string }) {
  const p = usePlayer();
  const active = p.current?.id === track.id;
  const fav = p.isFavorite(track.id);
  return (
    <div className={cn("group flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent/60", active && "bg-accent/70")}>
      <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => p.playList(list, track.id)} aria-label={`Tocar ${track.title}`}>
        <div className="relative">
          <Cover seed={track.id} className="size-12" />
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
            <span className="truncate">{track.artist}</span>
          </div>
        </div>
      </button>
      <span className="hidden text-xs tabular-nums text-muted-foreground sm:block">{formatTime(track.duration)}</span>
      <button onClick={() => p.toggleFavorite(track.id)} aria-label={fav ? "Remover dos favoritos" : "Favoritar"} className="rounded-full p-2 text-muted-foreground hover:text-foreground">
        <Heart className={cn("size-5", fav && "fill-primary text-primary")} />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger className="rounded-full p-2 text-muted-foreground hover:text-foreground" aria-label="Mais opções">
          <MoreVertical className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => p.addToQueue(track.id)}><ListPlus /> Adicionar à fila</DropdownMenuItem>
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
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-destructive" onClick={() => { if (window.confirm(`Remover “${track.title}” do app? O arquivo original no seu aparelho não é apagado.`)) void p.removeTrack(track.id); }}><Trash2 /> Remover do app</DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
