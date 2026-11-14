import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CloudDownload, CloudUpload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/music/player-context";
import { buildBackup, mergeBackup, type BackupPayload } from "@/lib/music/backup";
import { loadLibraryBackup, saveLibraryBackup } from "@/lib/music/backup.functions";
import { savedFolders } from "@/lib/music/folders";

interface Preview {
  folders: number;
  tracks: number;
  playlists: number;
  favorites: number;
  missing: string[];
  payload: BackupPayload;
}

export function LibraryBackup() {
  const p = usePlayer();
  const save = useServerFn(saveLibraryBackup);
  const load = useServerFn(loadLibraryBackup);
  const [busy, setBusy] = useState<"salvar" | "ver" | "aplicar" | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  /** Manda o som das músicas que ainda só existem neste aparelho para a conta. */
  async function enviarSom() {
    const locais = p.tracks.filter((t) => t.source === "local");
    if (!locais.length) { toast.message("Todo o som das suas músicas já está na conta."); return; }
    setUploading(true);
    let ok = 0, falha = 0;
    for (const t of locais) {
      try { await p.saveTrackToCloud(t.id); ok++; } catch { falha++; }
    }
    setUploading(false);
    if (ok) toast.success(`${ok} música(s) com o som guardado na conta.`);
    if (falha) toast.error(`${falha} música(s) não puderam ser enviadas agora.`);
  }

  async function salvar() {
    const payload = buildBackup(p.tracks, p.prefs);
    if (payload.tracks.length === 0) { toast.error("Nenhuma música sua para salvar ainda. Importe uma pasta primeiro."); return; }
    setBusy("salvar");
    try {
      const r = await save({ data: payload });
      if (r.ok) { setSavedAt(new Date().toLocaleString("pt-BR")); toast.success(`Lista salva na conta: ${payload.tracks.length} música(s), ${savedFolders(payload.tracks).length} pasta(s).`); }
      else toast.error(r.error ?? "Não foi possível salvar.");
    } catch { toast.error("Não foi possível salvar sua lista agora."); }
    finally { setBusy(null); }
  }

  async function ver() {
    setBusy("ver");
    try {
      const r = await load();
      if (r.error) { toast.error(r.error); setPreview(null); return; }
      if (!r.payload) { toast.message("Nenhuma lista salva na sua conta ainda."); setPreview(null); return; }
      const m = mergeBackup(r.payload, p.tracks, p.prefs);
      setPreview({
        folders: savedFolders(r.payload.tracks).length,
        tracks: r.payload.tracks.length,
        playlists: m.playlists.length,
        favorites: m.favorites.length,
        missing: m.missing,
        payload: r.payload,
      });
      setSavedAt(r.updatedAt ? new Date(r.updatedAt).toLocaleString("pt-BR") : null);
    } catch { toast.error("Não foi possível consultar sua lista agora."); }
    finally { setBusy(null); }
  }

  function aplicar() {
    if (!preview) return;
    const m = mergeBackup(preview.payload, p.tracks, p.prefs);
    setBusy("aplicar");
    try {
      p.applyRestoredLibrary({ folderInfo: m.folderInfo, playlists: m.playlists, favorites: m.favorites });
      toast.success(`Lista aplicada: ${m.folderInfo.length} música(s) com pasta de volta, ${m.playlists.length} playlist(s), ${m.favorites.length} favorito(s).`);
      setPreview(null);
    } finally { setBusy(null); }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => void salvar()} disabled={!!busy}>
          {busy === "salvar" ? <Loader2 className="animate-spin" /> : <CloudUpload />} Salvar minha lista na conta
        </Button>
        <Button variant="outline" onClick={() => void ver()} disabled={!!busy}>
          {busy === "ver" ? <Loader2 className="animate-spin" /> : <CloudDownload />} Ver o que está na conta
        </Button>
        <Button variant="outline" onClick={() => void enviarSom()} disabled={!!busy || uploading}>
          {uploading ? <Loader2 className="animate-spin" /> : <CloudUpload />} Enviar o som que falta para a conta
        </Button>
      </div>
      {savedAt && <p className="text-xs text-muted-foreground">Última vez na conta: {savedAt}</p>}
      <p className="text-xs text-muted-foreground">
        A conta guarda a lista de pastas e músicas (título, artista, pasta, playlists e favoritos) — não guarda o som de quem ainda não foi salvo na nuvem.
      </p>
      {preview && (
        <div className="space-y-2 rounded-xl border border-primary/40 bg-card p-3 text-sm">
          <p className="font-semibold">Na sua conta tem:</p>
          <ul className="grid grid-cols-2 gap-1 text-xs">
            <li>Pastas: <b>{preview.folders}</b></li>
            <li>Músicas: <b>{preview.tracks}</b></li>
            <li>Playlists: <b>{preview.playlists}</b></li>
            <li>Favoritas: <b>{preview.favorites}</b></li>
          </ul>
          {preview.missing.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {preview.missing.length} música(s) ainda sem som neste aparelho (importadas só aqui, sem salvar na nuvem): {preview.missing.slice(0, 3).join(", ")}{preview.missing.length > 3 ? "…" : ""}
            </p>
          )}
          <Button size="sm" onClick={aplicar} disabled={!!busy}>
            {busy === "aplicar" ? <Loader2 className="animate-spin" /> : null} Aplicar nesta aparelho
          </Button>
        </div>
      )}
    </div>
  );
}
