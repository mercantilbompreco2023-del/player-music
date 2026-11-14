import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const player = vi.hoisted(() => ({
  tracks: [{ id: "a", source: "local", title: "Faixa A", artist: "Cantor A" }, { id: "b", source: "local", title: "Faixa B", artist: "Cantor B" }],
  current: null, prefs: { shuffle: true, repeat: "off" }, currentTime: 0, duration: 0, isPlaying: false,
  playList: vi.fn(), toggle: vi.fn(), isFavorite: () => false, toggleFavorite: vi.fn(),
  seek: vi.fn(), prev: vi.fn(), next: vi.fn(), toggleShuffle: vi.fn(), cycleRepeat: vi.fn(),
}));
vi.mock("@/lib/music/player-context", () => ({ usePlayer: () => player }));
vi.mock("@/components/music/Cover", () => ({ Cover: () => <div data-testid="fallback" /> }));
vi.mock("@/components/ui/slider", () => ({ Slider: () => null }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
import { HomePlayer } from "@/components/music/HomePlayer";

beforeEach(() => { localStorage.clear(); vi.clearAllMocks(); });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

it("não busca foto ao reabrir com câmera desativada", async () => {
  localStorage.setItem("player-music-show-artist-photo", "false");
  const fetchPhoto = vi.fn(); vi.stubGlobal("fetch", fetchPhoto);
  render(<HomePlayer />);
  await waitFor(() => expect(screen.getByRole("button", { name: "Ativar foto automática do cantor" })).toHaveAttribute("aria-pressed", "false"));
  expect(fetchPhoto).not.toHaveBeenCalled();
});

it("usa capa alternativa se a imagem encontrada falhar e salva a câmera desligada", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ query: { pages: { a: { title: "Cantor A", thumbnail: { source: "https://example.org/photo.jpg" } } } } }) }));
  render(<HomePlayer />);
  const image = await screen.findByRole("img", { name: "Foto de Cantor A" });
  fireEvent.error(image);
  expect(screen.getByTestId("fallback")).toBeVisible();
  fireEvent.click(screen.getByRole("button", { name: "Desativar foto automática do cantor" }));
  expect(localStorage.getItem("player-music-show-artist-photo")).toBe("false");
});

it("inicia biblioteca em sequência sem autoplay", () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) }));
  render(<HomePlayer />);
  expect(player.playList).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: /^Tocar$/ }));
  expect(player.playList).toHaveBeenCalledExactlyOnceWith(["a", "b"], "a", "ordered");
});