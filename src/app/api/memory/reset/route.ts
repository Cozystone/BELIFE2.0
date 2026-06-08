import { z } from "zod";
import { requireUserForApi, resetBelifeMemory } from "@/lib/server/belife-service";

export const runtime = "nodejs";

const resetSchema = z.object({
  confirmation: z.literal("RESET"),
});

export async function POST(request: Request) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    resetSchema.parse(await request.json());
    const result = await resetBelifeMemory(user);
    return Response.json(result);
  } catch {
    return Response.json(
      { error: "BELIFE 기억을 초기화하려면 RESET을 입력해 주세요." },
      { status: 400 },
    );
  }
}
