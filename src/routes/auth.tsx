import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Minha conta — Player Music" }, { name: "description", content: "Entre para guardar suas músicas na sua conta do Player Music." }, { property: "og:title", content: "Minha conta — Player Music" }, { property: "og:description", content: "Acesse suas músicas privadas salvas na conta." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: AccountPage,
});
function AccountPage() {
  const { user } = useSession();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [signup, setSignup] = useState(false);
  const [easy, setEasy] = useState(true);
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const { error } = easy ? await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } }) : signup ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }) : await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message.includes("Invalid login") ? "E-mail ou senha incorretos." : "Não foi possível entrar ou criar a conta. Confira os dados e a confirmação do e-mail."); return; }
      if (easy) setSent(true);
      toast.success(easy ? "Confira seu e-mail e toque no link para entrar sem senha." : signup ? "Confira seu e-mail para confirmar sua conta." : "Você entrou na sua conta.");
    } catch { toast.error("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  }
  async function signOut() { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }
  async function resetPassword() { if (!email.trim()) { toast.error("Digite seu e-mail primeiro."); return; } const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); toast[error ? "error" : "success"](error ? "Não foi possível enviar o link." : "Confira seu e-mail para trocar a senha."); }
  return <div className="mx-auto max-w-md space-y-5"><Link to="/">← Início</Link><h1 className="text-2xl font-bold">Minha conta</h1>{user ? <><p>Conta conectada</p><Button asChild><Link to="/configuracoes">Músicas e cópia da biblioteca</Link></Button><Button variant="outline" onClick={() => void signOut()}>Sair</Button></> : <form onSubmit={(e) => void submit(e)} className="space-y-4"><div><Label htmlFor="email">E-mail</Label><Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>{!easy && <div><Label htmlFor="password">Senha</Label><Input id="password" type="password" required minLength={6} autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></div>}<Button type="submit" disabled={busy}>{busy ? "Aguarde…" : easy ? "Entrar sem senha" : signup ? "Criar conta" : "Entrar"}</Button><Button type="button" variant="outline" onClick={() => { setEasy((s) => !s); setSent(false); }}>{easy ? "Usar senha" : "Entrar sem senha"}</Button>{sent && <p role="status" className="text-sm text-muted-foreground">Link enviado. Confira seu e-mail para entrar.</p>}{!easy && <><Button type="button" variant="ghost" onClick={() => setSignup((s) => !s)}>{signup ? "Já tenho conta" : "Criar uma conta"}</Button><Button type="button" variant="link" onClick={() => void resetPassword()}>Esqueci minha senha</Button></>}</form>}</div>;
}
