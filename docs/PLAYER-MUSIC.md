# Player Music — documentação do MVP web

> Este é um **aplicativo web (MVP)** para celular Android. **Não é um APK nativo.**

## 1. Executar e compilar
- Desenvolvimento: `bun install` e depois `bun run dev` (abre em http://localhost:8080).
- Produção: `bun run build`. No Lovable, use o botão **Publicar**.
- Testes: `bunx vitest run`.

## 2. Permissões e justificativa
| Permissão | Uso | Quando |
|---|---|---|
| Seleção de arquivos | Importar áudios escolhidos pelo usuário | Só ao tocar em "Importar músicas" |
| Armazenamento do navegador (IndexedDB/localStorage) | Guardar faixas, playlists, favoritos e preferências no aparelho | Sempre, no próprio aparelho |
| Media Session (controles de mídia) | Título e botões na notificação/tela de bloqueio | Quando o navegador suporta |
| Conta (opcional) | Acesso à administração | Só se o usuário criar conta |

Não pedimos localização, microfone, câmera, contatos nem notificações.

## 3. Modelo de dados
**No aparelho:** `pm:prefs:v1` (tema, volume, aleatório, repetir, favoritos, playlists, recentes) e o banco IndexedDB `player-music/files` (arquivos importados).

**No servidor (Lovable Cloud):**
- `app_cards`: `function_key` (fixo, define o destino), `title`, `description`, `icon`, `position`, `enabled`. Visitantes só leem os cartões ativos; só administradores alteram.
- `app_settings`: `home_greeting`, `demo_tracks_enabled`.
- `user_roles` + função `has_role`: papéis `admin`/`user`, separados do perfil.
- `profiles`: e-mail e nome (só o próprio usuário ou administradores veem).
- `admin_audit_log`: quem, quando e o que mudou. É gravado por gatilhos no banco e só administradores podem ler.
- Gatilho que **impede remover o último administrador**.

**Cartões → funções** (`src/lib/cards.ts`): descobrir, player, buscar, biblioteca, importar, playlists, favoritos, fila, configuracoes, admin. O destino vem sempre da função, nunca do nome.

## 4. Segurança
- Senhas guardadas pelo serviço de login (com hash), nunca em texto puro. Login por e-mail/senha, Google ou Lovable. Recuperação por link no e-mail.
- Toda autorização é feita no servidor por regras no banco. Esconder a tela é só conforto visual.
- Não há senha fixa, rota secreta nem atalho escondido.

## 5. Criar o primeiro administrador (procedimento seguro)
1. Crie uma conta normal em **Entrar → Criar uma conta** e confirme pelo e-mail.
2. Peça no chat do Lovable: "tornar <seu e-mail> administrador". O dono do projeto adiciona a linha `admin` em `user_roles` direto no banco.
3. Depois disso, o próprio administrador concede ou remove acessos em **Administração → Usuários**.

## 6. Testes
- `src/test/music-queue.test.ts`: fila, aleatório, repetir, reordenar, busca e leitura do nome do arquivo.
- `src/test/cards.test.ts`: cada cartão abre uma página que existe, ordem, ativar/desativar, renomear sem mudar o destino, cartão de administração escondido para usuários comuns, validação.
- Verificação do servidor: visitante e usuário comum **não conseguem** alterar cartões, se tornar administrador nem ler registros.

## 7. Segundo plano — limitações
O navegador ou o Android podem pausar ou encerrar a página (economia de bateria, muito tempo em segundo plano). Não há garantia de que a música continue tocando com a tela desligada. Para uma reprodução confiável é preciso um **app Android nativo** com serviço de mídia (MediaSessionService/ExoPlayer), *foreground service* do tipo `mediaPlayback` e notificação permanente, com as permissões oficiais `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK` e `POST_NOTIFICATIONS` (Android 13 ou mais novo), concedidas pelo usuário.

## 8. Dados de demonstração
São 3 faixas ("Aurora Sintética", "Pulso Noturno" e "Maré Calma"), composições originais sintetizadas para este app e liberadas em **CC0**. Aparecem com o selo **DEMO** e podem ser desativadas pelo administrador.

## 9. O que falta
- **Catálogo licenciado:** contrato com um distribuidor ou serviço e implementação de um `CatalogProvider` (`src/lib/music/catalog.ts`) no servidor, com as chaves guardadas em Secrets.
- **Sincronização online** de playlists e favoritos entre aparelhos: tabelas por usuário com regras de acesso. Ainda não existe.
- **APK nativo:** um projeto Android (Kotlin/Media3 ou Capacitor com plugin de mídia nativo) com o serviço de mídia descrito no item 7.
