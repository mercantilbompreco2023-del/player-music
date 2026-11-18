import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Database, FolderOpen, HardDrive, Music, RefreshCw, Download, Plus, ListFilter, CheckCircle2, Save, CloudUpload } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/music/player-context";
import { customFolders, savedFolders } from "@/lib/music/folders";
import { fileStore } from "@/lib/music/storage";
import { ImportButton } from "@/components/music/ImportButton";
import { FolderImport } from "@/components/music/FolderImport";
import { requestPersistentStorage } from "@/lib/music/storage";
import { toast } from "sonner";

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
  const [savingFolder, setSavingFolder] = useState<string | null>(null);

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
  const saveLibrary = async () => {
    setSavingFolder("__all__");
    try {
      await requestPersistentStorage();
      for (const track of cloudTracks) await p.saveTrackLocally(track.id);
      await requestPersistentStorage();
      await refresh();
      toast.success(cloudTracks.length ? "Músicas da nuvem copiadas para este aparelho." : "As músicas importadas já ficam salvas no armazenamento deste aplicativo.");
    } catch {
      toast.error("Não foi possível concluir o salvamento. Verifique o espaço disponível.");
    } finally { setSavingFolder(null); }
  };
  const saveFolderInApp = async (folder: (typeof folders)[number]) => {
    setSavingFolder(folder.name);
    try {
      await requestPersistentStorage();
      const toCopy = folder.tracks.filter((track) => track.source === "cloud");
      for (const track of toCopy) await p.saveTrackLocally(track.id);
      await requestPersistentStorage();
      await refresh();
      const alreadyLocal = folder.tracks.filter((track) => track.source === "local").length;
      toast.success(toCopy.length ? "Pasta salva no aparelho: " + toCopy.length + " música(s) copiadas; " + alreadyLocal + " já estavam salvas." : "A pasta “" + folder.name + "” já está salva neste aparelho.");
    } catch {
      toast.error("Não foi possível salvar toda a pasta. Verifique o espaço disponível e tente novamente.");
    } finally { setSavingFolder(null); }
  };

  return <div className="storage-library mx-auto w-full max-w-6xl space-y-5 rounded-[1.8rem] bg-[#080808] p-3 text-white sm:p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link to="/configuracoes" className="inline-flex items-center gap-2 rounded-full border border-[#d6aa38]/35 px-4 py-2 text-sm font-semibold text-white/75 transition hover:border-[#e6c45f] hover:text-[#f4c64d]"><ArrowLeft className="size-4"/> Configurações</Link>
      <Link to="/player" className="inline-flex items-center gap-2 rounded-full border border-[#d6aa38]/50 bg-[#d6aa38]/10 px-4 py-2 text-sm font-bold text-[#f4c64d] hover:bg-[#d6aa38]/20"><Music className="size-4"/> Reproduzir</Link>
    </div>
    <header className="flex items-center justify-between gap-3 rounded-2xl border border-[#d6aa38]/35 bg-gradient-to-r from-[#17130a] to-[#101010] p-4 sm:p-5">
      <div className="min-w-0"><p className="text-[10px] font-black uppercase tracking-[.24em] text-[#e6c45f]">Biblioteca offline</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Pastas e armazenamento</h1><p className="mt-1 max-w-xl text-sm text-white/60">Importe suas músicas, mantenha os nomes originais e faça backup das pastas na nuvem.</p></div>
      <div className="hidden size-14 shrink-0 items-center justify-center rounded-2xl border border-[#d6aa38]/45 bg-[#d6aa38]/10 text-[#e6c45f] sm:flex"><HardDrive className="size-7"/></div>
    </header>

    <section className="space-y-4 rounded-2xl border border-[#d6aa38]/40 bg-[#111] p-4 shadow-[0_16px_40px_-28px_rgba(214,170,56,.35)] sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Database className="size-5 text-[#e6c45f]"/><h2 className="font-extrabold">Armazenamento do aplicativo</h2></div><span className="rounded-full border border-[#d6aa38]/30 bg-[#d6aa38]/10 px-3 py-1 text-xs font-semibold text-[#e6c45f]">Neste aparelho</span></div>
      <div className="flex flex-wrap items-end gap-x-3 gap-y-1"><strong className="text-3xl font-black tabular-nums sm:text-4xl">{formatBytes(usedBytes)}</strong><span className="pb-1 text-sm text-white/55">ocupados por músicas importadas</span></div>
      <div className="h-2.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-[#b88622] via-[#e6c45f] to-[#ffe7a0] transition-all" style={{ width: `${percent}%` }}/></div>
      <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-3"><div className="rounded-xl bg-white/[.04] p-3"><p className="text-white/50">Arquivos de áudio</p><p className="mt-1 text-lg font-bold text-white">{fileCount}</p></div><div className="rounded-xl bg-white/[.04] p-3"><p className="text-white/50">Cota estimada</p><p className="mt-1 text-lg font-bold text-white">{quotaBytes ? formatBytes(quotaBytes) : "Indisponível"}</p></div><div className="col-span-2 rounded-xl bg-white/[.04] p-3 sm:col-span-1"><p className="text-white/50">Espaço utilizado</p><p className="mt-1 text-lg font-bold text-[#e6c45f]">{quotaBytes ? `${percent.toFixed(1)}%` : "—"}</p></div></div>
      <p className="text-xs leading-relaxed text-white/50">As músicas importadas ficam salvas neste aparelho. Use “Salvar pasta na nuvem” para enviar uma cópia privada à sua conta, mantendo o nome do cantor, das músicas e a organização da pasta. O espaço online depende do plano e da configuração do serviço.</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-[#d6aa38]/55 bg-gradient-to-br from-[#f1d477] to-[#b88622] p-3 text-center text-black"><ImportButton/><span className="text-xs font-black">Importar músicas</span></div>
        <Button variant="outline" className="h-auto min-h-24 flex-col gap-2 rounded-xl border-white/15 bg-white/[.03] text-white hover:border-[#d6aa38]/60 hover:bg-[#d6aa38]/10" onClick={() => void saveLibrary()} disabled={savingFolder !== null}><Download className="size-5 text-[#e6c45f]"/><span className="text-xs font-bold">{savingFolder === "__all__" ? "Salvando…" : "Salvar no aparelho"}</span></Button>
        <Button asChild variant="outline" className="h-auto min-h-24 flex-col gap-2 rounded-xl border-white/15 bg-white/[.03] text-white hover:border-[#d6aa38]/60 hover:bg-[#d6aa38]/10"><Link to="/pastas"><Plus className="size-5 text-[#e6c45f]"/><span className="text-xs font-bold">Nova pasta</span></Link></Button>
        <Button asChild variant="outline" className="h-auto min-h-24 flex-col gap-2 rounded-xl border-white/15 bg-white/[.03] text-white hover:border-[#d6aa38]/60 hover:bg-[#d6aa38]/10"><Link to="/pastas"><ListFilter className="size-5 text-[#e6c45f]"/><span className="text-xs font-bold">Organizar pastas</span></Link></Button>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3"><span className="flex items-center gap-2 text-xs text-[#e6c45f]"><CheckCircle2 className="size-4"/> Biblioteca local disponível offline</span><Button variant="ghost" size="sm" className="text-white/65 hover:text-[#f4c64d]" onClick={() => void refresh()} disabled={loading}><RefreshCw className={loading ? "animate-spin" : ""}/> Atualizar dados</Button></div>
    </section>

    <section className="space-y-4 rounded-2xl border border-[#d6aa38]/30 bg-[#101010] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><FolderOpen className="size-5 text-[#e6c45f]"/><h2 className="text-lg font-extrabold">Minhas pastas</h2></div><span className="rounded-full bg-white/[.06] px-3 py-1 text-xs text-white/65">{folders.length} {folders.length===1?"pasta":"pastas"}</span></div>
      {folders.length ? <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{folders.map((folder) => <div key={folder.kind + folder.name} className="flex min-w-0 flex-col gap-2 rounded-xl border border-white/10 bg-white/[.035] p-3"><Link to="/pastas" className="flex min-w-0 items-center gap-3"><div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[#d6aa38]/10 text-[#e6c45f]"><FolderOpen/></div><div className="min-w-0 flex-1"><p className="truncate font-bold text-white">{folder.name}</p><p className="text-xs text-white/50">{folder.tracks.length} músicas · {folder.kind}</p></div><ArrowLeft className="size-4 rotate-180 text-white/35"/></Link><Button type="button" variant="outline" size="sm" className="w-full border-[#d6aa38]/40 bg-[#d6aa38]/[.06] text-xs font-bold text-[#f4c64d] hover:bg-[#d6aa38]/15" disabled={savingFolder !== null} onClick={() => void saveFolderInApp(folder)}><Save className="mr-2 size-4"/>{savingFolder === folder.name ? "Salvando pasta…" : "Salvar pasta no aplicativo"}</Button><Button type="button" variant="outline" size="sm" className="w-full border-sky-400/35 bg-sky-400/[.06] text-xs font-bold text-sky-300 hover:bg-sky-400/15" disabled={savingFolder !== null || !folder.tracks.some((track) => track.source === "local")} onClick={async () => { setSavingFolder("cloud:" + folder.name); try { await p.saveFolderToCloud(folder.name, folder.tracks.map((track) => track.id)); await refresh(); } catch { /* mensagem exibida pelo player */ } finally { setSavingFolder(null); } }}><CloudUpload className="mr-2 size-4"/>{savingFolder === "cloud:" + folder.name ? "Enviando para nuvem…" : "Salvar pasta na nuvem"}</Button></div>)}</div> : <div className="rounded-xl border border-dashed border-[#d6aa38]/30 bg-black/20 p-5 text-center"><FolderOpen className="mx-auto mb-2 size-8 text-[#e6c45f]/70"/><p className="font-semibold text-white">Você ainda não criou pastas</p><p className="mt-1 text-sm text-white/50">Crie uma pasta para organizar suas músicas por artista ou estilo.</p></div>}
      <div className="grid gap-3 lg:grid-cols-2">
        <Link to="/pastas" className="flex min-h-28 flex-col justify-center gap-2 rounded-xl border border-[#d6aa38]/60 bg-gradient-to-br from-[#f0d477] to-[#b88622] p-4 text-center font-black text-black transition hover:brightness-110"><Plus className="mx-auto size-7"/><span>Criar e organizar pastas</span><span className="text-xs font-medium text-black/65">Monte sua biblioteca do seu jeito</span></Link>
        <div className="flex flex-col justify-center gap-3 rounded-xl border border-white/10 bg-white/[.035] p-4"><div className="flex items-center gap-2"><FolderOpen className="size-5 text-[#e6c45f]"/><div><p className="font-bold">Importar pasta de músicas</p><p className="text-xs text-white/50">Escolha uma pasta do aparelho</p></div></div><p className="text-xs leading-relaxed text-white/55">A importação depende das permissões do navegador e do seletor de arquivos do aparelho. Os arquivos selecionados são copiados para a biblioteca local deste navegador.</p><FolderImport/></div>
      </div>
    </section>

    <section className="rounded-2xl border border-[#d6aa38]/25 bg-[#101010] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><Music className="size-5 text-[#e6c45f]"/><h2 className="font-extrabold">Adicionar músicas</h2></div><span className="text-xs text-white/45">Biblioteca local</span></div>
      <p className="mt-2 text-sm text-white/55">Importe arquivos de áudio e depois organize as faixas nas pastas que você criou.</p>
      <Button asChild variant="outline" className="mt-4 h-11 w-full border-[#d6aa38]/45 bg-white/[.03] font-bold text-white hover:bg-[#d6aa38]/10"><Link to="/importar"><Database className="mr-2 size-4 text-[#e6c45f]"/> Abrir biblioteca de importação</Link></Button>
    </section>
  </div>;
}
