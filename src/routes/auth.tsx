import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, AudioLines, Crown, Headphones, LockKeyhole, Mail, Music2, Play, SkipBack, SkipForward, UserRoundPlus, Zap } from "lucide-react";
import { useEffect, useState } from "react";
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
  useEffect(() => { if (user) void navigate({ to: "/player", replace: true }); }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true);
    try {
      sessionStorage.setItem("pm:after-login", "/player");
      const result = easy ? await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } }) : signup ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }) : await supabase.auth.signInWithPassword({ email, password });
      if (result.error) { toast.error(result.error.message.includes("Invalid login") ? "E-mail ou senha incorretos." : "Não foi possível entrar ou criar a conta. Confira os dados e a confirmação do e-mail."); return; }
      if (easy) setSent(true);
      if (!easy && !signup) await navigate({ to: "/player", replace: true });
      if (!easy && signup && result.data.session) await navigate({ to: "/player", replace: true });
      toast.success(easy ? "Confira seu e-mail e toque no link para entrar sem senha." : signup ? "Confira seu e-mail para confirmar sua conta." : "Você entrou na sua conta.");
      if (!easy && !signup) await navigate({ to: "/player", replace: true });
    } catch { toast.error("Não foi possível conectar. Tente novamente."); }
    finally { setBusy(false); }
  }
  async function signOut() { await queryClient.cancelQueries(); queryClient.clear(); await supabase.auth.signOut(); await navigate({ to: "/auth", replace: true }); }
  async function resetPassword() { if (!email.trim()) { toast.error("Digite seu e-mail primeiro."); return; } const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` }); toast[error ? "error" : "success"](error ? "Não foi possível enviar o link." : "Confira seu e-mail para trocar a senha."); }
  return (
    <main className="relative flex min-h-[calc(100vh-1rem)] items-center justify-center overflow-hidden rounded-[1.75rem] bg-[#050505] px-3 py-5 text-white sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,rgba(212,165,45,.16),transparent_42%),radial-gradient(ellipse_at_bottom_right,rgba(212,165,45,.12),transparent_38%)]" />
      <section className="relative grid w-full max-w-6xl overflow-hidden rounded-[1.75rem] border border-[#d6aa38]/70 bg-[#080808] shadow-[0_0_55px_rgba(212,165,45,.13)] md:min-h-[690px] md:grid-cols-[.95fr_1.05fr]">
        <div className="relative flex flex-col justify-between overflow-hidden border-b border-[#d6aa38]/30 bg-[radial-gradient(ellipse_at_center,rgba(125,79,15,.22),transparent_55%),linear-gradient(145deg,#111,#030303_70%)] p-6 sm:p-9 md:border-b-0 md:border-r">
          <div className="pointer-events-none absolute -left-20 top-10 size-72 rounded-full border-[18px] border-white/[.035] shadow-[0_0_0_18px_rgba(255,255,255,.02),0_0_0_38px_rgba(255,255,255,.015)]" />
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="flex size-32 items-center justify-center rounded-[2rem] border border-[#e3b83f]/80 bg-black/80 shadow-[0_0_45px_rgba(235,177,43,.22)]"><div className="relative flex flex-col items-center text-[#f5c84b]"><Crown className="mb-1 size-7 fill-current"/><Headphones className="size-16"/><AudioLines className="absolute bottom-3 size-9 text-white"/></div></div>
            <p className="mt-5 text-xs font-black tracking-[.38em] text-[#f2c64b]">MÚSICA</p><h1 className="text-4xl font-black italic tracking-tight text-white sm:text-5xl">PLAYER <span className="text-[#efbd3d]">PRO</span></h1><p className="mt-3 text-xs font-semibold uppercase tracking-[.2em] text-white/65">Seu reprodutor de músicas premium</p>
          </div>
          <div className="relative z-10 mt-8"><div className="mb-4 flex h-16 items-end justify-center gap-1.5 overflow-hidden">{Array.from({length:32},(_,i)=><span key={i} className="w-2 rounded-t-full bg-gradient-to-t from-[#9b6710] to-[#ffe17a]" style={{height:`${18 + ((i*17)%39)}px`}} />)}</div>
            <div className="rounded-2xl border border-[#d6aa38]/35 bg-black/65 p-4 shadow-lg"><div className="flex items-center gap-3"><div className="flex size-12 items-center justify-center rounded-xl border border-[#d6aa38]/50 bg-[#d6aa38]/10 text-[#f4c64d]"><Music2 className="size-6"/></div><div className="min-w-0 flex-1"><p className="font-bold">Música em reprodução</p><p className="text-sm text-[#e8bb43]">Música Player Pro</p></div><Play className="size-5 text-[#f4c64d]"/></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full w-[38%] rounded-full bg-gradient-to-r from-[#ffe27a] to-[#c58b16]"/></div><div className="mt-3 flex items-center justify-center gap-8 text-white/80"><SkipBack className="size-5"/><span className="flex size-12 items-center justify-center rounded-full border border-[#e7b83e] text-[#f4c64d]"><Play className="ml-0.5 size-5 fill-current"/></span><SkipForward className="size-5"/></div></div>
          </div><p className="relative z-10 mt-5 text-center text-xs text-white/45">Áudio, organização e sua biblioteca em um só lugar</p>
        </div>
        <div className="relative flex flex-col justify-center p-6 sm:p-10 lg:p-12">
          <Link to="/player" className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-semibold text-white/65 transition hover:text-[#f4c64d]"><ArrowLeft className="size-4"/> Voltar ao aplicativo</Link>
          <div className="mx-auto mt-8 w-full max-w-md">
            <div className="mb-7 text-center"><div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl border border-[#d6aa38]/65 bg-[#d6aa38]/10 text-[#f4c64d]"><Crown className="size-8"/></div><h2 className="text-2xl font-black sm:text-3xl">{user ? "Conta conectada" : signup ? "Criar cadastro" : "Acesse sua conta"}</h2><p className="mt-2 text-sm text-white/55">Entre para acessar sua experiência Música Player Pro</p></div>
            {user ? <div className="space-y-4"><p className="rounded-xl border border-[#d6aa38]/35 bg-black/50 p-4 text-sm">{user.email}</p><Button asChild className="h-12 w-full bg-gradient-to-r from-[#ffe17a] to-[#c58b16] font-black text-black hover:brightness-110"><Link to="/player">Ir para reprodução</Link></Button><Button variant="outline" className="w-full border-red-500/40 text-red-200" onClick={() => void signOut()}>Sair da conta</Button></div> : <form onSubmit={(e) => void submit(e)} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="email" className="text-sm text-white/80">E-mail</Label><div className="relative"><Mail className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#e7bb43]"/><Input id="email" type="email" required autoComplete="email" placeholder="Digite seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-xl border border-[#d6aa38]/70 bg-[#111] pl-12 text-white placeholder:text-white/35 focus-visible:ring-[#e7bb43]"/></div></div>
              {!easy && <div className="space-y-2"><Label htmlFor="password" className="text-sm text-white/80">Senha</Label><div className="relative"><LockKeyhole className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-[#e7bb43]"/><Input id="password" type="password" required minLength={6} autoComplete={signup ? "new-password" : "current-password"} placeholder="Digite sua senha" value={password} onChange={(e) => setPassword(e.target.value)} className="h-14 rounded-xl border border-[#d6aa38]/70 bg-[#111] pl-12 text-white placeholder:text-white/35 focus-visible:ring-[#e7bb43]"/></div></div>}
              <Button type="submit" disabled={busy} className="h-14 w-full rounded-full bg-gradient-to-r from-[#ffe17a] via-[#eab735] to-[#b77d13] text-lg font-black text-black shadow-[0_8px_28px_rgba(198,140,20,.22)] hover:brightness-110">{busy ? "Aguarde…" : easy ? "ENTRAR SEM SENHA" : signup ? "CRIAR CONTA" : "ENTRAR"}</Button>
              <div className="flex items-center gap-3 py-1 text-xs text-white/45"><span className="h-px flex-1 bg-white/20"/><span>OU</span><span className="h-px flex-1 bg-white/20"/></div>
              {easy && <Button type="button" variant="outline" className="h-12 w-full rounded-full border-[#d6aa38] bg-transparent font-bold text-white hover:bg-[#d6aa38]/10" onClick={() => { setEasy(false); setSignup(true); setSent(false); }}><UserRoundPlus className="mr-2 size-5 text-[#f4c64d]"/> CRIAR CADASTRO</Button>}
              <Button type="button" variant="outline" className="h-12 w-full rounded-full border-[#d6aa38]/70 bg-white/[.03] font-bold text-white hover:bg-[#d6aa38]/10" onClick={() => { setEasy((s) => !s); setSignup(false); setSent(false); }}>{easy ? <><Zap className="mr-2 size-5 text-[#f4c64d]"/> ENTRAR SEM SENHA</> : "VOLTAR AO ACESSO SEM SENHA"}</Button>
              {sent && <p role="status" className="text-sm text-emerald-300">Link enviado. Confira seu e-mail para entrar.</p>}
              {!easy && <div className="flex flex-wrap justify-between gap-2"><Button type="button" variant="ghost" className="px-0 text-white/65" onClick={() => setSignup((s) => !s)}>{signup ? "Já tenho conta" : "Criar uma conta"}</Button><Button type="button" variant="link" className="px-0 text-[#f4c64d]" onClick={() => void resetPassword()}>Esqueci minha senha</Button></div>}
            </form>}
          </div>
        </div>
      </section>
    </main>
  );
}
