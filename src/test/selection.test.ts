import { describe, expect, it } from "vitest";
import { allSelected, toggleAll, toggleOne } from "@/lib/music/selection";

const set = (...ids: string[]) => new Set(ids);

describe("seleção múltipla", () => {
  it("lista vazia nunca conta como 'todas selecionadas'", () => {
    expect(allSelected([], set())).toBe(false);
    expect(allSelected([], set("a"))).toBe(false);
  });

  it("só marca todas quando cada faixa visível está marcada", () => {
    expect(allSelected(["a", "b", "c"], set("a", "b"))).toBe(false);
    expect(allSelected(["a", "b", "c"], set("a", "b", "c"))).toBe(true);
  });

  it("selecionar todas marca as 3 faixas visíveis de uma vez", () => {
    expect(toggleAll(["a", "b", "c"], set())).toEqual(set("a", "b", "c"));
  });

  it("tocar em 'selecionar todas' de novo desmarca tudo", () => {
    const todos = toggleAll(["a", "b", "c"], set());
    expect(toggleAll(["a", "b", "c"], todos)).toEqual(set());
  });

  it("não seleciona faixa escondida em outra aba", () => {
    const visiveis = ["a", "b"];
    expect(toggleAll(visiveis, set("c"))).toEqual(set("a", "b", "c"));
  });

  it("alternar uma faixa não mexe nas outras", () => {
    expect(toggleOne("b", set("a", "c"))).toEqual(set("a", "b", "c"));
    expect(toggleOne("a", set("a", "c"))).toEqual(set("c"));
  });
});
