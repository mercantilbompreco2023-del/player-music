import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ put: vi.fn(async () => {}), upload: vi.fn(async () => ({ error: null })), blob: new Blob(["minha musica"]) }));
vi.mock("@/lib/music/native-media", () => ({ nativeMedia: null }));
vi.mock("@/lib/music/native-folder", () => ({ nativeFolder: null }));
vi.mock("@/lib/music/catalog", () => ({ DEMO_TRACKS: [] }));
vi.mock("@/lib/music/storage", async (original) => ({ ...await original<typeof import("@/lib/music/storage")>(), fileStore: { all: async () => [{ id: "a", title: "Faixa", artist: "Autor", blob: mock.blob, addedAt: 1 }], put: mock.put } }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
  auth: { getUser: async () => ({ data: { user: { id: "user" } } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
  storage: { from: () => ({ list: async () => ({ data: [] }), upload: mock.upload }) },
} }));
import { PlayerProvider, usePlayer } from "@/lib/music/player-context";
function Controls() { const p = usePlayer(); return <><button disabled={!p.ready} onClick={() => void p.saveTrackToCloud("a")}>Salvar</button><span>{p.tracks[0]?.source}</span></>; }
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
it("envia o áudio para a conta e mantém o mesmo arquivo e ID no aparelho", async () => {
  vi.stubGlobal("Audio", class { src = ""; volume = 1; pause() {} removeAttribute() {} });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:local");
  render(<PlayerProvider><Controls /></PlayerProvider>);
  await waitFor(() => expect(screen.getByRole("button", { name: "Salvar" })).toBeEnabled());
  fireEvent.click(screen.getByRole("button", { name: "Salvar" }));
  await waitFor(() => expect(mock.put).toHaveBeenCalledWith(expect.objectContaining({ id: "a", blob: mock.blob, storagePath: "user/a.audio" })));
  expect(mock.upload).toHaveBeenCalledWith("user/a.audio", mock.blob, expect.any(Object));
  expect(screen.getByText("local")).toBeVisible();
});