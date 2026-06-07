import { refreshDataTrust, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  const dataTrust = await refreshDataTrust(user.id);
  return Response.json({ dataTrust });
}
