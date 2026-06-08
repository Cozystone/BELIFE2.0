import {
  acceptProfileEnrichment,
  dismissProfileEnrichment,
  getProfileEnrichmentSuggestions,
  profileEnrichmentSchema,
  requireUserForApi,
} from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  const suggestions = await getProfileEnrichmentSuggestions(user.id);
  return Response.json({ suggestions });
}

export async function POST(request: Request) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const input = profileEnrichmentSchema.parse(await request.json());
    const result = await acceptProfileEnrichment(user.id, input.id);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "프로필 보강을 반영하지 못했습니다." },
      { status: 400 },
    );
  }
}

export async function DELETE(request: Request) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const input = profileEnrichmentSchema.parse(await request.json());
    const result = await dismissProfileEnrichment(user.id, input.id);
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "프로필 보강을 건너뛰지 못했습니다." },
      { status: 400 },
    );
  }
}
