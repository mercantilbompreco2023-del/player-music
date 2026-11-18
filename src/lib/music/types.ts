export type TrackSource = "demo" | "local" | "cloud" | "official";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string | undefined;
  duration?: number | undefined;
  url: string;
  source: TrackSource;
  /** Licença exibida ao usuário (faixas de demonstração) */
  license?: string | undefined;
  /** Impressão digital do conteúdo, usada para evitar duplicatas */
  fingerprint?: string | undefined;
  /** Caminho de origem dentro da pasta importada */
  path?: string | undefined;
  /** Nome da pasta escolhida pelo usuário, preservado no aparelho. */
  folderName?: string | undefined;
  /** Caminho privado do arquivo no Supabase Storage. */
  storagePath?: string | undefined;
}

export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
}

export type RepeatMode = "off" | "all" | "one";

/**
 * Contrato para uma futura integração com catálogo/API licenciada.
 * Hoje só existe o provedor de demonstração local — não há streaming online.
 */
export interface CatalogProvider {
  id: string;
  name: string;
  list(): Promise<Track[]>;
}
