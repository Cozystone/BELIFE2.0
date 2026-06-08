import { compactText, isoNow } from "@/lib/utils";
import type {
  EvidenceType,
  ImportanceTier,
  MemoryChunk,
  OntologyGraphEdge,
  OntologyGraphModel,
  OntologyGraphRelation,
  OntologyLayer,
  OntologyNode,
  OntologyNodeType,
} from "./types";

const contradictionHints = [
  "아니",
  "더 이상",
  "이제는",
  "바뀌",
  "반대",
  "틀렸",
  "예전",
  "not anymore",
  "changed",
  "opposite",
  "no longer",
];

interface CandidateSeed {
  type: OntologyNodeType;
  label: string;
  summary: string;
  tier?: ImportanceTier;
  layer?: OntologyLayer;
}

const keywordGroups = {
  goal: ["목표", "하고 싶", "이루고", "성장", "goal", "want", "achieve", "build"],
  value: ["가치", "중요", "의미", "일관", "진정성", "자유", "안정", "meaning", "value"],
  stress: ["불안", "걱정", "초조", "스트레스", "압박", "막막", "anxious", "worried", "stress"],
  rumination: ["계속", "반복", "자꾸", "되풀이", "생각이 많", "ruminate", "again"],
  decision: ["결정", "선택", "해야", "판단", "decision", "choose"],
  energy: ["지침", "피곤", "무기력", "소진", "번아웃", "exhausted", "tired", "burnout"],
  relationship: ["관계", "사람", "친구", "연결", "대화", "connection", "relationship"],
  recovery: ["쉬고", "회복", "정리", "조절", "차분", "rest", "recover"],
};

function includesAny(text: string, keywords: string[]) {
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}

function tierRank(tier: ImportanceTier) {
  return tier === "L1" ? 3 : tier === "L2" ? 2 : 1;
}

function strongerTier(left: ImportanceTier, right: ImportanceTier): ImportanceTier {
  return tierRank(right) > tierRank(left) ? right : left;
}

function strongerCertainty(left: EvidenceType, right: EvidenceType): EvidenceType {
  const rank: Record<EvidenceType, number> = { AMBIGUOUS: 0, INFERRED: 1, EXTRACTED: 2 };
  return rank[right] > rank[left] ? right : left;
}

function candidate(type: OntologyNodeType, label: string, summary: string, tier: ImportanceTier = "L2"): CandidateSeed {
  return { type, label, summary, tier, layer: tier === "L1" ? "core" : "active" };
}

export function extractOntologyCandidates(userId: string, text: string): OntologyNode[] {
  const seeds: CandidateSeed[] = [];
  const lower = text.toLowerCase();
  const evidence = compactText(text);

  if (includesAny(lower, keywordGroups.goal)) {
    seeds.push(candidate("Goal", "현재 목표를 분명히 하고 전진하려는 욕구", evidence, "L1"));
  }
  if (includesAny(lower, keywordGroups.value)) {
    seeds.push(candidate("Value", "의미와 일관성을 중시함", "결정과 관계에서 의미, 가치, 일관성의 신호가 반복됩니다.", "L1"));
  }
  if (includesAny(lower, keywordGroups.stress)) {
    seeds.push(candidate("EmotionPattern", "불확실성에서 긴장이 올라옴", "해석되지 않은 상황에서 걱정과 압박 신호가 커지는 경향이 보입니다."));
  }
  if (includesAny(lower, keywordGroups.rumination)) {
    seeds.push(candidate("FrictionPattern", "반복 사고 루프", "같은 문제를 다시 생각하며 원인과 구조를 찾으려는 신호가 있습니다."));
  }
  if (includesAny(lower, keywordGroups.decision)) {
    seeds.push(candidate("DecisionPattern", "선택 전 구조화 욕구", "결정 전에 감정, 기준, 리스크를 분리해 보고 싶어 하는 패턴이 보입니다."));
  }
  if (includesAny(lower, keywordGroups.energy)) {
    seeds.push(candidate("EnergyPattern", "에너지 소진 신호", "동기보다 회복과 조절이 먼저 필요할 수 있는 상태 신호입니다."));
  }
  if (includesAny(lower, keywordGroups.relationship)) {
    seeds.push(candidate("GrowthTrajectory", "안전하고 지속 가능한 연결 지향", "표면적 친밀감보다 안전하고 오래 유지 가능한 관계를 찾는 방향이 보입니다."));
  }
  if (includesAny(lower, keywordGroups.recovery)) {
    seeds.push(candidate("RecoveryHint", "회복을 위한 조절 필요", "속도를 낮추고 생각을 정리할 때 상태 해석이 더 선명해질 수 있습니다.", "L3"));
  }

  if (!seeds.length) {
    seeds.push(candidate("Belief", "대화를 통해 자기 이해를 개선하려는 믿음", evidence));
  }

  return seeds.map((seed) => ({
    userId,
    type: seed.type,
    label: seed.label,
    summary: seed.summary,
    layer: seed.layer ?? "active",
    tier: seed.tier ?? "L2",
    certainty: seed.tier === "L1" ? "EXTRACTED" : "INFERRED",
    confidence: seed.tier === "L1" ? 0.72 : seed.tier === "L3" ? 0.46 : 0.58,
    evidenceCount: 1,
    status: "active",
    lastEvidenceAt: isoNow(),
  }));
}

export function createMemoryChunks(userId: string, text: string, messageId?: string): MemoryChunk[] {
  return [
    {
      userId,
      messageId,
      content: compactText(text, 420),
      kind: "semantic",
      salience: Math.min(1, 0.32 + text.length / 900),
      evidenceType: "EXTRACTED",
      tags: ["conversation", "self-understanding"],
    },
  ];
}

export function filterOntologyView(nodes: OntologyNode[], view: "core" | "expanded" | "full") {
  const active = nodes.filter((node) => node.status !== "archived" && node.layer !== "archive");
  if (view === "core") return active.filter((node) => node.tier === "L1");
  if (view === "expanded") return active.filter((node) => node.tier === "L1" || node.tier === "L2");
  return active;
}

export function mergeOntologyEvidence(existing: OntologyNode, incoming: OntologyNode): OntologyNode {
  const contradictionText = `${incoming.label} ${incoming.summary}`.toLowerCase();
  const contradictsExisting =
    incoming.certainty === "AMBIGUOUS" && contradictionHints.some((hint) => contradictionText.includes(hint));
  const evidenceCount = existing.evidenceCount + Math.max(1, incoming.evidenceCount);

  if (contradictsExisting) {
    const confidence = Math.max(0.08, Math.min(1, existing.confidence * 0.68 + incoming.confidence * 0.18));
    const shouldArchive = confidence < 0.3 && existing.tier === "L3";

    return {
      ...existing,
      summary: incoming.summary,
      certainty: "AMBIGUOUS",
      confidence,
      evidenceCount,
      status: shouldArchive ? "archived" : "active",
      layer: shouldArchive ? "archive" : existing.layer,
      lastEvidenceAt: incoming.lastEvidenceAt,
    };
  }

  const tier = strongerTier(existing.tier, incoming.tier);
  const confidence = Math.min(0.96, Math.max(existing.confidence, incoming.confidence) + Math.min(0.08, evidenceCount * 0.004));

  return {
    ...existing,
    summary: incoming.summary.length >= existing.summary.length ? incoming.summary : existing.summary,
    layer: tier === "L1" ? "core" : incoming.layer === "archive" ? existing.layer : incoming.layer,
    tier,
    certainty: strongerCertainty(existing.certainty, incoming.certainty),
    confidence,
    evidenceCount,
    status: "active",
    lastEvidenceAt: incoming.lastEvidenceAt,
  };
}

export function applyOntologyMemoryPolicy(nodes: OntologyNode[], now = isoNow()): OntologyNode[] {
  const nowMs = new Date(now).getTime();

  return nodes.map((node) => {
    if (node.status === "archived" || node.layer === "archive") return node;

    const lastEvidenceMs = new Date(node.lastEvidenceAt).getTime();
    const ageDays = Number.isFinite(lastEvidenceMs) ? Math.max(0, (nowMs - lastEvidenceMs) / 86_400_000) : 0;
    const isCore = node.tier === "L1" || node.layer === "core";
    if (ageDays <= 30) return node;

    const staleFactor = Math.min(1, Math.max(0, (ageDays - 30) / 150));
    const ambiguityPenalty = node.certainty === "AMBIGUOUS" ? 0.06 : 0;
    const lowEvidencePenalty = node.evidenceCount <= 1 ? 0.04 : 0;
    const staleConfidenceCeiling = Math.max(
      0.08,
      Math.min(1, 0.62 - staleFactor * 0.26 - ambiguityPenalty - lowEvidencePenalty + Math.min(0.12, node.evidenceCount * 0.02)),
    );
    const confidence = isCore ? node.confidence : Math.min(node.confidence, staleConfidenceCeiling);
    const shouldArchive =
      !isCore &&
      ((ageDays > 90 && node.tier === "L3" && confidence < 0.34) ||
        (ageDays > 60 && node.certainty === "AMBIGUOUS" && node.evidenceCount <= 1));

    return {
      ...node,
      certainty: confidence < 0.38 && node.certainty !== "EXTRACTED" ? "AMBIGUOUS" : node.certainty,
      confidence,
      status: shouldArchive ? "archived" : node.status,
      layer: shouldArchive ? "archive" : node.layer,
    };
  });
}

export function buildOntologyGraph(nodes: OntologyNode[]): OntologyGraphModel {
  const visibleNodes = [...nodes]
    .filter((node) => node.status !== "archived")
    .sort((a, b) => nodeRank(b) - nodeRank(a));
  const edges = deriveOntologyEdges(visibleNodes).slice(0, 14);

  return {
    generatedAt: isoNow(),
    nodes: visibleNodes,
    edges,
    summary: summarizeGraph(visibleNodes, edges),
  };
}

function deriveOntologyEdges(nodes: OntologyNode[]): OntologyGraphEdge[] {
  const edges: OntologyGraphEdge[] = [];

  for (const source of nodes) {
    for (const target of nodes) {
      if (nodeKey(source) === nodeKey(target)) continue;
      const relation = relationFor(source.type, target.type);
      if (!relation) continue;
      edges.push(createGraphEdge(source, target, relation));
    }
  }

  const deduped = new Map<string, OntologyGraphEdge>();
  for (const edge of edges) {
    const key = `${edge.sourceNodeId}:${edge.targetNodeId}:${edge.relation}`;
    const current = deduped.get(key);
    if (!current || edge.confidence > current.confidence) deduped.set(key, edge);
  }

  const sorted = [...deduped.values()].sort((a, b) => b.confidence - a.confidence);
  if (!sorted.length && nodes.length >= 2) {
    return [createGraphEdge(nodes[0], nodes[1], "co_occurs")];
  }
  return sorted;
}

function relationFor(source: OntologyNodeType, target: OntologyNodeType): OntologyGraphRelation | null {
  if ((source === "Value" || source === "Belief") && (target === "Goal" || target === "DecisionPattern")) return "anchors";
  if (source === "Goal" && (target === "DecisionPattern" || target === "GrowthTrajectory")) return "drives";
  if ((source === "EmotionPattern" || source === "EnergyPattern") && (target === "FrictionPattern" || target === "DecisionPattern")) {
    return "shapes";
  }
  if (source === "FrictionPattern" && (target === "EmotionPattern" || target === "EnergyPattern" || target === "DecisionPattern")) {
    return "amplifies";
  }
  if ((source === "FrictionPattern" || source === "EnergyPattern" || source === "EmotionPattern") && target === "RecoveryHint") {
    return "needs_recovery";
  }
  if ((source === "Value" || source === "GrowthTrajectory") && target === "GrowthTrajectory") return "orients_connection";
  if (source === "CognitiveBiasCandidate" && (target === "DecisionPattern" || target === "EmotionPattern")) return "shapes";
  return null;
}

function createGraphEdge(
  source: OntologyNode,
  target: OntologyNode,
  relation: OntologyGraphRelation,
): OntologyGraphEdge {
  const confidence = edgeConfidence(source, target, relation);
  return {
    id: `${nodeKey(source)}--${relation}--${nodeKey(target)}`,
    sourceNodeId: nodeKey(source),
    targetNodeId: nodeKey(target),
    relation,
    label: relationLabel(relation),
    certainty: edgeCertainty(source, target, confidence),
    confidence,
    explanation: relationExplanation(source, target, relation),
  };
}

function nodeKey(node: OntologyNode) {
  return node.id ?? `${node.type}:${node.label}`;
}

function nodeRank(node: OntologyNode) {
  const tierWeight = node.tier === "L1" ? 1 : node.tier === "L2" ? 0.66 : 0.36;
  const layerWeight = node.layer === "core" ? 0.2 : node.layer === "active" ? 0.1 : 0;
  return tierWeight + layerWeight + node.confidence * 0.6 + Math.min(0.3, node.evidenceCount * 0.04);
}

function edgeConfidence(source: OntologyNode, target: OntologyNode, relation: OntologyGraphRelation) {
  const relationWeight: Record<OntologyGraphRelation, number> = {
    anchors: 0.08,
    drives: 0.06,
    shapes: 0.04,
    amplifies: 0.03,
    needs_recovery: 0.05,
    orients_connection: 0.07,
    co_occurs: -0.08,
  };
  return Math.min(
    0.94,
    Math.max(
      0.24,
      (source.confidence + target.confidence) / 2 +
        Math.min(0.12, (source.evidenceCount + target.evidenceCount) * 0.015) +
        relationWeight[relation],
    ),
  );
}

function edgeCertainty(source: OntologyNode, target: OntologyNode, confidence: number): EvidenceType {
  if (source.certainty === "EXTRACTED" && target.certainty === "EXTRACTED" && confidence >= 0.7) return "EXTRACTED";
  if (confidence < 0.42 || source.certainty === "AMBIGUOUS" || target.certainty === "AMBIGUOUS") return "AMBIGUOUS";
  return "INFERRED";
}

function relationLabel(relation: OntologyGraphRelation) {
  const labels: Record<OntologyGraphRelation, string> = {
    anchors: "기준이 됨",
    drives: "방향을 밀어줌",
    shapes: "표현을 형성",
    amplifies: "강도를 키움",
    needs_recovery: "회복 단서 필요",
    orients_connection: "관계 방향을 정함",
    co_occurs: "함께 관찰됨",
  };
  return labels[relation];
}

function relationExplanation(source: OntologyNode, target: OntologyNode, relation: OntologyGraphRelation) {
  const sourceLabel = source.label;
  const targetLabel = target.label;
  const explanations: Record<OntologyGraphRelation, string> = {
    anchors: `${sourceLabel} 신호가 ${targetLabel}을 해석하는 기준점으로 작동합니다.`,
    drives: `${sourceLabel}이 ${targetLabel} 쪽 행동 방향을 밀어주는 구조로 보입니다.`,
    shapes: `${sourceLabel}이 ${targetLabel}의 표현 방식에 영향을 줄 수 있습니다.`,
    amplifies: `${sourceLabel}이 ${targetLabel}을 더 강하게 만들 수 있어 조심스럽게 봅니다.`,
    needs_recovery: `${sourceLabel}은 ${targetLabel} 같은 회복 단서와 함께 봐야 안전합니다.`,
    orients_connection: `${sourceLabel}이 더 건강한 연결 방향을 정렬하는 신호로 보입니다.`,
    co_occurs: `${sourceLabel}와 ${targetLabel}은 같은 맥락에서 함께 관찰된 초기 신호입니다.`,
  };
  return explanations[relation];
}

function summarizeGraph(nodes: OntologyNode[], edges: OntologyGraphEdge[]) {
  if (!nodes.length) return "아직 온톨로지 노드가 없습니다. 온보딩이나 첫 대화를 통해 자기 구조가 생깁니다.";
  if (!edges.length) return "자기 구조 노드는 생겼지만, 노드 사이의 관계는 아직 조심스럽게 비워둡니다.";
  const coreCount = nodes.filter((node) => node.tier === "L1").length;
  return `${nodes.length}개의 자기 구조 노드와 ${edges.length}개의 해석 가능한 연결이 있습니다. 핵심 구조 ${coreCount}개를 중심으로 관계를 읽습니다.`;
}
