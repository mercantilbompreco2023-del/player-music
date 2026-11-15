import { useEffect, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { Cover } from "@/components/music/Cover";
import { saveArtistFolderCover, loadArtistFolderCover, saveCustomFolderCover, loadCustomFolderCover, loadCustomFolderCoverForTrack, removeArtistFolderCover, removeCustomFolderCover } from "@/lib/music/folder-covers";
import { toast } from "sonner";

export function CustomFolderCover({ folderName, artistName, editable = false, trackId, fallbackSeed, className = "w-full" }: { folderName?: string; artistName?: string; editable?: boolean; trackId?: string; fallbackSeed?: string; className?: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    let localUrl: string | null = null;
    const load = async () => {
      const local = artistName
        ? await loadArtistFolderCover(artistName)
        : trackId
          ? await loadCustomFolderCoverForTrack(trackId)
          : folderName
            ? await loadCustomFolderCover(folderName)
            : null;
      if (!active) { if (local) URL.revokeObjectURL(local); return; }
      localUrl = local;
      if (local) { setSrc(local); return; }

      // Quando ainda não existe capa personalizada, busca uma foto pública
      // do artista para manter a mesma identidade visual na tela Tocando agora.
      if (!artistName) { setSrc(null); return; }
      try {
        const params = new URLSearchParams({
          action: "query", generator: "search", gsrsearch: artistName,
          gsrnamespace: "0", gsrlimit: "8", prop: "pageimages",
          piprop: "thumbnail", pithumbsize: "800", format: "json", origin: "*",
        });
        const response = await fetch(`https://pt.wikipedia.org/w/api.php?${params.toString()}`);
        if (!response.ok) throw new Error("Falha ao buscar foto do artista");
        const data = await response.json() as { query?: { pages?: Record<string, { title?: string; thumbnail?: { source?: string } }> } };
        const normalize = (value: string) => value.normalize("NFD").replace(/[\\u0300-\\u036f]/g, "").toLocaleLowerCase("pt-BR").replace(/[^a-z0-9 ]/g, " ").replace(/\\s+/g, " ").trim();
        const wanted = normalize(artistName);
        const pages = Object.values(data.query?.pages ?? {}).filter((page) => page.title && page.thumbnail?.source);
        const match = pages.find((page) => normalize(page.title!) === wanted)
          ?? pages.find((page) => normalize(page.title!).includes(wanted) || wanted.includes(normalize(page.title!)));
        if (active) setSrc(match?.thumbnail?.source ?? null);
      } catch { if (active) setSrc(null); }
    };
    void load();
    return () => { active = false; if (localUrl) URL.revokeObjectURL(localUrl); };
  }, [folderName, artistName, trackId]);
  const upload = async (file?: File) => {
    if (!file || (!folderName && !artistName)) return;
    const ok = artistName ? await saveArtistFolderCover(artistName, file) : await saveCustomFolderCover(folderName!, file);
    if (!ok) { toast.error("Não foi possível salvar a foto da pasta."); return; }
    const next = artistName ? await loadArtistFolderCover(artistName) : await loadCustomFolderCover(folderName!);
    setSrc((previous) => { if (previous) URL.revokeObjectURL(previous); return next; });
    toast.success("Foto da pasta atualizada.");
  };
  const remove = async () => {
    if (!folderName && !artistName) return;
    const ok = artistName ? await removeArtistFolderCover(artistName) : await removeCustomFolderCover(folderName!);
    if (!ok) { toast.error("Não foi possível remover a foto da pasta."); return; }
    setSrc((previous) => { if (previous) URL.revokeObjectURL(previous); return null; });
    toast.success("Foto personalizada removida.");
  };
  return <div className={`relative overflow-hidden rounded-xl border border-primary/30 bg-muted ${className}`}>
    {src ? <img src={src} alt={`Foto da pasta ${artistName ?? folderName ?? "do cantor"}`} className="aspect-square w-full object-cover" /> : fallbackSeed ? <Cover seed={fallbackSeed} className="aspect-square w-full rounded-none" /> : <div className="flex aspect-square w-full items-center justify-center text-muted-foreground"><ImagePlus className="size-10" /></div>}
    {editable && (folderName || artistName) && <div className="absolute bottom-2 right-2 flex items-center gap-2">
      {src && <button type="button" onClick={() => void remove()} aria-label="Remover foto da pasta" title="Remover foto" className="flex items-center justify-center rounded-full bg-black/75 p-2 text-white"><Trash2 className="size-4" /></button>}
      <label className="flex cursor-pointer items-center gap-1 rounded-full bg-black/75 px-3 py-2 text-xs font-semibold text-white">
        <ImagePlus className="size-4" /> {src ? "Trocar foto" : "Adicionar foto"}
        <input type="file" accept="image/*" className="sr-only" onChange={(event) => { void upload(event.target.files?.[0]); event.currentTarget.value = ""; }} />
      </label>
    </div>}
  </div>;
}
