import { describe, expect, it } from "vitest";
import { moveItem, matchesSearch, nextIndex, parseFileName, prevIndex, shuffleQueue } from "@/lib/music/queue";

describe("fila de reprodução", () => {
  it("para no fim quando repetir está desligado", () => expect(nextIndex(3, 2, "off")).toBeNull());
  it("volta ao início com repetir tudo", () => expect(nextIndex(3, 2, "all")).toBe(0));
  it("avança normalmente", () => expect(nextIndex(3, 0, "off")).toBe(1));
  it("anterior no início com repetir tudo vai para a última", () => expect(prevIndex(3, 0, "all")).toBe(2));
  it("aleatório mantém a faixa atual em primeiro e todas as faixas", () => {
    const r = shuffleQueue(["a", "b", "c", "d"], "c");
    expect(r[0]).toBe("c");
    expect([...r].sort()).toEqual(["a", "b", "c", "d"]);
  });
});

describe("busca e importação", () => {
  it("busca por artista ignorando acentos", () =>
    expect(matchesSearch({ title: "X", artist: "João" }, "joao")).toBe(true));
  it("busca vazia não retorna nada", () => expect(matchesSearch({ title: "X", artist: "Y" }, " ")).toBe(false));
  it("lê artista e título do nome do arquivo", () =>
    expect(parseFileName("Banda - Minha Música.mp3")).toEqual({ artist: "Banda", title: "Minha Música" }));
});

describe("reordenar fila", () => {
  it("move a faixa atual e acompanha o índice", () =>
    expect(moveItem(["a", "b", "c"], 0, 0, 1)).toEqual({ queue: ["b", "a", "c"], index: 1 }));
  it("não move além do fim", () => expect(moveItem(["a", "b"], 0, 1, 1).queue).toEqual(["a", "b"]));
});
