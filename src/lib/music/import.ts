/** Utilitários de importação de arquivos e pastas (somente o que o usuário escolher). */

export const AUDIO_EXT = /\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|webm)$/i;

export interface ImportItem {
  file: File;
  /** Caminho relativo dentro da pasta escolhida (só para exibição). */
  path: string;
  folderName?: string | undefined;
}

export interface SkippedItem {
  path: string;
  reason: string;
}

export interface ImportReport {
  found: number;
  imported: number;
  duplicates: number;
  skipped: SkippedItem[];
  cancelled: boolean;
}

export interface ImportProgress {
  phase: "lendo" | "importando" | "concluido";
  found: number;
  processed: number;
  imported: number;
  current?: string | undefined;
}

export function isAudioCandidate(name: string, type: string): boolean {
  return type.startsWith("audio/") || AUDIO_EXT.test(name);
}

export function audioMime(name: string, type: string): string {
  const ext = name.split(".").pop()?.toLowerCase() ?? "";
  const known: Record<string, string> = { mp3: "audio/mpeg", wav: "audio/wav", m4a: "audio/mp4", aac: "audio/aac", ogg: "audio/ogg", oga: "audio/ogg", opus: "audio/ogg", flac: "audio/flac", webm: "audio/webm" };
  return known[ext] ?? type;
}

/** Motivo de recusa por formato, ou null se o navegador pode tentar tocar. */
export function formatProblem(name: string, type: string, canPlay: (mime: string) => string): string | null {
  if (!isAudioCandidate(name, type)) return "Não é um arquivo de áudio";
  const mime = audioMime(name, type);
  if (mime && canPlay(mime) === "") return `Formato não suportado por este navegador (${mime})`;
  return null;
}

function readBuffer(b: Blob): Promise<ArrayBuffer> {
  if (typeof b.arrayBuffer === "function") return b.arrayBuffer();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as ArrayBuffer);
    r.onerror = () => reject(r.error);
    r.readAsArrayBuffer(b);
  });
}

/**
 * Impressão digital do conteúdo: tamanho + SHA-256 do início e do fim do arquivo.
 * Detecta o mesmo arquivo mesmo com outro nome ou em outra subpasta.
 */
export async function fingerprint(blob: Blob): Promise<string> {
  const CHUNK = 256 * 1024;
  const head = blob.slice(0, CHUNK);
  const tail = blob.size > CHUNK ? blob.slice(Math.max(CHUNK, blob.size - CHUNK)) : new Blob();
  const buf = await readBuffer(new Blob([head, tail]));
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const hash = await crypto.subtle.digest("SHA-256", buf);
    const hex = Array.from(new Uint8Array(hash), (b) => b.toString(16).padStart(2, "0")).join("");
    return `${blob.size}:${hex}`;
  }
  // Sem crypto.subtle: soma simples (menos forte, ainda leva o tamanho em conta)
  let h = 0;
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 7) h = (h * 31 + bytes[i]!) | 0;
  return `${blob.size}:w${(h >>> 0).toString(16)}`;
}

// ---- Seletor de pasta (File System Access API) ----
interface DirHandle {
  kind: "directory";
  name: string;
  values(): AsyncIterable<DirHandle | FileHandle>;
}
interface FileHandle {
  kind: "file";
  name: string;
  getFile(): Promise<File>;
}

export function supportsDirectoryPicker(): boolean {
  if (typeof window === "undefined" || !("showDirectoryPicker" in window)) return false;
  // O seletor File System Access ainda falha em vários navegadores Android,
  // mesmo quando a função aparece no objeto window. Prefira o input webkitdirectory.
  return !/Android/i.test(navigator.userAgent);
}

export function supportsWebkitDirectory(): boolean {
  if (typeof document === "undefined") return false;
  return "webkitdirectory" in document.createElement("input");
}

export class ImportCancelled extends Error {}

/** Abre o seletor de pasta do sistema (somente leitura). */
export async function pickDirectory(): Promise<DirHandle> {
  const w = window as unknown as { showDirectoryPicker: (o: { mode: "read"; id?: string }) => Promise<DirHandle> };
  return w.showDirectoryPicker({ mode: "read", id: "player-music" });
}

/** Percorre a pasta escolhida e suas subpastas, coletando arquivos. Nunca sai da pasta escolhida. */
export async function walkDirectory(
  dir: DirHandle,
  signal: AbortSignal,
  onFile: (n: number, path: string) => void,
  skipped: SkippedItem[],
  prefix = "",
): Promise<ImportItem[]> {
  const out: ImportItem[] = [];
  for await (const entry of dir.values()) {
    if (signal.aborted) throw new ImportCancelled();
    const path = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.kind === "directory") {
      try {
        out.push(...(await walkDirectory(entry, signal, onFile, skipped, path)));
      } catch (e) {
        if (e instanceof ImportCancelled) throw e;
        skipped.push({ path, reason: "Não foi possível ler esta subpasta" });
      }
    } else {
      try {
        out.push({ file: await entry.getFile(), path });
        onFile(out.length, path);
      } catch {
        skipped.push({ path, reason: "Erro de leitura do arquivo" });
      }
    }
  }
  return out;
}

export function describePickerError(e: unknown): string | null {
  const name = (e as { name?: string })?.name;
  if (name === "AbortError") return null; // usuário fechou o seletor
  if (name === "NotAllowedError" || name === "SecurityError") return "Permissão negada para ler a pasta.";
  return "Não foi possível abrir a pasta.";
}


/** Lê metadados ID3 (MP3) quando disponíveis, sem depender do nome do arquivo. */
export async function readAudioTags(blob: Blob): Promise<{ title?: string; artist?: string; album?: string }> {
  const decodeText = (bytes: Uint8Array): string => {
    if (!bytes.length) return "";
    const encoding = bytes[0]!;
    const payload = bytes.subarray(1);
    let value = "";
    try {
      if (encoding === 0) value = new TextDecoder("windows-1252").decode(payload);
      else if (encoding === 3) value = new TextDecoder("utf-8").decode(payload);
      else if (encoding === 2) {
        const swapped = new Uint8Array(payload.length);
        for (let i = 0; i + 1 < payload.length; i += 2) { swapped[i] = payload[i + 1]!; swapped[i + 1] = payload[i]!; }
        value = new TextDecoder("utf-16le").decode(swapped);
      } else value = new TextDecoder("utf-16").decode(payload);
    } catch { return ""; }
    return value.replace(/\u0000/g, "").replace(/^\uFEFF/, "").trim();
  };
  const head = new Uint8Array(await blob.slice(0, Math.min(blob.size, 1024 * 1024)).arrayBuffer());
  const tags: { title?: string; artist?: string; album?: string } = {};
  if (head.length >= 10 && head[0] === 0x49 && head[1] === 0x44 && head[2] === 0x33) {
    const version = head[3]!;
    const size = ((head[6]! & 0x7f) << 21) | ((head[7]! & 0x7f) << 14) | ((head[8]! & 0x7f) << 7) | (head[9]! & 0x7f);
    let offset = 10;
    const end = Math.min(head.length, 10 + size);
    while (offset + 10 <= end) {
      const id = String.fromCharCode(...head.subarray(offset, offset + 4));
      if (!/^[A-Z0-9]{4}$/.test(id)) break;
      let frameSize = version >= 4
        ? ((head[offset + 4]! & 0x7f) << 21) | ((head[offset + 5]! & 0x7f) << 14) | ((head[offset + 6]! & 0x7f) << 7) | (head[offset + 7]! & 0x7f)
        : new DataView(head.buffer, head.byteOffset + offset + 4, 4).getUint32(0);
      if (!frameSize || offset + 10 + frameSize > end) break;
      const value = decodeText(head.subarray(offset + 10, offset + 10 + frameSize));
      if (value) {
        if (id === "TIT2") tags.title = value;
        if (id === "TPE1") tags.artist = value;
        if (id === "TALB") tags.album = value;
      }
      offset += 10 + frameSize;
    }
  }
  // Fallback para arquivos com tag ID3v1.
  if (!tags.title && blob.size >= 128) {
    const tail = new Uint8Array(await blob.slice(blob.size - 128).arrayBuffer());
    if (String.fromCharCode(...tail.subarray(0, 3)) === "TAG") {
      const read = (start: number, length: number) => new TextDecoder("windows-1252").decode(tail.subarray(start, start + length)).replace(/\u0000/g, "").trim();
      tags.title = read(3, 30) || undefined;
      tags.artist = read(33, 30) || undefined;
      tags.album = read(63, 30) || undefined;
    }
  }
  return tags;
}
