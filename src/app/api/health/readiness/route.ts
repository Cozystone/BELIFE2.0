import { getReadinessReport } from "@/lib/server/readiness";
import { getOllamaHealth } from "@/lib/ai/ollama";

export const runtime = "nodejs";

export async function GET() {
  const ollamaHealth = await getOllamaHealth();
  return Response.json(getReadinessReport({ ollamaHealth }));
}
