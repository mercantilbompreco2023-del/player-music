import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const player = vi.hoisted(() => ({
  prefs: { playlists: [
    { id: "one", name: "Minha seleção", trackIds: ["a", "missing", "b"] },
    { id: "empty", name: "Vazia", trackIds: [] },
  ] },
  byId: (id: string) => [
    { id: "a", title: "Faixa A", artist: "Autor A" },
    { id: "b", title: "Faixa B", artist: "Autor B" },
  ].find((track) => track.id === id),
  playList: vi.fn(), createPlaylist: vi.fn(),
}));

vi.mock("@/lib/music/player-context", () => ({ usePlayer: () => player }));
vi.mock("@/components/music/AiPlaylist", () => ({ AiPlaylist: () => null }));
vi.mock("@/components/music/AppShell", () => ({ PageHeader: () => null }));
vi.mock("@/components/music/Cover", () => ({ Cover: () => null }));
vi.mock("@tanstack/react-router", () => ({
  createFileRoute: () => (options: { component: () => React.ReactNode }) => ({ options }),
  Link: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

import { Route } from "@/routes/playlists.index";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("ações das playlists", () => {
  const open = () => {
    const Page = Route.options.component;
    render(<Page />);
  };

  it("mostra e oculta as faixas da playlist escolhida", () => {
    open();
    expect(screen.queryByRole("button", { name: "Tocar Faixa A da playlist Minha seleção" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Mostrar músicas de Minha seleção" }));
    expect(screen.getByRole("button", { name: "Tocar Faixa A da playlist Minha seleção" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Ocultar músicas de Minha seleção" }));
    expect(screen.queryByRole("button", { name: "Tocar Faixa A da playlist Minha seleção" })).toBeNull();
  });

  it("toca a playlist inteira sem incluir faixas indisponíveis", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Tocar playlist Minha seleção" }));
    expect(player.playList).toHaveBeenCalledExactlyOnceWith(["a", "b"]);
  });

  it("toca a faixa selecionada mantendo a fila da playlist", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Mostrar músicas de Minha seleção" }));
    fireEvent.click(screen.getByRole("button", { name: "Tocar Faixa B da playlist Minha seleção" }));
    expect(player.playList).toHaveBeenCalledExactlyOnceWith(["a", "b"], "b");
  });

  it("não inicia reprodução de uma playlist vazia", () => {
    open();
    fireEvent.click(screen.getByRole("button", { name: "Tocar playlist Vazia" }));
    expect(player.playList).not.toHaveBeenCalled();
  });
});