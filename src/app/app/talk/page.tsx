import { VoiceConsole } from "@/components/app/voice-console";
import { requireUserForPage } from "@/lib/server/belife-service";
import { getStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export default async function TalkPage() {
  const user = await requireUserForPage();
  const store = getStore();
  const [messages, latestConversationId] = await Promise.all([
    store.getRecentMessages(user.id, 20),
    store.getLatestConversationId(user.id),
  ]);
  return <VoiceConsole initialMessages={messages} initialConversationId={latestConversationId} />;
}
