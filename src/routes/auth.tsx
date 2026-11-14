import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import "@lovable.dev/cloud-auth-js/styles.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

function safePath(p: unknown): string {
  return typeof p === "string" && p.startsWith("/") && !p.startsWith("//") ? p : "/";
}

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>) => ({ redirect: typeof s["redirect"] === "string" ? (s["redirect"] as string) : undefined }),
  head: () => ({
    meta: [
      { title: "Entrar — Player Music" },
      { name: "description", content: "Entre na sua conta do Player Music." },
      { property: "og:title", content: "Entrar — Player Music" },
      { property: "og:description", content: "Entre na sua conta do Player Music." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { redirect } = Route.useSearch();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"entrar" | "criar" | "esqueci">("entrar");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const target = safePath(redirect);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (!/^\S+@\S+\.\S+$/.test(email)) return setMsg("Digite um e-mail válido.");
    if (mode !== "esqueci" && password.length < 8) return setMsg("A senha precisa ter pelo menos 8 caracteres.");
    setBusy(true);
    try {
      if (mode === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw new Error("E-mail ou senha incorretos, ou e-mail ainda não confirmado.");
        toast.success("Você entrou.");
        navigate({ to: target });
      } else if (mode === "criar") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin + target } });
        if (error) throw new Error("Não foi possível criar a conta. Verifique os dados e tente de novo.");
        setMsg("Conta criada! Abra o link que enviamos para o seu e-mail para confirmar.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw new Error("Não foi possível enviar agora. Tente mais tarde.");
        setMsg("Se este e-mail tiver conta, você receberá um link para criar uma nova senha.");
      }
    } catch (err) {
      setMsg((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function social(provider: "google" | "lovable") {
    if (target !== "/") sessionStorage.setItem("pm:after-login", target);
    const r = await lovable.auth.signInWithOAuth(provider, { redirect_uri: window.location.origin });
    if (r.error) return toast.error("Não foi possível entrar agora.");
    if (r.redirected) return;
    navigate({ to: target });
  }

  return (
    <div className="mx-auto max-w-sm space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Início</Link>
      <h1 className="text-3xl font-bold">{mode === "criar" ? "Criar conta" : mode === "esqueci" ? "Recuperar senha" : "Entrar"}</h1>
      <p className="text-sm text-muted-foreground">
        Uma conta não é necessária para ouvir música. Ela serve para acessar a administração, caso você tenha permissão.
      </p>
      {mode !== "esqueci" && (
        <div className="space-y-2">
          <Button type="button" variant="outline" className="h-11 w-full rounded-full" onClick={() => social("google")}>Continuar com Google</Button>
          <button type="button" className="lovable-auth-button w-full" onClick={() => social("lovable")}>Continuar com Lovable</button>
          <p className="text-center text-xs text-muted-foreground">ou com e-mail</p>
        </div>
      )}
      <form onSubmit={submit} className="space-y-3" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">E-mail</Label>
          <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-11" />
        </div>
        {mode !== "esqueci" && (
          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" autoComplete={mode === "criar" ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} className="h-11" />
          </div>
        )}
        {msg && <p role="status" className="rounded-lg bg-muted p-3 text-sm">{msg}</p>}
        <Button type="submit" className="h-11 w-full rounded-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" />}
          {mode === "criar" ? "Criar conta" : mode === "esqueci" ? "Enviar link" : "Entrar"}
        </Button>
      </form>
      <div className="flex flex-col gap-2 text-sm">
        {mode !== "entrar" && <button className="text-primary" onClick={() => { setMode("entrar"); setMsg(null); }}>Já tenho conta</button>}
        {mode !== "criar" && <button className="text-primary" onClick={() => { setMode("criar"); setMsg(null); }}>Criar uma conta</button>}
        {mode !== "esqueci" && <button className="text-muted-foreground" onClick={() => { setMode("esqueci"); setMsg(null); }}>Esqueci minha senha</button>}
      </div>
    </div>
  );
}
