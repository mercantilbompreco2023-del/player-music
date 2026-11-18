import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft, Home, Library, ListMusic, Pause, Play, Search, SkipForward, WifiOff, Volume2, Settings2, Image, AudioLines, FolderOpen, Heart, CirclePlay } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/music/player-context";
import { Cover } from "./Cover";
import playerMusicIcon from "@/assets/player-music-icon.jpg";

const NAV = [
  { to: "/", label: "Início", icon: Home },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/biblioteca", label: "Biblioteca", icon: Library },
  { to: "/playlists", label: "Playlists", icon: ListMusic },
] as const;

const MOBILE_NAV = [
  { to: "/", label: "Início", icon: Home },
  { to: "/biblioteca", label: "Músicas", icon: Library },
  { to: "/playlists", label: "Playlists", icon: ListMusic },
  { to: "/pastas", label: "Pastas", icon: FolderOpen },
  { to: "/favoritos", label: "Favoritos", icon: Heart },
] as const;

type NowPlayingPrefs = { style: "compact" | "highlighted"; showCover: boolean; showArtist: boolean; showProgress: boolean };
const NOW_PLAYING_DEFAULTS: NowPlayingPrefs = { style: "highlighted", showCover: true, showArtist: true, showProgress: true };
const NOW_PLAYING_KEY = "player-music-now-playing-panel";

function MiniPlayer() {
  const p = usePlayer();
  const [customize, setCustomize] = useState(false);
  const [prefs, setPrefs] = useState<NowPlayingPrefs>(NOW_PLAYING_DEFAULTS);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(NOW_PLAYING_KEY);
      if (saved) setPrefs({ ...NOW_PLAYING_DEFAULTS, ...JSON.parse(saved) });
    } catch { /* usa os padrões */ }
  }, []);
  const updatePrefs = (patch: Partial<NowPlayingPrefs>) => {
    setPrefs((current) => {
      const next = { ...current, ...patch };
      try { localStorage.setItem(NOW_PLAYING_KEY, JSON.stringify(next)); } catch { /* preferência opcional */ }
      return next;
    });
  };
  if (!p.current) return null;
  const pct = p.duration ? Math.min(100, (p.currentTime / p.duration) * 100) : 0;
  const highlighted = prefs.style === "highlighted";
  return (
    <div className={cn("now-playing-dock mx-2 mb-2 overflow-hidden rounded-[1.25rem] border shadow-2xl transition-all lg:mx-6 lg:mb-3", highlighted ? "border-primary/55 bg-[#0b1710]/95 ring-1 ring-primary/15" : "glass")}>
      <div className={cn("flex items-center gap-3", highlighted ? "px-3 py-2 lg:px-4 lg:py-2.5" : "p-2 lg:px-3 lg:py-2")}>
        <Link to="/player" className="flex min-w-0 flex-1 items-center gap-3" aria-label="Abrir player">
          {prefs.showCover && <Cover seed={p.current.id} className={cn("shrink-0", highlighted ? "size-11 rounded-xl lg:size-12" : "size-9")} />}
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[.18em] text-primary">
              {p.isPlaying ? <><span className="size-1.5 animate-pulse rounded-full bg-primary" /> Tocando agora</> : "Reprodução pausada"}
            </p>
            <p className={cn("truncate font-extrabold tracking-tight", highlighted ? "text-sm lg:text-[15px]" : "text-xs")}>{p.current.title}</p>
            {prefs.showArtist && <p className="truncate text-xs text-muted-foreground">{p.current.artist}</p>}
          </div>
        </Link>
        <button onClick={p.toggle} aria-label={p.isPlaying ? "Pausar" : "Tocar"} className={cn("now-playing-action flex shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_0_18px_-7px_rgba(60,230,120,.8)]", highlighted ? "size-10" : "size-9")}>
          {p.isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
        </button>
        <button onClick={p.next} aria-label="Próxima" className="shrink-0 rounded-full p-2 text-foreground hover:bg-muted"><SkipForward className="size-5" /></button>
        <button onClick={() => setCustomize((v) => !v)} aria-label="Personalizar painel de música" aria-expanded={customize} className={cn("shrink-0 rounded-full border p-2", customize ? "border-primary bg-primary/10 text-primary" : "text-muted-foreground hover:text-primary")}><Settings2 className="size-4" /></button>
        <Link to="/player" aria-label="Abrir painel completo de reprodução" className="flex rounded-full border border-primary/25 bg-primary/10 p-2 text-primary"><Volume2 className="size-4" /></Link>
      </div>
      {prefs.showProgress && <div className={cn("bg-muted", highlighted ? "h-1.5" : "h-0.5")}><div className="h-full bg-primary transition-[width]" style={{ width: `${pct}%` }} /></div>}
      {customize && <div className="grid gap-3 border-t bg-background/95 p-3 sm:grid-cols-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Destaque do painel</span>
          <button onClick={() => updatePrefs({ style: "highlighted" })} aria-pressed={highlighted} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", highlighted ? "border-primary bg-primary/10 text-primary" : "border-border")}>Destacado</button>
          <button onClick={() => updatePrefs({ style: "compact" })} aria-pressed={!highlighted} className={cn("rounded-full border px-3 py-1.5 text-xs font-semibold", !highlighted ? "border-primary bg-primary/10 text-primary" : "border-border")}>Compacto</button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="w-full text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Mostrar no painel</span>
          <button onClick={() => updatePrefs({ showCover: !prefs.showCover })} aria-pressed={prefs.showCover} className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs", prefs.showCover && "border-primary text-primary")}><Image className="size-3.5" /> Capa</button>
          <button onClick={() => updatePrefs({ showArtist: !prefs.showArtist })} aria-pressed={prefs.showArtist} className={cn("inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs", prefs.showArtist && "border-primary text-primary")}><AudioLines className="size-3.5" /> Artista</button>
          <button onClick={() => updatePrefs({ showProgress: !prefs.showProgress })} aria-pressed={prefs.showProgress} className={cn("rounded-full border px-3 py-1.5 text-xs", prefs.showProgress && "border-primary text-primary")}>Progresso</button>
        </div>
      </div>}
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  const onPlayer = pathname === "/player";
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const u = () => setOffline(!navigator.onLine);
    u();
    window.addEventListener("online", u);
    window.addEventListener("offline", u);
    return () => { window.removeEventListener("online", u); window.removeEventListener("offline", u); };
  }, []);
  return (
    <div className="min-h-screen">
      {offline && (
        <div role="status" className="fixed inset-x-0 top-0 z-50 flex items-center gap-2 bg-muted px-4 py-2 text-xs lg:left-64">
          <WifiOff className="size-4" /> Sem conexão. Suas músicas importadas continuam tocando; cartões e administração usam a última versão salva.
        </div>
      )}

      {!onPlayer && <aside className="glass fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border/70 p-5 shadow-2xl shadow-black/15 lg:flex">
        <Link to="/" className="mb-8 flex items-center gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-card px-3 py-3 shadow-lg shadow-black/10">
          <img src={playerMusicIcon} alt="" width={44} height={44} className="size-11 rounded-lg" />
          <span className="font-display text-xl font-bold tracking-tight">Delícia Coxi’s <span className="text-primary">Music</span></span>
        </Link>
        <p className="mb-3 px-3 text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Sua música</p>
        <nav aria-label="Navegação principal" className="space-y-2">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors", active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
                <Icon className="size-5" /> {label}
              </Link>
            );
          })}
          <Link to="/pastas" className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors", pathname.startsWith("/pastas") ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <FolderOpen className="size-5" /> Pastas
          </Link>
          <Link to="/favoritos" className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors", pathname.startsWith("/favoritos") ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Heart className="size-5" /> Favoritos
          </Link>
          <Link to="/importar" className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors", pathname === "/importar" ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Library className="size-5" /> Importar músicas
          </Link>
          <Link to="/configuracoes" className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors", pathname.startsWith("/configuracoes") ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Settings2 className="size-5" /> Configurações
          </Link>
        </nav>
        <div className="mt-auto rounded-2xl border bg-card/70 p-4">
          <p className="text-sm font-semibold">Player Music</p>
          <p className="mt-1 text-xs text-muted-foreground">Sua biblioteca, do seu jeito.</p>
          <p className="mt-2 text-[11px] font-semibold tracking-wide text-primary">Feito por Adevaldo Marques</p>
        </div>
      </aside>}

      {!onPlayer && (      <header className="glass fixed left-64 right-0 top-0 z-30 hidden h-20 items-center justify-between border-b px-8 lg:flex">
        <Link to="/buscar" className="flex w-full max-w-xl items-center gap-3 rounded-full border bg-background/70 px-5 py-3 text-sm text-muted-foreground hover:border-primary/60">
          <Search className="size-5" /> Buscar músicas, artistas ou álbuns...
        </Link>
        <Link to="/configuracoes" className="rounded-full border p-3 text-muted-foreground hover:text-primary" aria-label="Configurações">⚙</Link>
      </header> )}

      <div className="lg:pl-64">
        <main className={cn("mx-auto w-full max-w-7xl px-4 pt-6 lg:px-8 lg:pt-28", onPlayer ? "pb-24" : "pb-44 lg:pb-32")}>{children}</main>
      </div>

      {!onPlayer && (      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl pb-safe lg:hidden">
        {!onPlayer && <MiniPlayer />}
        <nav className="glass mx-2 mb-2 grid grid-cols-5 rounded-[1.4rem] border border-border/80 p-1.5 shadow-2xl shadow-black/25">
          {MOBILE_NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={cn("flex min-w-0 flex-col items-center gap-1 rounded-xl py-2.5 text-[10px] font-semibold transition-all", active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-muted")}>
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div> )}
      <div className="fixed bottom-0 left-64 right-0 z-40 hidden pb-safe lg:block">
        <MiniPlayer />
      </div>
    </div>
  );
}

export function PageHeader({ title, action, description }: { title: string; action?: ReactNode; description?: string }) {
  return (
    <header className="mb-6 space-y-3 rounded-2xl border border-border/60 bg-card/45 p-4 shadow-sm backdrop-blur-sm sm:p-5">
      <Link to="/" className="inline-flex items-center gap-1 rounded-full py-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Início
      </Link>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        {action}
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </header>
  );
}
