import { memoryCorrectionSchema, requireUserForApi, saveMemoryCorrection } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const result = await saveMemoryCorrection(user, memoryCorrectionSchema.parse(await request.json()));
    return Response.json(result);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "기억 정정을 저장하지 못했습니다." },
      { status: 400 },
    );
  }
}
