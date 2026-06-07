import { clamp, compactText, isoNow } from "@/lib/utils";
import type {
  MemoryChunk,
  RelationshipMemoryInput,
  RelationshipMemoryKind,
  RelationshipMemoryReport,
  RelationshipPairMemorySummary,
} from "./types";

export const relationshipMemoryTag = "relationship-memory";
export const relationshipMemoryConsentTag = "explicit-consent";

export const relationshipMemoryKinds = [
  "friendship",
  "collaboration",
  "mentorship",
  "family",
  "romantic",
  "other",
] as const satisfies readonly [RelationshipMemoryKind, ...RelationshipMemoryKind[]];

export function relationshipPairKey(label: string) {
  return label
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64) || "unnamed-relationship";
}

export function relationshipPersonTag(label: string) {
  return `person:${encodeURIComponent(label.trim())}`;
}

export function relationshipPairTag(label: string) {
  return `pair:${relationshipPairKey(label)}`;
}

export function relationshipMemoryChunk(userId: string, input: RelationshipMemoryInput): MemoryChunk {
  const personLabel = input.personLabel.trim();
  const pairKey = relationshipPairKey(personLabel);
  const quality = clamp(input.interactionQuality);
  const safety = clamp(input.emotionalSafety);
  const reciprocity = clamp(input.reciprocity);
  const repair = input.repairAttempted ? "yes" : "no";
  const salience = clamp(0.34 + quality * 0.18 + safety * 0.2 + reciprocity * 0.16 + (input.repairAttempted ? 0.1 : 0));

  return {
    userId,
    content: [
      "User-consented pairwise relationship memory.",
      `Person/context: ${personLabel}`,
      `Pair key: ${pairKey}`,
      `Relationship type: ${input.relationshipType}`,
      `Interaction quality: ${quality.toFixed(2)}`,
      `Emotional safety: ${safety.toFixed(2)}`,
      `Reciprocity: ${reciprocity.toFixed(2)}`,
      `Repair attempted: ${repair}`,
      "Interaction note:",
      input.interactionNote.trim(),
    ].join("\n"),
    kind: "relationship",
    salience,
    evidenceType: "EXTRACTED",
    tags: [
      relationshipMemoryTag,
      relationshipMemoryConsentTag,
      relationshipPairTag(personLabel),
      relationshipPersonTag(personLabel),
      `relationship-type:${input.relationshipType}`,
      `quality:${quality.toFixed(2)}`,
      `safety:${safety.toFixed(2)}`,
      `reciprocity:${reciprocity.toFixed(2)}`,
      `repair:${repair}`,
    ],
  };
}

export function buildRelationshipMemoryReport(
  chunks: MemoryChunk[],
  options: { personLabel?: string; limit?: number } = {},
): RelationshipMemoryReport {
  const pairFilter = options.personLabel ? relationshipPairTag(options.personLabel) : null;
  const relationshipChunks = chunks
    .filter((chunk) => chunk.kind === "relationship" && chunk.tags.includes(relationshipMemoryTag))
    .filter((chunk) => (pairFilter ? chunk.tags.includes(pairFilter) : true));
  const grouped = new Map<string, MemoryChunk[]>();

  for (const chunk of relationshipChunks) {
    const pair = tagValue(chunk.tags, "pair") ?? "unnamed-relationship";
    grouped.set(pair, [...(grouped.get(pair) ?? []), chunk]);
  }

  const pairs = [...grouped.entries()]
    .map(([pairKey, pairChunks]) => summarizePair(pairKey, pairChunks))
    .sort((left, right) => new Date(right.latestAt).getTime() - new Date(left.latestAt).getTime())
    .slice(0, Math.max(1, Math.min(20, options.limit ?? 12)));

  return {
    generatedAt: isoNow(),
    pairCount: pairs.length,
    totalInteractions: relationshipChunks.length,
    guardrail:
      "Relationship memory is private pairwise context for self-understanding, not public matching, diagnosis, or a score of another person.",
    pairs,
  };
}

function summarizePair(pairKey: string, chunks: MemoryChunk[]): RelationshipPairMemorySummary {
  const sorted = [...chunks].sort((left, right) => new Date(left.createdAt ?? 0).getTime() - new Date(right.createdAt ?? 0).getTime());
  const latest = sorted.at(-1) ?? chunks[0];
  const personLabel = decodeURIComponent(tagValue(latest.tags, "person") ?? pairKey);
  const relationshipType = relationshipTypeFromTags(latest.tags);
  const qualities = sorted.map((chunk) => numericTag(chunk.tags, "quality", 0.5));
  const safeties = sorted.map((chunk) => numericTag(chunk.tags, "safety", 0.5));
  const reciprocities = sorted.map((chunk) => numericTag(chunk.tags, "reciprocity", 0.5));
  const repairEvidence = sorted.filter((chunk) => tagValue(chunk.tags, "repair") === "yes").length / sorted.length;
  const averageQuality = average(qualities);
  const emotionalSafety = average(safeties);
  const reciprocity = average(reciprocities);
  const confidence = clamp(
    Math.min(1, sorted.length / 5) * 0.42 +
      average(sorted.map((chunk) => chunk.salience)) * 0.24 +
      (sorted.some((chunk) => chunk.evidenceType === "EXTRACTED") ? 0.18 : 0.08) +
      repairEvidence * 0.12,
  );
  const riskLevel = relationshipRiskLevel({ averageQuality, emotionalSafety, reciprocity, repairEvidence });

  return {
    pairKey,
    personLabel,
    relationshipType,
    interactionCount: sorted.length,
    averageQuality,
    emotionalSafety,
    reciprocity,
    repairEvidence,
    confidence,
    riskLevel,
    summary: relationshipSummary({ personLabel, averageQuality, emotionalSafety, reciprocity, repairEvidence, riskLevel }),
    signals: relationshipSignals({ averageQuality, emotionalSafety, reciprocity, repairEvidence, latest }),
    nextObservation: relationshipNextObservation({ riskLevel, emotionalSafety, reciprocity, repairEvidence }),
    latestAt: latest.createdAt ?? isoNow(),
  };
}

function relationshipTypeFromTags(tags: string[]): RelationshipMemoryKind {
  const value = tagValue(tags, "relationship-type");
  return relationshipMemoryKinds.includes(value as RelationshipMemoryKind) ? (value as RelationshipMemoryKind) : "other";
}

function relationshipRiskLevel(input: {
  averageQuality: number;
  emotionalSafety: number;
  reciprocity: number;
  repairEvidence: number;
}): RelationshipPairMemorySummary["riskLevel"] {
  const stabilizer = input.emotionalSafety * 0.36 + input.reciprocity * 0.28 + input.averageQuality * 0.24 + input.repairEvidence * 0.12;
  if (stabilizer < 0.4 || input.emotionalSafety < 0.34) return "high";
  if (stabilizer < 0.58 || input.repairEvidence < 0.15) return "moderate";
  return "low";
}

function relationshipSummary(input: {
  personLabel: string;
  averageQuality: number;
  emotionalSafety: number;
  reciprocity: number;
  repairEvidence: number;
  riskLevel: RelationshipPairMemorySummary["riskLevel"];
}) {
  const safety = input.emotionalSafety >= 0.62 ? "safe enough to observe more closely" : "still needs slower safety checks";
  const repair = input.repairEvidence >= 0.35 ? "repair evidence is visible" : "repair evidence is still thin";
  return `${input.personLabel} is ${input.riskLevel}-risk private relationship memory: quality ${Math.round(
    input.averageQuality * 100,
  )}, safety ${Math.round(input.emotionalSafety * 100)}, reciprocity ${Math.round(input.reciprocity * 100)}. It looks ${safety}; ${repair}.`;
}

function relationshipSignals(input: {
  averageQuality: number;
  emotionalSafety: number;
  reciprocity: number;
  repairEvidence: number;
  latest: MemoryChunk;
}) {
  return [
    `Average interaction quality ${Math.round(input.averageQuality * 100)}`,
    `Emotional safety ${Math.round(input.emotionalSafety * 100)}`,
    `Reciprocity ${Math.round(input.reciprocity * 100)}`,
    `Repair evidence ${Math.round(input.repairEvidence * 100)}`,
    `Latest note: ${compactText(input.latest.content.split("Interaction note:").at(-1)?.trim() ?? input.latest.content, 110)}`,
  ];
}

function relationshipNextObservation(input: {
  riskLevel: RelationshipPairMemorySummary["riskLevel"];
  emotionalSafety: number;
  reciprocity: number;
  repairEvidence: number;
}) {
  if (input.riskLevel === "high") {
    return "Keep the next interaction small and watch whether safety improves after a clear boundary or need is named.";
  }
  if (input.repairEvidence < 0.2) {
    return "Before increasing closeness, observe one small misunderstanding and whether both sides can repair without escalation.";
  }
  if (input.reciprocity < 0.48) {
    return "Watch whether care, attention, and initiative move both ways across more than one interaction.";
  }
  return "The next useful signal is consistency: does the same safety and repair rhythm repeat under mild pressure?";
}

function tagValue(tags: string[], key: string) {
  const prefix = `${key}:`;
  return tags.find((tag) => tag.startsWith(prefix))?.slice(prefix.length);
}

function numericTag(tags: string[], key: string, fallback: number) {
  const value = Number(tagValue(tags, key));
  return Number.isFinite(value) ? clamp(value) : fallback;
}

function average(values: number[]) {
  return values.length ? clamp(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}
