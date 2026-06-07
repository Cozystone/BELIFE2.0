import { type NextRequest } from "next/server";
import { getMentalStateHistory, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  const requestedLimit = Number(request.nextUrl.searchParams.get("limit") ?? "12");
  const limit = Number.isFinite(requestedLimit) ? Math.max(1, Math.min(30, requestedLimit)) : 12;
  const history = await getMentalStateHistory(user.id, limit);

  return Response.json({ history });
}
