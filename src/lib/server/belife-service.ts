import { redirect } from "next/navigation";
import { z } from "zod";
import { ollamaGenerate } from "@/lib/ai/ollama";
import { buildStructuredExtraction } from "@/lib/ai/structured-extraction";
import { buildConnectionPreview } from "@/lib/engines/compatibility";
import { calculateDataTrust } from "@/lib/engines/data-trust";
import { estimateMentalState } from "@/lib/engines/mental-state";
import { filterOntologyView } from "@/lib/engines/ontology";
import { buildProfileEnrichmentSuggestions, findProfileEnrichmentSuggestion } from "@/lib/engines/profile-enrichment";
import type {
  BelifeUser,
  Briefing,
  ConversationMessage,
  MessageSource,
  OnboardingAnswers,
  OntologyNode,
  ProfileEnrichmentSuggestion,
  UserProfile,
} from "@/lib/engines/types";
import { compactText, isoNow } from "@/lib/utils";
import { getBelifeUser } from "./auth";
import { getStore } from "./store";

export const onboardingSchema = z.object({
  nickname: z.string().min(1).max(40),
  role: z.string().max(80).default(""),
  mainWorry: z.string().min(1).max(280),
  currentGoal: z.string().min(1).max(280),
  importantValue: z.string().min(1).max(160),
  stressReaction: z.string().min(1).max(220),
  emotionalClimate: z.string().min(1).max(220),
  preferredTone: z.string().min(1).max(80),
  relationshipHope: z.string().min(1).max(220),
});

export const messageSchema = z.object({
  content: z.string().min(1).max(4000),
  source: z.enum(["text", "voice"]).default("text"),
});

export const profileEnrichmentSchema = z.object({
  id: z.string().min(1).max(220),
});

export async function requireUserForPage(): Promise<BelifeUser> {
  const user = await getBelifeUser();
  if (!user) redirect("/sign-in");
  return user;
}

export async function requireUserForApi() {
  const user = await getBelifeUser();
  if (!user) {
    return {
      user: null,
      response: Response.json(
        {
          error: "Unauthorized",
          code: "AUTH_REQUIRED",
          redirectTo: "/sign-in",
        },
        { status: 401 },
      ),
    };
  }
  return { user, response: null };
}

export async function ensureUserProfile(user: BelifeUser) {
  return getStore().ensureProfile(user);
}

export async function saveOnboarding(user: BelifeUser, answers: OnboardingAnswers) {
  const store = getStore();
  await store.ensureProfile(user);
  const profile = await store.updateOnboarding(user.id, answers);
  const initialText = [
    answers.mainWorry,
    answers.currentGoal,
    answers.importantValue,
    answers.stressReaction,
    answers.emotionalClimate,
    answers.relationshipHope,
  ].join("\n");
  const extraction = await buildStructuredExtraction({
    userId: user.id,
    text: initialText,
    source: "onboarding",
  });
  await store.saveMemoryChunks(extraction.chunks);
  await store.upsertOntologyNodes(user.id, extraction.nodes);
  await store.saveBehavior(user.id, extraction.behavior);
  await store.saveStateEstimate(user.id, extraction.state);
  await refreshDataTrust(user.id);
  return profile;
}

export async function createConversation(userId: string) {
  return getStore().createConversation(userId);
}

export async function handleConversationMessage(input: {
  user: BelifeUser;
  conversationId: string;
  content: string;
  source: MessageSource;
}) {
  const store = getStore();
  await store.ensureProfile(input.user);
  const userMessage = await store.appendMessage({
    conversationId: input.conversationId,
    userId: input.user.id,
    role: "user",
    content: input.content,
    source: input.source,
  });

  const [profile, previousState, previousBehavior, recentMessages, currentNodes] = await Promise.all([
    store.getProfile(input.user.id),
    store.getLatestState(input.user.id),
    store.getLatestBehavior(input.user.id),
    store.getRecentMessages(input.user.id, 12),
    store.getOntologyNodes(input.user.id),
  ]);

  const extraction = await buildStructuredExtraction({
    userId: input.user.id,
    text: input.content,
    messageId: userMessage.id,
    source: input.source,
    previousState,
    previousBehavior,
  });

  await store.saveMemoryChunks(extraction.chunks);
  const savedNodes = await store.upsertOntologyNodes(input.user.id, extraction.nodes);
  await store.saveStateEstimate(input.user.id, extraction.state);
  await store.saveBehavior(input.user.id, extraction.behavior);
  const dataTrust = await refreshDataTrust(input.user.id);
  const allNodes = mergeNodes(currentNodes, savedNodes);
  const assistantText = await buildAssistantReply({
    displayName: profile?.nickname ?? input.user.name,
    content: input.content,
    recentMessages,
    nodes: allNodes,
    stateSummary: extraction.state.summary,
    tone: profile?.preferredTone ?? "calm",
  });

  const assistantMessage = await store.appendMessage({
    conversationId: input.conversationId,
    userId: input.user.id,
    role: "assistant",
    content: assistantText,
    source: "system",
  });

  return {
    userMessage,
    assistantMessage,
    state: extraction.state,
    behavior: extraction.behavior,
    dataTrust,
    ontologyUpdates: savedNodes,
  };
}

function mergeNodes(existing: OntologyNode[], updates: OntologyNode[]) {
  const keyed = new Map<string, OntologyNode>();
  for (const node of [...existing, ...updates]) keyed.set(`${node.type}:${node.label}`, node);
  return [...keyed.values()];
}

async function buildAssistantReply(input: {
  displayName: string;
  content: string;
  recentMessages: ConversationMessage[];
  nodes: OntologyNode[];
  stateSummary: string;
  tone: string;
}) {
  const context = input.nodes
    .slice(0, 8)
    .map((node) => `- ${node.type}/${node.tier}: ${node.label} (${node.certainty}, ${Math.round(node.confidence * 100)}%)`)
    .join("\n");
  const recent = input.recentMessages
    .slice(-6)
    .map((message) => `${message.role}: ${compactText(message.content, 120)}`)
    .join("\n");

  const prompt = `You are BELIFE, a Korean-first personal AI intelligence service.
You are not a therapist and must not diagnose. Use warm, calm Korean by default.
User nickname: ${input.displayName}
Preferred tone: ${input.tone}
Current state interpretation: ${input.stateSummary}
Known self-structure:
${context || "- Not enough structure yet"}
Recent conversation:
${recent || "- First conversation"}

User just said:
${input.content}

Answer in Korean. Structure before advice. Keep it concise: 3 short paragraphs max, then one reflective question.`;

  try {
    const response = await ollamaGenerate({
      prompt,
      temperature: 0.48,
    });
    if (response) return response;
  } catch {
    // Keep production usable while an external Ollama endpoint is being connected.
  }

  return `지금 말에서 먼저 보이는 건 단순한 기분 문제가 아니라, 생각과 에너지가 함께 묶여 있다는 점이에요. “${compactText(
    input.content,
    64,
  )}”라는 표현 안에 현재 상태를 이해하고 싶어 하는 신호가 있습니다.

BELIFE가 보기에는 바로 결론을 내리기보다 감정 신호와 실제 문제를 분리해서 보는 게 좋습니다. 이 해석은 진단이 아니라, 지금까지의 대화와 자기 구조를 바탕으로 한 가설입니다.

지금 이 문제에서 가장 줄이고 싶은 것은 불안인가요, 피로인가요, 아니면 선택의 막막함인가요?`;
}

export async function refreshDataTrust(userId: string) {
  const store = getStore();
  const stats = await store.getStats(userId);
  const trust = calculateDataTrust(stats);
  await store.saveDataTrust(userId, trust);
  return trust;
}

export async function getBriefing(userId: string): Promise<Briefing> {
  const store = getStore();
  const [state, trust, nodes] = await Promise.all([
    store.getLatestState(userId),
    store.getLatestDataTrust(userId),
    store.getOntologyNodes(userId),
  ]);

  const dataTrust = trust ?? (await refreshDataTrust(userId));
  const mentalState =
    state ??
    estimateMentalState("BELIFE has limited signal. Start with a short check-in about today.", null);
  const highlights = filterOntologyView(nodes, "expanded").slice(0, 5);

  return {
    headline:
      dataTrust.score >= 50
        ? "오늘의 구조가 조금씩 선명해지고 있어요"
        : "BELIFE가 당신의 구조를 만들기 시작했어요",
    stateSummary: mentalState.summary,
    patternSummary: highlights.length
      ? `${highlights[0].label} 신호가 현재 자기 이해의 중심에 있습니다.`
      : "아직 충분한 반복 패턴은 없습니다. 짧은 대화 몇 번이면 첫 구조가 생깁니다.",
    recommendedPrompt: "지금 내 안에서 가장 크게 반복되는 생각은 뭐야?",
    dataTrust,
    state: mentalState,
    ontologyHighlights: highlights,
    safetyNote: "BELIFE는 비임상적 자기 이해 도구이며, 진단이나 치료를 대체하지 않습니다.",
  };
}

export async function getOntologyForView(userId: string, view: "core" | "expanded" | "full") {
  const nodes = await getStore().getOntologyNodes(userId);
  return filterOntologyView(nodes, view);
}

export async function getProfileEnrichmentSuggestions(userId: string) {
  const store = getStore();
  const [profile, nodes] = await Promise.all([store.getProfile(userId), store.getOntologyNodes(userId)]);
  return buildProfileEnrichmentSuggestions({ profile, nodes });
}

export async function acceptProfileEnrichment(userId: string, suggestionId: string) {
  const store = getStore();
  const [profile, nodes] = await Promise.all([store.getProfile(userId), store.getOntologyNodes(userId)]);
  const suggestion = findProfileEnrichmentSuggestion({ id: suggestionId, profile, nodes });
  if (!suggestion) {
    throw new Error("Profile enrichment suggestion is no longer available.");
  }

  let updatedProfile = profile;
  if (suggestion.kind === "profile_field" && suggestion.targetField && suggestion.proposedValue) {
    if (!profile) throw new Error("Profile is required before enrichment.");
    updatedProfile = await store.updateOnboarding(
      userId,
      mergeProfileAnswer(profile, suggestion.targetField, suggestion.proposedValue),
    );
  }

  if (suggestion.ontologyNode) {
    const promoted = promoteSuggestionNode(suggestion);
    await store.upsertOntologyNodes(userId, [promoted]);
  }

  await store.saveMemoryChunks([
    {
      userId,
      content: `사용자가 프로필 보강 제안을 승인함: ${suggestion.title} - ${suggestion.detail}`,
      kind: "semantic",
      salience: 0.74,
      evidenceType: "EXTRACTED",
      tags: ["profile-enrichment", "approval"],
    },
  ]);
  const dataTrust = await refreshDataTrust(userId);
  return { suggestion, profile: updatedProfile, dataTrust };
}

export async function getTwinAnswer(userId: string, question: string) {
  const store = getStore();
  const [profile, state, behavior, nodes] = await Promise.all([
    store.getProfile(userId),
    store.getLatestState(userId),
    store.getLatestBehavior(userId),
    store.getOntologyNodes(userId),
  ]);
  const constraints = nodes
    .slice(0, 10)
    .map((node) => `${node.type}: ${node.label} - ${node.summary}`)
    .join("\n");
  const prompt = `You are BELIFE Digital Twin, constrained by evidence only.
Do not invent unsupported life facts. Say when confidence is low.
Answer in Korean as a reflective mirror of the user, not as a roleplay character.
Nickname: ${profile?.nickname ?? "user"}
Current state: ${state?.summary ?? "limited state evidence"}
Behavior style: ${behavior?.summary ?? "limited behavior evidence"}
Ontology constraints:
${constraints || "No strong ontology yet"}

Question: ${question}

Return: 1) what your structure might be doing, 2) what is uncertain, 3) one question to ask yourself.`;

  try {
    const response = await ollamaGenerate({ prompt, temperature: 0.35 });
    if (response) return response;
  } catch {
    // Keep production usable while an external Ollama endpoint is being connected.
  }

  return `지금까지의 구조를 기준으로 보면, 이 질문은 단순히 “무엇을 해야 하지?”보다 “왜 같은 패턴이 반복되지?”를 확인하려는 쪽에 가깝습니다.

아직 확실하지 않은 부분은 이것이 일시적인 피로에서 나온 반복인지, 오래된 관계/결정 방식에서 나온 반복인지입니다. BELIFE는 증거가 부족한 부분을 사실처럼 말하지 않겠습니다.

스스로에게 물어볼 질문은 이것입니다. 지금 내가 해결하려는 것은 실제 문제인가요, 아니면 그 문제를 둘러싼 불안과 압박인가요?`;
}

export async function getConnectionPreview(userId: string) {
  const store = getStore();
  const [nodes, behavior, trust] = await Promise.all([
    store.getOntologyNodes(userId),
    store.getLatestBehavior(userId),
    store.getLatestDataTrust(userId),
  ]);
  const dataTrust = trust ?? (await refreshDataTrust(userId));
  const preview = buildConnectionPreview(nodes, behavior, dataTrust);
  await store.saveConnectionPreview(userId, preview);
  return preview;
}

export async function getDataTrustCenter(userId: string) {
  const store = getStore();
  const dataTrust = await refreshDataTrust(userId);
  const [stats, inventory] = await Promise.all([store.getStats(userId), store.getMemoryInventory(userId)]);
  return { dataTrust, stats, inventory };
}

export async function getMemoryTimeline(userId: string, limit?: number) {
  return getStore().getMemoryTimeline(userId, limit);
}

export async function exportBelifeData(userId: string) {
  return getStore().exportUserData(userId);
}

export async function resetBelifeMemory(user: BelifeUser) {
  const profile = await getStore().resetUserData(user);
  const dataTrust = await refreshDataTrust(user.id);
  return { profile, dataTrust };
}

function mergeProfileAnswer(
  profile: UserProfile,
  field: NonNullable<ProfileEnrichmentSuggestion["targetField"]>,
  value: string,
): OnboardingAnswers {
  const answers: OnboardingAnswers = {
    nickname: profile.nickname,
    role: profile.role,
    mainWorry: profile.mainWorry,
    currentGoal: profile.currentGoal,
    importantValue: profile.importantValue,
    stressReaction: profile.stressReaction,
    emotionalClimate: profile.emotionalClimate,
    preferredTone: profile.preferredTone,
    relationshipHope: profile.onboardingAnswers.relationshipHope ?? "",
  };
  return { ...answers, [field]: value };
}

function promoteSuggestionNode(suggestion: ProfileEnrichmentSuggestion): OntologyNode {
  const node = suggestion.ontologyNode;
  if (!node) throw new Error("Ontology node is required for promotion.");
  const shouldPromoteToCore = suggestion.kind === "ontology_promotion";
  return {
    ...node,
    tier: shouldPromoteToCore ? "L1" : node.tier,
    layer: shouldPromoteToCore ? "core" : node.layer,
    certainty: "EXTRACTED",
    confidence: Math.max(node.confidence, shouldPromoteToCore ? 0.78 : 0.68),
    evidenceCount: node.evidenceCount + 1,
    status: "active",
    lastEvidenceAt: isoNow(),
  };
}
