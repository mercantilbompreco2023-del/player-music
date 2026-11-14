import type { CapacitorConfig } from "@capacitor/cli";

// Preserve a origem publicada para manter os dados das instalações existentes.
const config: CapacitorConfig = {
  appId: "app.lovable.playermusic",
  appName: "Player Music",
  webDir: "android-shell",
  server: { url: "https://player-music-app.lovable.app", cleartext: false },
  android: { backgroundColor: "#1c1d24" },
};

export default config;
