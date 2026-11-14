import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const player = vi.hoisted(() => ({
  ready: true,
  tracks: [
    { id: "a", title: "Faixa A", artist: "Cantor A", folderName: "Coleção", source: "local", url: "blob:a" },
    { id: "b", title: "Faixa B", artist: "Cantor A", folderName: "Coleção", source: "local", url: "blob:b" },
    { id: "c", title: "Faixa C", artist: "Cantor B", folderName: "Cantor A", source: "local", url: "blob:c" },
  ],
  current: null, isPlaying: false, prefs: { playlists: [] },
  isFavorite: () => false, playList: vi.fn(),
}));
vi.mock("@/lib/music/player-context", () => ({ usePlayer: () => player }));
vi.mock("@/components/music/AppShell", () => ({ PageHeader: () => null }));
vi.mock("@/components/music/Cover", () => ({ Cover: () => null }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: () => ReactNode }) => ({ options }),
  Link: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}));
import { Route } from "@/routes/pastas";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);
const open = () => {
  const Page = Route.options.component;
  if (!Page) throw new Error("Tela de pastas não registrada");
  render(<Page />);
};
describe("reprodução das pastas", () => {
  it("toca todas as músicas do artista em sequência explícita", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Ouvir cantor Cantor A" }));
    expect(player.playList).toHaveBeenCalledExactlyOnceWith(["a", "b"], undefined, "ordered");
  });
  it("toca as músicas do artista em modo aleatório explícito", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Aleatório do cantor Cantor A" }));
    expect(player.playList).toHaveBeenCalledExactlyOnceWith(["a", "b"], undefined, "shuffle");
  });
  it("abre o artista sem confundir a pasta física de mesmo nome e toca a faixa individual", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Abrir cantor Cantor A" }));
    expect(screen.queryByRole("button", { name: "Tocar Faixa C" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Tocar Faixa B" }));
    expect(player.playList).toHaveBeenCalledExactlyOnceWith(["a", "b"], "b");
    fireEvent.click(screen.getByRole("button", { name: "Voltar para pastas" }));
    fireEvent.click(screen.getByRole("button", { name: "Abrir pasta Cantor A" }));
    expect(screen.getByRole("button", { name: "Tocar Faixa C" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Tocar Faixa A" })).toBeNull();
  });
});