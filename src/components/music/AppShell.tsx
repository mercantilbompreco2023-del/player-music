import { Link, useLocation } from "@tanstack/react-router";
import { ArrowLeft, Home, Library, ListMusic, Pause, Play, Search, SkipForward, WifiOff } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { usePlayer } from "@/lib/music/player-context";
import { Cover } from "./Cover";

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
    <div className="glass mx-2 mb-2 overflow-hidden rounded-2xl border shadow-glow">
      <div className="flex items-center gap-3 p-2">
        <Link to="/player" className="flex min-w-0 flex-1 items-center gap-3" aria-label="Abrir player">
          <Cover seed={p.current.id} className="size-11" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{p.current.title}</p>
            <p className="truncate text-xs text-muted-foreground">{p.current.artist}</p>
          </div>
        </Link>
        <button onClick={p.toggle} aria-label={p.isPlaying ? "Pausar" : "Tocar"} className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground">
          {p.isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="size-5 fill-current" />}
        </button>
        <button onClick={p.next} aria-label="Próxima" className="p-2 text-foreground"><SkipForward className="size-5" /></button>
      </div>
      <div className="h-0.5 bg-muted"><div className="h-full bg-primary" style={{ width: `${pct}%` }} /></div>
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
    <div className="mx-auto min-h-screen max-w-2xl">
      {offline && (
        <div role="status" className="flex items-center gap-2 bg-muted px-4 py-2 text-xs">
          <WifiOff className="size-4" /> Sem conexão. Suas músicas importadas continuam tocando; cartões e administração usam a última versão salva.
        </div>
      )}
      <main className={cn("px-4 pt-6", onPlayer ? "pb-24" : "pb-44")}>{children}</main>
      <div className="fixed inset-x-0 bottom-0 z-40 mx-auto max-w-2xl pb-safe">
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
