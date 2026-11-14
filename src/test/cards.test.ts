import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { routeTree } from "@/routeTree.gen";
import { DEFAULT_CARDS, FUNCTIONS, FUNCTION_KEYS, validateCard, visibleCards, type CardConfig } from "@/lib/cards";

const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
const card = (o: Partial<CardConfig>): CardConfig => ({ id: "x", function_key: "player", title: "T", description: "", icon: "disc", position: 1, enabled: true, ...o });

describe("cartões da tela principal", () => {
  it("cada função abre uma página que existe", () => {
    for (const k of FUNCTION_KEYS) {
      const m = router.matchRoutes(FUNCTIONS[k].route);
      expect(m.at(-1)?.routeId, k).not.toBe(rootRouteId);
    }
  });
  it("existem os 10 cartões exigidos", () => expect(DEFAULT_CARDS).toHaveLength(10));
  it("renomear um cartão não muda o destino", () => {
    const [c] = visibleCards([card({ title: "Meu som" })], false);
    expect(FUNCTIONS[c!.function_key as "player"].route).toBe("/player");
  });
  it("ordena pela posição", () =>
    expect(visibleCards([card({ id: "b", position: 2 }), card({ id: "a", position: 1 })], false).map((c) => c.id)).toEqual(["a", "b"]));
  it("cartão desativado some", () => expect(visibleCards([card({ enabled: false })], false)).toHaveLength(0));
  it("cartão de administração não aparece para usuário comum", () =>
    expect(visibleCards([card({ function_key: "admin" })], false)).toHaveLength(0));
  it("cartão de administração aparece para administrador", () =>
    expect(visibleCards([card({ function_key: "admin" })], true)).toHaveLength(1));
  it("função desconhecida é ignorada", () => expect(visibleCards([card({ function_key: "hack" })], true)).toHaveLength(0));
  it("validação recusa nome vazio e acima de 40 letras", () => {
    expect(validateCard({ title: " ", description: "", icon: "disc", function_key: "player" })).not.toBeNull();
    expect(validateCard({ title: "x".repeat(41), description: "", icon: "disc", function_key: "player" })).not.toBeNull();
    expect(validateCard({ title: "Ok", description: "", icon: "disc", function_key: "player" })).toBeNull();
  });
});
