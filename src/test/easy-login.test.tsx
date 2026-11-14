import type { ReactNode } from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
const otp = vi.hoisted(() => vi.fn(async () => ({ error: null })));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { signInWithOtp: otp } } }));
vi.mock("@/lib/auth", () => ({ useSession: () => ({ user: null }) }));
vi.mock("@tanstack/react-query", () => ({ useQueryClient: () => ({}) }));
vi.mock("@tanstack/react-router", () => ({ createFileRoute: () => (options: { component: () => ReactNode }) => ({ options }), Link: ({ children }: { children: ReactNode }) => <span>{children}</span>, useNavigate: () => vi.fn() }));
import { Route } from "@/routes/auth";
afterEach(() => { cleanup(); vi.clearAllMocks(); });
it("entra sem senha por link validado enviado ao e-mail, não por conta automática", async () => {
  const Page = Route.options.component;
  if (!Page) throw new Error("Página ausente");
  render(<Page />);
  fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "pessoa@example.org" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar sem senha" }));
  await waitFor(() => expect(otp).toHaveBeenCalledWith({ email: "pessoa@example.org", options: { emailRedirectTo: window.location.origin } }));
  expect(screen.queryByText("Conta conectada")).toBeNull();
});