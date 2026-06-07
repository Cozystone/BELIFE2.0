import { createConversation, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function POST() {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  const conversationId = await createConversation(user.id);
  return Response.json({ conversationId });
}
