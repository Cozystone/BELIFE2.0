import { clamp, compactText } from "@/lib/utils";
import type { ConversationMessage, MemoryChunk, MemoryEvidenceItem, OntologyNode } from "./types";

const stopWords = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "when",
  "what",
  "where",
  "how",
  "why",
  "about",
  "please",
  "내가",
  "나는",
  "제가",
  "저는",
  "이건",
  "그건",
  "지금",
  "너무",
  "대한",
  "대해",
  "하고",
  "에서",
  "으로",
]);

function tokenize(value: string) {
  const matches = value.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];
  return matches.filter((token) => token.length > 1 && !stopWords.has(token));
}

function overlapScore(queryTerms: Set<string>, text: string) {
  if (!queryTerms.size) return 0;
  const terms = new Set(tokenize(text));
  let overlap = 0;
  for (const term of queryTerms) {
    if (terms.has(term)) overlap += 1;
  }
  return overlap / queryTerms.size;
}

function recencyScore(value?: string) {
  if (!value) return 0.35;
  const ageMs = Date.now() - new Date(value).getTime();
  if (!Number.isFinite(ageMs) || ageMs < 0) return 0.45;
  const ageDays = ageMs / 86_400_000;
  return clamp(1 - ageDays / 30);
}

function evidenceWeight(type?: MemoryEvidenceItem["evidenceType"]) {
  if (type === "EXTRACTED") return 0.16;
  if (type === "INFERRED") return 0.1;
  if (type === "AMBIGUOUS") return 0.04;
  return 0.08;
}

function normalizeItems(items: MemoryEvidenceItem[], limit: number) {
  const deduped = new Map<string, MemoryEvidenceItem>();
  for (const item of items) {
    const key = `${item.source}:${item.label}:${item.detail}`;
    const existing = deduped.get(key);
    if (!existing || item.score > existing.score) deduped.set(key, item);
  }
  return [...deduped.values()]
    .sort((left, right) => right.score - left.score || right.confidence - left.confidence)
    .slice(0, limit);
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

export function rankMemoryEvidence(input: {
  query: string;
  chunks: MemoryChunk[];
  nodes: OntologyNode[];
  messages: ConversationMessage[];
  limit?: number;
}): MemoryEvidenceItem[] {
  const limit = Math.max(1, Math.min(12, input.limit ?? 6));
  const queryTerms = new Set(tokenize(input.query));
  const items: MemoryEvidenceItem[] = [];

  for (const chunk of input.chunks) {
    const overlap = overlapScore(queryTerms, `${chunk.content} ${chunk.tags.join(" ")}`);
    const score = clamp(overlap * 0.46 + chunk.salience * 0.24 + recencyScore(chunk.createdAt) * 0.14 + evidenceWeight(chunk.evidenceType));
    if (overlap > 0 || score >= 0.42) {
      items.push({
        id: chunk.id ?? `${chunk.kind}:${chunk.content}`,
        source: "memory",
        label: `${memoryKindLabel(chunk.kind)} 기억`,
        detail: compactText(chunk.content, 220),
        score,
        confidence: clamp(chunk.salience * 0.7 + evidenceWeight(chunk.evidenceType)),
        evidenceType: chunk.evidenceType,
        createdAt: chunk.createdAt,
        tags: chunk.tags,
      });
    }
  }

  for (const node of input.nodes) {
    const overlap = overlapScore(queryTerms, `${node.type} ${node.label} ${node.summary}`);
    const score = clamp(overlap * 0.42 + node.confidence * 0.25 + Math.min(0.12, node.evidenceCount * 0.03) + evidenceWeight(node.certainty));
    if (overlap > 0 || score >= 0.5) {
      items.push({
        id: node.id ?? `${node.type}:${node.label}`,
        source: "ontology",
        label: `${node.type} / ${node.tier}`,
        detail: compactText(`${node.label}: ${node.summary}`, 220),
        score,
        confidence: node.confidence,
        evidenceType: node.certainty,
        createdAt: node.lastEvidenceAt,
        tags: [node.layer, node.tier],
      });
    }
  }

  for (const message of input.messages.filter((message) => message.role === "user")) {
    const overlap = overlapScore(queryTerms, message.content);
    const score = clamp(overlap * 0.52 + recencyScore(message.createdAt) * 0.18 + 0.08);
    if (overlap > 0 || score >= 0.46) {
      items.push({
        id: message.id,
        source: "message",
        label: "사용자 메시지",
        detail: compactText(message.content, 220),
        score,
        confidence: clamp(score),
        evidenceType: "EXTRACTED",
        createdAt: message.createdAt,
        tags: [message.source],
      });
    }
  }

  return normalizeItems(items, limit);
}
