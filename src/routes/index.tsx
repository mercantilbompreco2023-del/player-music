import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, FolderOpen, LogIn, Music, Shuffle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cardsQuery } from "@/lib/cards-query";
import { FUNCTIONS, ICONS, isFunctionKey, visibleCards, type FunctionKey } from "@/lib/cards";
import { useIsAdmin, useSession } from "@/lib/auth";
import { usePlayer } from "@/lib/music/player-context";
import { supabase } from "@/integrations/supabase/client";
import { savedFolders } from "@/lib/music/folders";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Player Music — Início" },
      { name: "description", content: "Ouça seus próprios arquivos de áudio com playlists, favoritos e fila." },
      { property: "og:title", content: "Player Music" },
      { property: "og:description", content: "Ouça seus próprios arquivos de áudio com playlists, favoritos e fila." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function useCardStatus() {
  const p = usePlayer();
  const local = p.tracks.filter((t) => t.source === "local").length;
  return (k: FunctionKey): string => {
    switch (k) {
      case "descobrir": return `${p.prefs.recent.length} recentes`;
      case "player": return p.current ? `${p.isPlaying ? "Tocando" : "Pausado"}: ${p.current.title}` : "Nada tocando";
      case "buscar": return `${p.tracks.length} faixas para buscar`;
      case "biblioteca": return `${p.tracks.filter((t) => t.source === "local" || t.source === "cloud").length} músicas salvas`;
      case "importar": return local ? `${local} importadas` : "Nenhuma importada";
      case "playlists": return `${p.prefs.playlists.length} playlists`;
      case "favoritos": return `${p.prefs.favorites.length} favoritas`;
      case "fila": return p.queue.length ? `${p.queue.length - p.index - 1} a seguir` : "Fila vazia";
      case "configuracoes": return p.prefs.theme === "dark" ? "Tema escuro" : "Tema claro";
      case "admin": return "Acesso de administrador";
    }
  };
}


const CARD_PHOTOS: Record<FunctionKey, string> = {
  descobrir: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=900&q=85",
  player: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=900&q=85",
  buscar: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=900&q=85",
  biblioteca: "https://images.unsplash.com/photo-1461360228754-6e81c478b882?w=900&q=85",
  importar: "https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=900&q=85",
  playlists: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=900&q=85",
  favoritos: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=900&q=85",
  fila: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=900&q=85",
  configuracoes: "https://images.unsplash.com/photo-1519608487953-e999c86e7455?w=900&q=85",
  admin: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=900&q=85",
};

function Index() {
  const player = usePlayer();
  const folders = savedFolders(player.tracks);
  const { user } = useSession();
  const admin = useIsAdmin(user?.id);
  const cards = useQuery(cardsQuery);
  const greeting = useQuery({
    queryKey: ["setting", "home_greeting"],
    queryFn: async () => {
      const { data } = await supabase.from("app_settings").select("value").eq("key", "home_greeting").maybeSingle();
      return typeof data?.value === "string" ? data.value : "Sua música, do seu jeito.";
    },
  });
  const status = useCardStatus();
  const ownTracks = player.tracks.filter((track) => track.source === "local" || track.source === "cloud");
  const artistFolders = folders.length;
  const HOME_FUNCTIONS = new Set(["biblioteca", "importar", "playlists", "favoritos", "player", "fila", "configuracoes"]);
  const list = cards.data ? visibleCards(cards.data.cards, admin.data === true).filter((card) => HOME_FUNCTIONS.has(card.function_key)) : [];

  return (
    <div className="space-y-6">
      <section className="bg-hero -mx-4 -mt-6 px-4 pb-4 pt-6">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-widest text-primary"><Music className="size-4" /> Player Music</p>
          {user ? (
            <span className="max-w-40 truncate text-xs text-muted-foreground">{user.email}</span>
          ) : (
            <Link to="/auth" search={{ redirect: undefined }} className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"><LogIn className="size-4" /> Entrar</Link>
          )}
        </div>
        <h1 className="mt-3 text-3xl font-bold leading-tight">{greeting.data ?? "Sua música, do seu jeito."}</h1>
      </section>

      {player.current && (
        <Link to="/player" className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-card p-3 shadow-lg transition-colors hover:bg-accent">
          <div className="relative flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-primary/15 text-primary">
            <Music className="size-6" />
            {player.isPlaying && <span className="absolute bottom-1 right-1 size-2 rounded-full bg-primary ring-2 ring-card" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-0.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-primary">
              {player.isPlaying ? "Tocando agora" : "Reprodução pausada"}
            </p>
            <p className="truncate text-sm font-bold">{player.current.title}</p>
            <p className="truncate text-xs text-muted-foreground">{player.current.artist}</p>
          </div>
          <span className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Abrir player</span>
        </Link>
      )}

      {cards.data && cards.data.source !== "servidor" && (
        <p role="status" className="flex items-center gap-2 rounded-xl bg-muted p-3 text-xs">
          <AlertTriangle className="size-4 shrink-0" />
          Não foi possível carregar os cartões do servidor. Mostrando a {cards.data.source === "cache" ? "última versão salva" : "configuração padrão"}.
        </p>
      )}

      <Button asChild variant="outline" className="h-auto min-h-28 w-full justify-start gap-4 whitespace-normal rounded-lg bg-card p-5 text-left">
        <Link to="/pastas">
          <FolderOpen className="shrink-0 text-primary" />
          <span className="min-w-0 flex-1"><span className="block text-xl font-bold">Ouvir por pasta</span><span className="mt-1 block text-sm text-muted-foreground">{player.ready ? `${folders.length} pasta(s) salva(s)` : "Carregando…"}</span></span>
          <Shuffle className="shrink-0 text-primary" />
        </Link>
      </Button>

      {cards.isPending ? (
        <div className="grid grid-cols-2 gap-3">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-36 rounded-2xl" />)}</div>
      ) : list.length === 0 ? (
        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Nenhum cartão ativo. Um administrador pode ativá-los.</p>
      ) : (
        <nav aria-label="Funções do app" className="grid grid-cols-2 gap-3">
          {list.map((c) => {
            const key = c.function_key as FunctionKey;
            if (!isFunctionKey(key)) return null;
            const Icon = ICONS[c.icon] ?? ICONS[FUNCTIONS[key].icon]!;
            return (
              <Link
                key={c.id}
                to={FUNCTIONS[key].route}
                className="group relative isolate flex min-h-48 flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-card p-4 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-glow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
                aria-label={`${c.title}: ${c.description}. ${status(key)}`}
              >
                <img
                  src={CARD_PHOTOS[key]}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  className="absolute inset-0 -z-20 size-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <span className="absolute inset-0 -z-10 bg-gradient-to-t from-black/90 via-black/35 to-black/10" />
                <span className="flex size-10 items-center justify-center rounded-xl border border-white/25 bg-black/25 text-white shadow-lg backdrop-blur-sm">
                  <Icon className="size-5" />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-base font-bold leading-tight drop-shadow">{c.title}</span>
                  <span className="mt-1 block text-xs leading-snug text-white/80">{c.description}</span>
                  <span className="mt-3 inline-flex max-w-full truncate rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">{status(key)}</span>
                </span>
              </Link>
            );
          })}
        </nav>
      )}
      <p className="text-center text-xs text-muted-foreground">
        Sua biblioteca musical, do seu jeito. <Link to="/privacidade" className="underline">Privacidade e dados</Link>
      </p>
      <p className="pb-2 text-center text-xs font-semibold tracking-wide text-primary">Feito por Adevaldo Marques</p>
    </div>
  );
}
