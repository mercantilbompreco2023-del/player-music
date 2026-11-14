import { useEffect, useState } from "react";
import { ImagePlus } from "lucide-react";
import { Cover } from "@/components/music/Cover";
import { saveArtistFolderCover, loadArtistFolderCover, saveCustomFolderCover, loadCustomFolderCover, loadCustomFolderCoverForTrack } from "@/lib/music/folder-covers";
import { toast } from "sonner";

export function CustomFolderCover({ folderName, artistName, editable = false, trackId, fallbackSeed, className = "w-full" }: { folderName?: string; artistName?: string; editable?: boolean; trackId?: string; fallbackSeed?: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    const load = artistName ? loadArtistFolderCover(artistName) : trackId ? loadCustomFolderCoverForTrack(trackId) : folderName ? loadCustomFolderCover(folderName) : Promise.resolve(null);
    void load.then((url) => { if (active) setSrc(url); else if (url) URL.revokeObjectURL(url); });
    return () => { active = false; if (src) URL.revokeObjectURL(src); };
  }, [folderName, artistName, trackId]);
  const upload = async (file?: File) => {
    if (!file || (!folderName && !artistName)) return;
    const ok = artistName ? await saveArtistFolderCover(artistName, file) : await saveCustomFolderCover(folderName!, file);
    if (!ok) { toast.error("Não foi possível salvar a foto da pasta."); return; }
    const next = artistName ? await loadArtistFolderCover(artistName) : await loadCustomFolderCover(folderName!);
    setSrc((previous) => { if (previous) URL.revokeObjectURL(previous); return next; });
    toast.success("Foto da pasta atualizada.");
  };
  return <div className={`relative overflow-hidden rounded-xl border border-primary/30 bg-muted ${className}`}>
    {src ? <img src={src} alt={`Foto da pasta ${artistName ?? folderName ?? "do cantor"}`} className="aspect-square w-full object-cover" /> : fallbackSeed ? <Cover seed={fallbackSeed} className="aspect-square w-full rounded-none" /> : <div className="flex aspect-square w-full items-center justify-center text-muted-foreground"><ImagePlus className="size-10" /></div>}
    {editable && (folderName || artistName) && <label className="absolute bottom-2 right-2 flex cursor-pointer items-center gap-1 rounded-full bg-black/75 px-3 py-2 text-xs font-semibold text-white">
      <ImagePlus className="size-4" /> {src ? "Trocar foto" : "Adicionar foto"}
      <input type="file" accept="image/*" className="sr-only" onChange={(event) => { void upload(event.target.files?.[0]); event.currentTarget.value = ""; }} />
    </label>}
  </div>;
}
