import { compactText, isoNow } from "@/lib/utils";
import type { ImportanceTier, MemoryChunk, OntologyLayer, OntologyNode, OntologyNodeType } from "./types";

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
