import { clamp, compactText, isoNow } from "@/lib/utils";
import type {
  BelifeMemoryInventory,
  ConversationMessage,
  MemoryChunk,
  MemoryHealthAnchor,
  MemoryHealthReport,
  MemoryHealthWatchItem,
  OntologyNode,
} from "./types";

const dayMs = 24 * 60 * 60 * 1000;
const genericTags = new Set([
  "explicit-consent",
  "extracted-from-import",
  "extracted-from-correction",
  "relationship-derived",
  "profile-enrichment",
  "approval",
  "memory",
]);

export function buildMemoryHealthReport(input: {
  inventory: BelifeMemoryInventory;
  chunks: MemoryChunk[];
  nodes: OntologyNode[];
  messages: ConversationMessage[];
  now?: string;
}): MemoryHealthReport {
  const now = new Date(input.now ?? isoNow());
  const recentArtifacts = [
    ...input.chunks.flatMap((chunk) => (chunk.createdAt ? [chunk.createdAt] : [])),
    ...input.messages.map((message) => message.createdAt),
    ...input.nodes.map((node) => node.lastEvidenceAt),
  ];
  const latestMemoryAt = latestIso(input.chunks.flatMap((chunk) => (chunk.createdAt ? [chunk.createdAt] : [])));
  const latestMessageAt = latestIso(input.messages.map((message) => message.createdAt));
  const freshnessScore = freshnessFromLatest(latestIso(recentArtifacts), now);
  const evidenceBalance = evidenceBalanceFor(input.chunks, input.nodes);
  const contradictionWatchlist = buildContradictionWatchlist(input.chunks, input.nodes);
  const forgettingCandidates = buildForgettingCandidates(input.chunks, input.nodes, now);
  const episodicAnchors = buildEpisodicAnchors(input.chunks, input.nodes, input.messages);
  const artifactCoverage = clamp((input.chunks.length + input.nodes.length + input.messages.length) / 10, 0.08, 1);
  const baseScore = clamp(
    freshnessScore * 0.28 +
      evidenceClarityScore(evidenceBalance) * 0.24 +
      anchorScore(episodicAnchors) * 0.18 +
      (1 - Math.min(1, contradictionWatchlist.length / 5)) * 0.18 +
      (1 - Math.min(1, forgettingCandidates.length / 6)) * 0.12,
  );
  const score = clamp(baseScore * (0.5 + artifactCoverage * 0.5));

  return {
    generatedAt: isoNow(),
    score,
    label: memoryHealthLabel(score),
    summary: memoryHealthSummary(score, evidenceBalance, contradictionWatchlist.length, forgettingCandidates.length),
    guardrail:
      "기억 건강도는 BELIFE의 추가 기록형 기억을 관리하는 렌즈입니다. 오래되었거나 모호하거나 정정이 필요한 신호를 표시하지만, 스스로 기억을 삭제하거나 사실을 단정하지 않습니다.",
    freshness: {
      score: freshnessScore,
      latestMemoryAt,
      latestMessageAt,
      windows: [
        { label: "7d", count: countWithinDays(recentArtifacts, now, 7) },
        { label: "30d", count: countWithinDays(recentArtifacts, now, 30) },
        { label: "90d", count: countWithinDays(recentArtifacts, now, 90) },
      ],
    },
    evidenceBalance,
    contradictionWatchlist,
    forgettingCandidates,
    episodicAnchors,
    nextActions: nextActionsFor({
      score,
      evidenceBalance,
      contradictionWatchlist,
      forgettingCandidates,
      inventory: input.inventory,
    }),
  };
}

function evidenceBalanceFor(chunks: MemoryChunk[], nodes: OntologyNode[]) {
  const evidenceTypes = [...chunks.map((chunk) => chunk.evidenceType), ...nodes.map((node) => node.certainty)];
  const extracted = evidenceTypes.filter((type) => type === "EXTRACTED").length;
  const inferred = evidenceTypes.filter((type) => type === "INFERRED").length;
  const ambiguous = evidenceTypes.filter((type) => type === "AMBIGUOUS").length;
  const correctionCount = chunks.filter(
    (chunk) => chunk.kind === "correction" || chunk.tags.includes("user-correction"),
  ).length;
  const ambiguityRatio = evidenceTypes.length ? ambiguous / evidenceTypes.length : 0;
  return { extracted, inferred, ambiguous, correctionCount, ambiguityRatio };
}

function buildContradictionWatchlist(chunks: MemoryChunk[], nodes: OntologyNode[]): MemoryHealthWatchItem[] {
  const ambiguousChunks = chunks
    .filter((chunk) => chunk.evidenceType === "AMBIGUOUS")
    .map((chunk) => watchItem({
      id: chunk.id ?? `ambiguous-${hashKey(chunk.content)}`,
      kind: "contradiction",
      label: `${memoryKindLabel(chunk.kind)} 기억 검증 필요`,
      severity: chunk.salience >= 0.72 ? "high" : "medium",
      reason: "이 기억은 모호한 근거로 저장되어 확인 없이 핵심 패턴으로 올리면 안 됩니다.",
      evidence: compactText(chunk.content, 150),
      suggestedAction: "안정 패턴으로 쓰기 전에 BELIFE에 이 해석을 확인, 정정, 보관하도록 요청하세요.",
      createdAt: chunk.createdAt,
    }));
  const weakNodes = nodes
    .filter((node) => node.certainty === "AMBIGUOUS" || node.confidence < 0.38)
    .map((node) => watchItem({
      id: node.id ?? `node-${hashKey(`${node.type}:${node.label}`)}`,
      kind: node.certainty === "AMBIGUOUS" ? "contradiction" : "low_confidence",
      label: `${node.type}: ${node.label}`,
      severity: node.tier === "L1" ? "high" : "medium",
      reason:
        node.certainty === "AMBIGUOUS"
          ? "이 온톨로지 노드는 모호하지만 아직 자기 모델에 보입니다."
          : "이 온톨로지 노드는 신뢰도가 낮아 반복 근거가 더 필요합니다.",
      evidence: compactText(node.summary, 150),
      suggestedAction: "반복 근거나 사용자 정정으로 명확해질 때까지 가설로만 유지하세요.",
      createdAt: node.lastEvidenceAt,
    }));
  const correctionChunks = chunks
    .filter((chunk) => chunk.kind === "correction" || chunk.tags.includes("user-correction"))
    .map((chunk) => watchItem({
      id: chunk.id ?? `correction-${hashKey(chunk.content)}`,
      kind: "correction",
      label: "사용자 정정이 오래된 해석보다 우선되어야 합니다",
      severity: "high",
      reason: "사용자가 확인한 정정은 오래된 해석을 조정해야 한다는 가장 강한 신호입니다.",
      evidence: compactText(chunk.content, 150),
      suggestedAction: "향후 트윈, 브리핑, 온톨로지 출력에서는 이 정정을 우선 해석으로 사용하세요.",
      createdAt: chunk.createdAt,
    }));
  const tagConflicts = buildTagConflictWatchlist(chunks);

  return [...correctionChunks, ...ambiguousChunks, ...weakNodes, ...tagConflicts]
    .sort((left, right) => severityWeight(right.severity) - severityWeight(left.severity))
    .slice(0, 8);
}

function buildTagConflictWatchlist(chunks: MemoryChunk[]): MemoryHealthWatchItem[] {
  const grouped = new Map<string, MemoryChunk[]>();
  for (const chunk of chunks) {
    for (const tag of chunk.tags) {
      if (genericTags.has(tag) || tag.includes(":") || tag.length < 3) continue;
      grouped.set(tag, [...(grouped.get(tag) ?? []), chunk]);
    }
  }

  return [...grouped.entries()]
    .filter(([, group]) => group.some((chunk) => chunk.evidenceType === "AMBIGUOUS") && group.length >= 2)
    .map(([tag, group]) => watchItem({
      id: `tag-conflict-${hashKey(tag)}`,
      kind: "contradiction",
      label: `반복되는 모호한 태그: ${tag}`,
      severity: group.some((chunk) => chunk.salience >= 0.75) ? "high" : "medium",
      reason: "여러 기억이 이 태그를 공유하지만 일부가 모호합니다. BELIFE는 사실과 가설을 분리해야 합니다.",
      evidence: compactText(group.map((chunk) => chunk.content).join(" / "), 180),
      suggestedAction: "이 묶음을 검토하고, BELIFE가 다른 상황을 섞었다면 정정을 추가하세요.",
      createdAt: latestIso(group.flatMap((chunk) => (chunk.createdAt ? [chunk.createdAt] : []))),
    }));
}

function buildForgettingCandidates(
  chunks: MemoryChunk[],
  nodes: OntologyNode[],
  now: Date,
): MemoryHealthWatchItem[] {
  const staleChunks = chunks
    .filter((chunk) => chunk.createdAt && daysSince(chunk.createdAt, now) >= 45)
    .filter((chunk) => chunk.kind !== "correction" && !chunk.tags.includes("user-correction"))
    .filter((chunk) => chunk.salience < 0.56 || chunk.evidenceType !== "EXTRACTED")
    .map((chunk) => watchItem({
      id: chunk.id ?? `stale-${hashKey(chunk.content)}`,
      kind: "stale",
      label: `${memoryKindLabel(chunk.kind)} 기억이 오래되었을 수 있습니다`,
      severity: daysSince(chunk.createdAt, now) >= 90 ? "medium" : "low",
      reason: "오래된 저중요도 또는 추론 기억은 보존하되 현재 해석을 지배하면 안 됩니다.",
      evidence: compactText(chunk.content, 150),
      suggestedAction: "최근 메시지가 여전히 유효하다고 확인하기 전까지 이 기억의 가중치를 낮추세요.",
      createdAt: chunk.createdAt,
    }));
  const staleNodes = nodes
    .filter((node) => daysSince(node.lastEvidenceAt, now) >= 60)
    .filter((node) => node.layer !== "core" || node.evidenceCount < 2)
    .filter((node) => node.confidence < 0.66 || node.status === "archived" || node.layer === "archive")
    .map((node) => watchItem({
      id: node.id ?? `stale-node-${hashKey(`${node.type}:${node.label}`)}`,
      kind: "stale",
      label: `${node.type}: ${node.label}`,
      severity: node.layer === "archive" || node.status === "archived" ? "low" : "medium",
      reason: "이 온톨로지 신호는 충분한 확인 근거 없이 오래되었습니다.",
      evidence: compactText(node.summary, 150),
      suggestedAction: "역사적 맥락으로 보관하되, 현재 자기 패턴으로 쓰기 전에는 새 근거를 요청하세요.",
      createdAt: node.lastEvidenceAt,
    }));

  return [...staleChunks, ...staleNodes]
    .sort((left, right) => severityWeight(right.severity) - severityWeight(left.severity))
    .slice(0, 8);
}

function buildEpisodicAnchors(
  chunks: MemoryChunk[],
  nodes: OntologyNode[],
  messages: ConversationMessage[],
): MemoryHealthAnchor[] {
  const memoryAnchors: MemoryHealthAnchor[] = chunks
    .filter((chunk) => chunk.salience >= 0.62 || chunk.evidenceType === "EXTRACTED")
    .map((chunk) => ({
      id: chunk.id ?? `chunk-${hashKey(chunk.content)}`,
      source: "memory",
      label: `${memoryKindLabel(chunk.kind)} 기억`,
      detail: compactText(chunk.content, 150),
      confidence: chunk.evidenceType === "EXTRACTED" ? 0.82 : chunk.evidenceType === "INFERRED" ? 0.56 : 0.34,
      salience: chunk.salience,
      createdAt: chunk.createdAt,
    }));
  const messageAnchors: MemoryHealthAnchor[] = messages
    .filter((message) => message.role === "user")
    .map((message) => ({
      id: message.id,
      source: "message",
      label: "최근 사용자 에피소드",
      detail: compactText(message.content, 150),
      confidence: 0.72,
      createdAt: message.createdAt,
    }));
  const nodeAnchors: MemoryHealthAnchor[] = nodes
    .filter((node) => node.confidence >= 0.62 && node.status === "active")
    .map((node) => ({
      id: node.id ?? `node-${hashKey(`${node.type}:${node.label}`)}`,
      source: "ontology",
      label: `${node.type}: ${node.label}`,
      detail: compactText(node.summary, 150),
      confidence: node.confidence,
      createdAt: node.lastEvidenceAt,
    }));

  return [...memoryAnchors, ...messageAnchors, ...nodeAnchors]
    .sort((left, right) => anchorSortScore(right) - anchorSortScore(left))
    .slice(0, 6);
}

function nextActionsFor(input: {
  score: number;
  evidenceBalance: ReturnType<typeof evidenceBalanceFor>;
  contradictionWatchlist: MemoryHealthWatchItem[];
  forgettingCandidates: MemoryHealthWatchItem[];
  inventory: BelifeMemoryInventory;
}) {
  const actions: string[] = [];
  if (input.contradictionWatchlist.length) {
    actions.push("Review the top contradiction watch item and add a memory correction if BELIFE is over-reading it.");
  }
  if (input.evidenceBalance.ambiguityRatio >= 0.2) {
    actions.push("Add one concrete example for the most ambiguous pattern so BELIFE can separate fact from hypothesis.");
  }
  if (input.forgettingCandidates.length) {
    actions.push("Treat stale low-salience memories as historical context until a recent interaction confirms them.");
  }
  if ((input.inventory.counts.memoryChunks ?? 0) < 8) {
    actions.push("Have two or three ordinary conversations before trusting long-horizon self or relationship interpretations.");
  }
  if (!actions.length) {
    actions.push("Memory looks usable; the next improvement is a recent real-world example tied to one active ontology node.");
  }
  return actions.slice(0, 3);
}

function memoryHealthSummary(
  score: number,
  evidenceBalance: ReturnType<typeof evidenceBalanceFor>,
  contradictionCount: number,
  forgettingCount: number,
) {
  if (score >= 0.72) {
    return `Memory is rich enough for grounded interpretation. ${evidenceBalance.extracted} extracted signals are active, with ${contradictionCount} contradiction watch items.`;
  }
  if (score >= 0.54) {
    return `Memory is building: useful anchors exist, but ${contradictionCount} contradiction and ${forgettingCount} freshness items still need attention.`;
  }
  if (score >= 0.34) {
    return "Memory is still thin. BELIFE can reflect recent evidence, but stable self-structure should stay cautious.";
  }
  return "Memory is too early for strong claims. BELIFE should ask for examples before making broad interpretations.";
}

function memoryHealthLabel(score: number): MemoryHealthReport["label"] {
  if (score >= 0.76) return "rich";
  if (score >= 0.58) return "healthy";
  if (score >= 0.36) return "building";
  return "thin";
}

function evidenceClarityScore(balance: ReturnType<typeof evidenceBalanceFor>) {
  const total = balance.extracted + balance.inferred + balance.ambiguous;
  if (!total) return 0.18;
  return clamp(balance.extracted / total * 0.72 + balance.inferred / total * 0.34 - balance.ambiguityRatio * 0.28);
}

function anchorScore(anchors: MemoryHealthAnchor[]) {
  return clamp(anchors.reduce((sum, anchor) => sum + anchor.confidence * (anchor.salience ?? 0.66), 0) / 4);
}

function freshnessFromLatest(latest: string | undefined, now: Date) {
  if (!latest) return 0.08;
  const age = daysSince(latest, now);
  if (age <= 7) return 0.95;
  if (age <= 30) return clamp(0.88 - (age - 7) / 23 * 0.24);
  if (age <= 90) return clamp(0.62 - (age - 30) / 60 * 0.34);
  return 0.18;
}

function countWithinDays(values: string[], now: Date, days: number) {
  return values.filter((value) => daysSince(value, now) <= days).length;
}

function daysSince(value: string | undefined, now: Date) {
  if (!value) return Number.POSITIVE_INFINITY;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return Number.POSITIVE_INFINITY;
  return Math.max(0, (now.getTime() - timestamp) / dayMs);
}

function latestIso(values: string[]) {
  const timestamps = values
    .map((value) => new Date(value).getTime())
    .filter((value) => Number.isFinite(value));
  if (!timestamps.length) return undefined;
  return new Date(Math.max(...timestamps)).toISOString();
}

function watchItem(input: MemoryHealthWatchItem): MemoryHealthWatchItem {
  return input;
}

function severityWeight(severity: MemoryHealthWatchItem["severity"]) {
  if (severity === "high") return 3;
  if (severity === "medium") return 2;
  return 1;
}

function anchorSortScore(anchor: MemoryHealthAnchor) {
  const recencyBonus = anchor.createdAt ? Math.max(0, 1 - daysSince(anchor.createdAt, new Date()) / 90) * 0.12 : 0;
  return anchor.confidence * 0.62 + (anchor.salience ?? 0.5) * 0.28 + recencyBonus;
}

function hashKey(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function memoryKindLabel(kind: string) {
  const labels: Record<string, string> = {
    onboarding: "온보딩",
    conversation: "대화",
    correction: "정정",
    import: "가져온",
    relationship: "관계",
    semantic: "의미",
  };
  return labels[kind] ?? kind;
}
