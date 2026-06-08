import { type NextRequest } from "next/server";
import {
  getRelationshipMemory,
  isBelifeApiError,
  relationshipMemorySchema,
  requireUserForApi,
  saveRelationshipMemory,
} from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const personLabel = request.nextUrl.searchParams.get("personLabel") ?? undefined;
    const report = await getRelationshipMemory(user.id, personLabel);
    return Response.json({ report });
  } catch (error) {
    if (isBelifeApiError(error)) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    throw error;
  }
}

export async function POST(request: Request) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const result = await saveRelationshipMemory(user, relationshipMemorySchema.parse(await request.json()));
    return Response.json(result);
  } catch (error) {
    if (isBelifeApiError(error)) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }
    return Response.json(
      { error: error instanceof Error ? error.message : "관계 기억을 저장하지 못했습니다." },
      { status: 400 },
    );
  }
}
