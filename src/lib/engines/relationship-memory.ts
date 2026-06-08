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
  return (
    label
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9가-힣]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 64) || "unnamed-relationship"
  );
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
      "사용자가 동의한 관계별 개인 기억입니다.",
      `사람/맥락: ${personLabel}`,
      `관계 키: ${pairKey}`,
      `관계 유형: ${input.relationshipType}`,
      `상호작용의 질: ${quality.toFixed(2)}`,
      `정서적 안전감: ${safety.toFixed(2)}`,
      `상호성: ${reciprocity.toFixed(2)}`,
      `회복 시도: ${repair}`,
      "상호작용 메모:",
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
      "관계 기억은 자기 이해를 위한 개인별 맥락입니다. 공개 매칭, 진단, 상대에 대한 점수화로 사용하지 않습니다.",
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
  const riskLabel = input.riskLevel === "high" ? "주의가 큰" : input.riskLevel === "moderate" ? "천천히 확인할" : "비교적 안정적인";
  const safety = input.emotionalSafety >= 0.62 ? "더 가까이 관찰해도 될 만큼 안전감이 보입니다" : "안전감을 더 천천히 확인해야 합니다";
  const repair = input.repairEvidence >= 0.35 ? "회복 근거가 보입니다" : "회복 근거는 아직 얇습니다";
  return `${input.personLabel} 관계 기억은 ${riskLabel} 패턴입니다. 상호작용의 질 ${Math.round(
    input.averageQuality * 100,
  )}, 안전감 ${Math.round(input.emotionalSafety * 100)}, 상호성 ${Math.round(input.reciprocity * 100)}입니다. ${safety}; ${repair}.`;
}

function relationshipSignals(input: {
  averageQuality: number;
  emotionalSafety: number;
  reciprocity: number;
  repairEvidence: number;
  latest: MemoryChunk;
}) {
  return [
    `평균 상호작용의 질 ${Math.round(input.averageQuality * 100)}`,
    `정서적 안전감 ${Math.round(input.emotionalSafety * 100)}`,
    `상호성 ${Math.round(input.reciprocity * 100)}`,
    `회복 근거 ${Math.round(input.repairEvidence * 100)}`,
    `최근 메모: ${compactText(input.latest.content.split("상호작용 메모:").at(-1)?.trim() ?? input.latest.content, 110)}`,
  ];
}

function relationshipNextObservation(input: {
  riskLevel: RelationshipPairMemorySummary["riskLevel"];
  emotionalSafety: number;
  reciprocity: number;
  repairEvidence: number;
}) {
  if (input.riskLevel === "high") {
    return "다음 상호작용은 작게 유지하고, 경계나 필요를 말한 뒤 안전감이 회복되는지 보세요.";
  }
  if (input.repairEvidence < 0.2) {
    return "가까워지기 전에 작은 오해 하나를 두고 양쪽이 커지지 않게 회복할 수 있는지 관찰하세요.";
  }
  if (input.reciprocity < 0.48) {
    return "돌봄, 주의, 주도성이 한쪽으로만 흐르지 않고 여러 번 왕복되는지 보세요.";
  }
  return "다음 유용한 신호는 일관성입니다. 약한 압박 속에서도 같은 안전감과 회복 리듬이 반복되는지 확인하세요.";
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
