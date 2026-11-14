import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";

vi.mock("@/lib/music/player-context", () => ({ usePlayer: () => ({
  tracks: [], current: null, prefs: { shuffle: false, repeat: "off" },
  currentTime: 0, duration: 0, isPlaying: false, toggleShuffle: vi.fn(), cycleRepeat: vi.fn(),
}) }));
vi.mock("@/components/ui/slider", () => ({ Slider: () => null }));
vi.mock("@tanstack/react-router", () => ({ Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div> }));
import { HomePlayer } from "@/components/music/HomePlayer";
beforeEach(() => localStorage.clear());
afterEach(cleanup);

it("salva o nome oculto e restaura a escolha ao reabrir", () => {
  const first = render(<HomePlayer />);
  fireEvent.click(screen.getByRole("button", { name: "Ocultar nome do cantor" }));
  expect(localStorage.getItem("player-music-show-artist-name")).toBe("false");
  first.unmount();
  render(<HomePlayer />);
  expect(screen.getByRole("button", { name: "Mostrar nome do cantor" })).toHaveAttribute("aria-pressed", "false");
});

it("salva novamente a opção de mostrar o nome", () => {
  localStorage.setItem("player-music-show-artist-name", "false");
  render(<HomePlayer />);
  fireEvent.click(screen.getByRole("button", { name: "Mostrar nome do cantor" }));
  expect(localStorage.getItem("player-music-show-artist-name")).toBe("true");
});