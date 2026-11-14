import { createServerFn } from "@tanstack/react-start";
import { generateResponse, GatewayError } from "@lovable.dev/ai-gateway";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const requestSchema = z.object({ artist: z.string().trim().min(1).max(200) });

export const identifyArtistForPhoto = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => requestSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const response = await generateResponse({
        model: "openai/gpt-6-astra",
        input: data.artist,
        instructions: "Identifique o nome artístico público mais provável do cantor informado para localizar uma foto biográfica. Retorne somente JSON com canonicalName. Não invente nomes; se não for possível identificar, repita o texto recebido.",
        text: { format: { type: "json_schema", name: "artist_identity", strict: true, schema: { type: "object", additionalProperties: false, properties: { canonicalName: { type: "string" } }, required: ["canonicalName"] } } },
      });
      const raw = response.output.flatMap((item) => item.type === "message" ? item.content.flatMap((part) => part.type === "output_text" ? [part.text] : []) : []).join("");
      const parsed = z.object({ canonicalName: z.string().trim().min(1).max(200) }).parse(JSON.parse(raw));
      return { canonicalName: parsed.canonicalName, error: null };
    } catch (error) {
      return { canonicalName: data.artist, error: error instanceof GatewayError && error.httpStatus === 402 ? "A IA está sem créditos disponíveis." : "Não foi possível identificar o artista com IA." };
    }
  });
