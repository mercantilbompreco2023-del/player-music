import { Capacitor, registerPlugin } from "@capacitor/core";
import { audioMime } from "./import";

export interface DeviceTrack {
  uri: string;
  name: string;
  artist: string;
  album: string;
  duration: number;
  size: number;
}

interface MediaScanPlugin {
  scan(): Promise<{ files: DeviceTrack[]; limit: number }>;
  read(o: { uri: string }): Promise<{ data: string }>;
}

/** Busca na biblioteca de mídia do Android; só existe dentro do APK. */
export const nativeScan = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android"
  ? registerPlugin<MediaScanPlugin>("MediaScan")
  : null;

/** Lê uma música encontrada e devolve como arquivo pronto para importar. */
export async function readDeviceFile(t: DeviceTrack): Promise<File> {
  if (!nativeScan) throw new Error("Busca Android indisponível");
  const { data } = await nativeScan.read({ uri: t.uri });
  const bin = atob(data);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new File([bytes], t.name, { type: audioMime(t.name, "audio/mpeg") });
}

/** Nome curto para exibir na lista (sem a extensão). */
export function deviceTrackLabel(t: DeviceTrack): string {
  const base = t.name.replace(/\.[a-z0-9]{2,5}$/i, "");
  return base || t.name;
}
