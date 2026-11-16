import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { ArrowLeft, Moon, Smartphone, SkipForward, History, Database, FolderOpen } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { usePlayer } from "@/lib/music/player-context";
import { AdvancedMusicTools } from "@/components/music/AdvancedMusicTools";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Player Music" },
      { name: "description", content: "Tema e opções de reprodução do Player Music." },
      { property: "og:title", content: "Configurações — Player Music" },
      { property: "og:description", content: "Preferências e cópia privada da biblioteca do Player Music." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
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

      <section className="space-y-2 rounded-2xl border border-primary/30 bg-card p-4 text-sm">
        <h2 className="text-lg font-bold">Biblioteca neste aparelho</h2>
        <p className="text-muted-foreground">
          Use o Player Music sem criar conta e sem fazer login. Importe suas músicas, organize por pastas e cantores, escolha capas, monte playlists e salve favoritos. Os arquivos e as preferências ficam neste aparelho; mantenha as músicas importadas localmente para ouvir sem internet.
        </p>
      </section>

      <section className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4 text-sm">
        <div className="flex items-center gap-2"><Database className="size-5 text-primary" /><h2 className="text-lg font-bold">Armazenamento de músicas</h2></div>
        <p className="text-muted-foreground">Veja o espaço realmente usado pelos arquivos importados e encontre todas as suas pastas em um só lugar.</p>
        <Link to="/armazenamento" className="flex items-center justify-between rounded-xl border border-primary/30 p-3 font-semibold hover:bg-accent/50"><span className="flex items-center gap-2"><FolderOpen className="size-5 text-primary" /> Abrir armazenamento e pastas</span><span className="text-primary">›</span></Link>
      </section>

      <section className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4 text-sm">
        <div className="flex items-center gap-2">
          <History className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Continuar de onde parei</h2>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="resume-playback" className="text-base">Lembrar a música e o ponto de reprodução</Label>
          <Switch id="resume-playback" checked={p.resumePlayback} onCheckedChange={p.setResumePlayback} />
        </div>
        <p className="text-muted-foreground">Ao reabrir, sua música volta ao ponto salvo. Se o aparelho bloquear o início automático, toque em reproduzir para continuar.</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4 text-sm">
        <div className="flex items-center gap-2">
          <SkipForward className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Próxima música automática</h2>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="auto-next" className="text-base">Passar para a próxima música ao terminar</Label>
          <Switch id="auto-next" checked={p.autoNext} onCheckedChange={p.setAutoNext} />
        </div>
        <p className="text-muted-foreground">Quando ativado, o player continua pela próxima faixa da fila. Quando desativado, a reprodução para ao terminar a música atual.</p>
      </section>

      <section className="space-y-3 rounded-2xl border border-primary/30 bg-card p-4 text-sm">
        <div className="flex items-center gap-2">
          <Smartphone className="size-5 text-primary" />
          <h2 className="text-lg font-bold">Tocar em segundo plano</h2>
        </div>
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="background-playback" className="text-base">Ativar reprodução em segundo plano</Label>
          <Switch id="background-playback" checked={p.backgroundPlayback} onCheckedChange={p.setBackgroundPlayback} />
        </div>
        <p className="text-muted-foreground">
          No APK Android, esta opção usa o serviço de mídia para manter a notificação e os controles na tela bloqueada. O Android ainda pode aplicar restrições de bateria.
        </p>
        <p className="text-muted-foreground">
          No navegador, a continuidade depende do suporte do navegador {hydrated && (hasMediaSession ? "(controles de mídia disponíveis)" : "(sem suporte aos controles de mídia)")}.
        </p>
      </section>

      <section className="space-y-2 rounded-2xl bg-card p-4 text-sm">
        <h2 className="text-lg font-bold">Suas músicas e dados</h2>
        <p className="text-muted-foreground">
          Músicas importadas, pastas, favoritos e playlists ficam guardados neste aparelho. Limpar os dados ou desinstalar o aplicativo pode apagar a biblioteca local. Faça uma cópia dos arquivos originais para não perdê-los.
        </p>
        <p className="text-muted-foreground">O Player Music não exige login para ouvir arquivos locais. Recursos de administração e armazenamento privado na nuvem não fazem parte do uso offline.</p>
      </section>

      <p className="text-center text-xs text-muted-foreground">Player Music · aplicativo Android</p>
      <p className="pb-2 text-center text-xs font-semibold tracking-wide text-primary">Feito por Adevaldo Marques</p>
    </div>
  );
}
