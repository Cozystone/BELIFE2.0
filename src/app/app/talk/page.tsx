import { VoiceConsole } from "@/components/app/voice-console";
import { requireUserForPage } from "@/lib/server/belife-service";
import { getStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export default async function TalkPage() {
  const user = await requireUserForPage();
  const store = getStore();
  const latestConversationId = await store.getLatestConversationId(user.id);
  const messages = latestConversationId ? await store.getConversationMessages(latestConversationId, user.id, 20) : [];
  return <VoiceConsole initialMessages={messages} initialConversationId={latestConversationId} />;
}
