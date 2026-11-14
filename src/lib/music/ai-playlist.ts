import { z } from "zod";

export const playlistRequest = z.object({
  mood: z.string().trim().min(2).max(500),
  tracks: z.array(z.object({ id: z.string().max(200), title: z.string().max(300), artist: z.string().max(300) })).min(1).max(500),
});
export const playlistSelection = z.object({ name: z.string().trim().min(1).max(100), trackIds: z.array(z.string()).max(50) });
export function verifiedSelection(value: unknown, tracks: { id: string }[]) {
  const selection = playlistSelection.parse(value);
  const allowed = new Set(tracks.map((t) => t.id));
  return { name: selection.name, trackIds: [...new Set(selection.trackIds)].filter((id) => allowed.has(id)) };
}