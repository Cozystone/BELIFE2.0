import { compactText, isoNow } from "@/lib/utils";
import type { ImportanceTier, MemoryChunk, OntologyLayer, OntologyNode, OntologyNodeType } from "./types";

interface CandidateSeed {
  type: OntologyNodeType;
  label: string;
  summary: string;
  tier?: ImportanceTier;
  layer?: OntologyLayer;
}

function candidate(type: OntologyNodeType, label: string, summary: string, tier: ImportanceTier = "L2"): CandidateSeed {
  return { type, label, summary, tier, layer: tier === "L1" ? "core" : "active" };
}

export function extractOntologyCandidates(userId: string, text: string): OntologyNode[] {
  const seeds: CandidateSeed[] = [];
  const lower = text.toLowerCase();

  if (/목표|goal|하고 싶|되고 싶|성장/.test(lower)) {
    seeds.push(candidate("Goal", "현재 목표를 명확히 하려는 욕구", compactText(text), "L1"));
  }
  if (/가치|중요|meaning|의미|믿/.test(lower)) {
    seeds.push(candidate("Value", "의미와 일관성을 중시함", "결정이나 관계에서 의미, 가치, 일관성의 신호가 반복됨.", "L1"));
  }
  if (/불안|걱정|막막|초조|stress|anxious/.test(lower)) {
    seeds.push(candidate("EmotionPattern", "불확실성에서 긴장이 커짐", "불확실하거나 해석되지 않은 상황에서 긴장과 걱정 신호가 올라옴."));
  }
  if (/계속|반복|또|왜/.test(lower)) {
    seeds.push(candidate("FrictionPattern", "반복 사고 루프", "같은 문제를 다시 생각하며 원인 구조를 찾으려는 경향."));
  }
  if (/결정|선택|해야|decision/.test(lower)) {
    seeds.push(candidate("DecisionPattern", "선택 전 구조 확인 필요", "결정 전에 감정, 기준, 리스크를 분리하면 도움이 됨."));
  }
  if (/피곤|지쳤|무기력|burnout|tired/.test(lower)) {
    seeds.push(candidate("EnergyPattern", "에너지 소진 신호", "동기보다 회복과 조절이 먼저 필요할 수 있는 상태 신호."));
  }
  if (/친구|사람|관계|연애|팀|connection|relationship/.test(lower)) {
    seeds.push(candidate("GrowthTrajectory", "더 안전한 관계 선택을 원함", "표면적 친밀감보다 안전하고 지속 가능한 연결을 찾는 방향."));
  }

  if (!seeds.length) {
    seeds.push(candidate("Belief", "자기 이해를 통해 선택을 개선하려 함", compactText(text)));
  }

  return seeds.map((seed) => ({
    userId,
    type: seed.type,
    label: seed.label,
    summary: seed.summary,
    layer: seed.layer ?? "active",
    tier: seed.tier ?? "L2",
    certainty: "INFERRED",
    confidence: seed.tier === "L1" ? 0.72 : 0.58,
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
