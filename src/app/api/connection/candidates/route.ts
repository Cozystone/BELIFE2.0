import {
  getConnectionCandidateFilters,
  isBelifeApiError,
  requireUserForApi,
} from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const report = await getConnectionCandidateFilters(user.id);
    return Response.json({ report });
  } catch (error) {
    if (isBelifeApiError(error)) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    throw error;
  }
}
