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
      "Memory Health is a maintenance lens for BELIFE's append-only memory. It flags stale, ambiguous, or correction-worthy signals; it does not delete memories or decide facts by itself.",
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
      label: `${chunk.kind} memory needs validation`,
      severity: chunk.salience >= 0.72 ? "high" : "medium",
      reason: "This memory was stored as ambiguous evidence and should not be promoted without confirmation.",
      evidence: compactText(chunk.content, 150),
      suggestedAction: "Ask BELIFE to confirm, correct, or archive this interpretation before using it as a stable pattern.",
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
          ? "This ontology node is ambiguous but still visible in the self model."
          : "This ontology node has low confidence and needs more repeated evidence.",
      evidence: compactText(node.summary, 150),
      suggestedAction: "Keep it as a hypothesis until repeated evidence or a user correction clarifies it.",
      createdAt: node.lastEvidenceAt,
    }));
  const correctionChunks = chunks
    .filter((chunk) => chunk.kind === "correction" || chunk.tags.includes("user-correction"))
    .map((chunk) => watchItem({
      id: chunk.id ?? `correction-${hashKey(chunk.content)}`,
      kind: "correction",
      label: "User correction should override older readings",
      severity: "high",
      reason: "A user-confirmed correction is the strongest signal that older interpretations need reconciliation.",
      evidence: compactText(chunk.content, 150),
      suggestedAction: "Use this correction as the preferred interpretation when generating future twin, briefing, and ontology output.",
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
      label: `Repeated ambiguous tag: ${tag}`,
      severity: group.some((chunk) => chunk.salience >= 0.75) ? "high" : "medium",
      reason: "Several memories share this tag, but at least one is ambiguous. BELIFE should separate facts from hypotheses.",
      evidence: compactText(group.map((chunk) => chunk.content).join(" / "), 180),
      suggestedAction: "Review this cluster and add a correction if BELIFE has blended unlike situations.",
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
      label: `${chunk.kind} memory may be stale`,
      severity: daysSince(chunk.createdAt, now) >= 90 ? "medium" : "low",
      reason: "Older low-salience or inferred memory should stay append-only, but it should not dominate current interpretation.",
      evidence: compactText(chunk.content, 150),
      suggestedAction: "Down-weight this memory unless a recent message confirms it still applies.",
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
      reason: "This ontology signal has aged without enough confirming evidence.",
      evidence: compactText(node.summary, 150),
      suggestedAction: "Keep it as historical context, but ask for fresh evidence before using it as an active self pattern.",
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
      label: `${chunk.kind} memory`,
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
      label: "Recent user episode",
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
