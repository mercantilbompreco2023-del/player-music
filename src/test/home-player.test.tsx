import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

const player = vi.hoisted(() => ({
  tracks: [
    { id: "demo", source: "demo", title: "Demonstração" },
    { id: "local-a", source: "local", title: "Primeira", artist: "Autor" },
    { id: "local-b", source: "local", title: "Segunda", artist: "Autor" },
  ],
  current: null as null | { id: string; title: string; artist: string },
  prefs: { shuffle: true, repeat: "off" },
  currentTime: 0, duration: 0, isPlaying: false,
  playList: vi.fn(), toggle: vi.fn(), isFavorite: () => false,
  toggleFavorite: vi.fn(), seek: vi.fn(), prev: vi.fn(), next: vi.fn(),
  toggleShuffle: vi.fn(), cycleRepeat: vi.fn(),
}));
vi.mock("@/lib/music/player-context", () => ({ usePlayer: () => player }));
vi.mock("@/components/music/Cover", () => ({ Cover: () => null }));
vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));
import { HomePlayer } from "@/components/music/HomePlayer";

beforeEach(() => { vi.clearAllMocks(); player.current = null; });
afterEach(cleanup);

it("não inicia áudio automaticamente e toca os arquivos da biblioteca em sequência mesmo após aleatório", () => {
  render(<HomePlayer />);
  expect(player.playList).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Tocar", exact: true }));
  expect(player.playList).toHaveBeenCalledExactlyOnceWith(["local-a", "local-b"], "local-a", "ordered");
});

it("preserva a faixa atual sem recriar sua fila", () => {
  player.current = { id: "local-b", title: "Segunda", artist: "Autor" };
  render(<HomePlayer />);
  fireEvent.click(screen.getByRole("button", { name: "Tocar", exact: true }));
  expect(player.toggle).toHaveBeenCalledExactlyOnceWith();
  expect(player.playList).not.toHaveBeenCalled();
});