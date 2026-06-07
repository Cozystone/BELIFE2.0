import { exportBelifeData, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  const data = await exportBelifeData(user.id);
  return Response.json(data, {
    headers: {
      "Content-Disposition": `attachment; filename="belife-export-${user.id}.json"`,
    },
  });
}
