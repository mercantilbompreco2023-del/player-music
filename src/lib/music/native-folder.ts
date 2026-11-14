import { Capacitor, registerPlugin } from "@capacitor/core";
import { audioMime } from "./import";

export interface NativeFile { uri: string; path: string; name: string; type: string; size: number }
interface FolderPickerPlugin {
  pick(): Promise<{ name: string; files: NativeFile[] }>;
  read(o: { uri: string }): Promise<{ data: string }>;
  restore(): Promise<{ folders: { name: string; granted: boolean }[] }>;
}

/** Seletor de pasta nativo; só existe dentro do APK Android. */
export const nativeFolder = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android"
  ? registerPlugin<FolderPickerPlugin>("FolderPicker")
  : null;

export async function readNativeFile(f: NativeFile): Promise<File> {
  if (!nativeFolder) throw new Error("Seletor Android indisponível");
  const { data } = await nativeFolder.read({ uri: f.uri });
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], f.name, { type: audioMime(f.name, f.type) });
}
