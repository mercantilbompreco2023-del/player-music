import { describe, expect, it } from "vitest";
import { artistFolders, savedFolders } from "@/lib/music/folders";
import type { Track } from "@/lib/music/types";

const track = (id: string, extra: Partial<Track>): Track => ({ id, title: id, artist: "Artista", source: "local", url: "blob:test", ...extra });

describe("pastas salvas", () => {
  it("cria pastas por artista com contagem, sem separar maiúsculas ou espaços", () => {
    const folders = artistFolders([track("1", { artist: " Cantor A " }), track("2", { artist: "cantor a" }), track("3", { artist: "Cantor B", source: "cloud" })]);
    expect(folders.map((f) => [f.name, f.tracks.length, f.tracks.map((t) => t.id)])).toEqual([["Cantor A", 2, ["1", "2"]], ["Cantor B", 1, ["3"]]]);
  });
  it("não cria artistas para demos ou nomes vazios", () => {
    expect(artistFolders([track("1", { artist: " " }), track("2", { source: "demo" })])).toEqual([]);
  });
  it("mantém pasta física independente do artista com o mesmo nome", () => {
    const tracks = [track("1", { artist: "Cantor A", folderName: "Outra" }), track("2", { artist: "Cantor B", folderName: "Cantor A" })];
    expect(artistFolders(tracks).find((f) => f.name === "Cantor A")?.tracks.map((t) => t.id)).toEqual(["1"]);
    expect(savedFolders(tracks).find((f) => f.name === "Cantor A")?.tracks.map((t) => t.id)).toEqual(["2"]);
  });
  it("mantém a pasta escolhida e reúne suas subpastas", () => {
    const folders = savedFolders([track("1", { folderName: "Músicas", path: "Rock/a.mp3" }), track("2", { folderName: "Músicas", path: "b.mp3" })]);
    expect(folders.map((f) => [f.name, f.tracks.map((t) => t.id)])).toEqual([["Músicas", ["1", "2"]]]);
  });
  it("recupera pastas de importações antigas sem agrupar arquivos individuais", () => {
    expect(savedFolders([track("1", { path: "Minha pasta/sub/a.mp3" }), track("2", { path: "avulsa.mp3" })]).map((f) => f.name)).toEqual(["Minha pasta"]);
  });
  it("mantém o agrupamento após serializar os metadados salvos", () => {
    const persisted = JSON.parse(JSON.stringify([track("1", { folderName: "Forró", path: "a.mp3" })])) as Track[];
    expect(savedFolders(persisted)[0]?.tracks[0]?.id).toBe("1");
    expect(savedFolders(persisted)[0]?.name).toBe("Forró");
  });
  it("não apresenta demonstrações como pasta do usuário", () => {
    expect(savedFolders([track("demo", { source: "demo", folderName: "Demo" })])).toEqual([]);
  });
});