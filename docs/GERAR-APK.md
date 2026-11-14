# Como gerar o APK do Player Music

O APK abre o app publicado (https://player-music-app.lovable.app) dentro de um aplicativo Android.
Precisa de internet na primeira abertura. A música pode parar com a tela desligada (veja docs/PLAYER-MUSIC.md, item 7).

## Você precisa
- Um computador com **Node.js** (ou Bun) e o **Android Studio** instalados.

## Passo a passo
1. Extraia o ZIP do projeto e abra um terminal dentro da pasta.
2. `npm install`
3. A pasta `android/` já está incluída; não execute `cap add android` novamente.
4. `npx cap sync android`
5. `npx cap open android` (abre o Android Studio)
6. No Android Studio: **Build → Build Bundle(s) / APK(s) → Build APK(s)**.
7. O arquivo fica em `android/app/build/outputs/apk/debug/app-debug.apk`. Envie para o celular e instale
   (o Android pede para permitir "instalar apps desconhecidos").

## Para a Play Store
Use **Build → Generate Signed Bundle / APK**, crie sua chave de assinatura e guarde-a em local seguro (nunca no projeto).

## Versão nativa (incluída)
O APK tem um serviço de mídia Android (`android/app/src/main/java/.../MediaPlaybackService.java`):
- serviço em primeiro plano do tipo `mediaPlayback` com notificação de mídia (anterior, tocar/pausar, próxima);
- controles na tela bloqueada e nos fones Bluetooth (MediaSession);
- mantém o processo e a CPU ativos enquanto toca.
Permissões: `FOREGROUND_SERVICE`, `FOREGROUND_SERVICE_MEDIA_PLAYBACK`, `POST_NOTIFICATIONS` (pedida ao tocar a primeira música, Android 13+), `WAKE_LOCK`.
Limite: economizadores de bateria muito agressivos de alguns fabricantes ainda podem fechar apps; nesse caso, marque o Player Music como "sem restrição" nas configurações de bateria.

## Pastas e permissões (atualização v10)
A seleção solicita acesso persistente somente para leitura da pasta escolhida pelo usuário. Na abertura, o aplicativo verifica as permissões mantidas pelo Android. Se forem revogadas, solicita que a pessoa escolha a pasta novamente; não tenta conceder permissões automaticamente. As músicas importadas são cópias no armazenamento local e continuam disponíveis enquanto os dados do aplicativo não forem apagados.

O APK v3 (versionCode 3, versionName 1.3) foi compilado como release com Java 21 e Android SDK 36 e assinado com uma nova chave autorizada pelo usuário. A verificação da assinatura passou; o certificado é diferente do APK v2. NÃO é uma atualização compatível com a instalação anterior. Não desinstale o aplicativo antigo antes de guardar os arquivos originais de áudio; a exportação CSV salva apenas a lista, não as músicas. A importação, exportação nativa e restauração de acesso ainda precisam de teste em aparelho Android físico.

## Assinatura nova e ícone (v11)
O pacote privado `player-music-assinatura_v1.zip` contém a chave e suas credenciais. Guarde em local seguro, separado do código; nunca publique ou inclua nos ZIPs do projeto. Todas as próximas versões desta assinatura precisam usar essa mesma chave. Para assinar uma compilação release no Android Studio, selecione essa chave e o alias informado no pacote privado. O APK agora usa o novo ícone de fones com símbolo de reprodução, também aplicado ao favicon e à marca no aplicativo web.

No Android, a exportação usa `ACTION_CREATE_DOCUMENT` por meio do plugin `LibraryExport`, permitindo escolher onde salvar o CSV sem depender de downloads de URLs blob no WebView. A playlist por estilo precisa de internet e login; o APK continua abrindo o aplicativo publicado, não é uma versão totalmente offline. A publicação das mudanças foi solicitada nesta entrega.

## Exportação e playlists por estilo
Na Biblioteca, “Exportar lista da biblioteca” gera um CSV de metadados; não transfere os áudios nem restaura automaticamente uma biblioteca em outro aparelho. Em Playlists, uma pessoa conectada pode enviar descrição, títulos e artistas para a IA, visualizar a seleção e salvá-la. Os arquivos de áudio e URLs privadas não são enviados.
