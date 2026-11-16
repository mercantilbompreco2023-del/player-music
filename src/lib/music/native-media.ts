import { Capacitor, registerPlugin, type PluginListenerHandle } from "@capacitor/core";

export type NativeAction = "play" | "pause" | "next" | "previous";

interface MediaPlaybackPlugin {
  update(o: { title: string; artist: string; isPlaying: boolean; position: number; duration: number; artworkBase64?: string; artworkMime?: string }): Promise<void>;
  stop(): Promise<void>;
  addListener(e: "action", cb: (d: { action: NativeAction }) => void): Promise<PluginListenerHandle>;
}

/** Serviço de mídia nativo; só existe dentro do APK Android. */
export const nativeMedia = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android"
  ? registerPlugin<MediaPlaybackPlugin>("MediaPlayback")
  : null;
