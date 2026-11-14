import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft, Home, Library, ListMusic, Pause, Play, Search, SkipForward, WifiOff } from "lucide-react";
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

function MiniPlayer() {
  const p = usePlayer();
  if (!p.current) return null;
  const pct = p.duration ? (p.currentTime / p.duration) * 100 : 0;
  return (
    <div className="glass mx-2 mb-2 overflow-hidden rounded-2xl border shadow-glow lg:mx-6 lg:mb-3">
      <div className="flex items-center gap-3 p-2.5 lg:px-4 lg:py-3">
        <Link to="/player" className="flex min-w-0 flex-1 items-center gap-3" aria-label="Abrir player">
          <Cover seed={p.current.id} className="size-11 lg:size-12" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{p.current.title}</p>
            <p className="truncate text-xs text-muted-foreground">{p.current.artist}</p>
          </div>
        </Link>
        <button onClick={p.toggle} aria-label={p.isPlaying ? "Pausar" : "Tocar"} className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {p.isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
        </button>
        <button onClick={p.next} aria-label="Próxima" className="p-2 text-foreground"><SkipForward className="size-5" /></button>
        <div className="hidden min-w-32 flex-1 lg:block">
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <div className="h-0.5 bg-muted lg:hidden"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
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

      <aside className="glass fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r p-5 lg:flex">
        <Link to="/" className="mb-10 flex items-center gap-3 px-2 pt-2">
          <img src={playerMusicIcon} alt="" width={44} height={44} className="size-11 rounded-lg" />
          <span className="font-display text-xl font-bold tracking-tight">Player <span className="text-primary">Music</span></span>
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
          <Link to="/importar" className={cn("flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors", pathname === "/importar" ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-muted hover:text-foreground")}>
            <Library className="size-5" /> Importar músicas
          </Link>
        </nav>
        <div className="mt-auto rounded-2xl border bg-card/70 p-4">
          <p className="text-sm font-semibold">Player Music</p>
          <p className="mt-1 text-xs text-muted-foreground">Sua biblioteca, do seu jeito.</p>
        </div>
      </aside>

      <header className="glass fixed left-64 right-0 top-0 z-30 hidden h-20 items-center justify-between border-b px-8 lg:flex">
        <Link to="/buscar" className="flex w-full max-w-xl items-center gap-3 rounded-full border bg-background/70 px-5 py-3 text-sm text-muted-foreground hover:border-primary/60">
          <Search className="size-5" /> Buscar músicas, artistas ou álbuns...
        </Link>
        <Link to="/configuracoes" className="rounded-full border p-3 text-muted-foreground hover:text-primary" aria-label="Configurações">⚙</Link>
      </header>

      <div className="lg:pl-64">
        <main className={cn("mx-auto w-full max-w-7xl px-4 pt-6 lg:px-8 lg:pt-28", onPlayer ? "pb-24" : "pb-44 lg:pb-32")}>{children}</main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl pb-safe lg:hidden">
        {!onPlayer && <MiniPlayer />}
        <nav className="glass grid grid-cols-4 border-t">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
            return (
              <Link key={to} to={to} className={cn("flex flex-col items-center gap-1 py-2.5 text-xs font-medium", active ? "text-primary" : "text-muted-foreground")}>
                <Icon className="size-5" />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="fixed bottom-0 left-64 right-0 z-40 hidden pb-safe lg:block">
        <MiniPlayer />
      </div>
    </div>
  );
}

export function PageHeader({ title, action, description }: { title: string; action?: ReactNode; description?: string }) {
  return (
    <header className="mb-5 space-y-2">
      <Link to="/" className="inline-flex items-center gap-1 rounded-full py-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Início
      </Link>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">{title}</h1>
        {action}
      </div>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </header>
  );
}
