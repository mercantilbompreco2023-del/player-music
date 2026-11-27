import { useState } from "react";
import { Smartphone, Music2, Loader2, CheckCircle2, RefreshCw, FolderOpen, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { usePlayer } from "@/lib/music/player-context";
import { phoneMusicLibrary, readPhoneAudio, type PhoneAudioTrack } from "@/lib/music/phone-music-library";
import { toast } from "sonner";
import { FolderImport } from "@/components/music/FolderImport";

export function PhoneMusicSync() {
  const { importItems } = usePlayer();
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, imported: 0, duplicates: 0, skipped: 0 });
  const [finished, setFinished] = useState(false);
  const [showFolderImport, setShowFolderImport] = useState(false);

  async function sync() {
    if (!phoneMusicLibrary || busy) return;
    setBusy(true); setFinished(false);
    setProgress({ current: 0, total: 0, imported: 0, duplicates: 0, skipped: 0 });
    try {
      const { tracks } = await phoneMusicLibrary.list();
      if (!tracks.length) { toast.message("Não encontrei músicas na biblioteca do celular."); setBusy(false); return; }
      let imported = 0, duplicates = 0, skipped = 0;
      setProgress({ current: 0, total: tracks.length, imported, duplicates, skipped });
      for (let i = 0; i < tracks.length; i++) {
        const track: PhoneAudioTrack = tracks[i]!;
        try {
          const file = await readPhoneAudio(track);
          const ext = track.name.includes(".") ? track.name.split(".").pop() : "mp3";
          const title = track.title?.trim();
          const artist = track.artist?.trim();
          const filename = title && artist && artist !== "<unknown>" ? `${artist} - ${title}.${ext}` : track.name;
          const namedFile = new File([file], filename, { type: file.type });
          const report = await importItems([{ file: namedFile, path: `Músicas do celular/${track.name}`, folderName: "Músicas do celular" }], { quiet: true });
          imported += report.imported; duplicates += report.duplicates; skipped += report.skipped.length - report.duplicates;
        } catch { skipped++; }
        setProgress({ current: i + 1, total: tracks.length, imported, duplicates, skipped });
      }
      setFinished(true);
      toast.success(`Biblioteca vinculada: ${imported} música(s) adicionada(s).`);
    } catch (error) {
      const failure = error as { code?: string; message?: string };
      const message = failure?.code === "PERMISSION_DENIED"
        ? "A permissão de músicas foi negada. Autorize o acesso nas configurações do Android e tente novamente."
        : failure?.message || "Falha ao abrir a biblioteca de músicas. Atualize o aplicativo e tente novamente.";
      toast.error(message, { duration: 8000 });
    } finally { setBusy(false); }
  }

  if (!phoneMusicLibrary) return null;
  return (
    <section className="space-y-3 rounded-3xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/10 via-card to-card p-5 shadow-lg">
      <div className="flex items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-400"><Smartphone className="size-8" /></div>
        <div className="min-w-0"><h2 className="font-display text-xl font-bold">Vincular músicas do celular</h2><p className="text-sm text-muted-foreground">Encontre as músicas que já estão no seu aparelho.</p></div>
      </div>
      <p className="text-sm text-muted-foreground">O Player Music vai solicitar permissão, localizar os arquivos de áudio do celular e adicioná-los à sua biblioteca automaticamente. As faixas duplicadas são ignoradas. Os arquivos originais não são apagados nem modificados.</p>
      {phoneMusicLibrary && <Button className="h-12 w-full rounded-full text-base" onClick={() => void sync()} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" /> : finished ? <RefreshCw /> : <Music2 />}
        {busy ? "Vinculando músicas…" : finished ? "Atualizar biblioteca do celular" : "Vincular músicas do celular"}
      </Button>
      {busy && <div role="status" className="space-y-2"><div className="flex justify-between text-xs"><span>Verificando músicas</span><span>{progress.current}/{progress.total}</span></div><Progress value={progress.total ? progress.current / progress.total * 100 : 0} /><p className="text-xs text-muted-foreground">Adicionadas: {progress.imported} · Já existentes: {progress.duplicates} · Ignoradas: {progress.skipped}</p></div>}
      {phoneMusicLibrary && finished && <p className="flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 className="size-4" /> Biblioteca do celular vinculada. Você já pode tocar as músicas no Player Music.</p>}
      <div className="space-y-2 rounded-2xl border border-primary/40 bg-background/50 p-3">
        <div className="flex items-center gap-3"><FolderOpen className="size-6 shrink-0 text-primary"/><div className="min-w-0 flex-1"><h3 className="font-semibold">Adicionar por pasta</h3><p className="text-xs text-muted-foreground">Escolha uma pasta de cada cantor para manter cada coleção separada.</p></div></div>
        <Button variant="outline" className="h-11 w-full rounded-full border-primary/50" onClick={() => setShowFolderImport((v) => !v)}>
          <FolderOpen /> {showFolderImport ? "Fechar seletor de pastas" : "Escolher pasta do celular"} {showFolderImport ? <ChevronUp /> : <ChevronDown />}
        </Button>
        {showFolderImport && <div className="pt-2"><FolderImport /></div>}
        <p className="text-xs text-muted-foreground">Importe uma pasta por vez (por exemplo, Neto Brito, Marília Tavares ou Theuzinho). Cada pasta escolhida será criada separadamente na biblioteca. Repita para adicionar outra pasta.</p>
      </div>
    </section>
  );
}
