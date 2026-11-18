import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Crown, Headphones } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "@/lib/auth";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Minha conta — Música Player Pro" }, { name: "description", content: "Entre ou cadastre-se no Música Player Pro." }, { property: "og:title", content: "Minha conta — Player Music" }, { property: "og:description", content: "Acesse sua conta do Música Player Pro." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
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
      sessionStorage.setItem("pm:after-login", "/player");
      const { error } = easy ? await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } }) : signup ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }) : await supabase.auth.signInWithPassword({ email, password });
      if (error) { toast.error(error.message.includes("Invalid login") ? "E-mail ou senha incorretos." : "Não foi possível entrar ou criar a conta. Confira os dados e a confirmação do e-mail."); return; }
      if (easy) setSent(true);
      toast.success(easy ? "Confira seu e-mail e toque no link para entrar sem senha." : signup ? "Confira seu e-mail para confirmar sua conta." : "Você entrou na sua conta.");
      if (!easy && !signup) await navigate({ to: "/player", replace: true });
    } catch { toast.error("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  }
  async function signOut() { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }
  async function resetPassword() { if (!email.trim()) { toast.error("Digite seu e-mail primeiro."); return; } const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); toast[error ? "error" : "success"](error ? "Não foi possível enviar o link." : "Confira seu e-mail para trocar a senha."); }
  return (
    <main className="admin-login-shell relative flex min-h-[calc(100vh-2rem)] items-center justify-center overflow-hidden rounded-[2rem] bg-[#050505] px-4 py-8 text-white">
      <div className="pointer-events-none absolute -left-20 top-0 size-72 rounded-full bg-violet-700/20 blur-[100px]" />
      <div className="pointer-events-none absolute -right-20 bottom-0 size-72 rounded-full bg-amber-500/10 blur-[100px]" />
      <section className="relative grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-[#d6b34a]/70 bg-[#080808] shadow-2xl shadow-black/50 md:grid-cols-[.9fr_1.1fr]">
        <div className="flex flex-col items-center justify-center border-b border-[#d6b34a]/30 bg-gradient-to-br from-[#17112b] via-[#0b1020] to-[#080b16] p-8 text-center md:border-b-0 md:border-r">
          <div className="relative mb-6 flex size-28 items-center justify-center rounded-full border-2 border-[#e6c45f] bg-black text-5xl text-[#e6c45f] shadow-[0_0_45px_rgba(212,175,55,.25)]"><Headphones className="size-16" /><Crown className="absolute -top-4 size-7 fill-[#e6c45f]" /></div>
          <p className="text-xs font-black uppercase tracking-[.35em] text-amber-300">MÚSICA PLAYER PRO</p>
          <h1 className="mt-3 text-3xl font-black">Música Player Pro</h1>
          <p className="mt-3 max-w-xs text-sm text-slate-300">Seu espaço para ouvir e organizar suas músicas.</p>
          <div className="mt-8 text-xs text-slate-400">♛ Acesso restrito ao administrador</div>
        </div>
        <div className="p-6 sm:p-10">
          <Link to="/player" className="mb-5 inline-flex w-fit items-center gap-2 rounded-full border border-[#d6b34a]/50 px-4 py-2 text-sm font-bold text-[#e6c45f] hover:bg-[#d6b34a]/10"><ArrowLeft className="size-4" /> Continuar sem entrar</Link>
          <h2 className="mt-8 text-2xl font-black sm:text-3xl">{user ? "Conta conectada" : signup ? "Criar cadastro" : "Entrar na sua conta"}</h2>
          <p className="mt-2 text-sm text-slate-400">Entre ou crie sua conta para salvar suas músicas. O acesso administrativo continua protegido.</p>
          {user ? <div className="mt-8 space-y-4"><p className="rounded-xl border border-white/10 bg-black/30 p-4 text-sm">{user.email}</p><Button asChild className="h-12 w-full bg-gradient-to-r from-[#f0d477] to-[#b68b27] font-black text-black hover:brightness-110"><Link to="/admin">Abrir Painel do Administrador</Link></Button><Button variant="outline" className="w-full border-red-400/40 text-red-200" onClick={() => void signOut()}>Sair da conta</Button></div> : <form onSubmit={(e) => void submit(e)} className="mt-8 space-y-5">
            <div className="space-y-2"><Label htmlFor="email" className="text-slate-200">Usuário / E-mail</Label><Input id="email" type="email" required autoComplete="email" placeholder="Digite seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 border-white/15 bg-black/40 text-white placeholder:text-slate-500" /></div>
            {!easy && <div className="space-y-2"><Label htmlFor="password" className="text-slate-200">Senha</Label><Input id="password" type="password" required minLength={6} autoComplete={signup ? "new-password" : "current-password"} placeholder="Digite sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 border-white/15 bg-black/40 text-white placeholder:text-slate-500" /></div>}
            <Button type="submit" disabled={busy} className="h-13 w-full bg-gradient-to-r from-amber-300 to-yellow-600 text-base font-black text-black shadow-lg shadow-amber-950/30 hover:brightness-110">{busy ? "Aguarde…" : easy ? "ENTRAR SEM SENHA" : signup ? "CRIAR CONTA" : "ENTRAR NO PAINEL"}</Button>
            <Button type="button" variant="outline" className="w-full border-amber-300/35 bg-amber-300/5 text-amber-100 hover:bg-amber-300/10" onClick={() => { setEasy((s) => !s); setSent(false); }}>{easy ? "Entrar com senha" : "Entrar sem senha"}</Button>
            {easy && <Button type="button" variant="outline" className="w-full border-white/20 bg-white/5 font-bold text-white hover:border-amber-300/50 hover:bg-amber-300/10" onClick={() => { setEasy(false); setSignup(true); setSent(false); }}>Criar cadastro</Button>}
            {sent && <p role="status" className="text-sm text-emerald-300">Link enviado. Confira seu e-mail para entrar.</p>}
            {!easy && <div className="flex flex-wrap justify-between gap-2"><Button type="button" variant="ghost" className="px-0 text-slate-300" onClick={() => setSignup((s) => !s)}>{signup ? "Já tenho conta" : "Criar uma conta"}</Button><Button type="button" variant="link" className="px-0 text-amber-300" onClick={() => void resetPassword()}>Esqueci minha senha</Button></div>}
          </form>}
        </div>
      </section>
    </main>
  );
}
