import { clamp, isoNow } from "@/lib/utils";
import type {
  CompatibilityAxes,
  ConnectionQualityAxis,
  ConnectionQualityLensReport,
  RelationshipMemoryReport,
  RelationshipPairMemorySummary,
} from "./types";

interface RelationshipMemorySignals {
  averageQuality: number;
  emotionalSafety: number;
  reciprocity: number;
  repairEvidence: number;
  confidence: number;
  riskPenalty: number;
  strongestPair?: RelationshipPairMemorySummary;
  riskiestPair?: RelationshipPairMemorySummary;
}

export function buildConnectionQualityLens(input: {
  preview: CompatibilityAxes;
  relationshipMemory: RelationshipMemoryReport;
}): ConnectionQualityLensReport {
  const { preview, relationshipMemory } = input;
  const memorySignals = summarizeRelationshipMemory(relationshipMemory.pairs);
  const scenarioCuriosity = average(preview.scenarioPreviews.map((scenario) => scenario.state.curiosity));
  const vulnerabilitySafety =
    preview.scenarioPreviews.find((scenario) => scenario.type === "emotional_vulnerability")?.state.emotionalSafety ??
    preview.emotionalSafety;
  const repairScenario =
    preview.scenarioPreviews.find((scenario) => scenario.type === "repair_attempt")?.state.repairWillingness ??
    preview.repairPotential;

  const axes: ConnectionQualityAxis[] = [
    qualityAxis({
      key: "sharedReality",
      label: "공유 현실감",
      score:
        preview.hiddenEdge.sharedReality * 0.38 +
        preview.structuralSimilarity * 0.22 +
        memorySignals.averageQuality * 0.16 +
        memorySignals.reciprocity * 0.14 +
        memorySignals.confidence * 0.1,
      interpretation: "두 사람이 같은 의미, 맥락, 현실감을 보고 있다고 느낄 수 있는 정도입니다.",
      evidence: [
        `잠재 공유 현실감 ${percent(preview.hiddenEdge.sharedReality)}`,
        `구조적 유사성 ${percent(preview.structuralSimilarity)}`,
        `관찰된 관계 질 ${percent(memorySignals.averageQuality)}`,
      ],
      nextObservation: "다음 의미 있는 대화에서 상대가 조언으로 넘어가기 전에 내 실제 의미를 먼저 반영하는지 보세요.",
    }),
    qualityAxis({
      key: "partnerResponsiveness",
      label: "상대 반응성",
      score:
        preview.hiddenEdge.responsiveness * 0.32 +
        preview.dialogueCompatibility * 0.2 +
        memorySignals.reciprocity * 0.18 +
        memorySignals.repairEvidence * 0.16 +
        memorySignals.emotionalSafety * 0.14,
      interpretation: "이해받고, 존중받고, 적절한 속도로 응답받는 느낌이 얼마나 분명한지 봅니다.",
      evidence: [
        `반응성 ${percent(preview.hiddenEdge.responsiveness)}`,
        `대화 적합도 ${percent(preview.dialogueCompatibility)}`,
        `관찰된 회복 근거 ${percent(memorySignals.repairEvidence)}`,
      ],
      nextObservation: "작은 필요나 경계를 하나 말한 뒤, 응답이 더 구체적이고 차분하며 상호적으로 바뀌는지 보세요.",
    }),
    qualityAxis({
      key: "participantInterest",
      label: "상호 관심",
      score:
        scenarioCuriosity * 0.28 +
        memorySignals.averageQuality * 0.24 +
        memorySignals.reciprocity * 0.22 +
        preview.complementarity * 0.14 +
        preview.hiddenEdge.modeScores.friendship * 0.12,
      interpretation: "관계가 시간이 지나도 스스로 다시 선택될 만큼 관심이 지속적이고 상호적인지 봅니다.",
      evidence: [
        `시나리오 호기심 ${percent(scenarioCuriosity)}`,
        `상호성 ${percent(memorySignals.reciprocity)}`,
        `우정 모드 ${percent(preview.hiddenEdge.modeScores.friendship)}`,
      ],
      nextObservation: "한 번의 강한 순간보다 양쪽에서 반복적으로 주도성이 나오는지 보세요.",
    }),
    qualityAxis({
      key: "affectiveExperience",
      label: "정서 경험",
      score:
        preview.emotionalSafety * 0.26 +
        memorySignals.emotionalSafety * 0.26 +
        vulnerabilitySafety * 0.16 +
        preview.repairPotential * 0.12 +
        repairScenario * 0.1 +
        (1 - memorySignals.riskPenalty) * 0.1,
      interpretation: "친밀감이나 압박이 커질 때 감정 톤이 안전하고 자연스럽고 회복 가능한지 봅니다.",
      evidence: [
        `정서적 안전감 ${percent(preview.emotionalSafety)}`,
        `관찰된 안전감 ${percent(memorySignals.emotionalSafety)}`,
        `위험 역지표 ${percent(1 - memorySignals.riskPenalty)}`,
      ],
      nextObservation: "약한 압박 뒤에 몸이 더 안정되는지, 아니면 더 경계하고 움츠러드는지 살펴보세요.",
    }),
  ];

  const confidence = clamp(
    preview.relationshipReport.confidence * 0.5 +
      memorySignals.confidence * 0.28 +
      Math.min(1, relationshipMemory.totalInteractions / 5) * 0.22,
  );
  const weakestAxis = [...axes].sort((left, right) => left.score - right.score)[0];
  const strongestAxis = [...axes].sort((left, right) => right.score - left.score)[0];

  return {
    generatedAt: isoNow(),
    confidence,
    summary: buildQualitySummary(strongestAxis, weakestAxis, confidence, relationshipMemory.totalInteractions),
    guardrail:
      "이 연결 품질 렌즈는 BELIFE의 개인적 자기 이해를 위한 비공개 상호작용 해석입니다. 공개 매칭, 진단, 결정론적 관계 예측이 아닙니다.",
    memoryCoverage: {
      pairCount: relationshipMemory.pairCount,
      totalInteractions: relationshipMemory.totalInteractions,
      strongestPair: memorySignals.strongestPair?.personLabel,
      riskiestPair: memorySignals.riskiestPair?.personLabel,
    },
    axes,
    comfortSources: buildComfortSources(preview, memorySignals, strongestAxis),
    tensionSources: buildTensionSources(preview, memorySignals, weakestAxis),
    healthyPattern: buildHealthyPattern(strongestAxis, memorySignals),
    riskyPattern: buildRiskyPattern(weakestAxis, memorySignals),
    nextMicroExperiments: buildMicroExperiments(axes, relationshipMemory.totalInteractions),
  };
}

function qualityAxis(input: Omit<ConnectionQualityAxis, "score" | "level"> & { score: number }): ConnectionQualityAxis {
  const score = clamp(input.score);
  return {
    ...input,
    score,
    level: scoreLevel(score),
  };
}

function summarizeRelationshipMemory(pairs: RelationshipPairMemorySummary[]): RelationshipMemorySignals {
  if (!pairs.length) {
    return {
      averageQuality: 0.46,
      emotionalSafety: 0.46,
      reciprocity: 0.46,
      repairEvidence: 0.34,
      confidence: 0.12,
      riskPenalty: 0.38,
    };
  }

  const strongestPair = [...pairs].sort((left, right) => pairHealth(right) - pairHealth(left))[0];
  const riskiestPair = [...pairs].sort((left, right) => pairRisk(right) - pairRisk(left))[0];
  return {
    averageQuality: average(pairs.map((pair) => pair.averageQuality)),
    emotionalSafety: average(pairs.map((pair) => pair.emotionalSafety)),
    reciprocity: average(pairs.map((pair) => pair.reciprocity)),
    repairEvidence: average(pairs.map((pair) => pair.repairEvidence)),
    confidence: average(pairs.map((pair) => pair.confidence)),
    riskPenalty: average(pairs.map(pairRisk)),
    strongestPair,
    riskiestPair,
  };
}

function buildQualitySummary(
  strongestAxis: ConnectionQualityAxis,
  weakestAxis: ConnectionQualityAxis,
  confidence: number,
  totalInteractions: number,
) {
  const evidencePhrase =
    totalInteractions >= 3
      ? "반복된 관계 기억 근거가 쌓이고 있습니다"
      : "관계 기억이 아직 초기라 BELIFE는 이것을 작업 가설로만 둡니다";
  return `현재 가장 또렷한 품질 신호는 ${strongestAxis.label}이고, 다음 관찰이 필요한 축은 ${weakestAxis.label}입니다. ${evidencePhrase}. 신뢰도 ${percent(confidence)}.`;
}

function buildComfortSources(
  preview: CompatibilityAxes,
  memorySignals: RelationshipMemorySignals,
  strongestAxis: ConnectionQualityAxis,
) {
  return [
    `${strongestAxis.label}이 가장 강한 품질 신호로 보이며 점수는 ${percent(strongestAxis.score)}입니다.`,
    `정서적 안전감은 잠재 적합도 ${percent(preview.emotionalSafety)}와 관찰된 관계 안전감 ${percent(
      memorySignals.emotionalSafety,
    )}를 함께 봅니다.`,
    memorySignals.strongestPair
      ? `${memorySignals.strongestPair.personLabel} 관계에서 현재 가장 강한 근거가 보입니다.`
      : "아직 반복 근거가 충분한 특정 관계가 없어, 편안함은 천천히 검증해야 합니다.",
  ];
}

function buildTensionSources(
  preview: CompatibilityAxes,
  memorySignals: RelationshipMemorySignals,
  weakestAxis: ConnectionQualityAxis,
) {
  return [
    `${weakestAxis.label}은 다음에 관찰할 긴장 렌즈로 가장 유용합니다.`,
    `갈등 적합도 ${percent(preview.conflictCompatibility)}와 회복 기억 ${percent(
      memorySignals.repairEvidence,
    )}가 현재 회복 가능성의 상한을 만듭니다.`,
    memorySignals.riskiestPair
      ? `${memorySignals.riskiestPair.personLabel} 관계에 가장 높은 개인 위험 신호가 있습니다.`
      : "지금의 긴장은 위험의 증거라기보다 아직 비어 있는 근거에서 옵니다.",
  ];
}

function buildHealthyPattern(strongestAxis: ConnectionQualityAxis, memorySignals: RelationshipMemorySignals) {
  if (memorySignals.repairEvidence >= 0.45) {
    return `더 건강한 패턴은 ${strongestAxis.label}이 작은 오해 뒤의 명시적 회복과 함께 나타날 때입니다.`;
  }
  return `더 건강한 패턴은 ${strongestAxis.label}을 유지하되, 친밀도를 키우기 전에 상호성과 회복 근거를 더 확인하는 것입니다.`;
}

function buildRiskyPattern(weakestAxis: ConnectionQualityAxis, memorySignals: RelationshipMemorySignals) {
  if (memorySignals.riskPenalty >= 0.58) {
    return `위험한 패턴은 ${weakestAxis.label}이 충분하지 않은 상태에서 강도만 반복되고, 긴장 뒤 회복이 빠지는 경우입니다.`;
  }
  return `위험한 패턴은 ${weakestAxis.label}의 반복 근거가 생기기 전에 초기의 따뜻함을 안정적 연결로 과해석하는 것입니다.`;
}

function buildMicroExperiments(axes: ConnectionQualityAxis[], totalInteractions: number) {
  const weakest = [...axes].sort((left, right) => left.score - right.score)[0];
  const base = [weakest.nextObservation, "상호작용 한 번 뒤에 돌봄, 주도성, 회복이 양방향으로 움직였는지 기록하세요."];
  if (totalInteractions < 2) {
    base.push("이 렌즈를 안정적인 해석으로 보기 전에 동의한 관계 기억 메모를 하나 더 추가하세요.");
  } else {
    base.push("최근 두 번의 상호작용을 비교하고, 가장 좋았던 한 순간보다 반복된 품질을 보세요.");
  }
  return base;
}

function pairHealth(pair: RelationshipPairMemorySummary) {
  return (
    pair.averageQuality * 0.24 +
    pair.emotionalSafety * 0.3 +
    pair.reciprocity * 0.24 +
    pair.repairEvidence * 0.16 +
    pair.confidence * 0.06
  );
}

function pairRisk(pair: RelationshipPairMemorySummary) {
  const levelRisk = pair.riskLevel === "high" ? 0.86 : pair.riskLevel === "moderate" ? 0.54 : 0.2;
  return clamp(
    levelRisk * 0.42 +
      (1 - pair.emotionalSafety) * 0.22 +
      (1 - pair.reciprocity) * 0.18 +
      (1 - pair.repairEvidence) * 0.12 +
      (1 - pair.averageQuality) * 0.06,
  );
}

function scoreLevel(score: number): ConnectionQualityAxis["level"] {
  if (score >= 0.72) return "strong";
  if (score >= 0.56) return "clear";
  if (score >= 0.38) return "building";
  return "low";
}

function percent(value: number) {
  return Math.round(clamp(value) * 100);
}

function average(values: number[]) {
  return values.length ? clamp(values.reduce((sum, value) => sum + value, 0) / values.length) : 0;
}
