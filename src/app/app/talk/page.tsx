import { VoiceConsole } from "@/components/app/voice-console";
import type { ConversationSummary } from "@/lib/engines/types";
import { requireUserForPage } from "@/lib/server/belife-service";
import { getStore } from "@/lib/server/store";
import { cn } from "@/lib/utils";
import { MessageCircle, Plus } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

type TalkPageProps = {
  searchParams?: Promise<{
    conversation?: string | string[];
    draft?: string | string[];
  }>;
};

function requestedConversationId(params: { conversation?: string | string[] } | undefined) {
  const value = Array.isArray(params?.conversation) ? params?.conversation[0] : params?.conversation;
  if (!value || value === "new" || value.startsWith("/") || value.length > 80) return null;
  return value;
}

function requestedDraft(params: { draft?: string | string[] } | undefined) {
  const value = Array.isArray(params?.draft) ? params?.draft[0] : params?.draft;
  return value ? value.slice(0, 600) : "";
}

function formatConversationTime(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function ConversationRail({
  conversations,
  selectedConversationId,
  fresh,
}: {
  conversations: ConversationSummary[];
  selectedConversationId: string | null;
  fresh: boolean;
}) {
  return (
    <section className="mb-3 rounded-md border border-white/[0.08] bg-[#090909] p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <MessageCircle className="h-4 w-4 text-orange-300" />
          대화 기록
        </div>
        <Link
          href="/app/talk?conversation=new"
          className={cn(
            "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-xs font-medium transition",
            fresh
              ? "border-orange-400/40 bg-orange-500/15 text-orange-100"
              : "border-white/10 bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]",
          )}
        >
          <Plus className="h-3.5 w-3.5" />
          새 대화
        </Link>
      </div>
      {conversations.length ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {conversations.map((conversation) => {
            const active = conversation.id === selectedConversationId && !fresh;
            return (
              <Link
                key={conversation.id}
                href={`/app/talk?conversation=${conversation.id}`}
                className={cn(
                  "min-w-[13rem] rounded-md border p-3 text-left transition",
                  active
                    ? "border-orange-400/40 bg-orange-500/15 text-orange-50"
                    : "border-white/[0.08] bg-white/[0.04] text-zinc-300 hover:bg-white/[0.08]",
                )}
              >
                <div className="line-clamp-1 text-sm font-medium">{conversation.title}</div>
                <div className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{conversation.preview}</div>
                <div className="mt-2 text-[11px] text-zinc-600">
                  {conversation.messageCount} messages · {formatConversationTime(conversation.updatedAt)}
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-white/[0.08] bg-white/[0.04] p-3 text-sm text-zinc-500">
          아직 저장된 대화가 없습니다.
        </div>
      )}
    </section>
  );
}

export default async function TalkPage({ searchParams }: TalkPageProps) {
  const user = await requireUserForPage();
  const store = getStore();
  const params = searchParams ? await searchParams : undefined;
  const requestedId = requestedConversationId(params);
  const initialDraft = requestedDraft(params);
  const wantsFreshConversation = params?.conversation === "new";
  const [conversations, latestConversationId] = await Promise.all([
    store.getConversationSummaries(user.id, 12),
    store.getLatestConversationId(user.id),
  ]);
  const requestedBelongsToUser = requestedId ? await store.conversationBelongsToUser(requestedId, user.id) : false;
  const selectedConversationId = wantsFreshConversation
    ? null
    : requestedBelongsToUser
      ? requestedId
      : latestConversationId;
  const messages = selectedConversationId ? await store.getConversationMessages(selectedConversationId, user.id, 20) : [];

  return (
    <>
      <ConversationRail
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        fresh={wantsFreshConversation || !selectedConversationId}
      />
      <VoiceConsole
        key={selectedConversationId ?? "fresh"}
        initialMessages={messages}
        initialConversationId={selectedConversationId}
        initialDraft={initialDraft}
      />
    </>
  );
}
