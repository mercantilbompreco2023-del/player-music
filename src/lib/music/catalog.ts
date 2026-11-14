import aurora from "@/assets/demo/aurora.mp3.asset.json";
import pulso from "@/assets/demo/pulso.mp3.asset.json";
import mare from "@/assets/demo/mare.mp3.asset.json";
import type { CatalogProvider, Track } from "./types";

const LICENSE = "Demonstração original gerada para o Player Music — CC0 (domínio público)";

export const DEMO_TRACKS: Track[] = [
  { id: "demo-aurora", title: "Aurora Sintética", artist: "Demo Player Music", url: aurora.url, source: "demo", license: LICENSE },
  { id: "demo-pulso", title: "Pulso Noturno", artist: "Demo Player Music", url: pulso.url, source: "demo", license: LICENSE },
  { id: "demo-mare", title: "Maré Calma", artist: "Demo Player Music", url: mare.url, source: "demo", license: LICENSE },
];

/** Provedor atual: apenas faixas de demonstração. Um provedor licenciado pode implementar a mesma interface. */
export const demoCatalog: CatalogProvider = {
  id: "demo",
  name: "Faixas de demonstração",
  list: async () => DEMO_TRACKS,
};
