import { expect, it } from "vitest";
import { libraryCsv } from "@/lib/music/export";
it("exporta pasta e música sem URLs privadas ou demonstrações", () => {
  const csv = libraryCsv([{ id: "a", title: "Teste", artist: "Artista", folderName: "Rock", path: "Sub/a.mp3", url: "https://private/token", source: "local" }, { id: "d", title: "DEMO", artist: "X", source: "demo", url: "demo" }]);
  expect(csv).toContain('"Rock","Sub/a.mp3","Teste","Artista"');
  expect(csv).not.toContain("private"); expect(csv).not.toContain("DEMO");
});
it("protege células contra fórmulas ao abrir planilha", () => {
  expect(libraryCsv([{ id: "a", title: "=1+1", artist: "X", url: "blob:x", source: "local" }])).toContain('"\'=1+1"');
});