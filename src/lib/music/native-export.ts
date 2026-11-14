import { Capacitor, registerPlugin } from "@capacitor/core";

interface LibraryExportPlugin {
  save(options: { csv: string }): Promise<{ cancelled: boolean }>;
}

export const nativeExport = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android"
  ? registerPlugin<LibraryExportPlugin>("LibraryExport")
  : null;