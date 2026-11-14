import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { availablePlayback, loadPlaybackMemory, savePlaybackMemory } from "@/lib/music/playback-memory";

vi.mock("@/lib/music/native-media", () => ({ nativeMedia: null }));
vi.mock("@/lib/music/native-folder", () => ({ nativeFolder: null }));
vi.mock("@/lib/music/catalog", () => ({ DEMO_TRACKS: [] }));
vi.mock("@/lib/music/storage", async (original) => ({
  ...await original<typeof import("@/lib/music/storage")>(),
  fileStore: { all: async () => ["one", "two"].map((id) => ({ id, title: id, artist: "Artista", blob: new Blob(), addedAt: 1 })) },
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null }) }) }) }),
  auth: { getUser: async () => ({ data: { user: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }) },
} }));
import { PlayerProvider, usePlayer } from "@/lib/music/player-context";

class FakeAudio {
  static latest: FakeAudio;
  constructor() { FakeAudio.latest = this; }
  src = ""; volume = 1; paused = true; ended = false; currentTime = 0; duration = 180; preload = "";
  onplay?: (() => void) | null; onpause?: (() => void) | null;
  ontimeupdate?: () => void; onloadedmetadata?: () => void;
  play() { this.paused = false; this.onplay?.(); return Promise.resolve(); }
  pause() { this.paused = true; this.onpause?.(); }
  removeAttribute() { this.src = ""; }
}
function Controls() {
  const p = usePlayer();
  return <>
    <span>{p.ready ? "pronto" : "carregando"}</span>
    <span data-testid="track">{p.current?.id ?? "nenhuma"}</span>
    <span data-testid="position">{p.currentTime}</span>
    <span data-testid="playing">{String(p.isPlaying)}</span>
    <button onClick={() => p.playList(["one", "two"], "two", "ordered")}>Tocar</button>
    <button onClick={p.toggle}>Pausar</button>
    <button onClick={() => p.setResumePlayback(false)}>Desativar</button>
    <span data-testid="queue">{p.queue.join(",")}</span>
  </>;
}
beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("Audio", FakeAudio);
  vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:http://localhost/audio");
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });
describe("continuar de onde parou", () => {
  it("salva a segunda faixa em 84 segundos e restaura a fila e reprodução ao reabrir", async () => {
    const first = render(<PlayerProvider><Controls /></PlayerProvider>);
    await screen.findByText("pronto");
    fireEvent.click(screen.getByText("Tocar"));
    await waitFor(() => expect(screen.getByTestId("track")).toHaveTextContent("two"));
    act(() => { FakeAudio.latest.currentTime = 84; FakeAudio.latest.ontimeupdate?.(); });
    first.unmount();
    expect(loadPlaybackMemory()).toEqual({ queue: ["one", "two"], trackId: "two", position: 84, wasPlaying: true });
    render(<PlayerProvider><Controls /></PlayerProvider>);
    await waitFor(() => expect(screen.getByTestId("track")).toHaveTextContent("two"));
    act(() => FakeAudio.latest.onloadedmetadata?.());
    expect(screen.getByTestId("position")).toHaveTextContent("84");
    expect(screen.getByTestId("queue")).toHaveTextContent("one,two");
    expect(screen.getByTestId("playing")).toHaveTextContent("true");
  });
  it("mantém pausada a faixa salva pausada em 37 segundos", async () => {
    savePlaybackMemory({ queue: ["one"], trackId: "one", position: 37, wasPlaying: false });
    render(<PlayerProvider><Controls /></PlayerProvider>);
    await waitFor(() => expect(screen.getByTestId("track")).toHaveTextContent("one"));
    act(() => FakeAudio.latest.onloadedmetadata?.());
    expect(FakeAudio.latest.currentTime).toBe(37);
    expect(FakeAudio.latest.paused).toBe(true);
  });
  it("desativar apaga o ponto salvo e não restaura no próximo início", async () => {
    const first = render(<PlayerProvider><Controls /></PlayerProvider>);
    await screen.findByText("pronto");
    fireEvent.click(screen.getByText("Tocar"));
    await waitFor(() => expect(screen.getByTestId("track")).toHaveTextContent("two"));
    fireEvent.click(screen.getByText("Desativar"));
    first.unmount();
    expect(loadPlaybackMemory()).toBeNull();
    render(<PlayerProvider><Controls /></PlayerProvider>);
    await screen.findByText("pronto");
    expect(screen.getByTestId("track")).toHaveTextContent("nenhuma");
  });
  it("remove faixas indisponíveis da fila e não restaura uma música apagada", () => {
    const saved = { queue: ["one", "deleted", "two"], trackId: "two", position: 84, wasPlaying: true };
    expect(availablePlayback(saved, ["one", "two"])?.queue).toEqual(["one", "two"]);
    expect(availablePlayback(saved, ["one"])).toBeNull();
  });
});