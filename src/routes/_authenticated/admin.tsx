import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Loader2, LogOut, Plus, ShieldAlert, Trash2, Home, Music2, FolderOpen, UploadCloud, Users, BarChart3, Settings, HardDrive, Crown } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin, useSession } from "@/lib/auth";
import { FUNCTIONS, FUNCTION_KEYS, ICON_NAMES, validateCard, type CardConfig } from "@/lib/cards";
import { cn } from "@/lib/utils";
import { AdminMusicLibrary } from "@/components/music/AdminMusicLibrary";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração — PLAYER MUSIC PRO" },
      { name: "description", content: "Área restrita a administradores." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Administração — PLAYER MUSIC PRO" },
      { property: "og:description", content: "Área restrita a administradores." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function friendly(e: unknown) {
  const m = (e as { message?: string })?.message ?? "";
  if (m.includes("último administrador")) return "Não é possível remover o último administrador.";
  if (m.includes("row-level security") || m.includes("permission")) return "Você não tem permissão para esta ação.";
  return "Não foi possível concluir. Tente novamente.";
}

function AdminPage() {
  const { user, loading } = useSession();
  const admin = useIsAdmin(user?.id);
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"inicio" | "cartoes" | "usuarios" | "musicas" | "config" | "registros">("inicio");
  const overview = useQuery({
    queryKey: ["admin-overview"],
    enabled: !!user?.id && admin.data === true,
    queryFn: async () => {
      const [music, profiles, cards] = await Promise.all([
        supabase.from("public_music").select("id,title,artist,created_at,file_size", { count: "exact" }).order("created_at", { ascending: false }).limit(4),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("app_cards").select("id", { count: "exact", head: true }),
      ]);
      if (music.error) throw music.error;
      if (profiles.error) throw profiles.error;
      if (cards.error) throw cards.error;
      return { music: music.data, musicCount: music.count ?? 0, userCount: profiles.count ?? 0, cardCount: cards.count ?? 0 };
    },
  });

  async function logout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  }

  if (loading || admin.isPending) return <p className="flex items-center gap-2 text-muted-foreground"><Loader2 className="animate-spin" /> Verificando permissão…</p>;
  if (admin.isError) return <p className="text-destructive">Não foi possível verificar sua permissão. Verifique a conexão.</p>;
  if (!admin.data) {
    return (
      <div className="space-y-4">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Início</Link>
        <div className="flex gap-3 rounded-2xl border p-4">
          <ShieldAlert className="size-6 shrink-0 text-destructive" />
          <div>
            <h1 className="text-xl font-bold">Acesso negado</h1>
            <p className="text-sm text-muted-foreground">Sua conta não tem permissão de administrador. Mesmo que esta tela fosse aberta, o servidor recusaria qualquer alteração.</p>
          </div>
        </div>
        <Button variant="secondary" onClick={logout}><LogOut /> Sair</Button>
      </div>
    );
  }

  const NAV = [
    { key: "inicio", label: "Início", icon: Home },
    { key: "musicas", label: "Músicas Oficiais", icon: Music2 },
    { key: "cartoes", label: "Pastas / Artistas", icon: FolderOpen },
    { key: "musicas", label: "Uploads (Adicionar)", icon: UploadCloud },
    { key: "usuarios", label: "Usuários", icon: Users },
    { key: "registros", label: "Estatísticas / Registros", icon: BarChart3 },
    { key: "config", label: "Configurações", icon: Settings },
  ] as const;
  return (
    <div className="admin-console -mx-4 -mt-6 min-h-screen overflow-hidden bg-[#080808] text-white sm:-mx-8 sm:-mt-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#d6b34a]/35 bg-[#101010] px-5 py-4 sm:px-8">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-[#d6b34a]/60 bg-[#d6b34a]/10 p-3"><Crown className="size-7 text-amber-300" /></div>
          <div><p className="text-[10px] font-black uppercase tracking-[.3em] text-[#e6c45f]">PLAYER MUSIC PRO</p><h1 className="text-xl font-black sm:text-2xl">Painel do Administrador</h1><p className="text-xs text-slate-300">Gerencie músicas, pastas e usuários do aplicativo</p></div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-white/15 bg-white/5 px-4 py-2 sm:block"><p className="text-sm font-bold">ADM</p><p className="text-[11px] text-slate-300">{user?.email}</p></div>
          <Button onClick={logout} className="bg-red-600 font-bold text-white hover:bg-red-700"><LogOut className="mr-2 size-4" /> Sair do Painel</Button>
        </div>
      </header>
      <div className="grid min-h-[calc(100vh-88px)] lg:grid-cols-[245px_minmax(0,1fr)]">
        <aside className="border-b border-[#d6b34a]/20 bg-[#0b1022] p-3 lg:border-b-0 lg:border-r lg:p-4">
          <nav aria-label="Menu administrativo" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:flex lg:flex-col">
            {NAV.map(({key,label,icon:Icon},i) => <button key={label} onClick={()=>setTab(key)} className={cn("flex min-h-12 items-center gap-3 rounded-xl border px-3 py-3 text-left text-xs font-bold transition-colors sm:text-sm",tab===key && ((key==="inicio"&&i===0)||(key==="musicas"&&i===1)||(key==="cartoes"&&i===2)||(key==="usuarios"&&i===4)||(key==="registros"&&i===5)||(key==="config"&&i===6)) ? "border-amber-300/60 bg-gradient-to-r from-amber-400 to-yellow-600 text-black shadow-lg shadow-amber-950/30" : "border-white/10 bg-white/[.03] text-slate-100 hover:border-amber-300/40 hover:bg-white/[.07]")}><Icon className="size-5 shrink-0" />{label}</button>)}
            <Link to="/armazenamento" className="flex min-h-12 items-center gap-3 rounded-xl border border-white/10 bg-white/[.03] px-3 py-3 text-xs font-bold text-slate-100 hover:border-amber-300/40 sm:text-sm"><HardDrive className="size-5"/>Backup / Armazenamento</Link>
          </nav>
          <div className="mt-5 hidden rounded-xl border border-[#d6b34a]/30 bg-[#d6b34a]/10 p-3 text-xs text-white/80 lg:block"><span className="mb-1 block font-bold">Acesso protegido</span>Área exclusiva para administradores autorizados.</div>
        </aside>
        <section className="min-w-0 space-y-5 p-4 sm:p-6 lg:p-8">

          {tab === "inicio" && <div className="space-y-5">
            <div className="rounded-2xl border border-[#d6b34a]/35 bg-gradient-to-r from-[#191919] via-[#101010] to-[#17130a] p-5">
              <p className="text-xs font-black uppercase tracking-[.25em] text-[#e6c45f]">Visão geral</p>
              <h2 className="mt-1 text-2xl font-black text-white sm:text-3xl">Bem-vindo ao Painel ADM</h2>
              <p className="mt-1 text-sm text-white/65">Gerencie músicas oficiais, artistas e usuários em um só lugar.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              <button onClick={()=>setTab("musicas")} className="rounded-2xl border border-[#d6b34a]/45 bg-gradient-to-br from-[#242016] to-[#111] p-4 text-left"><Music2 className="mb-3 size-7 text-[#e6c45f]"/><p className="text-xs text-white/65">Músicas oficiais</p><p className="mt-1 text-2xl font-black">{overview.data?.musicCount ?? "—"}</p></button>
              <button onClick={()=>setTab("cartoes")} className="rounded-2xl border border-[#d6b34a]/35 bg-[#151515] p-4 text-left"><FolderOpen className="mb-3 size-7 text-[#e6c45f]"/><p className="text-xs text-white/65">Atalhos / Pastas</p><p className="mt-1 text-2xl font-black">{overview.data?.cardCount ?? "—"}</p></button>
              <button onClick={()=>setTab("usuarios")} className="rounded-2xl border border-[#d6b34a]/35 bg-[#151515] p-4 text-left"><Users className="mb-3 size-7 text-[#e6c45f]"/><p className="text-xs text-white/65">Usuários cadastrados</p><p className="mt-1 text-2xl font-black">{overview.data?.userCount ?? "—"}</p></button>
              <div className="rounded-2xl border border-[#d6b34a]/35 bg-[#151515] p-4"><HardDrive className="mb-3 size-7 text-[#e6c45f]"/><p className="text-xs text-white/65">Armazenamento</p><p className="mt-1 text-sm font-bold">Gerenciado pelo provedor</p><p className="mt-1 text-xs text-white/45">Sem capacidade fictícia</p></div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d6b34a]/35 bg-gradient-to-r from-[#211b0d] to-[#111] p-4">
              <div className="flex items-center gap-3"><UploadCloud className="size-10 text-[#e6c45f]"/><div><h3 className="font-extrabold text-white">Adicionar músicas oficiais</h3><p className="text-xs text-white/65">Publique faixas autorizadas para todos os usuários</p></div></div>
              <Button onClick={()=>setTab("musicas")} className="bg-gradient-to-r from-[#f0d477] to-[#b68b27] font-black text-black hover:brightness-110"><Plus className="mr-1 size-4"/> Enviar músicas</Button>
            </div>
            <div className="rounded-2xl border border-[#d6b34a]/30 bg-[#111] p-4">
              <div className="mb-3 flex items-center justify-between"><h3 className="flex items-center gap-2 font-extrabold"><FolderOpen className="size-5 text-[#e6c45f]"/> Últimas músicas publicadas</h3><button onClick={()=>setTab("musicas")} className="text-xs font-bold text-[#e6c45f]">Ver todas</button></div>
              {overview.isPending ? <p className="text-sm text-white/55">Carregando catálogo…</p> : overview.isError ? <p className="text-sm text-white/55">Não foi possível carregar o catálogo. Verifique a configuração do banco.</p> : overview.data?.music.length ? <div className="divide-y divide-white/10">{overview.data.music.map(track=><div key={track.id} className="flex items-center gap-3 py-3"><div className="rounded-lg bg-[#d6b34a]/15 p-2"><Music2 className="size-5 text-[#e6c45f]"/></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-white">{track.title}</p><p className="truncate text-xs text-white/55">{track.artist} · {((track.file_size ?? 0)/1048576).toFixed(1)} MB</p></div></div>)}</div> : <p className="rounded-xl border border-dashed border-[#d6b34a]/25 p-4 text-sm text-white/55">Nenhuma música oficial publicada ainda.</p>}
            </div>
          </div>
          {tab === "cartoes" && <><h2 className="text-xl font-black text-[#e6c45f]">Cartões e atalhos</h2><CardsAdmin /></>}
          {tab === "usuarios" && <><h2 className="text-xl font-black text-amber-200">Usuários</h2><UsersAdmin selfId={user!.id} /></>}
          {tab === "musicas" && <><div className="rounded-2xl border border-[#d6b34a]/35 bg-gradient-to-r from-[#211b0d] to-[#111] p-4"><h2 className="text-xl font-black">Adicionar Músicas</h2><p className="text-sm text-slate-300">Publique músicas oficiais disponíveis para os usuários</p></div><AdminMusicLibrary /></>}
          {tab === "config" && <><h2 className="text-xl font-black text-amber-200">Configurações</h2><SettingsAdmin /></>}
          {tab === "registros" && <><h2 className="text-xl font-black text-amber-200">Registros administrativos</h2><AuditAdmin /></>}
        </section>
      </div>
    </div>
  );
}

function CardsAdmin() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-cards"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_cards").select("*").order("position");
      if (error) throw error;
      return data as CardConfig[];
    },
  });
  const [newKey, setNewKey] = useState<string>("player");
  const refresh = () => { qc.invalidateQueries({ queryKey: ["admin-cards"] }); qc.invalidateQueries({ queryKey: ["app-cards"] }); };

  async function run(fn: () => PromiseLike<{ error: unknown }>, ok: string) {
    const { error } = await fn();
    if (error) toast.error(friendly(error)); else { toast.success(ok); refresh(); }
  }

  async function move(i: number, dir: -1 | 1) {
    const list = q.data!;
    const a = list[i]!, b = list[i + dir];
    if (!b) return;
    const r1 = await supabase.from("app_cards").update({ position: b.position }).eq("id", a.id);
    const r2 = await supabase.from("app_cards").update({ position: a.position }).eq("id", b.id);
    if (r1.error || r2.error) toast.error(friendly(r1.error ?? r2.error)); else refresh();
  }

  if (q.isPending) return <p className="text-muted-foreground">Carregando cartões…</p>;
  if (q.isError) return <p className="text-destructive">Falha ao carregar os cartões.</p>;
  const max = Math.max(0, ...q.data.map((c) => c.position));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">O destino de cada cartão é fixo pela sua função. Mudar nome, ícone ou ordem não altera o que ele abre.</p>
      {q.data.map((c, i) => <CardEditor key={c.id} card={c} first={i === 0} last={i === q.data.length - 1} onMove={(d) => move(i, d)} run={run} />)}
      <form
        className="flex flex-wrap items-end gap-2 rounded-2xl border border-dashed p-3"
        onSubmit={(e) => {
          e.preventDefault();
          const f = FUNCTIONS[newKey as keyof typeof FUNCTIONS];
          void run(() => supabase.from("app_cards").insert({ function_key: newKey, title: f.title, description: f.description, icon: f.icon, position: max + 1 }), "Cartão adicionado.");
        }}
      >
        <div className="flex-1 space-y-1">
          <Label htmlFor="nova-funcao">Novo cartão para a função</Label>
          <select id="nova-funcao" value={newKey} onChange={(e) => setNewKey(e.target.value)} className="h-10 w-full rounded-md border bg-background px-2 text-sm">
            {FUNCTION_KEYS.map((k) => <option key={k} value={k}>{FUNCTIONS[k].title}</option>)}
          </select>
        </div>
        <Button type="submit"><Plus /> Adicionar</Button>
      </form>
    </div>
  );
}

function CardEditor({ card, first, last, onMove, run }: {
  card: CardConfig; first: boolean; last: boolean; onMove: (d: -1 | 1) => void;
  run: (fn: () => PromiseLike<{ error: unknown }>, ok: string) => Promise<void>;
}) {
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description);
  const [icon, setIcon] = useState(card.icon);
  const dirty = title !== card.title || description !== card.description || icon !== card.icon;
  const fn = FUNCTIONS[card.function_key as keyof typeof FUNCTIONS];
  return (
    <div className={cn("space-y-2 rounded-2xl bg-card p-3", !card.enabled && "opacity-60")}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">Função: <b>{fn?.title ?? card.function_key}</b> → {fn?.route}</p>
        <div className="flex items-center gap-1">
          <button disabled={first} onClick={() => onMove(-1)} aria-label={`Subir ${card.title}`} className="p-1.5 disabled:opacity-30"><ArrowUp className="size-4" /></button>
          <button disabled={last} onClick={() => onMove(1)} aria-label={`Descer ${card.title}`} className="p-1.5 disabled:opacity-30"><ArrowDown className="size-4" /></button>
          <Switch
            aria-label={card.enabled ? `Desativar ${card.title}` : `Ativar ${card.title}`}
            checked={card.enabled}
            onCheckedChange={(v) => run(() => supabase.from("app_cards").update({ enabled: v }).eq("id", card.id), v ? "Cartão ativado." : "Cartão desativado.")}
          />
        </div>
      </div>
      <Input aria-label="Nome do cartão" value={title} maxLength={40} onChange={(e) => setTitle(e.target.value)} />
      <Input aria-label="Descrição do cartão" value={description} maxLength={120} onChange={(e) => setDescription(e.target.value)} />
      <div className="flex gap-2">
        <select aria-label="Ícone" value={icon} onChange={(e) => setIcon(e.target.value)} className="h-9 flex-1 rounded-md border bg-background px-2 text-sm">
          {ICON_NAMES.map((n) => <option key={n} value={n}>{n}</option>)}
        </select>
        <Button
          size="sm"
          disabled={!dirty}
          onClick={() => {
            const err = validateCard({ title, description, icon, function_key: card.function_key });
            if (err) { toast.error(err); return; }
            void run(() => supabase.from("app_cards").update({ title: title.trim(), description: description.trim(), icon }).eq("id", card.id), "Cartão salvo.");
          }}
        >Salvar</Button>
        <Button
          size="sm" variant="ghost" className="text-destructive" aria-label={`Excluir ${card.title}`}
          onClick={() => { if (window.confirm(`Excluir o cartão “${card.title}”? A função continua existindo.`)) void run(() => supabase.from("app_cards").delete().eq("id", card.id), "Cartão excluído."); }}
        ><Trash2 /></Button>
      </div>
    </div>
  );
}

function UsersAdmin({ selfId }: { selfId: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("id, email, display_name, created_at").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (p.error || r.error) throw p.error ?? r.error;
      const admins = new Set(r.data.filter((x) => x.role === "admin").map((x) => x.user_id));
      return p.data.map((u) => ({ ...u, admin: admins.has(u.id) }));
    },
  });
  async function toggle(id: string, email: string | null, makeAdmin: boolean) {
    if (!window.confirm(makeAdmin ? `Tornar ${email} administrador?` : `Remover o acesso de administrador de ${email}?`)) return;
    const { error } = makeAdmin
      ? await supabase.from("user_roles").insert({ user_id: id, role: "admin" })
      : await supabase.from("user_roles").delete().eq("user_id", id).eq("role", "admin");
    if (error) toast.error(friendly(error)); else { toast.success("Permissão atualizada."); qc.invalidateQueries({ queryKey: ["admin-users"] }); qc.invalidateQueries({ queryKey: ["is-admin"] }); }
  }
  if (q.isPending) return <p className="text-muted-foreground">Carregando usuários…</p>;
  if (q.isError) return <p className="text-destructive">Falha ao carregar usuários.</p>;
  return (
    <ul className="space-y-2">
      {q.data.map((u) => (
        <li key={u.id} className="flex items-center justify-between gap-3 rounded-xl bg-card p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{u.email}{u.id === selfId && " (você)"}</p>
            <p className="text-xs text-muted-foreground">{u.admin ? "Administrador" : "Usuário comum"}</p>
          </div>
          <Button size="sm" variant={u.admin ? "ghost" : "secondary"} onClick={() => toggle(u.id, u.email, !u.admin)}>
            {u.admin ? "Remover admin" : "Tornar admin"}
          </Button>
        </li>
      ))}
    </ul>
  );
}

function SettingsAdmin() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["admin-settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("app_settings").select("key, value");
      if (error) throw error;
      return Object.fromEntries(data.map((d) => [d.key, d.value]));
    },
  });
  const [greeting, setGreeting] = useState<string | null>(null);
  async function save(key: "home_greeting" | "demo_tracks_enabled", value: string | boolean) {
    const { error } = await supabase.from("app_settings").update({ value }).eq("key", key);
    if (error) toast.error(friendly(error)); else { toast.success("Ajuste salvo."); qc.invalidateQueries(); }
  }
  if (q.isPending) return <p className="text-muted-foreground">Carregando…</p>;
  if (q.isError) return <p className="text-destructive">Falha ao carregar ajustes.</p>;
  const g = greeting ?? String(q.data["home_greeting"] ?? "");
  return (
    <div className="space-y-4">
      <form className="space-y-2 rounded-2xl bg-card p-3" onSubmit={(e) => { e.preventDefault(); const t = g.trim(); if (t.length < 1 || t.length > 60) { toast.error("Use de 1 a 60 caracteres."); return; } void save("home_greeting", t); }}>
        <Label htmlFor="saudacao">Frase da tela inicial</Label>
        <Input id="saudacao" value={g} maxLength={60} onChange={(e) => setGreeting(e.target.value)} />
        <Button size="sm" type="submit">Salvar</Button>
      </form>
      <div className="flex items-center justify-between rounded-2xl bg-card p-3">
        <Label htmlFor="demos">Mostrar faixas de demonstração</Label>
        <Switch id="demos" checked={q.data["demo_tracks_enabled"] !== false} onCheckedChange={(v) => save("demo_tracks_enabled", v)} />
      </div>
    </div>
  );
}

function AuditAdmin() {
  const q = useQuery({
    queryKey: ["admin-audit"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      return data;
    },
  });
  const ACT: Record<string, string> = { insert: "criou", update: "alterou", delete: "excluiu" };
  const TBL: Record<string, string> = { app_cards: "cartão", app_settings: "ajuste", user_roles: "permissão" };
  if (q.isPending) return <p className="text-muted-foreground">Carregando registros…</p>;
  if (q.isError) return <p className="text-destructive">Falha ao carregar registros.</p>;
  if (!q.data.length) return <p className="text-sm text-muted-foreground">Nenhuma ação registrada ainda.</p>;
  return (
    <ul className="space-y-2">
      {q.data.map((r) => {
        const d = r.details as { new?: { title?: string; key?: string; role?: string } } | null;
        return (
          <li key={r.id} className="rounded-xl bg-card p-3 text-sm">
            <p><b>{r.actor_email ?? "sistema"}</b> {ACT[r.action] ?? r.action} {TBL[r.target_table] ?? r.target_table} {d?.new?.title ?? d?.new?.key ?? d?.new?.role ?? ""}</p>
            <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString("pt-BR")}</p>
          </li>
        );
      })}
    </ul>
  );
}
