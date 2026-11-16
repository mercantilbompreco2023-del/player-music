import { Capacitor, registerPlugin } from "@capacitor/core";
export interface PhoneAudioTrack { uri: string; name: string; title?: string; artist?: string; album?: string; type: string; size: number }
interface PhoneMusicPlugin { list(): Promise<{ tracks: PhoneAudioTrack[] }>; read(options: { uri: string }): Promise<{ data: string }> }
export const phoneMusicLibrary = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android" ? registerPlugin<PhoneMusicPlugin>("PhoneMusicLibrary") : null;
export async function readPhoneAudio(track: PhoneAudioTrack): Promise<File> {
  if (!phoneMusicLibrary) throw new Error("A biblioteca do celular está disponível no APK Android.");
  const { data } = await phoneMusicLibrary.read({ uri: track.uri });
  const binary = atob(data); const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new File([bytes], track.name, { type: track.type || "audio/mpeg" });
}
