import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DEFAULT_CARDS, type CardConfig } from "./cards";

const CACHE = "pm:cards-cache:v1";

export const cardsQuery = queryOptions({
  queryKey: ["app-cards"],
  queryFn: async (): Promise<{ cards: CardConfig[]; source: "servidor" | "cache" | "padrao" }> => {
    try {
      const { data, error } = await supabase.from("app_cards").select("*").order("position");
      if (error) throw error;
      try { localStorage.setItem(CACHE, JSON.stringify(data)); } catch { /* sem espaço */ }
      return { cards: data, source: "servidor" };
    } catch {
      try {
        const raw = localStorage.getItem(CACHE);
        if (raw) return { cards: JSON.parse(raw) as CardConfig[], source: "cache" };
      } catch { /* ignore */ }
      return { cards: DEFAULT_CARDS, source: "padrao" };
    }
  },
  staleTime: 60_000,
});
