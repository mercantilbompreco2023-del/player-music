import type { CapacitorConfig } from "@capacitor/cli";

// O APK carrega a interface empacotada localmente, sem redirecionar para um site.
const config: CapacitorConfig = {
  appId: "app.lovable.playermusic",
  appName: "Player Music",
  webDir: ".output/public",
  android: { backgroundColor: "#1c1d24" },
};

export default config;
