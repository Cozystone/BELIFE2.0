import { clamp } from "@/lib/utils";
import type {
  BehaviorSnapshot,
  ConnectionAxisInsight,
  CompatibilityAxes,
  ConnectionRelationshipReport,
  ConnectionScenarioPreview,
  ConnectionScenarioState,
  DataTrustScore,
  OntologyNode,
} from "./types";

export function buildConnectionPreview(
  nodes: OntologyNode[],
  behavior: BehaviorSnapshot | null,
  trust: DataTrustScore,
): CompatibilityAxes {
  const hasValue = nodes.some((node) => node.type === "Value" || node.type === "Belief");
  const hasGoal = nodes.some((node) => node.type === "Goal" || node.type === "GrowthTrajectory");
  const hasFriction = nodes.some((node) => node.type === "FrictionPattern" || node.type === "EnergyPattern");

  const structuralSimilarity = clamp(0.38 + (hasValue ? 0.22 : 0) + (hasGoal ? 0.16 : 0));
  const complementarity = clamp(0.42 + (hasFriction ? 0.18 : 0) + (behavior?.solutionOrientation ?? 0.35) * 0.18);
  const dialogueCompatibility = clamp(0.35 + (behavior?.warmth ?? 0.35) * 0.25 + (behavior?.directness ?? 0.35) * 0.18);
  const conflictCompatibility = clamp(0.62 - (behavior?.conflictSensitivity ?? 0.25) * 0.25 + (behavior?.empathyOrientation ?? 0.35) * 0.2);
  const repairPotential = clamp(0.34 + (behavior?.empathyOrientation ?? 0.35) * 0.28 + (behavior?.directness ?? 0.35) * 0.15);
  const emotionalSafety = clamp(0.36 + (behavior?.warmth ?? 0.35) * 0.32 + structuralSimilarity * 0.18);
  const confidence = clamp(trust.score / 100);
  const axes = {
    structuralSimilarity,
    complementarity,
    dialogueCompatibility,
    conflictCompatibility,
    repairPotential,
    emotionalSafety,
    confidence,
  };
  const scenarioPreviews = buildScenarioPreviews({
    axes,
    behavior,
    hasValue,
    hasGoal,
    hasFriction,
  });
  const relationshipReport = buildRelationshipReport({
    axes,
    scenarioPreviews,
    behavior,
    trust,
    hasValue,
    hasGoal,
    hasFriction,
  });

  return {
    structuralSimilarity,
    complementarity,
    dialogueCompatibility,
    conflictCompatibility,
    repairPotential,
    emotionalSafety,
    confidence,
    summary:
      trust.score >= 55
        ? "BELIFE는 이미 관계 적합성을 해석할 초기 렌즈를 만들 수 있지만, 확신 수준은 계속 드러냅니다."
        : "아직은 초기 프리뷰입니다. 강한 관계 판단을 하려면 더 자연스러운 대화 신호가 필요합니다.",
    comfortSignals: [
      hasValue ? "공유 가치와 의미를 다루는 언어가 중요하게 작동할 수 있습니다." : "가치 신호는 아직 충분히 쌓이지 않았습니다.",
      behavior?.warmth && behavior.warmth > 0.5 ? "따뜻한 반응 스타일은 정서적 안전감에 도움이 될 수 있습니다." : "따뜻함 신호는 아직 형성 중입니다.",
    ],
    tensionSignals: [
      hasFriction ? "스트레스나 에너지 리듬의 차이가 가까운 관계에서 중요해질 수 있습니다." : "마찰 패턴은 더 많은 증거가 필요합니다.",
      behavior?.conflictSensitivity && behavior.conflictSensitivity > 0.45
        ? "오해나 압박 상황에서는 느린 회복 루틴이 필요할 수 있습니다."
        : "갈등 스타일은 아직 단정할 만큼 선명하지 않습니다.",
    ],
    idealConnectionPattern:
      "차분한 호기심으로 반응하고, 당신이 의미를 정리하는 속도를 존중하며, 긴장을 서두르지 않고 회복할 수 있는 사람.",
    riskyConnectionPattern:
      "즉각적인 확신을 요구하거나, 내면의 복잡성을 가볍게 여기거나, 당신의 스트레스 신호를 더 큰 압박으로 바꾸는 사람.",
    scenarioPreviews,
    relationshipReport,
  };
}

function buildRelationshipReport(input: {
  axes: Pick<
    CompatibilityAxes,
    | "structuralSimilarity"
    | "complementarity"
    | "dialogueCompatibility"
    | "conflictCompatibility"
    | "repairPotential"
    | "emotionalSafety"
    | "confidence"
  >;
  scenarioPreviews: ConnectionScenarioPreview[];
  behavior: BehaviorSnapshot | null;
  trust: DataTrustScore;
  hasValue: boolean;
  hasGoal: boolean;
  hasFriction: boolean;
}): ConnectionRelationshipReport {
  const { axes, behavior, trust, hasValue, hasGoal, hasFriction, scenarioPreviews } = input;
  const compatibilityScore = clamp(
    axes.structuralSimilarity * 0.22 +
      axes.complementarity * 0.14 +
      axes.dialogueCompatibility * 0.18 +
      axes.conflictCompatibility * 0.14 +
      axes.repairPotential * 0.14 +
      axes.emotionalSafety * 0.18,
  );
  const scenarioConfidence = scenarioPreviews.length
    ? scenarioPreviews.reduce((sum, scenario) => sum + scenario.confidence, 0) / scenarioPreviews.length
    : 0;
  const confidence = clamp((trust.score / 100) * 0.68 + scenarioConfidence * 0.22 + (behavior?.confidence ?? 0.15) * 0.1);
  const finalScore = clamp(compatibilityScore * confidence);
  const axisInsights = buildAxisInsights(axes, behavior);
  const evidenceSignals = [
    hasValue ? "가치/믿음 축에서 관계 해석에 쓸 수 있는 자기 구조가 있습니다." : "가치 축은 아직 더 많은 자연 대화가 필요합니다.",
    hasGoal ? "목표와 성장 방향 신호가 연결 가능성 해석에 반영되었습니다." : "장기 목표 신호가 더 쌓이면 지속 가능성 해석이 선명해집니다.",
    hasFriction ? "스트레스/마찰 패턴이 관계 리스크 시뮬레이션에 반영되었습니다." : "마찰 패턴은 아직 조심스럽게만 해석합니다.",
    behavior
      ? `대화 행동 신뢰도 ${Math.round(behavior.confidence * 100)}%가 축별 리포트에 반영되었습니다.`
      : "대화 행동 관측이 부족해 온보딩 기반 프리뷰로 시작합니다.",
  ];
  const blindSpots = [
    trust.score < 55 ? "현재 리포트는 초기 프리뷰입니다. 사람을 단정하거나 추천하지 않습니다." : "",
    behavior ? "" : "실제 대화 리듬, 질문 빈도, 갈등 반응은 아직 관측이 부족합니다.",
    hasValue && hasGoal ? "" : "핵심 가치와 목표가 더 구체화되면 구조적 유사성의 오차가 줄어듭니다.",
    hasFriction ? "" : "압박 상황에서의 회복 루틴은 아직 별도 확인이 필요합니다.",
  ].filter(Boolean);
  const nextObservationPrompts = [
    "가까운 사람이 나를 편하게 만드는 순간과 부담스럽게 만드는 순간은 각각 무엇이었나?",
    "갈등이 생겼을 때 나는 설명, 침묵, 회피, 해결 중 어디로 먼저 움직이나?",
    "나와 오래 맞는 사람은 내 속도를 늦춰주는가, 방향을 잡아주는가, 감정을 받아주는가?",
  ];

  return {
    compatibilityScore,
    finalScore,
    confidence,
    confidenceLabel: confidenceLabel(confidence),
    hiddenEdgeStatus: "latent",
    thesis:
      finalScore >= 0.5
        ? "현재 구조만으로도 관계에서 편안함과 회복 가능성을 해석할 초기 근거가 있습니다."
        : "아직은 관계를 판단하기보다 어떤 신호를 더 봐야 하는지 알려주는 탐색 리포트에 가깝습니다.",
    axisInsights,
    evidenceSignals,
    blindSpots,
    nextObservationPrompts,
  };
}

function buildAxisInsights(
  axes: Pick<
    CompatibilityAxes,
    | "structuralSimilarity"
    | "complementarity"
    | "dialogueCompatibility"
    | "conflictCompatibility"
    | "repairPotential"
    | "emotionalSafety"
  >,
  behavior: BehaviorSnapshot | null,
): ConnectionAxisInsight[] {
  return [
    {
      key: "structuralSimilarity",
      label: "구조적 유사성",
      score: axes.structuralSimilarity,
      level: scoreLevel(axes.structuralSimilarity),
      interpretation: "가치, 믿음, 목표의 결이 비슷할 때 대화의 기본 전제가 덜 흔들립니다.",
      evidence: "온보딩과 온톨로지의 Value, Belief, Goal 노드 기반",
      nextObservation: "상대가 중요한 선택을 설명할 때 어떤 기준을 반복하는지 봅니다.",
    },
    {
      key: "complementarity",
      label: "상호 보완성",
      score: axes.complementarity,
      level: scoreLevel(axes.complementarity),
      interpretation: "서로의 약한 지점을 압박하지 않고 보완할 가능성을 봅니다.",
      evidence: `해결 지향 ${Math.round((behavior?.solutionOrientation ?? 0.35) * 100)}%와 에너지/마찰 신호 기반`,
      nextObservation: "같이 무언가를 만들 때 결정권과 속도를 어떻게 나누는지 봅니다.",
    },
    {
      key: "dialogueCompatibility",
      label: "대화 적합성",
      score: axes.dialogueCompatibility,
      level: scoreLevel(axes.dialogueCompatibility),
      interpretation: "말의 속도, 직접성, 따뜻함이 가까운 관계의 피로도를 낮출 수 있는지 봅니다.",
      evidence: `따뜻함 ${Math.round((behavior?.warmth ?? 0.35) * 100)}%, 직접성 ${Math.round((behavior?.directness ?? 0.35) * 100)}% 기반`,
      nextObservation: "상대가 질문과 반응의 균형을 어떻게 잡는지 봅니다.",
    },
    {
      key: "conflictCompatibility",
      label: "갈등 적합성",
      score: axes.conflictCompatibility,
      level: scoreLevel(axes.conflictCompatibility),
      interpretation: "차이가 생겼을 때 방어, 회피, 비난으로 빨리 악화되는지를 조심스럽게 봅니다.",
      evidence: `갈등 민감도 ${Math.round((behavior?.conflictSensitivity ?? 0.25) * 100)}%와 공감 지향 기반`,
      nextObservation: "작은 이견에서 상대가 의미를 확인하는지, 승패를 정하려 하는지 봅니다.",
    },
    {
      key: "repairPotential",
      label: "회복 가능성",
      score: axes.repairPotential,
      level: scoreLevel(axes.repairPotential),
      interpretation: "오해가 생긴 뒤 다시 안전하게 돌아올 수 있는지를 봅니다.",
      evidence: `공감 지향 ${Math.round((behavior?.empathyOrientation ?? 0.35) * 100)}%와 직접성 기반`,
      nextObservation: "사과 이후 행동이 실제로 달라지는지, 같은 상처가 반복되는지 봅니다.",
    },
    {
      key: "emotionalSafety",
      label: "정서적 안전감",
      score: axes.emotionalSafety,
      level: scoreLevel(axes.emotionalSafety),
      interpretation: "취약한 이야기를 꺼냈을 때 평가보다 이해가 먼저 올 가능성을 봅니다.",
      evidence: "따뜻함, 구조적 유사성, 정서 반응 신호 기반",
      nextObservation: "상대가 조언하기 전에 감정과 맥락을 반사해주는지 봅니다.",
    },
  ];
}

function scoreLevel(score: number): ConnectionAxisInsight["level"] {
  if (score >= 0.72) return "strong";
  if (score >= 0.56) return "clear";
  if (score >= 0.38) return "building";
  return "low";
}

function confidenceLabel(confidence: number): ConnectionRelationshipReport["confidenceLabel"] {
  if (confidence >= 0.78) return "strong";
  if (confidence >= 0.58) return "usable";
  if (confidence >= 0.36) return "building";
  return "early";
}

function buildScenarioPreviews(input: {
  axes: Pick<
    CompatibilityAxes,
    | "structuralSimilarity"
    | "complementarity"
    | "dialogueCompatibility"
    | "conflictCompatibility"
    | "repairPotential"
    | "emotionalSafety"
    | "confidence"
  >;
  behavior: BehaviorSnapshot | null;
  hasValue: boolean;
  hasGoal: boolean;
  hasFriction: boolean;
}): ConnectionScenarioPreview[] {
  const { axes, behavior, hasValue, hasGoal, hasFriction } = input;
  const warmth = behavior?.warmth ?? 0.35;
  const directness = behavior?.directness ?? 0.35;
  const empathy = behavior?.empathyOrientation ?? 0.35;
  const solution = behavior?.solutionOrientation ?? 0.35;
  const disclosure = behavior?.disclosureSpeed ?? 0.35;
  const pacing = behavior?.pacing ?? 0.45;
  const conflictSensitivity = behavior?.conflictSensitivity ?? 0.25;
  const behaviorConfidence = behavior?.confidence ?? 0.25;
  const signalCoverage = (hasValue ? 0.34 : 0) + (hasGoal ? 0.28 : 0) + (hasFriction ? 0.18 : 0);
  const scenarioConfidence = clamp(axes.confidence * 0.66 + behaviorConfidence * 0.24 + signalCoverage * 0.1);

  const state = (values: Partial<ConnectionScenarioState>): ConnectionScenarioState => ({
    trust: clamp(values.trust ?? 0.45),
    emotionalSafety: clamp(values.emotionalSafety ?? axes.emotionalSafety),
    irritation: clamp(values.irritation ?? conflictSensitivity * 0.4),
    curiosity: clamp(values.curiosity ?? axes.structuralSimilarity),
    reciprocity: clamp(values.reciprocity ?? axes.dialogueCompatibility),
    openness: clamp(values.openness ?? disclosure),
    repairWillingness: clamp(values.repairWillingness ?? axes.repairPotential),
    disengagementRisk: clamp(values.disengagementRisk ?? 0.24 + conflictSensitivity * 0.28),
    commitmentTendency: clamp(values.commitmentTendency ?? axes.complementarity),
  });

  return [
    {
      type: "first_contact",
      title: "First Contact",
      likelyDynamic:
        axes.dialogueCompatibility >= 0.55
          ? "처음 만남에서는 차분한 질문과 반응 속도가 맞을 때 호기심이 빨리 살아날 수 있습니다."
          : "초기 만남에서는 상대의 속도와 표현 방식이 맞는지 천천히 확인해야 합니다.",
      supportMove: "첫 대화에서는 결론보다 관찰과 질문을 먼저 두는 편이 안정적입니다.",
      riskSignal: "초반부터 확신이나 친밀감을 강하게 요구하면 방어감이 커질 수 있습니다.",
      state: state({
        trust: axes.dialogueCompatibility * 0.5 + axes.emotionalSafety * 0.3 + warmth * 0.2,
        curiosity: axes.structuralSimilarity * 0.55 + (hasValue ? 0.2 : 0) + warmth * 0.15,
        openness: disclosure * 0.5 + axes.emotionalSafety * 0.3,
        disengagementRisk: 0.2 + (1 - axes.dialogueCompatibility) * 0.32,
      }),
      confidence: scenarioConfidence,
    },
    {
      type: "light_disagreement",
      title: "Light Disagreement",
      likelyDynamic:
        axes.conflictCompatibility >= 0.55
          ? "가벼운 의견 차이는 관계를 깨기보다 서로의 기준을 더 선명하게 만드는 장면이 될 수 있습니다."
          : "작은 의견 차이도 상대가 압박처럼 느껴지면 빠르게 피로해질 수 있습니다.",
      supportMove: "맞고 틀림보다 각자가 지키려는 기준을 먼저 말하는 방식이 좋습니다.",
      riskSignal: "설명 없이 단정하거나, 감정 신호를 논리 문제로만 처리하면 긴장이 올라갑니다.",
      state: state({
        trust: axes.conflictCompatibility * 0.5 + empathy * 0.28 + directness * 0.12,
        irritation: conflictSensitivity * 0.52 + (1 - axes.conflictCompatibility) * 0.28,
        reciprocity: empathy * 0.32 + directness * 0.28 + axes.dialogueCompatibility * 0.24,
        repairWillingness: axes.repairPotential,
        disengagementRisk: conflictSensitivity * 0.42 + (1 - axes.conflictCompatibility) * 0.28,
      }),
      confidence: scenarioConfidence,
    },
    {
      type: "emotional_vulnerability",
      title: "Emotional Vulnerability",
      likelyDynamic:
        axes.emotionalSafety >= 0.56
          ? "취약한 이야기는 과잉 조언보다 안정적인 반응을 받을 때 신뢰를 키우는 재료가 됩니다."
          : "취약한 이야기를 꺼내기 전에는 상대가 감정을 담을 수 있는 사람인지 더 확인해야 합니다.",
      supportMove: "감정을 바로 해결하지 말고, 들은 내용을 정확히 반사한 뒤 작은 선택지를 제안하는 편이 안전합니다.",
      riskSignal: "고백을 평가하거나 빠른 해결책으로 덮으면 관계 안전감이 낮아질 수 있습니다.",
      state: state({
        trust: axes.emotionalSafety * 0.46 + empathy * 0.32 + warmth * 0.16,
        emotionalSafety: axes.emotionalSafety * 0.58 + warmth * 0.22 + empathy * 0.16,
        openness: disclosure * 0.32 + axes.emotionalSafety * 0.34 + empathy * 0.18,
        irritation: (1 - empathy) * 0.18 + conflictSensitivity * 0.18,
        commitmentTendency: axes.structuralSimilarity * 0.32 + axes.emotionalSafety * 0.34,
      }),
      confidence: scenarioConfidence,
    },
    {
      type: "pressure",
      title: "Pressure / Stress",
      likelyDynamic:
        hasFriction || conflictSensitivity > 0.44
          ? "압박이 생기면 관계의 좋고 나쁨보다 회복 루틴과 속도 조절이 먼저 중요해집니다."
          : "압박 상황에서도 역할과 기대가 분명하면 비교적 안정적으로 협력할 수 있습니다.",
      supportMove: "지금 당장 정해야 하는 것과 나중에 다뤄도 되는 것을 분리하는 방식이 도움이 됩니다.",
      riskSignal: "피로한 상태에서 확답을 요구하면 관계보다 자기보호가 먼저 켜질 수 있습니다.",
      state: state({
        trust: axes.repairPotential * 0.32 + solution * 0.26 + axes.emotionalSafety * 0.2,
        irritation: conflictSensitivity * 0.48 + (hasFriction ? 0.18 : 0.05),
        reciprocity: solution * 0.38 + empathy * 0.24 + axes.dialogueCompatibility * 0.18,
        disengagementRisk: 0.18 + conflictSensitivity * 0.36 + (hasFriction ? 0.2 : 0.06),
        commitmentTendency: axes.complementarity * 0.36 + solution * 0.22,
      }),
      confidence: scenarioConfidence,
    },
    {
      type: "misunderstanding",
      title: "Misunderstanding",
      likelyDynamic:
        axes.repairPotential >= 0.52
          ? "오해는 빠른 해명보다 감정 확인과 의미 재정렬을 거치면 회복 가능한 장면이 됩니다."
          : "오해가 생기면 설명이 길어질수록 방어와 거리두기가 함께 커질 수 있습니다.",
      supportMove: "상대의 의도와 내가 받은 영향을 분리해서 말하는 회복 문장이 필요합니다.",
      riskSignal: "침묵, 비꼼, 과잉 설명이 반복되면 오해가 관계의 기본 기억으로 굳을 수 있습니다.",
      state: state({
        trust: axes.repairPotential * 0.44 + axes.conflictCompatibility * 0.22 + empathy * 0.18,
        emotionalSafety: axes.emotionalSafety * 0.38 + axes.repairPotential * 0.24,
        irritation: 0.18 + conflictSensitivity * 0.48 + (1 - directness) * 0.14,
        repairWillingness: axes.repairPotential * 0.62 + empathy * 0.18,
        disengagementRisk: 0.2 + conflictSensitivity * 0.38 + (1 - axes.repairPotential) * 0.22,
      }),
      confidence: scenarioConfidence,
    },
    {
      type: "repair_attempt",
      title: "Repair Attempt",
      likelyDynamic:
        axes.repairPotential >= 0.55
          ? "회복 시도는 사과의 형식보다 상대가 받은 영향을 인정할 때 가장 잘 작동합니다."
          : "회복 시도는 가능하지만, 타이밍과 언어가 맞지 않으면 다시 상처를 건드릴 수 있습니다.",
      supportMove: "내 의도, 상대가 받은 영향, 다음에 다르게 할 행동을 짧게 분리해 말하는 편이 좋습니다.",
      riskSignal: "사과 직후 바로 평소처럼 돌아가길 요구하면 회복 의지가 낮게 해석될 수 있습니다.",
      state: state({
        trust: axes.repairPotential * 0.52 + empathy * 0.22 + directness * 0.12,
        emotionalSafety: axes.emotionalSafety * 0.34 + empathy * 0.28 + axes.repairPotential * 0.2,
        irritation: conflictSensitivity * 0.22 + (1 - axes.repairPotential) * 0.22,
        repairWillingness: axes.repairPotential * 0.68 + empathy * 0.18 + directness * 0.08,
        disengagementRisk: 0.16 + (1 - axes.repairPotential) * 0.34,
      }),
      confidence: scenarioConfidence,
    },
    {
      type: "collaboration",
      title: "Collaboration",
      likelyDynamic:
        axes.complementarity >= 0.56
          ? "함께 무언가를 만들 때는 서로의 다른 강점이 역할 분담으로 이어질 가능성이 있습니다."
          : "협업에서는 좋은 의도만으로는 부족하고, 기대와 책임 범위를 명시해야 안정적입니다.",
      supportMove: "목표, 속도, 결정권을 작게 나누면 관계 피로를 줄이면서 성취감을 만들 수 있습니다.",
      riskSignal: "한쪽이 계속 조율하고 다른 쪽이 계속 판단하는 구도가 생기면 불균형이 커집니다.",
      state: state({
        trust: axes.complementarity * 0.36 + axes.dialogueCompatibility * 0.24 + solution * 0.2,
        curiosity: axes.structuralSimilarity * 0.26 + axes.complementarity * 0.3 + (hasGoal ? 0.18 : 0),
        reciprocity: axes.dialogueCompatibility * 0.32 + solution * 0.28 + pacing * 0.16,
        openness: directness * 0.24 + axes.emotionalSafety * 0.24 + solution * 0.18,
        commitmentTendency: axes.complementarity * 0.46 + (hasGoal ? 0.18 : 0) + solution * 0.14,
        disengagementRisk: 0.16 + (1 - axes.complementarity) * 0.24 + conflictSensitivity * 0.18,
      }),
      confidence: scenarioConfidence,
    },
  ];
}
