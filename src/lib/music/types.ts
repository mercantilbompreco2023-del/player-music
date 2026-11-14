export type TrackSource = "demo" | "local";

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration?: number;
  url: string;
  source: TrackSource;
  /** Licença exibida ao usuário (faixas de demonstração) */
  license?: string;
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
