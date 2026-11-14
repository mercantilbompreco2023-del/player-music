import { expect, it } from "vitest";
import { verifiedSelection } from "@/lib/music/ai-playlist";
it("aceita só músicas da biblioteca e elimina repetições", () => {
  expect(verifiedSelection({ name: "Forró", trackIds: ["a", "inventada", "a", "b"] }, [{ id: "a" }, { id: "b" }])).toEqual({ name: "Forró", trackIds: ["a", "b"] });
});