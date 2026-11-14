import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FolderOpen, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useHydrated } from "@tanstack/react-router";
import { usePlayer } from "@/lib/music/player-context";
import { nativeFolder, readNativeFile } from "@/lib/music/native-folder";
import {
  AUDIO_EXT, describePickerError, ImportCancelled, pickDirectory, supportsDirectoryPicker, supportsWebkitDirectory, walkDirectory,
  type ImportItem, type ImportProgress, type ImportReport, type SkippedItem,
} from "@/lib/music/import";

type State =
  | { s: "idle" }
  | { s: "lendo"; found: number; current?: string }
  | { s: "importando"; p: ImportProgress }
  | { s: "fim"; r: ImportReport; folder: string }
  | { s: "erro"; msg: string };

async function askPersistentStorage() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch { /* opcional */ }
}

export function FolderImport() {
  const hydrated = useHydrated();
  const { importItems } = usePlayer();
  const [st, setSt] = useState<State>({ s: "idle" });
  const ctrl = useRef<AbortController | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const picker = hydrated && supportsDirectoryPicker();
  const webkitDir = hydrated && supportsWebkitDirectory();
  const busy = st.s === "lendo" || st.s === "importando";

  async function runImport(items: ImportItem[], pre: SkippedItem[], folder: string, c: AbortController) {
    if (items.length === 0 && pre.length === 0) {
      setSt({ s: "erro", msg: `A pasta “${folder}” está vazia.` });
      return;
    }
    const r = await importItems(items.map((item) => ({ ...item, folderName: folder })), { signal: c.signal, quiet: true, onProgress: (p) => setSt({ s: "importando", p }) });
    r.skipped.unshift(...pre);
    r.found += pre.length;
    setSt({ s: "fim", r, folder });
    if (r.imported) void askPersistentStorage();
  }

  async function fromPicker() {
    let dir;
    try {
      dir = await pickDirectory();
    } catch (e) {
      const msg = describePickerError(e);
      // Se o seletor moderno for bloqueado pelo navegador, ofereça o seletor
      // alternativo de pasta em vez de deixar a importação travada.
      setSt(msg ? { s: "erro", msg } : { s: "idle" });
      return;
    }
    const c = new AbortController();
    ctrl.current = c;
    const pre: SkippedItem[] = [];
    setSt({ s: "lendo", found: 0 });
    try {
      const items = await walkDirectory(dir, c.signal, (n, path) => setSt({ s: "lendo", found: n, current: path }), pre);
      await runImport(items, pre, dir.name, c);
    } catch (e) {
      if (e instanceof ImportCancelled) setSt({ s: "fim", folder: dir.name, r: { found: 0, imported: 0, duplicates: 0, skipped: pre, cancelled: true } });
      else setSt({ s: "erro", msg: describePickerError(e) ?? "Leitura interrompida." });
    }
  }

  /** APK Android: seletor de pasta do sistema, lendo um arquivo por vez. */
  async function fromNative() {
    if (!nativeFolder) return;
    let res;
    try {
      res = await nativeFolder.pick();
    } catch (e) {
      const code = (e as { code?: string })?.code;
      setSt(code === "CANCELLED" ? { s: "idle" } : { s: "erro", msg: "Não foi possível ler a pasta escolhida." });
      return;
    }
    const c = new AbortController();
    ctrl.current = c;
    const total: ImportReport = { found: res.files.length, imported: 0, duplicates: 0, skipped: [], cancelled: false };
    const audio = res.files.filter((f) => AUDIO_EXT.test(f.name) || f.type.startsWith("audio/"));
    for (const f of res.files) if (!audio.includes(f)) total.skipped.push({ path: f.path, reason: "Formato não suportado" });
    if (res.files.length === 0) { setSt({ s: "erro", msg: `A pasta “${res.name}” está vazia.` }); return; }
    let processed = total.skipped.length;
    for (const f of audio) {
      if (c.signal.aborted) { total.cancelled = true; break; }
      setSt({ s: "importando", p: { phase: "importando", found: total.found, processed, imported: total.imported, current: f.path } });
      try {
        const file = await readNativeFile(f);
        const r = await importItems([{ file, path: f.path, folderName: res.name }], { signal: c.signal, quiet: true });
        total.imported += r.imported;
        total.duplicates += r.duplicates;
        total.skipped.push(...r.skipped);
        if (r.cancelled) { total.cancelled = true; break; }
      } catch {
        total.skipped.push({ path: f.path, reason: "Erro ao ler o arquivo" });
      }
      processed++;
    }
    setSt({ s: "fim", r: total, folder: res.name });
    if (total.imported) void askPersistentStorage();
  }

  async function fromInput(files: FileList) {
    const c = new AbortController();
    ctrl.current = c;
    const list = Array.from(files);
    const first = (list[0] as File & { webkitRelativePath?: string })?.webkitRelativePath?.split("/")[0] ?? "pasta";
    const items = list.map((file) => ({ file, path: (file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name }));
    await runImport(items, [], first, c);
  }

  return (
    <section className="space-y-3 rounded-2xl border-2 border-primary/40 bg-card p-4" aria-labelledby="pasta-titulo">
      <h2 id="pasta-titulo" className="flex items-center gap-2 text-lg font-bold"><FolderOpen className="size-5 text-primary" /> Importar pasta de músicas</h2>
      <p className="text-sm text-muted-foreground">
        O app lê <b>somente a pasta que você escolher</b> (e as subpastas dela), apenas para leitura. Nenhuma outra pasta é acessada e nada é enviado para a internet.
        As músicas são copiadas para o armazenamento deste navegador, então continuam tocando depois de recarregar, sem pedir acesso de novo.
      </p>

      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        aria-label="Escolher pasta de músicas"
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
        onChange={(e) => { if (e.target.files?.length) void fromInput(e.target.files); else setSt({ s: "erro", msg: "A pasta escolhida está vazia." }); e.target.value = ""; }}
      />

      {!busy && (
        <Button
          size="lg"
          className="h-12 w-full rounded-full text-base"
          disabled={!hydrated || (!nativeFolder && !picker && !webkitDir)}
          onClick={() => (nativeFolder ? void fromNative() : picker ? void fromPicker() : inputRef.current?.click())}
        >
          <FolderOpen /> Importar pasta de músicas
        </Button>
      )}
      {hydrated && !picker && !nativeFolder && (
        <p className="rounded-lg bg-muted p-3 text-xs">
          {webkitDir
            ? "Seu navegador usa o seletor de pasta simples: ele pode pedir para confirmar o envio dos arquivos da pasta (isso só os carrega neste app, não os envia para a internet). Em alguns Android ele não abre subpastas — se isso acontecer, use “Importar músicas” e selecione vários arquivos de uma vez."
            : "Este navegador não permite escolher uma pasta inteira. Use “Importar músicas” logo abaixo e selecione vários arquivos de uma vez."}
        </p>
      )}

      {st.s === "lendo" && (
        <div role="status" className="space-y-2">
          <p className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" /> Lendo a pasta… {st.found} arquivo(s) encontrado(s)</p>
          {st.current && <p className="truncate text-xs text-muted-foreground">{st.current}</p>}
        </div>
      )}
      {st.s === "importando" && (
        <div role="status" className="space-y-2">
          <p className="text-sm">Importando {st.p.processed} de {st.p.found} · {st.p.imported} importada(s)</p>
          <Progress value={st.p.found ? (st.p.processed / st.p.found) * 100 : 0} aria-label="Progresso da importação" />
          {st.p.current && <p className="truncate text-xs text-muted-foreground">{st.p.current}</p>}
        </div>
      )}
      {busy && (
        <Button variant="secondary" className="w-full rounded-full" onClick={() => ctrl.current?.abort()}>
          <X /> Cancelar importação
        </Button>
      )}

      {st.s === "erro" && (
        <div className="space-y-2">
          <p role="alert" className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm"><AlertTriangle className="size-4 shrink-0 text-destructive" /> {st.msg}</p>
          {webkitDir && (
            <Button variant="secondary" className="w-full rounded-full" onClick={() => inputRef.current?.click()}>
              <FolderOpen /> Tentar outro seletor de pasta
            </Button>
          )}
        </div>
      )}
      {st.s === "fim" && (
        <div role="status" className="space-y-2 rounded-lg bg-muted p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            {st.r.cancelled ? <AlertTriangle className="size-4 text-primary" /> : <CheckCircle2 className="size-4 text-primary" />}
            {st.r.cancelled ? "Importação cancelada" : "Importação concluída"} — “{st.folder}”
          </p>
          <ul className="grid grid-cols-2 gap-1 text-xs">
            <li>Encontrados: <b>{st.r.found}</b></li>
            <li>Importados: <b>{st.r.imported}</b></li>
            <li>Duplicados: <b>{st.r.duplicates}</b></li>
            <li>Ignorados: <b>{st.r.skipped.length - st.r.duplicates}</b></li>
          </ul>
          {st.r.cancelled && <p className="text-xs text-muted-foreground">As faixas já importadas foram mantidas inteiras; as restantes não foram adicionadas.</p>}
          {st.r.skipped.length > 0 && (
            <details>
              <summary className="cursor-pointer text-xs font-semibold">Ver arquivos não importados ({st.r.skipped.length})</summary>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
                {st.r.skipped.map((s, i) => (
                  <li key={i}><span className="break-all">{s.path}</span> — <span className="text-muted-foreground">{s.reason}</span></li>
                ))}
              </ul>
            </details>
          )}
        </div>
      )}
    </section>
  );
}
