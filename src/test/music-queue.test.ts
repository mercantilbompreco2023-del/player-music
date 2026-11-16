import { describe, expect, it } from "vitest";
import { moveItem, matchesSearch, nextIndex, parseFileName, prevIndex, shuffleQueue } from "@/lib/music/queue";

describe("fila de reprodução", () => {
  it("aleatório de pasta embaralha todas as faixas sem fixar a primeira e sem incluir outras pastas", () => {
    const ids = ["pasta-a1", "pasta-a2", "pasta-a3"];
    expect(shuffleQueue(ids, null, () => 0)).toEqual(["pasta-a2", "pasta-a3", "pasta-a1"]);
    expect(ids).toEqual(["pasta-a1", "pasta-a2", "pasta-a3"]);
  });
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
  it("remove o número da faixa antes de identificar artista e título", () =>
    expect(parseFileName("01 - Banda - Minha Música.mp3")).toEqual({ artist: "Banda", title: "Minha Música" }));
  it("usa o nome do arquivo como título quando o artista não está informado", () =>
    expect(parseFileName("Minha Música.mp3")).toEqual({ artist: "Artista desconhecido", title: "Minha Música" }));
});

describe("reordenar fila", () => {
  it("move a faixa atual e acompanha o índice", () =>
    expect(moveItem(["a", "b", "c"], 0, 0, 1)).toEqual({ queue: ["b", "a", "c"], index: 1 }));
  it("não move além do fim", () => expect(moveItem(["a", "b"], 0, 1, 1).queue).toEqual(["a", "b"]));
});

import { fingerprint, formatProblem } from "@/lib/music/import";
describe("importação de pasta", () => {
  const can = (m: string) => (m === "audio/mpeg" ? "probably" : "");
  it("recusa arquivo que não é áudio", () => expect(formatProblem("capa.jpg", "image/jpeg", can)).toBe("Não é um arquivo de áudio"));
  it("recusa formato que o navegador não toca", () => expect(formatProblem("x.wma", "audio/x-ms-wma", can)).toMatch(/não suportado/));
  it("aceita mp3", () => expect(formatProblem("a.mp3", "audio/mpeg", can)).toBeNull());
  it("aceita mp3 quando Android informa tipo genérico", () => expect(formatProblem("a.mp3", "application/octet-stream", can)).toBeNull());
  it("mesmo conteúdo com nomes diferentes gera a mesma impressão", async () => {
    const a = new File([new Uint8Array([1, 2, 3, 4])], "a.mp3");
    const b = new File([new Uint8Array([1, 2, 3, 4])], "outra/b.mp3");
    const c = new File([new Uint8Array([1, 2, 3, 5])], "a.mp3");
    expect(await fingerprint(a)).toBe(await fingerprint(b));
    expect(await fingerprint(a)).not.toBe(await fingerprint(c));
  });
});
