import {
  getPrivacyPreferences,
  privacyPreferencesSchema,
  requireUserForApi,
  updatePrivacyPreferences,
} from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function GET() {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  const preferences = await getPrivacyPreferences(user.id);
  return Response.json({ preferences });
}

export async function POST(request: Request) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const result = await updatePrivacyPreferences(user, privacyPreferencesSchema.parse(await request.json()));
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to update privacy preferences." },
      { status: 400 },
    );
  }
}
