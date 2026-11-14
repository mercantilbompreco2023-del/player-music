import { createFileRoute, Link } from "@tanstack/react-router";
import { Play, Search, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Cover } from "@/components/music/Cover";
import { ImportButton } from "@/components/music/ImportButton";
import { TrackRow } from "@/components/music/TrackRow";
import { usePlayer } from "@/lib/music/player-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Player Music" },
      { name: "description", content: "Ouça seus próprios arquivos de áudio com playlists, favoritos e fila." },
      { property: "og:title", content: "Player Music" },
      { property: "og:description", content: "Ouça seus próprios arquivos de áudio com playlists, favoritos e fila." },
    ],
  }),
  component: Index,
});

function Index() {
  const p = usePlayer();
  const recent = p.prefs.recent.map(p.byId).filter((t) => !!t);
  const allIds = p.tracks.map((t) => t.id);
  return (
    <div className="space-y-8">
      <section className="bg-hero -mx-4 -mt-6 px-4 pb-6 pt-6">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">Player Music</p>
          <Link to="/configuracoes" aria-label="Configurações" className="rounded-full p-2 text-muted-foreground hover:text-foreground">
            <Settings className="size-5" />
          </Link>
        </div>
        <h1 className="mt-3 text-4xl font-bold leading-tight">Sua música,<br />do seu jeito.</h1>
        <Link to="/buscar" className="mt-5 flex items-center gap-3 rounded-full border bg-card px-4 py-3 text-muted-foreground">
          <Search className="size-5" /> Buscar por título ou artista
        </Link>
        <div className="mt-4 flex flex-wrap gap-2">
          <ImportButton />
          <Button variant="secondary" className="rounded-full" onClick={() => p.playList(allIds)}>
            <Play /> Tocar tudo
          </Button>
        </div>
      </section>

      {recent.length > 0 && (
        <section>
          <h2 className="mb-3 text-xl font-bold">Tocadas recentemente</h2>
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {recent.map((t) => (
              <button key={t.id} onClick={() => p.playList(recent.map((r) => r.id), t.id)} className="w-32 shrink-0 text-left">
                <Cover seed={t.id} className="aspect-square w-full rounded-xl" />
                <p className="mt-2 truncate text-sm font-semibold">{t.title}</p>
                <p className="truncate text-xs text-muted-foreground">{t.artist}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Suas playlists</h2>
          <Link to="/playlists" className="text-sm font-semibold text-primary">Ver todas</Link>
        </div>
        {p.prefs.playlists.length === 0 ? (
          <Link to="/playlists" className="block rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
            Nenhuma playlist ainda. Toque para criar a primeira.
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {p.prefs.playlists.slice(0, 4).map((pl) => (
              <Link key={pl.id} to="/playlists/$id" params={{ id: pl.id }} className="flex items-center gap-3 rounded-xl bg-card p-2">
                <Cover seed={pl.id} className="size-12" />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{pl.name}</p>
                  <p className="text-xs text-muted-foreground">{pl.trackIds.length} faixas</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xl font-bold">Biblioteca</h2>
          <Link to="/biblioteca" className="text-sm font-semibold text-primary">Abrir</Link>
        </div>
        {p.tracks.slice(0, 6).map((t) => <TrackRow key={t.id} track={t} list={allIds} />)}
        <p className="mt-3 text-xs text-muted-foreground">
          Faixas marcadas como DEMO são composições originais de demonstração, de domínio público (CC0). Não há catálogo online neste app.
        </p>
      </section>
    </div>
  );
}
