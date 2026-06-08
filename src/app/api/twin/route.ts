import { z } from "zod";
import { getTwinReflection, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

const twinSchema = z.object({
  question: z.string().min(1).max(1200),
});

export async function POST(request: Request) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const { question } = twinSchema.parse(await request.json());
    const reflection = await getTwinReflection(user.id, question);
    return Response.json({ answer: reflection.answer, reflection });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "트윈 요청 형식을 확인해 주세요." }, { status: 400 });
  }
}
