import type { Track } from "./types";
import { nativeExport } from "./native-export";

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