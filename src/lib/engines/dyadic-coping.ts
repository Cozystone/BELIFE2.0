import { clamp, isoNow } from "@/lib/utils";
import type {
  CompatibilityAxes,
  ConnectionScenarioPreview,
  DyadicCopingAxis,
  DyadicCopingReport,
  MentalStateEstimate,
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

export function buildDyadicCopingReport(input: {
  preview: CompatibilityAxes;
  relationshipMemory: RelationshipMemoryReport;
  state: MentalStateEstimate | null;
}): DyadicCopingReport {
  const { preview, relationshipMemory, state } = input;
  const memorySignals = summarizeRelationshipMemory(relationshipMemory.pairs);
  const pressure = scenarioByType(preview, "pressure");
  const misunderstanding = scenarioByType(preview, "misunderstanding");
  const repair = scenarioByType(preview, "repair_attempt");
  const vulnerability = scenarioByType(preview, "emotional_vulnerability");
  const collaboration = scenarioByType(preview, "collaboration");
  const drift = scenarioByType(preview, "longitudinal_drift");

  const currentStress = state?.stressLoad ?? 0.42;
  const currentWithdrawal = state?.socialWithdrawal ?? 0.32;
  const supportNeed = state?.supportNeed ?? 0.42;
  const volatility = state?.emotionalVolatility ?? 0.34;
  const scenarioStress = clamp(
    pressure.state.irritation * 0.22 +
      pressure.state.disengagementRisk * 0.24 +
      misunderstanding.state.irritation * 0.18 +
      drift.state.disengagementRisk * 0.18 +
      currentStress * 0.18,
  );
  const withdrawalRisk = clamp(
    currentWithdrawal * 0.22 +
      pressure.state.disengagementRisk * 0.2 +
      misunderstanding.state.disengagementRisk * 0.18 +
      (1 - preview.emotionalSafety) * 0.14 +
      memorySignals.riskPenalty * 0.14 +
      (1 - preview.repairPotential) * 0.12,
  );

  const axes: DyadicCopingAxis[] = [
    axis({
      key: "stressCommunication",
      label: "스트레스 소통",
      polarity: "protective",
      score:
        preview.dialogueCompatibility * 0.26 +
        vulnerability.state.openness * 0.22 +
        memorySignals.reciprocity * 0.18 +
        preview.emotionalSafety * 0.16 +
        (1 - currentWithdrawal) * 0.12 +
        stateConfidence(state) * 0.06,
      interpretation:
        "관계가 추측하거나 시험하거나 멀어지기 전에 스트레스를 충분히 이르게 말할 수 있는지 봅니다.",
      evidence: [
        `대화 적합도 ${percent(preview.dialogueCompatibility)}`,
        `취약성 공유 개방도 ${percent(vulnerability.state.openness)}`,
        `현재 거리두기 역지표 ${percent(1 - currentWithdrawal)}`,
      ],
      nextObservation: "균열이 되기 전에 작은 압박 지점 하나를 말하고, 응답이 구체적으로 유지되는지 보세요.",
    }),
    axis({
      key: "supportiveResponse",
      label: "지지적 반응",
      polarity: "protective",
      score:
        preview.hiddenEdge.responsiveness * 0.26 +
        preview.emotionalSafety * 0.18 +
        memorySignals.emotionalSafety * 0.18 +
        memorySignals.reciprocity * 0.16 +
        vulnerability.state.emotionalSafety * 0.14 +
        (1 - volatility) * 0.08,
      interpretation:
        "압박이 즉각적 조언이나 방어 대신 속도 조절, 반영, 실제 도움으로 맞아지는지 봅니다.",
      evidence: [
        `반응성 ${percent(preview.hiddenEdge.responsiveness)}`,
        `관찰된 안전감 ${percent(memorySignals.emotionalSafety)}`,
        `변동성 역지표 ${percent(1 - volatility)}`,
      ],
      nextObservation: "경계가 분명한 필요를 하나 공유하고, 상대가 해결책 전에 영향을 먼저 반영하는지 보세요.",
    }),
    axis({
      key: "jointRegulation",
      label: "공동 조절",
      polarity: "protective",
      score:
        preview.complementarity * 0.18 +
        collaboration.state.reciprocity * 0.18 +
        memorySignals.reciprocity * 0.2 +
        preview.hiddenEdge.modeScores.collaboration * 0.12 +
        (1 - scenarioStress) * 0.12 +
        preview.dialogueCompatibility * 0.12 +
        (1 - supportNeed * 0.35) * 0.08,
      interpretation:
        "스트레스를 각자 버티는 방식이 아니라 함께 조율하는 흐름으로 바꿀 수 있는지 봅니다.",
      evidence: [
        `협업 상호성 ${percent(collaboration.state.reciprocity)}`,
        `관찰된 상호성 ${percent(memorySignals.reciprocity)}`,
        `시나리오 스트레스 역지표 ${percent(1 - scenarioStress)}`,
      ],
      nextObservation: "명시적인 공동 계획 하나를 시도하세요. 각자 맡을 것, 미뤄도 되는 것, 충분함의 기준을 정합니다.",
    }),
    axis({
      key: "repairAfterStress",
      label: "스트레스 후 회복",
      polarity: "protective",
      score:
        preview.repairPotential * 0.26 +
        preview.hiddenEdge.repair * 0.2 +
        memorySignals.repairEvidence * 0.2 +
        repair.state.repairWillingness * 0.18 +
        preview.conflictCompatibility * 0.12 +
        (1 - misunderstanding.state.irritation) * 0.04,
      interpretation:
        "이미 영향이 생긴 뒤에도 긴장이 설명, 공감, 회복으로 이동할 수 있는지 봅니다.",
      evidence: [
        `회복 가능성 ${percent(preview.repairPotential)}`,
        `관찰된 회복 근거 ${percent(memorySignals.repairEvidence)}`,
        `회복 시나리오 의지 ${percent(repair.state.repairWillingness)}`,
      ],
      nextObservation: "작은 오해 뒤에 의도, 영향, 다음 행동을 세 문장으로 나누어 말해 보세요.",
    }),
    axis({
      key: "withdrawalRisk",
      label: "거리두기 위험",
      polarity: "risk",
      score: withdrawalRisk,
      interpretation:
        "회복이 일어나기 전에 압박이 회피, 비난, 정서적 차단, 거리두기로 바뀔 가능성입니다.",
      evidence: [
        `현재 거리두기 ${percent(currentWithdrawal)}`,
        `압박 상황 이탈 위험 ${percent(pressure.state.disengagementRisk)}`,
        `기억 기반 위험 ${percent(memorySignals.riskPenalty)}`,
      ],
      nextObservation: "거리가 생기면 회복 시간이 필요한 것인지, 회복을 피하고 있다는 신호인지 구분해 보세요.",
    }),
  ];

  const protectiveAverage = average(axes.filter((item) => item.polarity === "protective").map((item) => item.score));
  const confidence = clamp(
    preview.relationshipReport.confidence * 0.38 +
      memorySignals.confidence * 0.24 +
      stateConfidence(state) * 0.2 +
      Math.min(1, relationshipMemory.totalInteractions / 5) * 0.18,
  );

  return {
    generatedAt: isoNow(),
    confidence,
    summary: buildSummary({ protectiveAverage, withdrawalRisk, confidence, totalInteractions: relationshipMemory.totalInteractions }),
    guardrail:
      "이 VSA/관계 대처 렌즈는 BELIFE의 비공개 관계 성찰입니다. 공개 매칭, 치료, 진단, 결정론적 예측이 아닙니다.",
    memoryCoverage: {
      pairCount: relationshipMemory.pairCount,
      totalInteractions: relationshipMemory.totalInteractions,
      strongestPair: memorySignals.strongestPair?.personLabel,
      riskiestPair: memorySignals.riskiestPair?.personLabel,
    },
    vsa: buildVsa({
      preview,
      state,
      pressure,
      misunderstanding,
      drift,
      repair,
      memorySignals,
      currentStress,
      currentWithdrawal,
      withdrawalRisk,
    }),
    axes,
    stressSignals: buildStressSignals({ state, scenarioStress, pressure, misunderstanding, withdrawalRisk }),
    supportMoves: buildSupportMoves(axes, memorySignals),
    riskSignals: buildRiskSignals({ axes, state, withdrawalRisk, memorySignals, pressure }),
    nextConversationMove: buildNextConversationMove(axes),
  };
}

function axis(input: Omit<DyadicCopingAxis, "score" | "level"> & { score: number }): DyadicCopingAxis {
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
      averageQuality: 0.45,
      emotionalSafety: 0.45,
      reciprocity: 0.45,
      repairEvidence: 0.28,
      confidence: 0.1,
      riskPenalty: 0.42,
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

function buildSummary(input: {
  protectiveAverage: number;
  withdrawalRisk: number;
  confidence: number;
  totalInteractions: number;
}) {
  const evidence = input.totalInteractions >= 3 ? "반복된 관계 기억" : "초기 관계 기억";
  if (input.withdrawalRisk >= 0.48 && input.protectiveAverage < 0.62) {
    return `스트레스가 회복 전에 거리두기로 이동할 수 있습니다. BELIFE는 이것을 증명이 아니라 ${evidence} 기반 가설로 보고 관계 리듬을 늦춥니다. 신뢰도 ${percent(input.confidence)}.`;
  }
  if (input.protectiveAverage >= 0.62) {
    return `관계 대처 능력이 형성되고 있습니다. 속도가 명시적일 때 스트레스를 말하고, 나누고, 회복할 수 있습니다. 근거는 ${evidence}입니다. 신뢰도 ${percent(input.confidence)}.`;
  }
  return `관계 대처는 아직 작업 가설입니다. 다음 신호는 압박이 회피가 아니라 설명과 회복으로 이어지는지입니다. 근거는 ${evidence}입니다. 신뢰도 ${percent(input.confidence)}.`;
}

function buildVsa(input: {
  preview: CompatibilityAxes;
  state: MentalStateEstimate | null;
  pressure: ConnectionScenarioPreview;
  misunderstanding: ConnectionScenarioPreview;
  drift: ConnectionScenarioPreview;
  repair: ConnectionScenarioPreview;
  memorySignals: RelationshipMemorySignals;
  currentStress: number;
  currentWithdrawal: number;
  withdrawalRisk: number;
}): DyadicCopingReport["vsa"] {
  const vulnerabilities = [
    input.currentStress >= 0.55
      ? `현재 스트레스 부하가 ${percent(input.currentStress)}로 높아, 압박 속에서는 관계 속도를 늦출 필요가 있습니다.`
      : `현재 스트레스 부하는 ${percent(input.currentStress)}로 중간 수준이며, 커지기 전에 말해 둘 가치가 있습니다.`,
    input.currentWithdrawal >= 0.48
      ? `사회적 거리두기가 ${percent(input.currentWithdrawal)}로 보이는 취약성입니다.`
      : `거리두기가 아직 지배적인 신호는 아니지만, 거리는 조심스럽게 해석해야 합니다.`,
    input.preview.conflictCompatibility < 0.5
      ? `갈등 적합도는 ${percent(input.preview.conflictCompatibility)}로 아직 형성 중입니다.`
      : `갈등 적합도는 ${percent(input.preview.conflictCompatibility)}로, 회복을 부드럽게 시험할 만큼의 신호가 있습니다.`,
  ];

  const stressfulEvents = [
    `압박 시나리오 이탈 위험 ${percent(input.pressure.state.disengagementRisk)}.`,
    `오해 상황 자극도 ${percent(input.misunderstanding.state.irritation)}.`,
    `장기적 흔들림 위험 ${percent(input.drift.state.disengagementRisk)}.`,
  ];
  if (input.state?.drivers.length) stressfulEvents.push(`현재 상태 동인: ${input.state.drivers.slice(0, 2).join(", ")}.`);

  const adaptiveProcesses = [
    `스트레스 속 회복 의지 ${percent(input.repair.state.repairWillingness)}.`,
    `관찰된 관계 회복 근거 ${percent(input.memorySignals.repairEvidence)}.`,
    `다뤄야 할 거리두기 위험 ${percent(input.withdrawalRisk)}.`,
  ];

  return {
    enduringVulnerabilities: vulnerabilities,
    stressfulEvents,
    adaptiveProcesses,
  };
}

function buildStressSignals(input: {
  state: MentalStateEstimate | null;
  scenarioStress: number;
  pressure: ConnectionScenarioPreview;
  misunderstanding: ConnectionScenarioPreview;
  withdrawalRisk: number;
}) {
  return [
    `시나리오 스트레스 부하 ${percent(input.scenarioStress)}.`,
    `압박 상황 자극도 ${percent(input.pressure.state.irritation)}와 이탈 위험 ${percent(
      input.pressure.state.disengagementRisk,
    )}.`,
    `오해 상황 이탈 위험 ${percent(input.misunderstanding.state.disengagementRisk)}.`,
    input.state
      ? `현재 지지 필요 ${percent(input.state.supportNeed)}, 멘탈 상태 신뢰도 ${percent(input.state.confidence)}.`
      : "현재 멘탈 상태 추정이 없어 스트레스 신호는 관계 시뮬레이션에 더 기대고 있습니다.",
    `거리두기 위험 ${percent(input.withdrawalRisk)}.`,
  ];
}

function buildSupportMoves(axes: DyadicCopingAxis[], memorySignals: RelationshipMemorySignals) {
  const weakestProtective = [...axes]
    .filter((axisItem) => axisItem.polarity === "protective")
    .sort((left, right) => left.score - right.score)[0];
  const moves = [
    weakestProtective.nextObservation,
    "두 단계로 확인하세요. 먼저 압박을 반영하고, 실제로 도움이 되는 지지가 무엇인지 묻습니다.",
    "긴장 뒤에는 설명, 공감, 구체적 다음 행동 중 무엇으로 회복이 일어났는지 기록하세요.",
  ];
  if (memorySignals.confidence < 0.35) {
    moves.push("이 대처 렌즈를 안정적으로 보기 전에 동의한 관계 기억 메모를 하나 더 추가하세요.");
  }
  return moves;
}

function buildRiskSignals(input: {
  axes: DyadicCopingAxis[];
  state: MentalStateEstimate | null;
  withdrawalRisk: number;
  memorySignals: RelationshipMemorySignals;
  pressure: ConnectionScenarioPreview;
}) {
  const signals = [
    input.withdrawalRisk >= 0.55
      ? "압박이 올라갈 때 거리두기가 첫 번째 대처가 될 수 있습니다."
      : "거리두기가 지배적이지는 않지만, 거리를 거절로 해석하기 전에 확인해야 합니다.",
    input.memorySignals.repairEvidence < 0.35
      ? "회복 근거가 아직 얇습니다. 따뜻함만으로 안정성을 판단하지 마세요."
      : "회복 근거는 있지만, 다른 스트레스 수준에서도 일관성이 필요합니다.",
    input.pressure.state.irritation >= 0.45
      ? "압박 시나리오는 다음 반응을 왜곡할 만큼 자극도를 높일 수 있습니다."
      : "지지를 일찍 말하면 압박 자극도는 관리 가능한 수준입니다.",
  ];
  if ((input.state?.emotionalVolatility ?? 0) >= 0.55) {
    signals.push("현재 정서 변동성 때문에 중립적인 침묵도 실제보다 더 위협적으로 느껴질 수 있습니다.");
  }
  return signals;
}

function buildNextConversationMove(axes: DyadicCopingAxis[]) {
  const withdrawal = axes.find((axisItem) => axisItem.key === "withdrawalRisk");
  const weakestProtective = [...axes]
    .filter((axisItem) => axisItem.polarity === "protective")
    .sort((left, right) => left.score - right.score)[0];
  if (withdrawal && withdrawal.score >= 0.48) {
    return "이렇게 시작하세요: '압박이 올라오면 내가 조용해질 때가 있어. 서로 추측하지 않도록 멈췄다가 돌아오는 방식을 정해볼 수 있을까?'";
  }
  return `가장 약한 대처 축부터 시작하세요: ${weakestProtective.nextObservation}`;
}

function scenarioByType(preview: CompatibilityAxes, type: ConnectionScenarioPreview["type"]) {
  return preview.scenarioPreviews.find((scenario) => scenario.type === type) ?? preview.scenarioPreviews[0];
}

function pairHealth(pair: RelationshipPairMemorySummary) {
  return (
    pair.averageQuality * 0.2 +
    pair.emotionalSafety * 0.28 +
    pair.reciprocity * 0.24 +
    pair.repairEvidence * 0.2 +
    pair.confidence * 0.08
  );
}

function pairRisk(pair: RelationshipPairMemorySummary) {
  const levelRisk = pair.riskLevel === "high" ? 0.86 : pair.riskLevel === "moderate" ? 0.54 : 0.2;
  return clamp(
    levelRisk * 0.38 +
      (1 - pair.emotionalSafety) * 0.22 +
      (1 - pair.reciprocity) * 0.18 +
      (1 - pair.repairEvidence) * 0.16 +
      (1 - pair.averageQuality) * 0.06,
  );
}

function stateConfidence(state: MentalStateEstimate | null) {
  return state?.confidence ?? 0.12;
}

function scoreLevel(score: number): DyadicCopingAxis["level"] {
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
