import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Cover } from "@/components/music/Cover";
import { PageHeader } from "@/components/music/AppShell";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/music/player-context";

export const Route = createFileRoute("/fila")({
  head: () => ({
    meta: [
      { title: "Fila — Player Music" },
      { name: "description", content: "Veja, reordene e edite a fila de reprodução." },
      { property: "og:title", content: "Fila — Player Music" },
      { property: "og:description", content: "Veja, reordene e edite a fila de reprodução." },
    ],
  }),
  component: FilaPage,
});

function FilaPage() {
  const p = usePlayer();
  return (
    <div>
      <PageHeader
        title="Fila"
        description="Toque numa faixa para pular até ela. Use as setas para mudar a ordem."
        action={p.queue.length > 1 ? (
          <Button variant="ghost" className="text-destructive" onClick={() => { if (window.confirm("Limpar as próximas faixas da fila?")) p.clearUpcoming(); }}>
            <Trash2 /> Limpar
          </Button>
        ) : undefined}
      />
      {p.queue.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
          A fila está vazia. Toque numa faixa na <Link to="/biblioteca" className="font-semibold text-primary">Biblioteca</Link> para começar.
        </p>
      ) : (
        <ol className="space-y-1">
          {p.queue.map((id, pos) => {
            const t = p.byId(id);
            if (!t) return null;
            const isCur = pos === p.index;
            return (
              <li key={`${pos}-${id}`} className={cn("flex items-center gap-2 rounded-xl px-2 py-1.5", isCur && "bg-accent/70")}>
                <button className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => p.playAt(pos)} aria-label={`Tocar ${t.title}`}>
                  <Cover seed={t.id} className="size-10" />
                  <div className="min-w-0">
                    <p className={cn("truncate text-sm font-semibold", isCur && "text-primary")}>{isCur ? "▶ " : ""}{t.title}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.artist}</p>
                  </div>
                </button>
                <button disabled={pos === 0} onClick={() => p.moveInQueue(pos, -1)} aria-label={`Subir ${t.title}`} className="p-2 text-muted-foreground disabled:opacity-30"><ArrowUp className="size-4" /></button>
                <button disabled={pos === p.queue.length - 1} onClick={() => p.moveInQueue(pos, 1)} aria-label={`Descer ${t.title}`} className="p-2 text-muted-foreground disabled:opacity-30"><ArrowDown className="size-4" /></button>
                <button disabled={isCur} onClick={() => p.removeFromQueue(pos)} aria-label={`Tirar ${t.title} da fila`} className="p-2 text-muted-foreground disabled:opacity-30"><X className="size-4" /></button>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
