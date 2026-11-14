import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowLeft, ArrowUp, Loader2, LogOut, Plus, ShieldAlert, Trash2 } from "lucide-react";
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

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administração — Player Music" },
      { name: "description", content: "Área restrita a administradores." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Administração — Player Music" },
      { property: "og:description", content: "Área restrita a administradores." },
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
  const [tab, setTab] = useState<"cartoes" | "usuarios" | "config" | "registros">("cartoes");

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

  const TABS = [["cartoes", "Cartões"], ["usuarios", "Usuários"], ["config", "Ajustes"], ["registros", "Registros"]] as const;
  return (
    <div className="space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Início</Link>
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">Administração</h1>
        <Button variant="ghost" size="sm" onClick={logout}><LogOut /> Sair</Button>
      </div>
      <p className="text-xs text-muted-foreground">Conectado como {user?.email}. Toda alteração é registrada.</p>
      <div role="tablist" className="grid grid-cols-4 gap-1 rounded-full bg-muted p-1">
        {TABS.map(([k, l]) => (
          <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={cn("rounded-full py-2 text-xs font-semibold", tab === k ? "bg-background" : "text-muted-foreground")}>{l}</button>
        ))}
      </div>
      {tab === "cartoes" && <CardsAdmin />}
      {tab === "usuarios" && <UsersAdmin selfId={user!.id} />}
      {tab === "config" && <SettingsAdmin />}
      {tab === "registros" && <AuditAdmin />}
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
