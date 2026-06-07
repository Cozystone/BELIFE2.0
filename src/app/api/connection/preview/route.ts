import { getConnectionPreview, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  const preview = await getConnectionPreview(user.id);
  return Response.json({ preview });
}
