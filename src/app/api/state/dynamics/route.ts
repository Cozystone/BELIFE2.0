import { type NextRequest } from "next/server";
import { getMentalStateDynamics, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(requestedLimit) ? Math.max(2, Math.min(40, requestedLimit)) : 20;
  const dynamics = await getMentalStateDynamics(user.id, limit);

  return Response.json({ dynamics });
}
