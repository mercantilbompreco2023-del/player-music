import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { FileMusic, FolderOpen, HardDrive, Layers3, Music2, Search, Zap } from "lucide-react";
import { PageHeader } from "@/components/music/AppShell";
import { ImportButton } from "@/components/music/ImportButton";
import { FolderImport } from "@/components/music/FolderImport";
import { PhoneMusicSync } from "@/components/music/PhoneMusicSync";
import { TrackRow } from "@/components/music/TrackRow";
import { usePlayer } from "@/lib/music/player-context";

export const Route = createFileRoute("/importar")({
  head: () => ({
    meta: [
      { title: "Importar músicas — Player Music" },
      { name: "description", content: "Adicione músicas à sua biblioteca de forma rápida e segura." },
      { property: "og:title", content: "Importar músicas — Player Music" },
      { property: "og:description", content: "Adicione músicas à sua biblioteca de forma rápida e segura." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImportarPage,
});

function ImportarPage() {
  const p = usePlayer();
  const local = p.tracks.filter((t) => t.source === "local");

  return (
    <div className="space-y-7">
      <PageHeader
        title="Importar músicas"
        description="Adicione suas músicas à biblioteca de forma rápida e segura."
      />

      <section className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-center">
        <div className="flex items-center gap-4">
          <div className="hidden size-20 shrink-0 items-center justify-center rounded-3xl bg-gradient-to-br from-sky-500/25 to-violet-600/30 text-primary shadow-glow sm:flex">
            <FolderOpen className="size-11" />
          </div>
          <div>
            <p className="font-display text-2xl font-bold sm:text-3xl">Sua biblioteca começa aqui</p>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground sm:text-base">Escolha arquivos individuais ou uma pasta inteira, incluindo subpastas.</p>
          </div>
        </div>
        <div className="flex items-center gap-4 rounded-2xl border border-primary/50 bg-card px-5 py-3 shadow-glow">
          <Music2 className="size-9 text-primary" />
          <div>
            <p className="text-xs text-muted-foreground">Músicas importadas</p>
            <p className="font-display text-2xl font-bold tabular-nums">{local.length.toLocaleString("pt-BR")}</p>
          </div>
        </div>
      </section>

      <PhoneMusicSync />

      <section className="grid gap-4 xl:grid-cols-2" aria-label="Métodos de importação">
        <div className="flex min-h-[330px] flex-col items-center justify-center rounded-3xl border border-sky-500/60 bg-gradient-to-br from-sky-500/10 via-card to-card p-6 text-center shadow-lg">
          <div className="mb-4 flex size-20 items-center justify-center rounded-2xl bg-sky-500/15 text-sky-400">
            <FileMusic className="size-12" />
          </div>
          <h2 className="font-display text-xl font-bold">Importar músicas</h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">Selecione arquivos de música individualmente ou vários de uma vez. MP3, M4A, WAV, FLAC e outros formatos compatíveis.</p>
          <div className="mt-6">
            <ImportButton />
          </div>
        </div>
        <div className="rounded-3xl border border-violet-500/60 bg-gradient-to-br from-violet-500/15 via-card to-card p-1 shadow-lg">
          <FolderImport />
        </div>
      </section>

      <section className="grid gap-3 rounded-2xl border bg-card/80 p-4 sm:grid-cols-2 xl:grid-cols-4">
        <Feature icon={<Search className="size-6 text-sky-400" />} title="Escaneia subpastas" text="Encontra músicas dentro das pastas selecionadas." />
        <Feature icon={<Layers3 className="size-6 text-sky-400" />} title="Evita duplicatas" text="Não adiciona novamente arquivos que já estão na biblioteca." />
        <Feature icon={<HardDrive className="size-6 text-sky-400" />} title="Biblioteca salva" text="Os arquivos importados ficam armazenados neste navegador." />
        <Feature icon={<Zap className="size-6 text-violet-400" />} title="Importação rápida" text="Adicione vários arquivos em poucos passos." />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold">Músicas importadas</h2>
            <p className="text-sm text-muted-foreground">Arquivos disponíveis na biblioteca deste aparelho.</p>
          </div>
          <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-semibold text-primary">{local.length}</span>
        </div>
        {!p.ready ? (
          <p className="rounded-2xl border bg-card p-4 text-sm text-muted-foreground">Carregando biblioteca…</p>
        ) : local.length === 0 ? (
          <div className="rounded-2xl border border-dashed bg-card/50 p-8 text-center">
            <Music2 className="mx-auto size-9 text-muted-foreground" />
            <p className="mt-3 font-semibold">Nenhuma música importada ainda</p>
            <p className="mt-1 text-sm text-muted-foreground">Escolha arquivos ou uma pasta para começar sua biblioteca.</p>
          </div>
        ) : (
          <div className="rounded-2xl border bg-card p-2">
            {local.map((t) => <TrackRow key={t.id} track={t} list={local.map((x) => x.id)} />)}
          </div>
        )}
      </section>
      <p className="text-center text-xs text-muted-foreground">O aplicativo acessa somente os arquivos e pastas que você selecionar. Seus arquivos não são enviados para a internet.</p>
    </div>
  );
}

function Feature({ icon, title, text }: { icon: ReactNode; title: string; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-2">
      <span className="mt-0.5">{icon}</span>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
      </div>
    </div>
  );
}
