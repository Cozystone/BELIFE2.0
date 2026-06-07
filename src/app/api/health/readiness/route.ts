import { getReadinessReport } from "@/lib/server/readiness";

export const runtime = "nodejs";

export async function GET() {
  return Response.json(getReadinessReport());
}
