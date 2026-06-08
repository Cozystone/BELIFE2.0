import type { BelifeMemoryTimelineItem, OntologyGraphRelation, OntologyNodeType } from "@/lib/engines/types";

const ontologyTypeLabels: Record<OntologyNodeType, string> = {
  Value: "가치",
  Belief: "믿음",
  Goal: "목표",
  EmotionPattern: "감정 패턴",
  DecisionPattern: "결정 패턴",
  FrictionPattern: "마찰 신호",
  EnergyPattern: "에너지",
  GrowthTrajectory: "성장 방향",
  RiskSignal: "주의 신호",
  RecoveryHint: "회복 단서",
  CognitiveBiasCandidate: "해석 주의",
};

const relationLabels: Record<OntologyGraphRelation, string> = {
  anchors: "근거 고정",
  drives: "방향 형성",
  shapes: "표현 형성",
  amplifies: "강도 증폭",
  needs_recovery: "회복 필요",
  orients_connection: "관계 방향",
  co_occurs: "동시 관찰",
};

const titleLabels: Record<string, string> = {
  "mental state estimate": "상태 추정",
  "behavior snapshot": "행동 신호 스냅샷",
  "semantic memory": "의미 기억",
  "state memory": "상태 기억",
  "behavior memory": "행동 기억",
  "relationship memory": "관계 기억",
  "raw memory": "원문 기억",
};

const tagLabels: Record<string, string> = {
  active: "활성",
  archive: "보관",
  behavior: "행동",
  communication: "소통",
  conversation: "대화",
  memory: "기억",
  "ontology-edge": "구조 연결",
  relationship: "관계",
  "self-understanding": "자기 이해",
  shapes: "표현 형성",
  amplifies: "강도 증폭",
  anchors: "근거 고정",
  drives: "방향 형성",
  needs_recovery: "회복 필요",
  orients_connection: "관계 방향",
  co_occurs: "동시 관찰",
};

export function displayTimelineTitle(item: BelifeMemoryTimelineItem) {
  const title = item.title.trim();
  const normalized = title.toLocaleLowerCase("en-US");
  if (titleLabels[normalized]) return titleLabels[normalized];

  const edgeMatch = title.match(/^Ontology edge - ([A-Za-z_]+)$/);
  if (edgeMatch) {
    const relation = edgeMatch[1] as OntologyGraphRelation;
    return `온톨로지 연결 · ${relationLabels[relation] ?? edgeMatch[1]}`;
  }

  const typeMatch = title.match(/^([A-Za-z]+) · (.+)$/);
  if (typeMatch) {
    const type = typeMatch[1] as OntologyNodeType;
    return `${ontologyTypeLabels[type] ?? typeMatch[1]} · ${typeMatch[2]}`;
  }

  return title;
}

export function displayMemoryTag(tag: string) {
  return tagLabels[tag] ?? tag;
}

function hasFinalConsonant(value: string) {
  const match = [...value.trim()].reverse().find((char) => /\S/.test(char));
  if (!match) return false;
  const code = match.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

export function withJosa(value: string, pair: "은/는" | "이/가" | "을/를" | "과/와") {
  const hasBatchim = hasFinalConsonant(value);
  const particle = {
    "은/는": hasBatchim ? "은" : "는",
    "이/가": hasBatchim ? "이" : "가",
    "을/를": hasBatchim ? "을" : "를",
    "과/와": hasBatchim ? "과" : "와",
  }[pair];

  return `${value}${particle}`;
}
