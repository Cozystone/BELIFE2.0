import { clamp, compactText } from "@/lib/utils";
import type {
  BehaviorSnapshot,
  MemoryEvidenceItem,
  MentalStateEstimate,
  OntologyNode,
  TwinEvidenceItem,
  TwinReflection,
  UserProfile,
} from "./types";

export interface BuildTwinReflectionInput {
  answer: string;
  question: string;
  profile: UserProfile | null;
  state: MentalStateEstimate | null;
  behavior: BehaviorSnapshot | null;
  nodes: OntologyNode[];
  retrievedEvidence?: MemoryEvidenceItem[];
}

export function buildTwinReflection(input: BuildTwinReflectionInput): TwinReflection {
  const evidence = buildTwinEvidence(input);
  const confidence = calculateTwinConfidence(evidence, input.state, input.behavior, input.nodes);
  const uncertainties = buildUncertainties(input, evidence);

  return {
    answer: input.answer,
    confidence,
    confidenceLabel: twinConfidenceLabel(confidence),
    evidence,
    uncertainties,
    nextQuestion: buildNextQuestion(input.question, input.state),
    guardrail: "BELIFE Twin은 증거가 있는 자기 구조만 반사하며, 진단이나 확정적 예측을 하지 않습니다.",
  };
}

export function calculateTwinConfidence(
  evidence: TwinEvidenceItem[],
  state: MentalStateEstimate | null,
  behavior: BehaviorSnapshot | null,
  nodes: OntologyNode[],
) {
  const evidenceCoverage = clamp(evidence.length / 6);
  const stateConfidence = state?.confidence ?? 0;
  const behaviorConfidence = behavior?.confidence ?? 0;
  const ontologyConfidence = nodes.length
    ? nodes.slice(0, 8).reduce((sum, node) => sum + node.confidence, 0) / Math.min(nodes.length, 8)
    : 0;

  return clamp(
    evidenceCoverage * 0.22 +
      stateConfidence * 0.28 +
      behaviorConfidence * 0.2 +
      ontologyConfidence * 0.22 +
      Math.min(0.08, nodes.length * 0.01),
  );
}

function buildTwinEvidence(input: BuildTwinReflectionInput): TwinEvidenceItem[] {
  const evidence: TwinEvidenceItem[] = [];
  const retrievedEvidence: TwinEvidenceItem[] = [];

  if (input.profile?.currentGoal) {
    evidence.push({
      source: "profile",
      label: "현재 목표",
      detail: compactText(input.profile.currentGoal, 140),
      confidence: 0.78,
    });
  }

  if (input.profile?.importantValue) {
    evidence.push({
      source: "profile",
      label: "중요 가치",
      detail: compactText(input.profile.importantValue, 140),
      confidence: 0.76,
    });
  }

  if (input.state) {
    evidence.push({
      source: "state",
      label: "최근 상태",
      detail: compactText(input.state.summary, 160),
      confidence: input.state.confidence,
    });
  }

  if (input.behavior) {
    evidence.push({
      source: "behavior",
      label: "대화 행동",
      detail: compactText(input.behavior.summary, 160),
      confidence: input.behavior.confidence,
    });
  }

  for (const item of (input.retrievedEvidence ?? []).slice(0, 3)) {
    retrievedEvidence.push({
      source: item.source,
      label: item.label,
      detail: compactText(item.detail, 170),
      confidence: Math.max(item.confidence, item.score),
    });
  }

  for (const node of input.nodes.slice(0, 4)) {
    evidence.push({
      source: "ontology",
      label: `${node.type} / ${node.tier}`,
      detail: compactText(`${node.label}: ${node.summary}`, 170),
      confidence: node.confidence,
    });
  }

  const rankedRetrieved = retrievedEvidence.sort((left, right) => right.confidence - left.confidence).slice(0, 2);
  const rankedStructural = evidence.sort((left, right) => right.confidence - left.confidence);
  return [...rankedRetrieved, ...rankedStructural].slice(0, 6);
}

function buildUncertainties(input: BuildTwinReflectionInput, evidence: TwinEvidenceItem[]) {
  const uncertainties = [];
  if (!input.state) uncertainties.push("최근 상태 추정이 부족해 지금의 컨디션 변화는 조심스럽게 봅니다.");
  if (!input.behavior) uncertainties.push("대화 행동 관측이 부족해 말의 속도와 반응 패턴은 아직 초기 가설입니다.");
  if (input.nodes.length < 4) uncertainties.push("온톨로지 노드가 더 쌓이면 반복 패턴과 핵심 가치의 구분이 선명해집니다.");
  if (evidence.length < 3) uncertainties.push("현재 답변은 제한된 증거에 기반한 초기 반사입니다.");
  return uncertainties.length
    ? uncertainties
    : ["이 해석은 현재까지의 증거에 근거하지만, 다음 대화에서 달라질 수 있는 가설입니다."];
}

function buildNextQuestion(question: string, state: MentalStateEstimate | null) {
  if (state && state.rumination > 0.55) return "이 반복 생각이 시작되는 가장 작은 장면은 언제인가요?";
  if (state && state.burnoutRisk > 0.5) return "지금 필요한 것은 더 큰 결심인가요, 아니면 회복 시간을 확보하는 것인가요?";
  if (/관계|사람|친구|연결/.test(question)) return "이 관계에서 내가 편안해지는 순간과 방어적으로 변하는 순간은 각각 언제인가요?";
  return "이 질문에서 내가 진짜 확인하고 싶은 것은 사실, 감정, 선택 중 무엇인가요?";
}

function twinConfidenceLabel(confidence: number): TwinReflection["confidenceLabel"] {
  if (confidence >= 0.78) return "strong";
  if (confidence >= 0.58) return "grounded";
  if (confidence >= 0.34) return "forming";
  return "early";
}
