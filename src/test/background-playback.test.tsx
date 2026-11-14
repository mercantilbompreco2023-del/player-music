import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const native = vi.hoisted(() => ({ update: vi.fn(async () => {}), stop: vi.fn(async () => {}), remove: vi.fn(async () => {}), addListener: vi.fn() }));
vi.mock("@/lib/music/native-media", () => ({ nativeMedia: native }));
vi.mock("@/lib/music/native-folder", () => ({ nativeFolder: null }));
vi.mock("@/lib/music/catalog", () => ({ DEMO_TRACKS: [] }));
vi.mock("@/lib/music/storage", async (importOriginal) => ({
  ...await importOriginal<typeof import("@/lib/music/storage")>(),
  fileStore: { all: async () => [{ id: "one", title: "Minha música", artist: "Meu artista", blob: new Blob(), addedAt: 1 } ] },
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
  auth: { getUser: async () => ({ data: { user: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
} }));
import { PlayerProvider, usePlayer } from "@/lib/music/player-context";

function Controls() {
  const p = usePlayer();
  return <><input aria-label="Segundo plano" type="checkbox" checked={p.backgroundPlayback} onChange={(e) => p.setBackgroundPlayback(e.target.checked)} /><button onClick={() => p.playList(["one"])}>Tocar teste</button><span>{p.isPlaying ? "tocando" : "pausado"}</span></>;
}
beforeEach(() => {
  localStorage.clear(); vi.clearAllMocks();
  native.addListener.mockResolvedValue({ remove: native.remove });
  vi.stubGlobal("Audio", class {
    src = ""; volume = 1; paused = true; currentTime = 0; duration = 30; preload = "";
    onplay?: () => void; onpause?: () => void;
    play() { this.paused = false; this.onplay?.(); return Promise.resolve(); }
    pause() { this.paused = true; this.onpause?.(); }
    removeAttribute() { this.src = ""; }
  });
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:http://localhost/test");
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("preferência de reprodução em segundo plano", () => {
  it("restaura desativado sem registrar controles ou iniciar serviço antes da preferência", async () => {
    localStorage.setItem("player-music-background-playback", "false");
    render(<PlayerProvider><Controls /></PlayerProvider>);
    await waitFor(() => expect(screen.getByLabelText("Segundo plano")).not.toBeChecked());
    expect(native.addListener).not.toHaveBeenCalled();
    expect(native.update).not.toHaveBeenCalled();
    expect(native.stop).toHaveBeenCalled();
  });
  it("ativa o serviço para a faixa atual e o encerra ao desativar sem pausar o áudio", async () => {
    render(<PlayerProvider><Controls /></PlayerProvider>);
    await waitFor(() => expect(native.addListener).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole("button", { name: "Tocar teste" })).toBeVisible());
    fireEvent.click(screen.getByRole("button", { name: "Tocar teste" }));
    await waitFor(() => expect(native.update).toHaveBeenCalledWith(expect.objectContaining({ title: "Minha música", artist: "Meu artista", isPlaying: true })));
    native.stop.mockClear();
    fireEvent.click(screen.getByLabelText("Segundo plano"));
    await waitFor(() => expect(native.stop).toHaveBeenCalled());
    expect(screen.getByText("tocando")).toBeVisible();
    expect(localStorage.getItem("player-music-background-playback")).toBe("false");
    await waitFor(() => expect(native.remove).toHaveBeenCalled());
    fireEvent.click(screen.getByLabelText("Segundo plano"));
    expect(localStorage.getItem("player-music-background-playback")).toBe("true");
    await waitFor(() => expect(native.addListener).toHaveBeenCalledTimes(2));
  });
  it("encerra o serviço quando o player é desmontado", async () => {
    const view = render(<PlayerProvider><Controls /></PlayerProvider>);
    await waitFor(() => expect(native.addListener).toHaveBeenCalled());
    native.stop.mockClear(); view.unmount();
    expect(native.stop).toHaveBeenCalledExactlyOnceWith();
  });
});