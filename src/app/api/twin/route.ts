import { z } from "zod";
import { getTwinAnswer, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

const twinSchema = z.object({
  question: z.string().min(1).max(1200),
});

export async function POST(request: Request) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const { question } = twinSchema.parse(await request.json());
    const answer = await getTwinAnswer(user.id, question);
    return Response.json({ answer });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Invalid twin request" }, { status: 400 });
  }
}
