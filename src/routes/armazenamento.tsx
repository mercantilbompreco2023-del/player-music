import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Database, FolderOpen, HardDrive, Music, RefreshCw, Download, Plus, ListFilter, CheckCircle2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/music/player-context";
import { customFolders, savedFolders } from "@/lib/music/folders";
import { fileStore } from "@/lib/music/storage";
import { ImportButton } from "@/components/music/ImportButton";
import { FolderImport } from "@/components/music/FolderImport";

export const Route = createFileRoute("/armazenamento")({
  head: () => ({ meta: [
    { title: "Armazenamento — Player Music" },
    { name: "description", content: "Gerencie músicas e pastas salvas neste aparelho." },
  ] }),
  component: StoragePage,
});

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / Math.pow(1024, index)).toFixed(index >= 2 ? 2 : 0)} ${units[index]}`;
}

function StoragePage() {
  const p = usePlayer();
  const [usedBytes, setUsedBytes] = useState(0);
  const [quotaBytes, setQuotaBytes] = useState<number | null>(null);
  const [fileCount, setFileCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const files = await fileStore.all();
      setFileCount(files.length);
      setUsedBytes(files.reduce((total, file) => total + (file.blob?.size ?? 0), 0));
      if (navigator.storage?.estimate) {
        const estimate = await navigator.storage.estimate();
        setQuotaBytes(typeof estimate.quota === "number" ? estimate.quota : null);
      }
    } catch {
      setQuotaBytes(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh, p.tracks.length]);

  const custom = customFolders(p.tracks);
  const device = savedFolders(p.tracks);
  const folders = [...custom.map((folder) => ({ ...folder, kind: "Sua pasta" })), ...device.map((folder) => ({ ...folder, kind: "Pasta importada" }))];
  const percent = quotaBytes && quotaBytes > 0 ? Math.min(100, (usedBytes / quotaBytes) * 100) : 0;
  const cloudTracks = p.tracks.filter((track) => track.source === "cloud");
  const saveLibrary = async () => { for (const track of cloudTracks) await p.saveTrackLocally(track.id); await refresh(); };

  return <div className="storage-library space-y-5 rounded-[1.8rem] p-1 sm:p-3">
    <Link to="/configuracoes" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Configurações</Link>
    <div className="flex items-center justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.22em] text-primary">Biblioteca offline</p><h1 className="text-3xl font-black">Pastas e armazenamento</h1><p className="mt-1 text-sm text-muted-foreground">Importe, salve e organize suas músicas neste aparelho.</p></div><HardDrive className="size-9 text-primary"/></div>

    <section className="space-y-3 rounded-3xl border border-primary/40 bg-gradient-to-br from-[#10251a] via-card to-[#080e0b] p-4 shadow-[0_18px_45px_-30px_rgba(34,197,94,.7)]">
      <div className="flex items-center gap-2"><Database className="size-6 text-primary" /><h2 className="text-lg font-extrabold">Armazenamento do aplicativo</h2></div>
      <div className="flex items-end gap-2"><strong className="text-3xl">{formatBytes(usedBytes)}</strong><span className="pb-1 text-sm text-muted-foreground">em músicas importadas</span></div>
      <div className="h-3 overflow-hidden rounded-full bg-muted/80"><div className="h-full rounded-full bg-gradient-to-r from-green-500 to-lime-300 transition-all shadow-[0_0_14px_rgba(74,222,128,.55)]" style={{ width: `${percent}%` }} /></div>
      <div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>{fileCount} arquivo(s) de áudio</span><span>{quotaBytes ? `Cota estimada: ${formatBytes(quotaBytes)}` : "Cota informada pelo aparelho indisponível"}</span></div>
      <p className="text-xs text-muted-foreground">As músicas importadas ficam salvas no armazenamento local do aplicativo e podem ser reproduzidas sem login e sem internet. O espaço disponível depende do aparelho; armazenamento de 1 TB online exige um serviço de nuvem contratado.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-primary/35 bg-primary/10 p-2 text-center"><ImportButton/><span className="text-xs font-bold">Importar músicas</span></div><Button variant="outline" className="h-auto min-h-24 flex-col gap-2 rounded-2xl" onClick={() => void saveLibrary()} disabled={!cloudTracks.length}><Download className="size-5"/> <span className="text-xs font-bold">Salvar no app</span></Button><Button asChild variant="outline" className="h-auto min-h-24 flex-col gap-2 rounded-2xl"><Link to="/pastas"><Plus className="size-5"/> <span className="text-xs font-bold">Nova pasta</span></Link></Button><Button asChild variant="outline" className="h-auto min-h-24 flex-col gap-2 rounded-2xl"><Link to="/pastas"><ListFilter className="size-5"/> <span className="text-xs font-bold">Organizar</span></Link></Button></div><div className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-xs text-primary"><CheckCircle2 className="size-4"/> Músicas locais disponíveis offline</span><Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""}/> Atualizar</Button></div>
    </section>

    <section className="space-y-3 rounded-3xl border border-primary/30 bg-card/90 p-4">
      <div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><FolderOpen className="size-5 text-primary" /><h2 className="text-lg font-bold">Minhas pastas</h2></div><span className="text-xs text-muted-foreground">{folders.length} pasta(s)</span></div>
      {folders.length ? <div className="space-y-2">
        {folders.map((folder) => <Link key={folder.kind + folder.name} to="/pastas" className="flex items-center gap-3 rounded-xl border p-3 hover:bg-accent/50">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><FolderOpen /></div>
          <div className="min-w-0 flex-1"><p className="truncate font-semibold">{folder.name}</p><p className="text-xs text-muted-foreground">{folder.tracks.length} música(s) · {folder.kind}</p></div>
        </Link>)}
      </div> : <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Nenhuma pasta encontrada. Crie suas pastas e adicione músicas para elas aparecerem aqui.</p>}
      <div className="grid gap-2 sm:grid-cols-2"><Button asChild className="w-full"><Link to="/pastas"><FolderOpen /> Criar e organizar pastas</Link></Button><FolderImport /></div>
    </section>

    <section className="space-y-2 rounded-2xl bg-card p-4">
      <div className="flex items-center gap-2"><Music className="size-5 text-primary" /><h2 className="font-bold">Adicionar músicas</h2></div>
      <p className="text-sm text-muted-foreground">Importe músicas para a biblioteca local. Depois, adicione cada faixa às pastas que aparecem nesta tela.</p>
      <Button asChild variant="outline" className="w-full"><Link to="/importar"><Database /> Importar músicas</Link></Button>
    </section>
  </div>;
}
