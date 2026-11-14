# Como gerar o APK do Player Music

O APK abre o app publicado (https://player-music-app.lovable.app) dentro de um aplicativo Android.
Precisa de internet na primeira abertura. A música pode parar com a tela desligada (veja docs/PLAYER-MUSIC.md, item 7).

## Você precisa
- Um computador com **Node.js** (ou Bun) e o **Android Studio** instalados.

## Passo a passo
1. Extraia o ZIP do projeto e abra um terminal dentro da pasta.
2. `npm install`
3. `npx cap add android` (só na primeira vez)
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
