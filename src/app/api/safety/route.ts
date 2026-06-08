import { getSafetyBoundary, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  const safety = await getSafetyBoundary(user.id);

  return Response.json({ safety });
}
