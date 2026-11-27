import { createFileRoute, Link, useHydrated } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, AudioLines, Bell, Bluetooth, BookOpen, CheckCircle2, Cloud, Database, Download, FolderOpen, Gauge, HardDrive, History, Info, ListMusic, Moon, Music2, Palette, Play, RotateCcw, Settings2, Smartphone, Sparkles, Timer, Trash2, Video, Volume2, Wifi } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { usePlayer } from "@/lib/music/player-context";
import { requestPersistentStorage } from "@/lib/music/storage";
import { toast } from "sonner";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({ meta: [
    { title: "Configurações — Delícia Coxi’s Music & Video" },
    { name: "description", content: "Personalize reprodução, biblioteca, aparência e controles do Delícia Coxi’s Music & Video." },
  ] }),
  component: ConfigPage,
});

const PREF_KEY = "delicia-music-ui-preferences";
type UiPrefs = { visualizer: boolean; lyrics: boolean; musicNotifications: boolean; videoNotifications: boolean; lockControls: boolean; bluetooth: boolean; animations: boolean; offlineDownloads: boolean; autoOpenPlayer: boolean };
const DEFAULT_UI: UiPrefs = { visualizer: true, lyrics: true, musicNotifications: true, videoNotifications: true, lockControls: true, bluetooth: true, animations: true, offlineDownloads: true, autoOpenPlayer: false };
function readUiPrefs(): UiPrefs {
  try { return { ...DEFAULT_UI, ...JSON.parse(localStorage.getItem(PREF_KEY) || "{}") }; } catch { return DEFAULT_UI; }
}
function SettingRow({ icon: Icon, title, detail, control }: { icon: React.ElementType; title: string; detail?: string; control: React.ReactNode }) {
  return <div className="flex min-h-[58px] items-center gap-3 border-b border-primary/15 py-2.5 last:border-0"><Icon className="size-5 shrink-0 text-primary"/><div className="min-w-0 flex-1"><p className="text-sm font-semibold leading-tight">{title}</p>{detail && <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>}</div>{control}</div>;
}
function Group({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return <section className="settings-group rounded-2xl border border-primary/35 bg-card/75 p-3 shadow-[0_0_22px_-16px_hsl(var(--primary))] sm:p-4"><h2 className="mb-2 flex items-center gap-2 text-base font-extrabold text-primary"><Icon className="size-5"/>{title}</h2>{children}</section>;
}
function ConfigPage() {
  const p = usePlayer();
  const hydrated = useHydrated();
  const [ui, setUi] = useState<UiPrefs>(DEFAULT_UI);
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [persistent, setPersistent] = useState<boolean | null>(null);
  useEffect(() => { setUi(readUiPrefs()); void navigator.storage?.estimate?.().then(e => setStorage({ usage: e.usage || 0, quota: e.quota || 0 })).catch(() => {}); void navigator.storage?.persisted?.().then(setPersistent).catch(() => {}); }, []);
  const update = (key: keyof UiPrefs, value: boolean) => setUi(current => { const next = { ...current, [key]: value }; try { localStorage.setItem(PREF_KEY, JSON.stringify(next)); } catch {} return next; });
  const fmt = (bytes: number) => bytes < 1024 ** 3 ? (bytes / 1024 ** 2).toFixed(0) + " MB" : (bytes / 1024 ** 3).toFixed(1) + " GB";
  const clearCache = async () => { try { if ("caches" in window) { const keys = await caches.keys(); await Promise.all(keys.map(k => caches.delete(k))); } toast.success("Cache temporário limpo. Suas músicas salvas não foram apagadas."); } catch { toast.error("Não foi possível limpar o cache."); } };
  const restore = () => { p.setTheme("dark"); p.setVolume(0.8); p.setAutoNext(true); p.setBackgroundPlayback(true); p.setResumePlayback(true); if (p.prefs.shuffle) p.toggleShuffle(); while (p.prefs.repeat !== "off") p.cycleRepeat(); setUi(DEFAULT_UI); try { localStorage.setItem(PREF_KEY, JSON.stringify(DEFAULT_UI)); } catch {} toast.success("Preferências principais restauradas."); };
  const toggle = (key: keyof UiPrefs, label: string) => <Switch checked={ui[key]} onCheckedChange={v => update(key, v)} aria-label={label}/>;
  return <div className="settings-neon settings-complete space-y-4 pb-5">
    <Link to="/" className="inline-flex items-center gap-2 rounded-full border border-primary/35 bg-primary/10 px-3 py-2 text-sm font-semibold text-primary"><ArrowLeft className="size-4"/> Início</Link>
    <header className="rounded-2xl border border-primary/45 bg-gradient-to-r from-[#06170b] via-card to-[#031006] p-4 shadow-[0_0_24px_-12px_hsl(var(--primary))]">
      <p className="text-[10px] font-black uppercase tracking-[.22em] text-primary">Delícia Coxi’s Music & Video</p><h1 className="mt-1 text-2xl font-black sm:text-3xl">Configurações</h1><p className="mt-1 text-sm text-muted-foreground">Personalize o aplicativo do seu jeito</p>
    </header>
    <div className="grid gap-3 lg:grid-cols-2">
      <Group icon={Smartphone} title="Minha conta e dispositivo">
        <SettingRow icon={Info} title="Perfil do aplicativo" detail="Player local, sem login obrigatório" control={<Link to="/auth" className="text-xs font-bold text-primary">Conta ›</Link>}/>
        <SettingRow icon={Cloud} title="Sincronizar biblioteca" detail="Backup de playlists e dados da conta" control={<Link to="/armazenamento" className="text-xs font-bold text-primary">Abrir ›</Link>}/>
        <SettingRow icon={Database} title="Backup e restauração" detail="Exportar ou recuperar biblioteca" control={<Link to="/armazenamento" className="text-xs font-bold text-primary">Backup ›</Link>}/>
        <SettingRow icon={HardDrive} title="Armazenamento local" detail="Músicas e pastas neste aparelho" control={<Link to="/armazenamento" className="text-xs font-bold text-primary">Gerenciar ›</Link>}/>
      </Group>
      <Group icon={AudioLines} title="Reprodução">
        <SettingRow icon={Play} title="Continuar automaticamente" detail="Avançar para a próxima faixa" control={<Switch checked={p.autoNext} onCheckedChange={p.setAutoNext} aria-label="Próxima música automática"/>}/>
        <SettingRow icon={History} title="Lembrar posição" detail="Retomar de onde parou" control={<Switch checked={p.resumePlayback} onCheckedChange={p.setResumePlayback} aria-label="Lembrar posição"/>}/>
        <SettingRow icon={Smartphone} title="Reprodução em segundo plano" detail="Continuar com tela bloqueada (sujeito ao Android)" control={<Switch checked={p.backgroundPlayback} onCheckedChange={p.setBackgroundPlayback} aria-label="Reprodução em segundo plano"/>}/>
        <SettingRow icon={Shuffle} title="Modo aleatório" control={<Switch checked={p.prefs.shuffle} onCheckedChange={p.toggleShuffle} aria-label="Modo aleatório"/>}/>
        <SettingRow icon={Repeat} title="Repetição" detail={p.prefs.repeat === "off" ? "Desativada" : p.prefs.repeat === "all" ? "Repetir fila" : "Repetir faixa"} control={<Button size="sm" variant="outline" onClick={p.cycleRepeat}>Alterar</Button>}/>
        <div className="px-1 py-3"><div className="mb-2 flex items-center justify-between text-sm font-semibold"><span className="flex items-center gap-2"><Volume2 className="size-4 text-primary"/> Volume</span><span>{Math.round(p.prefs.volume * 100)}%</span></div><Slider value={[p.prefs.volume * 100]} max={100} step={1} onValueChange={([v]) => p.setVolume((v ?? 80) / 100)} aria-label="Volume do player"/></div>
        <SettingRow icon={Gauge} title="Velocidade da reprodução" detail="Ajuste disponível no controle de reprodução" control={<Link to="/player" className="text-xs font-bold text-primary">Player ›</Link>}/>
        <SettingRow icon={Timer} title="Timer / desligar automático" control={<Link to="/player" className="text-xs font-bold text-primary">Abrir ›</Link>}/>
      </Group>
      <Group icon={FolderOpen} title="Biblioteca e organização">
        <SettingRow icon={Music2} title="Gerenciar músicas" control={<Link to="/biblioteca" className="text-xs font-bold text-primary">Abrir ›</Link>}/>
        <SettingRow icon={Video} title="Gerenciar vídeos" control={<Link to="/videos" className="text-xs font-bold text-primary">Abrir ›</Link>}/>
        <SettingRow icon={FolderOpen} title="Gerenciar pastas e cantores" control={<Link to="/pastas" className="text-xs font-bold text-primary">Abrir ›</Link>}/>
        <SettingRow icon={ListMusic} title="Gerenciar playlists" control={<Link to="/playlists" className="text-xs font-bold text-primary">Abrir ›</Link>}/>
        <SettingRow icon={Download} title="Importar / baixar para offline" control={<Link to="/importar" className="text-xs font-bold text-primary">Importar ›</Link>}/>
      </Group>
      <Group icon={Palette} title="Aparência e tema">
        <SettingRow icon={Moon} title="Tema escuro" detail="Interface preta com neon verde" control={<Switch checked={p.prefs.theme === "dark"} onCheckedChange={v => p.setTheme(v ? "dark" : "light")} aria-label="Tema escuro"/>}/>
        <SettingRow icon={Sparkles} title="Animação do visualizador" control={toggle("visualizer","Visualizador animado")}/>
        <SettingRow icon={Palette} title="Animações da interface" control={toggle("animations","Animações da interface")}/>
        <SettingRow icon={AudioLines} title="Visualizador de áudio" control={toggle("visualizer","Visualizador de áudio")}/>
        <SettingRow icon={BookOpen} title="Letras / karaokê" detail="Mostrar opção de letras quando disponíveis" control={toggle("lyrics","Letras e karaokê")}/>
      </Group>
      <Group icon={Bell} title="Notificações e controles">
        <SettingRow icon={Bell} title="Notificações de música" control={toggle("musicNotifications","Notificações de música")}/>
        <SettingRow icon={Video} title="Notificações de vídeo" control={toggle("videoNotifications","Notificações de vídeo")}/>
        <SettingRow icon={Smartphone} title="Controles na tela bloqueada" detail={hydrated && "mediaSession" in navigator ? "Controles de mídia disponíveis" : "Dependente do suporte Android/navegador"} control={toggle("lockControls","Controles de tela bloqueada")}/>
        <SettingRow icon={Bluetooth} title="Bluetooth" detail="Use controles do dispositivo quando suportados" control={toggle("bluetooth","Bluetooth")}/>
        <SettingRow icon={Wifi} title="Abrir player automaticamente" control={toggle("autoOpenPlayer","Abrir player automaticamente")}/>
      </Group>
      <Group icon={Sparkles} title="Recursos especiais">
        <SettingRow icon={BookOpen} title="Letra da música" control={toggle("lyrics","Letra da música")}/>
        <SettingRow icon={AudioLines} title="Visualização musical" control={toggle("visualizer","Visualização musical")}/>
        <SettingRow icon={Download} title="Manter músicas offline" detail="Arquivos locais continuam disponíveis sem internet" control={toggle("offlineDownloads","Músicas offline")}/>
        <SettingRow icon={Smartphone} title="Widget e atalhos" control={<Link to="/" className="text-xs font-bold text-primary">Início ›</Link>}/>
      </Group>
      <Group icon={Database} title="Armazenamento">
        <div className="rounded-xl bg-background/70 p-3"><p className="text-sm font-bold">Uso do armazenamento do navegador</p><div className="my-2 h-2.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{width: storage?.quota ? Math.min(100, (storage.usage/storage.quota)*100)+"%" : "0%"}}/></div><p className="text-xs text-muted-foreground">{storage ? fmt(storage.usage)+" usados de "+fmt(storage.quota) : "Calculando uso…"}{persistent !== null ? " · "+(persistent ? "armazenamento persistente" : "armazenamento padrão") : ""}</p></div>
        <div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => void requestPersistentStorage().then(v => { setPersistent(v); toast(v ? "Armazenamento persistente autorizado." : "O aparelho não concedeu armazenamento persistente."); })}><HardDrive className="size-4"/> Proteger armazenamento</Button><Button size="sm" variant="outline" onClick={() => void clearCache()}><Trash2 className="size-4"/> Limpar cache</Button></div>
        <p className="mt-2 text-xs text-muted-foreground">Limpar cache remove apenas cache temporário do site; não apaga arquivos de áudio salvos na biblioteca.</p>
      </Group>
      <Group icon={Info} title="Sobre o aplicativo">
        <SettingRow icon={Info} title="Delícia Coxi’s Music & Video" detail="Biblioteca e player de música e vídeo" control={<span className="text-xs text-muted-foreground">Android / Web</span>}/>
        <SettingRow icon={CheckCircle2} title="Verificar atualizações" control={<button className="text-xs font-bold text-primary" onClick={() => toast.info("Você está usando a versão publicada mais recente disponível neste projeto.")}>Verificar</button>}/>
        <SettingRow icon={BookOpen} title="Privacidade e dados" control={<Link to="/privacidade" className="text-xs font-bold text-primary">Ler ›</Link>}/>
        <SettingRow icon={Settings2} title="Feito por Adevaldo Marques" detail="Configurações do aplicativo"/>
      </Group>
    </div>
    <Button variant="outline" className="w-full rounded-xl" onClick={restore}><RotateCcw className="size-4"/> Restaurar preferências principais</Button>
    <p className="text-center text-[11px] text-muted-foreground">Configurações locais são salvas neste dispositivo. Algumas funções dependem dos recursos do Android e do navegador.</p>
  </div>;
}
