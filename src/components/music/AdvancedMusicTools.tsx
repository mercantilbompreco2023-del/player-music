import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AudioLines, Bluetooth, Clock3, Headphones, ListMusic, Mic2, Palette, Smartphone, Sparkles, TimerOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { usePlayer } from "@/lib/music/player-context";

const TIMER_KEY = "pm:sleep-timer:v1";
const LYRICS_KEY = "pm:lyrics:v1";
const THEME_KEY = "pm:accent-theme:v1";
const themes = [
  { id: "violet", label: "Roxo", value: "270 90% 65%" },
  { id: "blue", label: "Azul", value: "215 95% 60%" },
  { id: "green", label: "Verde", value: "155 70% 45%" },
  { id: "pink", label: "Rosa", value: "325 85% 62%" },
  { id: "orange", label: "Laranja", value: "25 95% 55%" },
];

export function AdvancedMusicTools() {
  const p = usePlayer();
  const [deadline, setDeadline] = useState<number | null>(null);
  const [remaining, setRemaining] = useState(0);
  const [customMinutes, setCustomMinutes] = useState("30");
  const [lyrics, setLyrics] = useState("");
  const [theme, setTheme] = useState("violet");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(TIMER_KEY);
      const value = raw ? Number(raw) : 0;
      if (value > Date.now()) setDeadline(value);
      else localStorage.removeItem(TIMER_KEY);
      setTheme(localStorage.getItem(THEME_KEY) || "violet");
    } catch { /* armazenamento local opcional */ }
  }, []);

  useEffect(() => {
    if (!deadline) { setRemaining(0); return; }
    const tick = () => {
      const seconds = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setRemaining(seconds);
      if (seconds === 0) {
        setDeadline(null);
        try { localStorage.removeItem(TIMER_KEY); } catch { /* opcional */ }
        if (p.isPlaying) p.toggle();
      }
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [deadline, p.isPlaying, p.toggle]);

  useEffect(() => {
    if (!p.current) { setLyrics(""); setSaved(false); return; }
    try {
      const all = JSON.parse(localStorage.getItem(LYRICS_KEY) || "{}") as Record<string, string>;
      setLyrics(all[p.current.id] || "");
      setSaved(false);
    } catch { setLyrics(""); }
  }, [p.current?.id]);

  useEffect(() => {
    const selected = themes.find((item) => item.id === theme) || themes[0]!;
    document.documentElement.style.setProperty("--primary", selected.value);
    document.documentElement.style.setProperty("--ring", selected.value);
    try { localStorage.setItem(THEME_KEY, theme); } catch { /* preferência opcional */ }
  }, [theme]);

  const startTimer = (minutes: number) => {
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 720) return;
    const end = Date.now() + minutes * 60_000;
    setDeadline(end);
    try { localStorage.setItem(TIMER_KEY, String(end)); } catch { /* sessão atual continua */ }
  };
  const stopTimer = () => {
    setDeadline(null);
    setRemaining(0);
    try { localStorage.removeItem(TIMER_KEY); } catch { /* opcional */ }
  };
  const timeLabel = useMemo(() => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remaining]);

  const makeSmartPlaylist = (kind: "favorites" | "recent" | "artist") => {
    const available = p.tracks.filter((track) => track.source !== "demo");
    const ids = kind === "favorites"
      ? available.filter((track) => p.isFavorite(track.id)).map((track) => track.id)
      : kind === "recent"
        ? [...p.prefs.recent].filter((id) => available.some((track) => track.id === id))
        : available.filter((track, index, all) => all.findIndex((item) => item.artist.toLocaleLowerCase() === track.artist.toLocaleLowerCase()) === index).map((track) => track.id);
    if (!ids.length) return;
    const name = kind === "favorites" ? "Favoritas inteligentes" : kind === "recent" ? "Tocadas recentemente" : "Meus artistas";
    const playlist = p.createPlaylist(name);
    ids.forEach((id) => p.addToPlaylist(playlist.id, id));
  };

  const saveLyrics = () => {
    if (!p.current) return;
    try {
      const all = JSON.parse(localStorage.getItem(LYRICS_KEY) || "{}") as Record<string, string>;
      all[p.current.id] = lyrics;
      localStorage.setItem(LYRICS_KEY, JSON.stringify(all));
      setSaved(true);
    } catch { setSaved(false); }
  };

  return (
    <div className="space-y-5">
      <section className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4">
        <div className="flex items-center gap-2"><Clock3 className="size-5 text-primary" /><h2 className="text-lg font-bold">Temporizador para dormir</h2></div>
        {deadline ? <div className="flex items-center justify-between rounded-xl bg-primary/10 p-3"><div><p className="text-xs text-muted-foreground">A reprodução será pausada em</p><p className="text-3xl font-bold tabular-nums">{timeLabel}</p></div><Button variant="outline" onClick={stopTimer}><TimerOff className="size-4" /> Cancelar</Button></div> : <div className="flex flex-wrap gap-2">{[15, 30, 45, 60, 90].map((m) => <Button key={m} variant="outline" onClick={() => startTimer(m)}>{m} min</Button>)}</div>}
        <div className="flex gap-2"><input aria-label="Minutos personalizados" type="number" min="1" max="720" value={customMinutes} onChange={(e) => setCustomMinutes(e.target.value)} className="w-24 rounded-lg border bg-background px-3 py-2" /><Button onClick={() => startTimer(Number(customMinutes))} disabled={!!deadline}>Definir tempo</Button></div>
        <p className="text-xs text-muted-foreground">O horário fica salvo neste aparelho; ao chegar a zero, o player pausa a música.</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4">
        <div className="flex items-center gap-2"><Palette className="size-5 text-primary" /><h2 className="text-lg font-bold">Temas personalizados</h2></div>
        <p className="text-sm text-muted-foreground">Escolha a cor principal dos botões e destaques do aplicativo.</p>
        <div className="flex flex-wrap gap-3">{themes.map((item) => <button key={item.id} type="button" onClick={() => setTheme(item.id)} aria-pressed={theme === item.id} className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm ${theme === item.id ? "border-primary ring-2 ring-primary/30" : "border-border"}`}><span className="size-4 rounded-full" style={{ backgroundColor: `hsl(${item.value})` }} />{item.label}</button>)}</div>
      </section>

      <section className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4">
        <div className="flex items-center gap-2"><ListMusic className="size-5 text-primary" /><h2 className="text-lg font-bold">Playlists inteligentes</h2></div>
        <p className="text-sm text-muted-foreground">Crie listas automaticamente usando suas músicas locais, favoritos e histórico.</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3"><Button variant="outline" onClick={() => makeSmartPlaylist("favorites")}>Minhas favoritas</Button><Button variant="outline" onClick={() => makeSmartPlaylist("recent")}>Tocadas recentemente</Button><Button variant="outline" onClick={() => makeSmartPlaylist("artist")}>Por artistas</Button></div>
        <Link to="/playlists" className="text-sm font-semibold text-primary">Abrir minhas playlists →</Link>
      </section>

      <section className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4">
        <div className="flex items-center gap-2"><Mic2 className="size-5 text-primary" /><h2 className="text-lg font-bold">Modo karaokê — letras da música</h2></div>
        {p.current ? <><p className="text-sm text-muted-foreground">Letra ou anotação salva somente neste aparelho para: <strong>{p.current.title}</strong>.</p><Textarea value={lyrics} onChange={(e) => { setLyrics(e.target.value); setSaved(false); }} placeholder="Cole ou escreva aqui a letra autorizada da música…" rows={6} /><div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">{saved ? "Letra salva neste aparelho" : "Não salvo ainda"}</span><Button onClick={saveLyrics}>Salvar letra</Button></div></> : <p className="text-sm text-muted-foreground">Comece a tocar uma música para adicionar a letra.</p>}
      </section>

      <section className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4">
        <div className="flex items-center gap-2"><Headphones className="size-5 text-primary" /><h2 className="text-lg font-bold">Equalizador de áudio</h2></div>
        <p className="text-sm text-muted-foreground">O player atual reproduz o áudio pelo elemento nativo do Android WebView. Um equalizador real precisa controlar a sessão de áudio do Android; esta ligação ainda não está disponível. Não vou mostrar controles de grave/agudo que não alteram o som.</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4">
        <div className="flex items-center gap-2"><Bluetooth className="size-5 text-primary" /><h2 className="text-lg font-bold">Bluetooth e tela bloqueada</h2></div>
        <p className="text-sm text-muted-foreground">O APK já usa a sessão de mídia do Android para os comandos play/pause, próxima e anterior, inclusive pelos botões compatíveis de fones e Bluetooth. A notificação de reprodução também fornece controles na tela bloqueada.</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4">
        <div className="flex items-center gap-2"><AudioLines className="size-5 text-primary" /><h2 className="text-lg font-bold">Visualizador e player profissional</h2></div>
        <p className="text-sm text-muted-foreground">A tela Tocando agora já tem capa/foto/vídeo por faixa, barra de progresso, fila, repetição, aleatório e animação visual. Abra o player completo para usar esses controles.</p>
        <Button asChild className="w-full"><Link to="/player">Abrir player profissional</Link></Button>
      </section>

      <section className="space-y-2 rounded-2xl border border-dashed p-4">
        <div className="flex items-center gap-2"><Smartphone className="size-5 text-primary" /><h2 className="font-bold">Widget na tela inicial do Android</h2></div>
        <p className="text-sm text-muted-foreground">O widget nativo já foi adicionado ao projeto Android, com nome da faixa e botões de anterior, tocar/pausar e próxima. Depois de instalar o APK 1.24, mantenha pressionada a tela inicial do celular, abra Widgets e procure Player Music para adicionar. Os controles dependem do aplicativo e da sessão de reprodução estarem ativos.</p>
      </section>
    </div>
  );
}
