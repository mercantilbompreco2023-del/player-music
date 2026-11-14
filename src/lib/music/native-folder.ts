import { Capacitor, registerPlugin } from "@capacitor/core";

export interface NativeFile { uri: string; path: string; name: string; type: string; size: number }
interface FolderPickerPlugin {
  pick(): Promise<{ name: string; files: NativeFile[] }>;
  read(o: { uri: string }): Promise<{ data: string }>;
}

/** Seletor de pasta nativo; só existe dentro do APK Android. */
export const nativeFolder = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android"
  ? registerPlugin<FolderPickerPlugin>("FolderPicker")
  : null;

export async function readNativeFile(f: NativeFile): Promise<File> {
  const { data } = await nativeFolder!.read({ uri: f.uri });
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], f.name, { type: f.type });
}
