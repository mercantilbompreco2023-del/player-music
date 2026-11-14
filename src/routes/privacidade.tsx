import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/music/AppShell";

export const Route = createFileRoute("/privacidade")({
  head: () => ({
    meta: [
      { title: "Privacidade — Player Music" },
      { name: "description", content: "Quais dados o Player Music usa e por quê." },
      { property: "og:title", content: "Privacidade — Player Music" },
      { property: "og:description", content: "Quais dados o Player Music usa e por quê." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PrivPage,
});

function PrivPage() {
  return (
    <div className="space-y-4 text-sm">
      <PageHeader title="Privacidade" />
      <section className="space-y-2 rounded-2xl bg-card p-4">
        <h2 className="text-lg font-bold">No seu aparelho</h2>
        <p className="text-muted-foreground">Músicas importadas, favoritos, playlists, fila, histórico, volume e tema ficam guardados apenas no navegador deste aparelho. Eles não são enviados para nenhum servidor. Limpar os dados do navegador apaga essas informações.</p>
      </section>
      <section className="space-y-2 rounded-2xl bg-card p-4">
        <h2 className="text-lg font-bold">Conta (opcional)</h2>
        <p className="text-muted-foreground">Para ouvir música não é preciso conta. Se você criar uma, guardamos só o e-mail e o seu nível de acesso (usuário comum ou administrador). As senhas são guardadas de forma criptografada pelo serviço de login, nunca em texto puro. A conexão é sempre protegida (HTTPS).</p>
        <p className="text-muted-foreground">Ações de administradores (mudar cartões, ajustes ou permissões) ficam registradas com o e-mail, a data e a ação, para segurança.</p>
      </section>
      <section className="space-y-2 rounded-2xl bg-card p-4">
        <h2 className="text-lg font-bold">Permissões usadas</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li><b>Escolher arquivos:</b> só quando você toca em “Importar músicas”, e só os arquivos que você selecionar.</li>
          <li><b>Controles de mídia:</b> exibe título e botões na notificação/tela de bloqueio, quando o navegador permite.</li>
          <li>Não pedimos localização, microfone, contatos, câmera nem notificações.</li>
        </ul>
      </section>
    </div>
  );
}
