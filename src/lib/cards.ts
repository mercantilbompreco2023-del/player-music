import {
  Compass, Disc3, Heart, Library, ListMusic, ListOrdered, Music, Search, Settings, Shield, Upload, type LucideIcon,
} from "lucide-react";

/**
 * Cada função do app tem uma rota fixa. Os cartões guardam apenas a chave da função,
 * então renomear, trocar ícone ou mudar a posição nunca altera o destino do cartão.
 */
export const FUNCTIONS = {
  descobrir: { route: "/descobrir", title: "Descobrir", description: "Recentes e faixas de demonstração", icon: "compass" },
  player: { route: "/player", title: "Player", description: "O que está tocando agora", icon: "disc" },
  buscar: { route: "/buscar", title: "Buscar músicas", description: "Encontre por título ou artista", icon: "search" },
  biblioteca: { route: "/biblioteca", title: "Minhas músicas", description: "Suas músicas importadas e salvas", icon: "library" },
  importar: { route: "/importar", title: "Importar músicas", description: "Adicione áudios do seu aparelho", icon: "upload" },
  playlists: { route: "/playlists", title: "Playlists", description: "Crie e organize listas", icon: "list-music" },
  favoritos: { route: "/favoritos", title: "Favoritos", description: "Suas faixas marcadas com coração", icon: "heart" },
  fila: { route: "/fila", title: "Fila de reprodução", description: "Veja e edite o que vem a seguir", icon: "list-ordered" },
  configuracoes: { route: "/configuracoes", title: "Configurações", description: "Tema, privacidade e limitações", icon: "settings" },
  admin: { route: "/admin", title: "Administração", description: "Área restrita a administradores", icon: "shield" },
} as const;

export type FunctionKey = keyof typeof FUNCTIONS;
export const FUNCTION_KEYS = Object.keys(FUNCTIONS) as FunctionKey[];

export const ICONS: Record<string, LucideIcon> = {
  compass: Compass, disc: Disc3, search: Search, library: Library, upload: Upload, "list-music": ListMusic,
  heart: Heart, "list-ordered": ListOrdered, settings: Settings, shield: Shield, music: Music,
};
export const ICON_NAMES = Object.keys(ICONS);

export interface CardConfig {
  id: string;
  function_key: string;
  title: string;
  description: string;
  icon: string;
  position: number;
  enabled: boolean;
}

export function isFunctionKey(k: string): k is FunctionKey {
  return k in FUNCTIONS;
}

/** Cartões válidos e visíveis, em ordem. Admin só aparece para administradores. */
export function visibleCards(cards: CardConfig[], isAdmin: boolean): CardConfig[] {
  return cards
    .filter((c) => c.enabled && isFunctionKey(c.function_key) && (c.function_key !== "admin" || isAdmin))
    .sort((a, b) => a.position - b.position);
}

export const DEFAULT_CARDS: CardConfig[] = FUNCTION_KEYS.map((k, i) => ({
  id: `default-${k}`, function_key: k, title: FUNCTIONS[k].title, description: FUNCTIONS[k].description,
  icon: FUNCTIONS[k].icon, position: i + 1, enabled: true,
}));

export function validateCard(input: { title: string; description: string; icon: string; function_key: string }): string | null {
  if (!isFunctionKey(input.function_key)) return "Função inválida.";
  const t = input.title.trim();
  if (t.length < 1 || t.length > 40) return "O nome deve ter entre 1 e 40 caracteres.";
  if (input.description.trim().length > 120) return "A descrição pode ter no máximo 120 caracteres.";
  if (!ICON_NAMES.includes(input.icon)) return "Ícone inválido.";
  return null;
}
