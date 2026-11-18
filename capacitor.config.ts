import type { CapacitorConfig } from "@capacitor/cli";

// O APK usa os arquivos web compilados junto com o app.
// Não apontar para o site remoto: isso fazia o APK abrir a interface antiga.
const config: CapacitorConfig = {
  appId: "app.lovable.playermusic",
  appName: "Player Music",
  webDir: ".output/public",
  android: { backgroundColor: "#080d0a" },
};

export default config;
