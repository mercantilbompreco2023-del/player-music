import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/music/AppShell";
import { ImportButton } from "@/components/music/ImportButton";
import { FolderImport } from "@/components/music/FolderImport";
import { TrackRow } from "@/components/music/TrackRow";
import { usePlayer } from "@/lib/music/player-context";

export const Route = createFileRoute("/importar")({
  head: () => ({
    meta: [
      { title: "Importar músicas — Player Music" },
      { name: "description", content: "Escolha arquivos de áudio do seu aparelho para ouvir no app." },
      { property: "og:title", content: "Importar músicas — Player Music" },
      { property: "og:description", content: "Escolha arquivos de áudio do seu aparelho para ouvir no app." },
    ],
  }),
  component: ImportarPage,
});

function ImportarPage() {
  const p = usePlayer();
  const local = p.tracks.filter((t) => t.source === "local");
  return (
    <div className="space-y-5">
      <PageHeader title="Importar músicas" />
      <FolderImport />
      <section className="space-y-3 rounded-2xl bg-card p-4">
        <h2 className="text-lg font-bold">Importar arquivos individuais</h2>
        <ImportButton />
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>Você pode escolher vários arquivos de uma vez.</li>
          <li>Formatos: MP3, M4A/AAC, OGG/Opus, WAV e, na maioria dos navegadores, FLAC.</li>
          <li>Nome no formato “Artista - Título.mp3” preenche o artista automaticamente.</li>
          <li>Os arquivos ficam só neste aparelho; nada é enviado para a internet.</li>
          <li>Arquivos com proteção (DRM) ou corrompidos são recusados com aviso.</li>
        </ul>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-bold">Importadas ({local.length})</h2>
        {!p.ready ? (
          <p className="text-sm text-muted-foreground">Carregando…</p>
        ) : local.length === 0 ? (
          <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Nenhum arquivo importado ainda.</p>
        ) : (
          local.map((t) => <TrackRow key={t.id} track={t} list={local.map((x) => x.id)} />)
        )}
      </section>
    </div>
  );
}
