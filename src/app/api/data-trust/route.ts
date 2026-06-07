import { getDataTrustCenter, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  const center = await getDataTrustCenter(user.id);
  return Response.json(center);
}
