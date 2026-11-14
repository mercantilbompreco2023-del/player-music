import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { ArrowLeft, Moon } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePlayer } from "@/lib/music/player-context";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Player Music" },
      { name: "description", content: "Tema, limitações de reprodução e informações do app." },
      { property: "og:title", content: "Configurações — Player Music" },
      { property: "og:description", content: "Tema, limitações de reprodução e informações do app." },
    ],
  }),
  component: ConfigPage,
});

function ConfigPage() {
  const p = usePlayer();
  const hydrated = useHydrated();
  const hasMediaSession = hydrated && "mediaSession" in navigator;
  return (
    <div className="space-y-5">
      <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Início</Link>
      <h1 className="text-3xl font-bold">Configurações</h1>

      <section className="flex items-center justify-between rounded-2xl bg-card p-4">
        <Label htmlFor="tema" className="flex items-center gap-3 text-base"><Moon className="size-5" /> Tema escuro</Label>
        <Switch id="tema" checked={p.prefs.theme === "dark"} onCheckedChange={(c) => p.setTheme(c ? "dark" : "light")} />
      </section>

      <section className="space-y-2 rounded-2xl bg-card p-4 text-sm">
        <h2 className="text-lg font-bold">Tocar em segundo plano</h2>
        <p className="text-muted-foreground">
          Este é um app web (MVP), não um aplicativo instalado (APK). A música costuma continuar com a tela bloqueada, e os controles podem aparecer
          na notificação/tela de bloqueio {hydrated && (hasMediaSession ? "(seu navegador suporta esses controles)" : "(seu navegador não suporta esses controles)")}.
        </p>
        <p className="text-muted-foreground">
          Mas não há garantia: o Android ou o navegador podem pausar ou fechar a página para economizar bateria, principalmente com economia de
          energia ativa ou após muito tempo em segundo plano. Reprodução garantida em segundo plano exige um app Android nativo com serviço de mídia e notificação permanente — isso ainda não existe.
        </p>
      </section>

      <section className="space-y-2 rounded-2xl bg-card p-4 text-sm">
        <h2 className="text-lg font-bold">Suas músicas e dados</h2>
        <p className="text-muted-foreground">
          Os arquivos importados, favoritos e playlists ficam guardados só neste aparelho e navegador. Limpar os dados do navegador apaga tudo.
          Se o aparelho estiver sem espaço, a faixa vale apenas até fechar o app. Formatos aceitos dependem do navegador (MP3, M4A/AAC, OGG, WAV e
          normalmente FLAC). Arquivos com proteção (DRM) não são suportados.
        </p>
        <p className="text-muted-foreground">
          Não existe catálogo online nem streaming. As faixas DEMO são composições originais de domínio público (CC0) criadas para este app.
        </p>
      </section>

      <section className="space-y-2 rounded-2xl bg-card p-4 text-sm">
        <h2 className="text-lg font-bold">Conta e administração</h2>
        <p className="text-muted-foreground">
          A área de administração exige login e a permissão de administrador, conferida pelo servidor a cada ação.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/auth" search={{ redirect: "/admin" }} className="font-semibold text-primary">Entrar / criar conta</Link>
          <Link to="/privacidade" className="font-semibold text-primary">Privacidade e permissões</Link>
        </div>
      </section>
      <p className="text-center text-xs text-muted-foreground">Player Music · versão web MVP</p>
    </div>
  );
}
