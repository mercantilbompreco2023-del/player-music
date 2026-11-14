import type { CapacitorConfig } from "@capacitor/cli";

// O APK abre o app publicado (o app usa servidor, por isso não há pasta estática completa).
const config: CapacitorConfig = {
  appId: "app.lovable.playermusic",
  appName: "Player Music",
  webDir: "android-shell",
  server: { url: "https://player-music-app.lovable.app", cleartext: false },
  android: { backgroundColor: "#1c1d24" },
};

export default config;
