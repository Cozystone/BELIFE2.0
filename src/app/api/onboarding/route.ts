import { onboardingSchema, requireUserForApi, saveOnboarding } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const body = await request.json();
    const answers = onboardingSchema.parse(body);
    const profile = await saveOnboarding(user, answers);
    return Response.json({ profile });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "온보딩 입력 형식을 확인해 주세요." },
      { status: 400 },
    );
  }
}
