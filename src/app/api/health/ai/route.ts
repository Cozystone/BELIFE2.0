import { getOllamaHealth, getOllamaModel } from "@/lib/ai/ollama";
import { hasDatabaseUrl } from "@/lib/db/client";
import { isClerkConfigured } from "@/lib/server/auth";
import { isNativeAuthAvailable } from "@/lib/server/native-auth";

export const runtime = "nodejs";

export async function GET() {
  const ollama = await getOllamaHealth();
  return Response.json({
    ollama,
    model: {
      chat: getOllamaModel("chat"),
      extractor: getOllamaModel("extractor"),
    },
    storage: hasDatabaseUrl() ? "neon-postgres" : "demo-memory",
    auth: isClerkConfigured() ? "clerk" : isNativeAuthAvailable() ? "native" : "demo",
  });
}
