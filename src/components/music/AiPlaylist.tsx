import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useSession } from "@/lib/auth";
import { usePlayer } from "@/lib/music/player-context";
import { playlistRequest } from "@/lib/music/ai-playlist";
import { suggestPlaylist } from "@/lib/music/ai-playlist.functions";

export function AiPlaylist() {
  const p = usePlayer();
  const { user } = useSession();
  const suggest = useServerFn(suggestPlaylist);
  const [mood, setMood] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<{ name: string; trackIds: string[] } | null>(null);
  const tracks = p.tracks.filter((t) => t.source !== "demo");
  return <section className="mb-6 space-y-3 border-y py-5" aria-label="Playlist por estilo">
    <h2 className="flex items-center gap-2 text-lg font-semibold"><Sparkles className="size-5 text-primary" /> Playlist por estilo</h2>
    <p className="text-xs text-muted-foreground">Ao gerar, sua descrição e os títulos e artistas são enviados à IA. Nenhum áudio é enviado. A seleção usa esses nomes, sem analisar o som.</p>
    {!user ? <Button asChild variant="outline"><Link to="/auth" search={{ redirect: "/playlists" }}>Entrar para gerar playlist</Link></Button> : <form className="space-y-3" onSubmit={async (e) => {
      e.preventDefault(); setMessage(""); setResult(null);
      const parsed = playlistRequest.safeParse({ mood, tracks: tracks.slice(0, 500).map(({ id, title, artist }) => ({ id, title, artist })) });
      if (!parsed.success) { setMessage("Descreva o estilo e importe pelo menos uma música."); return; }
      setBusy(true);
      try { const response = await suggest({ data: parsed.data }); if (response.error) setMessage(response.error); else if (response.selection?.trackIds.length) setResult(response.selection); else setMessage("Não encontrei faixas que combinem com esse pedido."); }
      catch { setMessage("Não foi possível gerar. Confira sua conexão e sua conta."); }
      finally { setBusy(false); }
    }}>
      <Textarea aria-label="Estilo ou clima da playlist" placeholder="Ex.: forró animado para o fim de semana" maxLength={500} value={mood} onChange={(e) => setMood(e.target.value)} disabled={busy} />
      {tracks.length > 500 && <p className="text-xs text-muted-foreground">Serão consideradas as primeiras 500 músicas da biblioteca.</p>}
      <Button disabled={busy || !p.ready || !tracks.length || mood.trim().length < 2}>{busy ? <Loader2 className="animate-spin" /> : <Sparkles />}{busy ? "Montando…" : "Gerar playlist"}</Button>
    </form>}
    {message && <p role="status" className="text-sm">{message}</p>}
    {result && <div className="space-y-2">
      <h3 className="font-semibold">{result.name}</h3>
      <ul className="space-y-1 text-sm">{result.trackIds.map((id) => <li key={id}>{p.byId(id)?.title} — {p.byId(id)?.artist}</li>)}</ul>
      <Button onClick={() => { const ids = result.trackIds.filter((id) => p.byId(id)); if (!ids.length) { setMessage("As músicas não estão mais disponíveis."); return; } const pl = p.createPlaylist(result.name); ids.forEach((id) => p.addToPlaylist(pl.id, id)); setResult(null); setMessage("Playlist salva na sua biblioteca."); }}>Salvar playlist</Button>
    </div>}
  </section>;
}