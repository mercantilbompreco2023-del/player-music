import { describe, expect, it } from "vitest";
import { mergeSavedTracks } from "@/lib/music/saved-tracks";
import { visualKind } from "@/lib/music/track-visual";
import type { Track } from "@/lib/music/types";
const local: Track = { id: "local-1", title: "Minha música", artist: "Autor", source: "local", fingerprint: "abc", storagePath: "user/song", url: "blob:local" };
describe("música salva nos dois lugares", () => {
  it("mantém a cópia local sem duplicar a música da conta", () => {
    expect(mergeSavedTracks([local], [{ ...local, id: "cloud-abc", source: "cloud", url: "https://remote" }])).toEqual([local]);
  });
  it("preserva músicas da conta que não estão no aparelho", () => {
    const remote: Track = { ...local, id: "cloud-other", source: "cloud", storagePath: "other", fingerprint: "other" };
    expect(mergeSavedTracks([local], [remote])).toEqual([local, remote]);
  });
});
describe("foto ou vídeo", () => {
  it("aceita foto escolhida", () => expect(visualKind("image/jpeg")).toBe("image"));
  it("aceita vídeo escolhido", () => expect(visualKind("video/mp4")).toBe("video"));
  it("recusa áudio como vídeo", () => expect(visualKind("audio/mpeg")).toBeNull());
});