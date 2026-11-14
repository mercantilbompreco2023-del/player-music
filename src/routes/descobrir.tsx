import { createFileRoute } from "@tanstack/react-router";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Cover } from "@/components/music/Cover";
import { PageHeader } from "@/components/music/AppShell";
import { TrackRow } from "@/components/music/TrackRow";
import { usePlayer } from "@/lib/music/player-context";

export const Route = createFileRoute("/descobrir")({
  head: () => ({
    meta: [
      { title: "Descobrir — Player Music" },
      { name: "description", content: "Músicas tocadas recentemente e faixas de demonstração livres." },
      { property: "og:title", content: "Descobrir — Player Music" },
      { property: "og:description", content: "Músicas tocadas recentemente e faixas de demonstração livres." },
    ],
  }),
  component: DescobrirPage,
});

function DescobrirPage() {
  const p = usePlayer();
  const recent = p.prefs.recent.map(p.byId).filter((t) => !!t);
  const demos = p.tracks.filter((t) => t.source === "demo");
  return (
    <div className="space-y-8">
      <PageHeader title="Descobrir" description="Não há catálogo online: aqui ficam seu histórico e as faixas de demonstração." />
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-bold">Histórico recente</h2>
          {recent.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => { if (window.confirm("Limpar o histórico de músicas recentes?")) p.clearRecent(); }}>Limpar</Button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Você ainda não tocou nada. As últimas 12 faixas aparecem aqui.</p>
        ) : (
          <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
            {recent.map((t) => (
              <button key={t.id} onClick={() => p.playList(recent.map((r) => r.id), t.id)} className="w-32 shrink-0 text-left" aria-label={`Tocar ${t.title}`}>
                <Cover seed={t.id} className="aspect-square w-full rounded-xl" />
                <p className="mt-2 truncate text-sm font-semibold">{t.title}</p>
                <p className="truncate text-xs text-muted-foreground">{t.artist}</p>
              </button>
            ))}
          </div>
        )}
      </section>
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-xl font-bold">Faixas de demonstração</h2>
          {demos.length > 0 && <Button size="sm" className="rounded-full" onClick={() => p.playList(demos.map((d) => d.id))}><Play /> Tocar</Button>}
        </div>
        {demos.length === 0 ? (
          <p className="text-sm text-muted-foreground">As faixas de demonstração foram desativadas pelo administrador.</p>
        ) : (
          demos.map((t) => <TrackRow key={t.id} track={t} list={demos.map((d) => d.id)} />)
        )}
        <p className="mt-3 text-xs text-muted-foreground">Composições originais criadas para este app, em domínio público (CC0). Não são músicas comerciais.</p>
      </section>
    </div>
  );
}
