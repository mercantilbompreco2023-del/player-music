import { useEffect, useRef, useState } from "react";
import { ImagePlus, Image, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { trackVisualStore, visualKind } from "@/lib/music/track-visual";
import type { Track } from "@/lib/music/types";
import { usePlayer } from "@/lib/music/player-context";
import { toast } from "sonner";
import { ArtistPhoto } from "./HomePlayer";

export function TrackVisual({ track }: { track: Track }) {
  const p = usePlayer();
  const key = track.fingerprint ?? track.id;
  const [visual, setVisual] = useState<{ url: string; kind: "image" | "video" } | null>(null);
  const [show, setShow] = useState(true);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const video = useRef<HTMLVideoElement>(null);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    let url: string | undefined;
    setVisual(null);
    void trackVisualStore.get(key).then((saved) => {
      if (!active || !saved) return;
      url = URL.createObjectURL(saved.blob);
      setVisual({ url, kind: saved.kind });
    }).catch(() => toast.error("Não foi possível abrir a foto ou vídeo salvo."));
    return () => { active = false; if (url) URL.revokeObjectURL(url); };
  }, [key, revision]);
  useEffect(() => {
    const element = video.current;
    if (!element) return;
    if (Math.abs(element.currentTime - p.currentTime) > 0.75) element.currentTime = p.currentTime;
    if (p.current?.id === track.id && p.isPlaying) void element.play().catch(() => toast.message("O celular não permitiu exibir este vídeo."));
    else element.pause();
  }, [p.currentTime, p.isPlaying, p.current?.id, track.id, visual, show]);
  async function choose(file?: File) {
    if (!file) return;
    const kind = visualKind(file.type);
    if (!kind) { toast.error("Escolha uma foto ou um vídeo."); return; }
    setBusy(true);
    try {
      await trackVisualStore.put(key, { blob: file, kind });
      setShow(true); setRevision((n) => n + 1);
      toast.success("Foto ou vídeo salvo neste aparelho para esta música.");
    } catch { toast.error("Não foi possível salvar. Verifique o espaço livre no aparelho."); }
    finally { setBusy(false); }
  }
  return <div className="space-y-1">
    <div className="aspect-square overflow-hidden">
      {show && visual ? visual.kind === "image" ? <img src={visual.url} alt={`Foto de ${track.title}`} className="size-full object-cover" onError={() => setShow(false)} /> : <video ref={video} src={visual.url} muted playsInline loop preload="metadata" aria-label={`Vídeo de ${track.title}`} className="size-full object-cover" onError={() => { setShow(false); toast.error("Este formato de vídeo não é compatível com o aparelho."); }} /> : <ArtistPhoto artist={track.artist} fallbackSeed={track.id} />}
    </div>
    <div className="flex justify-center gap-1">
      <Button size="icon" variant="ghost" className="size-8" disabled={busy} title="Escolher foto ou vídeo do celular" aria-label="Escolher foto ou vídeo do celular" onClick={() => input.current?.click()}><ImagePlus className="size-4" /></Button>
      {visual && <><Button size="icon" variant="ghost" className="size-8" title={show ? "Ocultar foto ou vídeo" : "Mostrar foto ou vídeo"} aria-label={show ? "Ocultar foto ou vídeo" : "Mostrar foto ou vídeo"} aria-pressed={show} onClick={() => setShow((s) => !s)}>{visual.kind === "video" ? <Video className="size-4" /> : <Image className="size-4" />}</Button><Button size="icon" variant="ghost" className="size-8" title="Remover foto ou vídeo" aria-label="Remover foto ou vídeo" onClick={() => { void trackVisualStore.remove(key).then(() => setRevision((n) => n + 1)).catch(() => toast.error("Não foi possível remover.")); }}><X className="size-4" /></Button></>}
    </div>
    <input ref={input} type="file" accept="image/*,video/*" className="sr-only" onChange={(e) => { void choose(e.target.files?.[0]); e.currentTarget.value = ""; }} />
  </div>;
}