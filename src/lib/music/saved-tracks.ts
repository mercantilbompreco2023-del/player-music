import type { Track } from "./types";

/** A local audio copy takes precedence over its remote counterpart. */
export function mergeSavedTracks(local: Track[], cloud: Track[]): Track[] {
  return [...local, ...cloud.filter((remote) => !local.some((track) =>
    track.id === remote.id ||
    (!!track.storagePath && track.storagePath === remote.storagePath) ||
    (!!track.fingerprint && track.fingerprint === remote.fingerprint),
  ))];
}