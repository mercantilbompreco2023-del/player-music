import { useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, ListMusic, Loader2, Music2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { usePlayer } from "@/lib/music/player-context";
import { nativeScan, readDeviceFile, deviceTrackLabel, type DeviceTrack } from "@/lib/music/native-scan";
import type { ImportReport } from "@/lib/music/import";

const FOLDER = "Músicas do celular";

type State =
  | { s: "idle" }
  | { s: "procurando" }
  | { s: "lista"; files: DeviceTrack[]; picked: Set<string>; hitLimit: boolean }
  | { s: "importando"; p: number; total: number; imported: number; current: string }
  | { s: "fim"; r: ImportReport }
  | { s: "erro"; msg: string };

/** Procura as músicas que já estão no aparelho e adiciona as escolhidas à biblioteca. */
export function DeviceScan() {
  const { importItems } = usePlayer();
  const [st, setSt] = useState<State>({ s: "idle" });
  const ctrl = useRef<AbortController | null>(null);
  const busy = st.s === "procurando" || st.s === "importando";

  async function find() {
    if (!nativeScan) return;
    setSt({ s: "procurando" });
    try {
      const { files, limit } = await nativeScan.scan();
      if (files.length === 0) {
        setSt({ s: "erro", msg: "Nenhuma música foi encontrada no aparelho. Se você tem músicas em uma pasta específica, use “Importar pasta de músicas”." });
        return;
      }
      setSt({ s: "lista", files, picked: new Set(files.map((f) => f.uri)), hitLimit: files.length >= limit });
    } catch (e) {
      const code = (e as { code?: string })?.code;
      setSt({
        s: "erro",
        msg: code === "UNIMPLEMENTED"
          ? "Atualize o aplicativo para usar a busca de músicas do aparelho."
          : (e as { message?: string })?.message ?? "Não foi possível procurar as músicas do aparelho.",
      });
    }
  }

  function toggle(uri: string) {
    setSt((cur) => {
      if (cur.s !== "lista") return cur;
      const picked = new Set(cur.picked);
      if (picked.has(uri)) picked.delete(uri); else picked.add(uri);
      return { ...cur, picked };
    });
  }

  function toggleAll(all: boolean) {
    setSt((cur) => (cur.s === "lista" ? { ...cur, picked: all ? new Set(cur.files.map((f) => f.uri)) : new Set<string>() } : cur));
  }

  async function addSelected() {
    if (st.s !== "lista" || !nativeScan) return;
    const chosen = st.files.filter((f) => st.picked.has(f.uri));
    if (chosen.length === 0) return;
    const c = new AbortController();
    ctrl.current = c;
    const total: ImportReport = { found: chosen.length, imported: 0, duplicates: 0, skipped: [], cancelled: false };
    for (let i = 0; i < chosen.length; i++) {
      const t = chosen[i]!;
      if (c.signal.aborted) { total.cancelled = true; break; }
      setSt({ s: "importando", p: i, total: chosen.length, imported: total.imported, current: deviceTrackLabel(t) });
      try {
        const file = await readDeviceFile(t);
        const r = await importItems([{ file, path: t.name, folderName: FOLDER }], { signal: c.signal, quiet: true });
        total.imported += r.imported;
        total.duplicates += r.duplicates;
        total.skipped.push(...r.skipped);
        if (r.cancelled) { total.cancelled = true; break; }
      } catch {
        total.skipped.push({ path: t.name, reason: "Erro ao ler a música" });
      }
    }
    setSt({ s: "fim", r: total });
  }

  if (!nativeScan) {
    return (
      <section className="space-y-3 rounded-2xl border-2 border-primary/40 bg-card p-4" aria-labelledby="buscar-titulo">
        <h2 id="buscar-titulo" className="flex items-center gap-2 text-lg font-bold"><Search className="size-5 text-primary" /> Encontrar músicas do meu celular</h2>
        <p className="text-sm text-muted-foreground">
          O navegador não tem permissão para procurar sozinho no aparelho inteiro — isso só é possível dentro do aplicativo instalado (APK).
          Aqui você continua podendo escolher <b>uma pasta inteira</b> ou <b>vários arquivos de uma vez</b>, e as músicas entram na biblioteca do mesmo jeito.
        </p>
      </section>
    );
  }

  const pickedCount = st.s === "lista" ? st.picked.size : 0;

  return (
    <section className="space-y-3 rounded-2xl border-2 border-primary/40 bg-card p-4" aria-labelledby="buscar-titulo">
      <h2 id="buscar-titulo" className="flex items-center gap-2 text-lg font-bold"><Search className="size-5 text-primary" /> Encontrar músicas do meu celular</h2>
      <p className="text-sm text-muted-foreground">
        O aplicativo procura as músicas que já estão no seu aparelho e mostra a lista. Você escolhe quais entram — nada é adicionado sem você confirmar,
        e nenhuma música sua é apagada ou enviada para a internet.
      </p>

      {st.s === "idle" && (
        <Button size="lg" className="h-12 w-full rounded-full text-base" onClick={() => void find()}>
          <Search /> Procurar músicas no celular
        </Button>
      )}

      {st.s === "procurando" && (
        <p role="status" className="flex items-center gap-2 text-sm"><Loader2 className="size-4 animate-spin" /> Procurando as músicas do aparelho…</p>
      )}

      {st.s === "lista" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold">{st.files.length} música(s) encontrada(s)</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" className="rounded-full" onClick={() => toggleAll(true)}>Selecionar todas</Button>
              <Button variant="secondary" size="sm" className="rounded-full" onClick={() => toggleAll(false)}>Nenhuma</Button>
            </div>
          </div>
          {st.hitLimit && (
            <p className="rounded-lg bg-muted p-2 text-xs text-muted-foreground">
              A lista mostra as primeiras {st.files.length} músicas. Para as outras, use “Importar pasta de músicas”.
            </p>
          )}
          <ul className="max-h-72 space-y-1 overflow-y-auto rounded-lg border bg-background/40 p-2">
            {st.files.map((t) => (
              <li key={t.uri} className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/60">
                <Checkbox
                  id={`dev-${t.uri}`}
                  checked={st.picked.has(t.uri)}
                  onCheckedChange={() => toggle(t.uri)}
                  aria-label={`Selecionar ${deviceTrackLabel(t)}`}
                />
                <label htmlFor={`dev-${t.uri}`} className="min-w-0 flex-1 cursor-pointer">
                  <span className="block truncate text-sm font-medium">{deviceTrackLabel(t)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[t.artist, t.album].filter(Boolean).join(" · ") || "Artista desconhecido"}
                  </span>
                </label>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{Math.round(t.size / 1024 / 1024)} MB</span>
              </li>
            ))}
          </ul>
          <Button size="lg" className="h-12 w-full rounded-full text-base" disabled={pickedCount === 0} onClick={() => void addSelected()}>
            <Music2 /> Adicionar {pickedCount} selecionada(s)
          </Button>
        </div>
      )}

      {st.s === "importando" && (
        <div role="status" className="space-y-2">
          <p className="text-sm">Adicionando {st.p} de {st.total} · {st.imported} adicionada(s)</p>
          <Progress value={(st.p / st.total) * 100} aria-label="Progresso da adicionação" />
          <p className="truncate text-xs text-muted-foreground">{st.current}</p>
          <Button variant="secondary" className="w-full rounded-full" onClick={() => ctrl.current?.abort()}>
            <X /> Cancelar
          </Button>
        </div>
      )}

      {st.s === "erro" && (
        <div className="space-y-2">
          <p role="alert" className="flex items-center gap-2 rounded-lg bg-destructive/15 p-3 text-sm">
            <AlertTriangle className="size-4 shrink-0 text-destructive" /> {st.msg}
          </p>
          <Button variant="secondary" className="w-full rounded-full" onClick={() => void find()}>
            <Search /> Tentar de novo
          </Button>
        </div>
      )}

      {st.s === "fim" && (
        <div role="status" className="space-y-2 rounded-lg bg-muted p-3 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            {st.r.cancelled ? <AlertTriangle className="size-4 text-primary" /> : <CheckCircle2 className="size-4 text-primary" />}
            {st.r.cancelled ? "Adicionação cancelada" : "Músicas adicionadas"}
          </p>
          <ul className="grid grid-cols-2 gap-1 text-xs">
            <li>Escolhidas: <b>{st.r.found}</b></li>
            <li>Adicionadas: <b>{st.r.imported}</b></li>
            <li>Já existiam: <b>{st.r.duplicates}</b></li>
            <li>Ignoradas: <b>{st.r.skipped.length - st.r.duplicates}</b></li>
          </ul>
          <p className="text-xs text-muted-foreground">Elas aparecem na biblioteca e no cartão de pasta “{FOLDER}”.</p>
          {st.r.skipped.length > 0 && (
            <details>
              <summary className="cursor-pointer text-xs font-semibold">Ver músicas não adicionadas ({st.r.skipped.length})</summary>
              <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto text-xs">
                {st.r.skipped.map((s, i) => (
                  <li key={i}><span className="break-all">{s.path}</span> — <span className="text-muted-foreground">{s.reason}</span></li>
                ))}
              </ul>
            </details>
          )}
          <Button variant="secondary" className="w-full rounded-full" onClick={() => void find()}>
            <ListMusic /> Procurar de novo
          </Button>
        </div>
      )}
    </section>
  );
}
