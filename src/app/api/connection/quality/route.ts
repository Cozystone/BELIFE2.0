import { type NextRequest } from "next/server";
import { getConnectionQuality, isBelifeApiError, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const personLabel = request.nextUrl.searchParams.get("personLabel") ?? undefined;
    const report = await getConnectionQuality(user.id, personLabel);
    return Response.json({ report });
  } catch (error) {
    if (isBelifeApiError(error)) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    throw error;
  }
}
