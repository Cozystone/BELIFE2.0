import { handleConversationMessage, isBelifeApiError, messageSchema, requireUserForApi } from "@/lib/server/belife-service";

export const runtime = "nodejs";

export async function POST(request: Request, segmentData: { params: Promise<{ id: string }> }) {
  const { user, response } = await requireUserForApi();
  if (!user) return response;

  try {
    const { id } = await segmentData.params;
    const body = await request.json();
    const message = messageSchema.parse(body);
    const result = await handleConversationMessage({
      user,
      conversationId: id,
      content: message.content,
      source: message.source,
    });

    return Response.json(result);
  } catch (error) {
    if (isBelifeApiError(error)) {
      return Response.json({ error: error.message, code: error.code }, { status: error.status });
    }

    return Response.json(
      { error: error instanceof Error ? error.message : "Unable to process message" },
      { status: 400 },
    );
  }
}
