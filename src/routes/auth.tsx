import { createFileRoute, Link } from "@tanstack/react-router";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [signup, setSignup] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      const { error } = signup ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message.includes("Invalid login") ? "E-mail ou senha incorretos." : "Não foi possível entrar ou criar a conta. Confira os dados e a confirmação do e-mail."); return; }
      toast.success(signup ? "Confira seu e-mail para confirmar sua conta." : "Você entrou na sua conta.");
    } catch { toast.error("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  }
  return <div className="mx-auto max-w-md space-y-5"><Link to="/">← Início</Link><h1 className="text-2xl font-bold">Minha conta</h1>{user ? <><p>Conta conectada</p><Button asChild><Link to="/configuracoes">Músicas e cópia da biblioteca</Link></Button><Button variant="outline" onClick={() => void supabase.auth.signOut()}>Sair</Button></> : <form onSubmit={(e) => void submit(e)} className="space-y-4"><div><Label htmlFor="email">E-mail</Label><Input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div><div><Label htmlFor="password">Senha</Label><Input id="password" type="password" required minLength={6} autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} /></div><Button type="submit" disabled={busy}>{busy ? "Aguarde…" : signup ? "Criar conta" : "Entrar"}</Button><Button type="button" variant="outline" onClick={() => setSignup((s) => !s)}>{signup ? "Já tenho conta" : "Criar uma conta"}</Button><Link to="/reset-password" className="block text-sm text-primary">Esqueci minha senha</Link></form>}</div>;
}
