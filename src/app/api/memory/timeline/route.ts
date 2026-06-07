import { type NextRequest } from "next/server";
import { getMemoryTimeline, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? "24");
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(60, requestedLimit)) : 24;
  const timeline = await getMemoryTimeline(user.id, limit);

  return Response.json({ timeline });
}
