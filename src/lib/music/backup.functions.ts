import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Metadados de uma faixa no backup — nunca URL de reprodução, token ou áudio. */
const trackSchema = z.object({
  title: z.string().min(1).max(300),
  artist: z.string().min(1).max(300),
  duration: z.number().finite().nonnegative().optional(),
  fingerprint: z.string().min(1).max(200).optional(),
  path: z.string().max(1000).optional(),
  folderName: z.string().max(300).optional(),
  source: z.enum(["local", "cloud"]),
});

export const backupPayloadSchema = z.object({
  version: z.literal(1),
  savedAt: z.number().int().nonnegative(),
  tracks: z.array(trackSchema).max(5000),
  playlists: z.array(z.object({
    id: z.string().min(1).max(200),
    name: z.string().min(1).max(200),
    trackIds: z.array(z.string().max(200)).max(5000),
    createdAt: z.number().int().nonnegative(),
  })).max(500),
  favorites: z.array(z.string().max(200)).max(5000),
});

export type BackupInput = z.infer<typeof backupPayloadSchema>;

/** Grava a lista do próprio usuário (uma linha por conta). */
export const saveLibraryBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => ({ payload: backupPayloadSchema.parse(input) }))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("library_backups")
      .upsert({ user_id: context.userId, payload: data.payload, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
    if (error) return { ok: false, error: "Não foi possível salvar sua lista agora. Tente de novo." };
    return { ok: true, error: null };
  });

/** Lê a lista guardada na conta do usuário. */
export const loadLibraryBackup = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("library_backups")
      .select("payload, updated_at")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) return { payload: null, updatedAt: null, error: "Não foi possível consultar sua lista agora." };
    if (!data) return { payload: null, updatedAt: null, error: null };
    const parsed = backupPayloadSchema.safeParse(data.payload);
    if (!parsed.success) return { payload: null, updatedAt: null, error: "A lista guardada está em um formato antigo. Salve de novo." };
    return { payload: parsed.data as BackupInput, updatedAt: data.updated_at as string, error: null };
  });
