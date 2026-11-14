import type { Track } from "./types";
import { nativeExport } from "./native-export";
import { fileStore } from "./storage";

export function libraryCsv(tracks: Track[]): string {
  const cell = (value: string | number) => {
    const text = String(value);
    return `"${(/^[=+@\-\t\r]/.test(text) ? "'" : "") + text.replace(/"/g, '""')}"`;
  };
  const rows: (string | number)[][] = [["Pasta", "Caminho", "Título", "Artista", "Duração (segundos)", "Origem"]];
  for (const t of tracks.filter((item) => item.source !== "demo")) {
    rows.push([t.folderName ?? (t.path?.includes("/") ? t.path.split("/")[0] ?? "" : ""), t.path ?? "", t.title, t.artist, t.duration ?? "", t.source === "local" ? "Aparelho" : "Nuvem"]);
  }
  return "\uFEFF" + rows.map((row) => row.map(cell).join(",")).join("\r\n") + "\r\n";
}

export async function exportLibrary(tracks: Track[]): Promise<void> {
  if (nativeExport) {
    await nativeExport.save({ csv: libraryCsv(tracks) });
    return;
  }
  const file = new File([libraryCsv(tracks)], "player-music-biblioteca.csv", { type: "text/csv;charset=utf-8" });
  if (navigator.canShare?.({ files: [file] }) && matchMedia("(pointer: coarse)").matches) {
    try { await navigator.share({ files: [file], title: "Lista da biblioteca" }); return; }
    catch (e) { if ((e as DOMException).name === "AbortError") return; }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url; a.download = file.name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/** Exporta os arquivos de áudio originais, além da opção de exportar a lista CSV. */
export async function exportAudioTracks(tracks: Track[]): Promise<number> {
  const own = tracks.filter((track) => track.source !== "demo");
  if (!own.length) throw new Error("Não há músicas próprias para exportar.");
  const stored = await fileStore.all().catch(() => []);
  const byId = new Map(stored.map((file) => [file.id, file]));
  let exported = 0;
  for (const track of own) {
    const local = byId.get(track.id);
    const blob = local ? local.blob : await fetch(track.url).then((response) => {
      if (!response.ok) throw new Error(`Não foi possível baixar: ${track.title}`);
      return response.blob();
    });
    const extension = (track.path ?? track.title).match(/\.([a-z0-9]{2,5})$/i)?.[1]?.toLowerCase() ?? (blob.type.split("/")[1]?.split(";")[0] || "mp3");
    const safeName = `${track.artist} - ${track.title}`.replace(/[\\/:*?"<>|]/g, "-").trim();
    const file = new File([blob], `${safeName}.${extension}`, { type: blob.type || "audio/mpeg" });
    if (navigator.canShare?.({ files: [file] }) && matchMedia("(pointer: coarse)").matches) {
      try { await navigator.share({ files: [file], title: file.name }); exported++; continue; }
      catch (error) { if ((error as DOMException).name === "AbortError") return exported; }
    }
    const url = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = file.name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30000);
    exported++;
    await new Promise((resolve) => window.setTimeout(resolve, 350));
  }
  return exported;
}
