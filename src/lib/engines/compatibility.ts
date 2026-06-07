import { clamp } from "@/lib/utils";
import type {
  BehaviorSnapshot,
  ConnectionAxisInsight,
  ConnectionCandidateFilter,
  ConnectionCandidateFilteringReport,
  ConnectionCandidateStatus,
  ConnectionHiddenEdge,
  ConnectionRelationshipMode,
  ConnectionModeRank,
  ConnectionRerankingDirection,
  ConnectionRerankingReport,
  ConnectionRerankingSignal,
  ConnectionScenarioType,
  CompatibilityAxes,
  ConnectionSimulationHorizon,
  ConnectionSimulationInput,
  ConnectionSimulationResult,
  ConnectionRelationshipReport,
  ConnectionScenarioPreview,
  ConnectionScenarioSimulation,
  ConnectionScenarioState,
  DataTrustScore,
  OntologyNode,
} from "./types";

export function buildConnectionPreview(
  nodes: OntologyNode[],
  behavior: BehaviorSnapshot | null,
  trust: DataTrustScore,
  previousPreview?: CompatibilityAxes | null,
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
  const hiddenEdge = buildHiddenEdge({
    axes,
    scenarioPreviews,
    behavior,
    relationshipReport,
    previous: previousPreview?.hiddenEdge,
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
    hiddenEdge,
    scenarioPreviews,
    relationshipReport,
  };
}

export const connectionScenarioTypes = [
  "first_contact",
  "light_disagreement",
  "emotional_vulnerability",
  "pressure",
  "misunderstanding",
  "repair_attempt",
  "collaboration",
  "reselection",
  "longitudinal_drift",
] as const satisfies readonly [ConnectionScenarioType, ...ConnectionScenarioType[]];

export const connectionRelationshipModes = [
  "friendship",
  "collaboration",
  "mentorship",
] as const satisfies readonly [ConnectionRelationshipMode, ...ConnectionRelationshipMode[]];
export const connectionSimulationHorizons = [
  "immediate",
  "next_month",
  "long_term",
] as const satisfies readonly [ConnectionSimulationHorizon, ...ConnectionSimulationHorizon[]];

export function simulateConnectionScenario(
  preview: CompatibilityAxes,
  input: ConnectionSimulationInput,
): ConnectionSimulationResult {
  const baseScenario = preview.scenarioPreviews.find((scenario) => scenario.type === input.scenarioType) ?? preview.scenarioPreviews[0];
  const scenario = baseScenario ?? buildFallbackScenario(preview);
  const normalizedInput = normalizeSimulationInput(input, scenario.type);
  const modeFit = preview.hiddenEdge.modeScores[normalizedInput.relationshipMode];
  const sceneSignal = clamp(normalizedInput.scene.trim().length / 260, 0.12, 1);
  const horizonPressure = horizonPressureFor(normalizedInput.timeHorizon);
  const stressLoad = clamp(normalizedInput.pressure * 0.58 + normalizedInput.vulnerability * 0.22 + horizonPressure * 0.2);
  const adjustedState = adjustScenarioState({
    base: scenario.state,
    preview,
    modeFit,
    sceneSignal,
    pressure: normalizedInput.pressure,
    vulnerability: normalizedInput.vulnerability,
    horizonPressure,
  });
  const adjustedConfidence = clamp(
    scenario.confidence * 0.62 +
      preview.relationshipReport.confidence * 0.2 +
      sceneSignal * 0.1 +
      modeFit * 0.08 -
      normalizedInput.pressure * 0.04,
  );
  const adjustedScenario: ConnectionScenarioPreview = {
    ...scenario,
    title: `${scenario.title} - Custom`,
    likelyDynamic: buildCustomLikelyDynamic(normalizedInput, scenario, adjustedState, stressLoad),
    supportMove: buildCustomSupportMove(normalizedInput, preview, scenario),
    riskSignal: buildCustomRiskSignal(normalizedInput, scenario, adjustedState),
    state: adjustedState,
    confidence: adjustedConfidence,
    simulation: buildScenarioSimulation(adjustedState, scenario.type, {
      confidence: adjustedConfidence,
      conflictSensitivity: clamp(stressLoad * 0.72 + adjustedState.irritation * 0.28),
      dialogueCompatibility: preview.dialogueCompatibility,
      emotionalSafety: preview.emotionalSafety,
      repairPotential: preview.repairPotential,
    }),
  };
  const readiness = clamp(
    adjustedState.trust * 0.22 +
      adjustedState.emotionalSafety * 0.22 +
      adjustedState.reciprocity * 0.16 +
      adjustedState.repairWillingness * 0.18 +
      modeFit * 0.14 -
      adjustedState.disengagementRisk * 0.12 -
      stressLoad * 0.08,
  );

  return {
    input: normalizedInput,
    scenario: adjustedScenario,
    readiness,
    modeFit,
    stressLoad,
    guidance: {
      openingMove: buildOpeningMove(readiness, normalizedInput),
      supportMove: adjustedScenario.supportMove,
      riskToWatch: adjustedScenario.riskSignal,
      repairMove: buildRepairMove(adjustedState, preview),
    },
    guardrail:
      "This is an internal BELIFE relationship rehearsal, not a prediction, diagnosis, or public matching decision.",
  };
}

export function buildConnectionCandidateFilteringReport(
  preview: CompatibilityAxes,
  limit = 5,
): ConnectionCandidateFilteringReport {
  const candidates = buildCandidateFilters(preview)
    .sort((left, right) => right.fit - left.fit || left.risk - right.risk)
    .slice(0, Math.max(1, Math.min(6, limit)));

  return {
    generatedAt: new Date().toISOString(),
    confidence: preview.relationshipReport.confidence,
    guardrail:
      "These are private BELIFE relationship candidate filters, not public matching suggestions, rankings of people, or deterministic predictions.",
    candidates,
    prioritized: candidates.filter((candidate) => candidate.status === "prioritize"),
    deferred: candidates.filter((candidate) => candidate.status === "defer"),
  };
}

export function buildConnectionRerankingReport(
  current: CompatibilityAxes,
  previous?: CompatibilityAxes | null,
): ConnectionRerankingReport {
  const modeRanking = buildModeRanking(current.hiddenEdge.modeScores, previous?.hiddenEdge.modeScores ?? null);
  const signals = buildRerankingSignals(current, previous)
    .sort((left, right) => Math.abs(right.impact) - Math.abs(left.impact) || Math.abs(right.delta) - Math.abs(left.delta))
    .slice(0, 7);
  const edgeDelta = previous ? clampDelta(current.hiddenEdge.edgeStrength - previous.hiddenEdge.edgeStrength) : 0;

  return {
    generatedAt: new Date().toISOString(),
    confidence: current.relationshipReport.confidence,
    edgeDelta,
    summary: rerankingSummary({ current, previous, edgeDelta, topMode: modeRanking[0], topSignal: signals[0] }),
    guardrail:
      "This is private incremental reranking of BELIFE's latent relationship-fit model, not public matching, people ranking, or deterministic prediction.",
    modeRanking,
    signals,
    nextStabilizers: rerankingStabilizers(current, signals),
  };
}

function buildCandidateFilters(preview: CompatibilityAxes): ConnectionCandidateFilter[] {
  const misunderstanding = scenarioByType(preview, "misunderstanding");
  const vulnerability = scenarioByType(preview, "emotional_vulnerability");
  const collaboration = scenarioByType(preview, "collaboration");
  const repair = scenarioByType(preview, "repair_attempt");
  const drift = scenarioByType(preview, "longitudinal_drift");
  const reselection = scenarioByType(preview, "reselection");
  const sharedSafety = clamp((preview.hiddenEdge.sharedReality + preview.emotionalSafety) / 2);
  const repairCapacity = clamp((preview.repairPotential + preview.hiddenEdge.repair + repair.state.repairWillingness) / 3);

  return [
    candidateFilter({
      id: "grounded-reciprocity",
      label: "Grounded reciprocity",
      relationshipMode: "friendship",
      scenarioType: "first_contact",
      fit: sharedSafety * 0.34 +
        preview.hiddenEdge.responsiveness * 0.24 +
        preview.hiddenEdge.modeScores.friendship * 0.22 +
        vulnerability.state.emotionalSafety * 0.2,
      risk: vulnerability.state.disengagementRisk * 0.46 + (1 - preview.emotionalSafety) * 0.34 + misunderstanding.state.irritation * 0.2,
      confidence: preview.relationshipReport.confidence,
      why: "Prioritize people and contexts where response quality, pacing, and emotional safety are visible before intensity rises.",
      evidence: [
        `Friendship mode ${Math.round(preview.hiddenEdge.modeScores.friendship * 100)}`,
        `Shared reality ${Math.round(preview.hiddenEdge.sharedReality * 100)}`,
        `Vulnerability safety ${Math.round(vulnerability.state.emotionalSafety * 100)}`,
      ],
      riskSignals: [
        "Early over-disclosure without reciprocal checking",
        "Warmth that disappears when a small need is named",
      ],
      nextObservation: "In the next close interaction, watch whether the other person reflects your meaning before offering a fix.",
    }),
    candidateFilter({
      id: "repair-capable-challenger",
      label: "Repair-capable challenger",
      relationshipMode: "friendship",
      scenarioType: "repair_attempt",
      fit: repairCapacity * 0.42 +
        preview.conflictCompatibility * 0.22 +
        preview.hiddenEdge.modeScores.friendship * 0.18 +
        repair.simulation.stability * 0.18,
      risk: misunderstanding.state.irritation * 0.38 + (1 - repairCapacity) * 0.36 + misunderstanding.state.disengagementRisk * 0.26,
      confidence: preview.relationshipReport.confidence,
      why: "A useful challenging relationship is not low-friction; it is one where tension can be named and repaired.",
      evidence: [
        `Repair capacity ${Math.round(repairCapacity * 100)}`,
        `Conflict fit ${Math.round(preview.conflictCompatibility * 100)}`,
        `Repair stability ${Math.round(repair.simulation.stability * 100)}`,
      ],
      riskSignals: [
        "Debate becomes a test of worth",
        "The other side avoids impact repair after disagreement",
      ],
      nextObservation: "Notice whether disagreement ends with one concrete repair move or only with explanation.",
    }),
    candidateFilter({
      id: "structured-collaborator",
      label: "Structured collaborator",
      relationshipMode: "collaboration",
      scenarioType: "collaboration",
      fit: preview.hiddenEdge.modeScores.collaboration * 0.32 +
        preview.complementarity * 0.24 +
        collaboration.state.reciprocity * 0.22 +
        collaboration.simulation.stability * 0.22,
      risk: collaboration.state.irritation * 0.34 + (1 - preview.dialogueCompatibility) * 0.3 + drift.state.disengagementRisk * 0.2 + (1 - preview.complementarity) * 0.16,
      confidence: preview.relationshipReport.confidence,
      why: "Collaboration should be filtered for pace, role clarity, and repair under pressure rather than surface enthusiasm.",
      evidence: [
        `Collaboration mode ${Math.round(preview.hiddenEdge.modeScores.collaboration * 100)}`,
        `Complementarity ${Math.round(preview.complementarity * 100)}`,
        `Scenario stability ${Math.round(collaboration.simulation.stability * 100)}`,
      ],
      riskSignals: [
        "Ambiguous ownership of decisions",
        "Fast agreement that avoids constraints",
      ],
      nextObservation: "Before committing to shared work, test one small decision with explicit roles and a clear pace.",
    }),
    candidateFilter({
      id: "steady-mentor",
      label: "Steady mentor / guide",
      relationshipMode: "mentorship",
      scenarioType: "emotional_vulnerability",
      fit: preview.hiddenEdge.modeScores.mentorship * 0.32 +
        preview.dialogueCompatibility * 0.2 +
        preview.repairPotential * 0.2 +
        vulnerability.state.openness * 0.14 +
        preview.emotionalSafety * 0.14,
      risk: (1 - vulnerability.state.emotionalSafety) * 0.36 + vulnerability.state.disengagementRisk * 0.28 + (1 - preview.hiddenEdge.responsiveness) * 0.2 + misunderstanding.state.irritation * 0.16,
      confidence: preview.relationshipReport.confidence,
      why: "Mentorship fit depends on calm truth-telling and pacing, not authority or intensity.",
      evidence: [
        `Mentorship mode ${Math.round(preview.hiddenEdge.modeScores.mentorship * 100)}`,
        `Dialogue fit ${Math.round(preview.dialogueCompatibility * 100)}`,
        `Openness under vulnerability ${Math.round(vulnerability.state.openness * 100)}`,
      ],
      riskSignals: [
        "Advice arrives before understanding",
        "Authority replaces mutual consent",
      ],
      nextObservation: "Ask for one bounded reflection and see whether it increases clarity without shrinking your agency.",
    }),
    candidateFilter({
      id: "high-intensity-low-repair",
      label: "High-intensity, low-repair dynamic",
      relationshipMode: "friendship",
      scenarioType: "longitudinal_drift",
      fit: preview.structuralSimilarity * 0.24 + reselection.state.curiosity * 0.2 + preview.hiddenEdge.sharedReality * 0.18,
      risk: (1 - repairCapacity) * 0.34 +
        drift.state.disengagementRisk * 0.28 +
        misunderstanding.state.irritation * 0.22 +
        (1 - drift.simulation.stability) * 0.16,
      confidence: preview.relationshipReport.confidence,
      why: "Some relationships feel meaningful because of intensity, but BELIFE should defer them when repair and stability are not visible.",
      evidence: [
        `Repair capacity ${Math.round(repairCapacity * 100)}`,
        `Drift risk ${Math.round(drift.state.disengagementRisk * 100)}`,
        `Long-term stability ${Math.round(drift.simulation.stability * 100)}`,
      ],
      riskSignals: [
        "Strong resonance followed by avoidant distance",
        "Repeated tension without a reliable repair rhythm",
      ],
      nextObservation: "Do not increase investment until the relationship shows a repeatable repair pattern after a small rupture.",
    }),
    candidateFilter({
      id: "novelty-without-safety",
      label: "Novelty without safety",
      relationshipMode: "collaboration",
      scenarioType: "first_contact",
      fit: preview.complementarity * 0.2 + preview.structuralSimilarity * 0.16 + preview.hiddenEdge.mechanisms.closure * 0.16,
      risk: (1 - preview.emotionalSafety) * 0.38 +
        (1 - preview.hiddenEdge.responsiveness) * 0.24 +
        misunderstanding.state.disengagementRisk * 0.2 +
        collaboration.state.irritation * 0.18,
      confidence: preview.relationshipReport.confidence,
      why: "Novelty can be useful, but BELIFE should filter it through observed safety, responsiveness, and disagreement handling.",
      evidence: [
        `Emotional safety ${Math.round(preview.emotionalSafety * 100)}`,
        `Responsiveness ${Math.round(preview.hiddenEdge.responsiveness * 100)}`,
        `Closure mechanism ${Math.round(preview.hiddenEdge.mechanisms.closure * 100)}`,
      ],
      riskSignals: [
        "The connection feels energizing but not stabilizing",
        "Curiosity substitutes for trust evidence",
      ],
      nextObservation: "Treat novelty as exploratory until it proves calmness under a boundary or disagreement.",
    }),
  ];
}

function scenarioByType(preview: CompatibilityAxes, type: ConnectionScenarioType) {
  return preview.scenarioPreviews.find((scenario) => scenario.type === type) ?? buildFallbackScenario(preview);
}

function candidateFilter(input: Omit<ConnectionCandidateFilter, "fit" | "risk" | "status"> & {
  fit: number;
  risk: number;
}): ConnectionCandidateFilter {
  const fit = clamp(input.fit);
  const risk = clamp(input.risk);
  return {
    ...input,
    fit,
    risk,
    confidence: clamp(input.confidence),
    status: candidateStatus(fit, risk, input.confidence),
  };
}

function candidateStatus(fit: number, risk: number, confidence: number): ConnectionCandidateStatus {
  if (risk >= 0.58 && fit < 0.62) return "defer";
  if (fit >= 0.58 && risk <= 0.5 && confidence >= 0.35) return "prioritize";
  return "watch";
}

function buildModeRanking(
  current: CompatibilityAxes["hiddenEdge"]["modeScores"],
  previous: CompatibilityAxes["hiddenEdge"]["modeScores"] | null,
): ConnectionModeRank[] {
  const modes: ConnectionRelationshipMode[] = ["friendship", "collaboration", "mentorship"];
  const previousRanks = previous
    ? new Map(
        modes
          .map((mode) => ({ mode, score: previous[mode] }))
          .sort((left, right) => right.score - left.score)
          .map((item, index) => [item.mode, index + 1] as const),
      )
    : new Map<ConnectionRelationshipMode, number>();

  return modes
    .map((mode) => {
      const previousScore = previous?.[mode] ?? null;
      const delta = previousScore === null ? 0 : clampDelta(current[mode] - previousScore);
      return {
        mode,
        score: current[mode],
        previousScore,
        delta,
      };
    })
    .sort((left, right) => right.score - left.score)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
      previousRank: previousRanks.get(item.mode) ?? null,
      direction: directionFor(item.delta, previous ? 0.025 : null),
    }));
}

function buildRerankingSignals(
  current: CompatibilityAxes,
  previous?: CompatibilityAxes | null,
): ConnectionRerankingSignal[] {
  const currentEdge = current.hiddenEdge;
  const previousEdge = previous?.hiddenEdge;
  const signals: Array<{
    key: string;
    label: string;
    current: number;
    previous: number | null;
    weight: number;
    interpretation: (direction: ConnectionRerankingDirection, delta: number) => string;
  }> = [
    {
      key: "edgeStrength",
      label: "Latent edge strength",
      current: currentEdge.edgeStrength,
      previous: previousEdge?.edgeStrength ?? null,
      weight: 1,
      interpretation: (direction) =>
        direction === "up"
          ? "The latent edge is strengthening as current signals reinforce prior connection structure."
          : direction === "down"
            ? "The latent edge is softening because current signals add more caution than reinforcement."
            : "The latent edge is not moving enough to justify a stronger relationship interpretation.",
    },
    {
      key: "sharedReality",
      label: "Shared reality",
      current: currentEdge.sharedReality,
      previous: previousEdge?.sharedReality ?? null,
      weight: 0.74,
      interpretation: (direction) =>
        direction === "up"
          ? "Value, goal, and dialogue signals are aligning more clearly."
          : direction === "down"
            ? "Shared meaning looks less stable and needs more direct observation."
            : "Shared meaning is currently stable but still evidence-bounded.",
    },
    {
      key: "responsiveness",
      label: "Responsiveness",
      current: currentEdge.responsiveness,
      previous: previousEdge?.responsiveness ?? null,
      weight: 0.78,
      interpretation: (direction) =>
        direction === "up"
          ? "The model sees stronger signs that the relationship can respond before advising or defending."
          : direction === "down"
            ? "Response quality is a weaker signal, so BELIFE should slow escalation."
            : "Response quality remains the main thing to observe next.",
    },
    {
      key: "repair",
      label: "Repair capacity",
      current: currentEdge.repair,
      previous: previousEdge?.repair ?? null,
      weight: 0.82,
      interpretation: (direction) =>
        direction === "up"
          ? "Repair potential is carrying more of the relationship-fit estimate."
          : direction === "down"
            ? "Repair potential is thinner, so disagreement and misunderstanding need smaller tests."
            : "Repair potential is steady and should be validated with a real low-stakes rupture.",
    },
    {
      key: "drift",
      label: "Drift risk",
      current: currentEdge.mechanisms.drift,
      previous: previousEdge?.mechanisms.drift ?? null,
      weight: -0.64,
      interpretation: (direction) =>
        direction === "up"
          ? "Longer-horizon distance or disengagement risk is becoming more relevant."
          : direction === "down"
            ? "Longer-horizon drift looks less dominant than before."
            : "Drift risk is stable; it should remain a watch signal, not a conclusion.",
    },
    {
      key: "conflictToxicity",
      label: "Conflict toxicity",
      current: currentEdge.mechanisms.conflictToxicity,
      previous: previousEdge?.mechanisms.conflictToxicity ?? null,
      weight: -0.72,
      interpretation: (direction) =>
        direction === "up"
          ? "Conflict cost is rising, so BELIFE should prefer repair-first contexts."
          : direction === "down"
            ? "Conflict cost is easing and the relationship may tolerate more honest dialogue."
            : "Conflict cost is not moving enough to update the hidden graph strongly.",
    },
    {
      key: "confidence",
      label: "Interpretation confidence",
      current: currentEdge.confidence,
      previous: previousEdge?.confidence ?? null,
      weight: 0.48,
      interpretation: (direction) =>
        direction === "up"
          ? "The model has more usable signal, but still must stay non-deterministic."
          : direction === "down"
            ? "Confidence dropped, so ranking changes should be treated as provisional."
            : "Confidence is steady and should be improved through more observed interactions.",
    },
  ];

  return signals.map((signal) => {
    const delta = signal.previous === null ? 0 : clampDelta(signal.current - signal.previous);
    const direction = directionFor(delta, signal.previous === null ? null : 0.025);
    return {
      key: signal.key,
      label: signal.label,
      previous: signal.previous,
      current: clamp(signal.current),
      delta,
      direction,
      impact: clampDelta(delta * signal.weight),
      interpretation: signal.interpretation(direction, delta),
    };
  });
}

function rerankingSummary(input: {
  current: CompatibilityAxes;
  previous?: CompatibilityAxes | null;
  edgeDelta: number;
  topMode?: ConnectionModeRank;
  topSignal?: ConnectionRerankingSignal;
}) {
  if (!input.previous) {
    return "BELIFE has created the first latent relationship ranking baseline. Future conversations and rehearsals will update this hidden graph incrementally.";
  }

  const movement =
    Math.abs(input.edgeDelta) < 0.025
      ? "mostly stable"
      : input.edgeDelta > 0
        ? "slightly stronger"
        : "more cautious";
  const mode = input.topMode ? `${input.topMode.mode} is currently ranked #${input.topMode.rank}` : "mode ranking is forming";
  const signal = input.topSignal ? `the largest update signal is ${input.topSignal.label}` : "no single update signal dominates";
  return `The hidden edge is ${movement}; ${mode}, and ${signal}.`;
}

function rerankingStabilizers(current: CompatibilityAxes, signals: ConnectionRerankingSignal[]) {
  const byKey = new Map(signals.map((signal) => [signal.key, signal]));
  const stabilizers = [
    "Collect one more real interaction before treating a mode rank as stable.",
    "Prefer low-pressure scenes where response quality and repair can be observed.",
  ];

  if ((byKey.get("drift")?.current ?? current.hiddenEdge.mechanisms.drift) >= 0.5) {
    stabilizers.push("Check whether distance appears after small friction, not only after large conflict.");
  }
  if ((byKey.get("conflictToxicity")?.current ?? current.hiddenEdge.mechanisms.conflictToxicity) >= 0.46) {
    stabilizers.push("Use one explicit repair sentence before increasing relational investment.");
  }
  if ((byKey.get("responsiveness")?.current ?? current.hiddenEdge.responsiveness) >= 0.58) {
    stabilizers.push("Preserve the relationship pace that produced responsiveness instead of escalating intensity.");
  }

  return stabilizers.slice(0, 4);
}

function directionFor(delta: number, threshold: number | null): ConnectionRerankingDirection {
  if (threshold === null) return "new";
  if (delta > threshold) return "up";
  if (delta < -threshold) return "down";
  return "stable";
}

function clampDelta(value: number) {
  return Math.max(-1, Math.min(1, value));
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

function normalizeSimulationInput(
  input: ConnectionSimulationInput,
  fallbackScenarioType: ConnectionScenarioPreview["type"],
): ConnectionSimulationInput {
  return {
    scenarioType: connectionScenarioTypes.includes(input.scenarioType) ? input.scenarioType : fallbackScenarioType,
    relationshipMode: connectionRelationshipModes.includes(input.relationshipMode) ? input.relationshipMode : "friendship",
    timeHorizon: connectionSimulationHorizons.includes(input.timeHorizon) ? input.timeHorizon : "immediate",
    scene: input.scene.trim().slice(0, 1200),
    pressure: clamp(input.pressure),
    vulnerability: clamp(input.vulnerability),
  };
}

function buildFallbackScenario(preview: CompatibilityAxes): ConnectionScenarioPreview {
  const state: ConnectionScenarioState = {
    trust: preview.hiddenEdge.edgeStrength,
    emotionalSafety: preview.emotionalSafety,
    irritation: 0.24,
    curiosity: preview.structuralSimilarity,
    reciprocity: preview.dialogueCompatibility,
    openness: 0.42,
    repairWillingness: preview.repairPotential,
    disengagementRisk: preview.hiddenEdge.mechanisms.drift,
    commitmentTendency: preview.complementarity,
  };
  return {
    type: "first_contact",
    title: "First Contact",
    likelyDynamic: "BELIFE has enough signal for an early relationship rehearsal, but not for a deterministic prediction.",
    supportMove: "Start with a small, observable exchange before making a strong relationship conclusion.",
    riskSignal: "If the exchange starts demanding certainty too quickly, slow the pace and collect more signal.",
    state,
    confidence: preview.relationshipReport.confidence,
    simulation: buildScenarioSimulation(state, "first_contact", {
      confidence: preview.relationshipReport.confidence,
      conflictSensitivity: preview.hiddenEdge.mechanisms.conflictToxicity,
      dialogueCompatibility: preview.dialogueCompatibility,
      emotionalSafety: preview.emotionalSafety,
      repairPotential: preview.repairPotential,
    }),
  };
}

function horizonPressureFor(horizon: ConnectionSimulationHorizon) {
  if (horizon === "long_term") return 0.44;
  if (horizon === "next_month") return 0.24;
  return 0.1;
}

function adjustScenarioState(input: {
  base: ConnectionScenarioState;
  preview: CompatibilityAxes;
  modeFit: number;
  sceneSignal: number;
  pressure: number;
  vulnerability: number;
  horizonPressure: number;
}): ConnectionScenarioState {
  const modeLift = input.modeFit - 0.5;
  const safetyBuffer = input.preview.emotionalSafety * input.vulnerability;
  const repairBuffer = input.preview.repairPotential * (1 - input.pressure);
  const pressureDrag = input.pressure + input.horizonPressure * 0.42;

  return {
    trust: clamp(input.base.trust + modeLift * 0.16 + safetyBuffer * 0.14 - pressureDrag * 0.12),
    emotionalSafety: clamp(input.base.emotionalSafety + safetyBuffer * 0.12 + repairBuffer * 0.06 - pressureDrag * 0.13),
    irritation: clamp(input.base.irritation + input.pressure * 0.2 + input.horizonPressure * 0.06 - repairBuffer * 0.08),
    curiosity: clamp(input.base.curiosity + input.sceneSignal * 0.08 + modeLift * 0.08 - input.pressure * 0.04),
    reciprocity: clamp(input.base.reciprocity + modeLift * 0.12 + input.preview.dialogueCompatibility * 0.06 - pressureDrag * 0.08),
    openness: clamp(input.base.openness + input.vulnerability * 0.16 + input.sceneSignal * 0.05 - pressureDrag * 0.1),
    repairWillingness: clamp(input.base.repairWillingness + repairBuffer * 0.14 - input.pressure * 0.06),
    disengagementRisk: clamp(input.base.disengagementRisk + pressureDrag * 0.16 - repairBuffer * 0.1 - modeLift * 0.06),
    commitmentTendency: clamp(input.base.commitmentTendency + modeLift * 0.18 - input.horizonPressure * 0.08 - input.pressure * 0.04),
  };
}

function buildCustomLikelyDynamic(
  input: ConnectionSimulationInput,
  scenario: ConnectionScenarioPreview,
  state: ConnectionScenarioState,
  stressLoad: number,
) {
  if (stressLoad >= 0.7) {
    return `${scenario.title} is likely to be shaped by pressure first. BELIFE would watch whether trust (${Math.round(
      state.trust * 100,
    )}) can stay ahead of irritation and disengagement before treating the connection as stable.`;
  }
  if (input.vulnerability >= 0.62 && state.emotionalSafety >= 0.52) {
    return `${scenario.title} can become a useful vulnerability test if the other side responds with pacing, reflection, and repair rather than quick certainty.`;
  }
  if (state.disengagementRisk >= 0.55) {
    return `${scenario.title} has a visible distance signal. The next move should reduce pressure and make the expected response smaller and clearer.`;
  }
  return `${scenario.title} looks workable as a rehearsal scene. The main question is whether reciprocity and repair stay visible after the first exchange.`;
}

function buildCustomSupportMove(
  input: ConnectionSimulationInput,
  preview: CompatibilityAxes,
  scenario: ConnectionScenarioPreview,
) {
  if (input.relationshipMode === "collaboration") {
    return `Name the shared task, decision boundary, and pace before solving. Current collaboration fit is ${Math.round(
      preview.hiddenEdge.modeScores.collaboration * 100,
    )}.`;
  }
  if (input.relationshipMode === "mentorship") {
    return `Ask for one concrete reflection or next step instead of broad reassurance. Current mentorship fit is ${Math.round(
      preview.hiddenEdge.modeScores.mentorship * 100,
    )}.`;
  }
  if (input.vulnerability >= 0.58) {
    return "Start with a small truth, then pause for the other person's response before sharing the full emotional load.";
  }
  return scenario.supportMove;
}

function buildCustomRiskSignal(
  input: ConnectionSimulationInput,
  scenario: ConnectionScenarioPreview,
  state: ConnectionScenarioState,
) {
  if (input.pressure >= 0.68) {
    return "The key risk is asking the relationship to provide certainty while both sides still need pacing and signal.";
  }
  if (state.irritation >= 0.52) {
    return "Watch for explanation turning into defense. If that appears, switch from persuasion to impact-checking.";
  }
  return scenario.riskSignal;
}

function buildOpeningMove(readiness: number, input: ConnectionSimulationInput) {
  if (readiness >= 0.62) {
    return "Open directly, but keep the ask small enough that the other person can answer honestly.";
  }
  if (input.pressure >= 0.6) {
    return "Lower the stakes first: name the context, ask for a short response, and avoid making the whole relationship the topic.";
  }
  return "Begin with observation before interpretation: describe what happened, then ask how they experienced it.";
}

function buildRepairMove(state: ConnectionScenarioState, preview: CompatibilityAxes) {
  if (state.repairWillingness >= 0.58 && preview.repairPotential >= 0.5) {
    return "If tension appears, reflect the impact first, then suggest one next behavior both sides can test.";
  }
  return "If tension appears, pause the interpretation and ask for the smallest correctable misunderstanding.";
}

function buildHiddenEdge(input: {
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
  relationshipReport: ConnectionRelationshipReport;
  previous?: ConnectionHiddenEdge;
}): ConnectionHiddenEdge {
  const { axes, scenarioPreviews, behavior, relationshipReport, previous } = input;
  const scenarioCount = Math.max(1, scenarioPreviews.length);
  const averageDisengagement =
    scenarioPreviews.reduce((sum, scenario) => sum + scenario.state.disengagementRisk, 0) / scenarioCount;
  const averageIrritation = scenarioPreviews.reduce((sum, scenario) => sum + scenario.state.irritation, 0) / scenarioCount;
  const directness = behavior?.directness ?? 0.35;
  const empathy = behavior?.empathyOrientation ?? 0.35;
  const solution = behavior?.solutionOrientation ?? 0.35;
  const warmth = behavior?.warmth ?? 0.35;

  const sharedReality = clamp(
    axes.structuralSimilarity * 0.58 + axes.dialogueCompatibility * 0.22 + axes.emotionalSafety * 0.2,
  );
  const responsiveness = clamp(
    axes.dialogueCompatibility * 0.45 + axes.emotionalSafety * 0.2 + warmth * 0.2 + empathy * 0.15,
  );
  const repair = axes.repairPotential;
  const mechanisms = {
    homophily: axes.structuralSimilarity,
    reciprocity: responsiveness,
    closure: clamp(((axes.complementarity + sharedReality) / 2) * axes.confidence),
    persistence: previous?.edgeStrength ?? 0.22,
    drift: clamp(averageDisengagement * 0.7 + (1 - axes.dialogueCompatibility) * 0.3),
    conflictToxicity: clamp(averageIrritation * 0.55 + (1 - axes.conflictCompatibility) * 0.45),
  };
  const edgeStrength = clamp(
    mechanisms.persistence * 0.42 +
      relationshipReport.compatibilityScore * 0.26 +
      mechanisms.reciprocity * 0.14 +
      mechanisms.closure * 0.08 +
      repair * 0.08 -
      mechanisms.drift * 0.09 -
      mechanisms.conflictToxicity * 0.07,
  );

  return {
    status: "latent",
    compatibility: relationshipReport.compatibilityScore,
    confidence: relationshipReport.confidence,
    edgeStrength,
    modeScores: {
      friendship: clamp(sharedReality * 0.28 + responsiveness * 0.28 + repair * 0.22 + axes.emotionalSafety * 0.22),
      collaboration: clamp(axes.complementarity * 0.34 + axes.dialogueCompatibility * 0.26 + solution * 0.22 + repair * 0.18),
      mentorship: clamp(responsiveness * 0.28 + repair * 0.24 + directness * 0.22 + axes.emotionalSafety * 0.16 + axes.structuralSimilarity * 0.1),
    },
    sharedReality,
    responsiveness,
    repair,
    mechanisms,
    lastSimulatedAt: new Date().toISOString(),
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

function buildScenarioSimulation(
  base: ConnectionScenarioState,
  type: ConnectionScenarioPreview["type"],
  context: {
    confidence: number;
    conflictSensitivity: number;
    dialogueCompatibility: number;
    emotionalSafety: number;
    repairPotential: number;
  },
): ConnectionScenarioSimulation {
  const scenarioPressure: Record<ConnectionScenarioPreview["type"], number> = {
    first_contact: 0.1,
    light_disagreement: 0.18,
    emotional_vulnerability: 0.2,
    pressure: 0.28,
    misunderstanding: 0.26,
    repair_attempt: 0.19,
    collaboration: 0.14,
    reselection: 0.22,
    longitudinal_drift: 0.3,
  };
  const volatility = clamp(
    scenarioPressure[type] +
      context.conflictSensitivity * 0.34 +
      (1 - context.dialogueCompatibility) * 0.18 +
      (1 - context.confidence) * 0.14,
    0.06,
    0.48,
  );
  const resilience = clamp(
    context.repairPotential * 0.4 + context.emotionalSafety * 0.34 + context.confidence * 0.16,
    0.06,
    0.86,
  );
  const offsets = [-1, -0.62, -0.28, 0, 0.31, 0.68, 1];
  const samples = offsets.map((offset) => perturbScenarioState(base, offset, volatility, resilience));
  const ranked = [...samples].sort((left, right) => stateHealthScore(right) - stateHealthScore(left));
  const spread = stateSpread(samples);
  const stability = clamp(1 - spread * 0.92 - volatility * 0.18 + resilience * 0.14);
  const riskBand: ConnectionScenarioSimulation["riskBand"] =
    spread < 0.12 ? "narrow" : spread < 0.22 ? "moderate" : "wide";

  return {
    iterations: samples.length,
    stability,
    riskBand,
    bestCase: ranked[0],
    likelyCase: averageScenarioState(samples),
    riskCase: ranked.at(-1) ?? ranked[0],
    notes: simulationNotes({ riskBand, stability, riskCase: ranked.at(-1) ?? ranked[0] }),
  };
}

function perturbScenarioState(
  base: ConnectionScenarioState,
  offset: number,
  volatility: number,
  resilience: number,
): ConnectionScenarioState {
  const stress = Math.max(0, offset) * volatility;
  const support = Math.max(0, -offset) * resilience;
  return {
    trust: clamp(base.trust + support * 0.13 - stress * 0.15),
    emotionalSafety: clamp(base.emotionalSafety + support * 0.12 - stress * 0.16),
    irritation: clamp(base.irritation + stress * 0.2 - support * 0.1),
    curiosity: clamp(base.curiosity + support * 0.08 - stress * 0.07),
    reciprocity: clamp(base.reciprocity + support * 0.1 - stress * 0.12),
    openness: clamp(base.openness + support * 0.11 - stress * 0.11),
    repairWillingness: clamp(base.repairWillingness + support * 0.12 - stress * 0.08),
    disengagementRisk: clamp(base.disengagementRisk + stress * 0.2 - support * 0.12),
    commitmentTendency: clamp(base.commitmentTendency + support * 0.1 - stress * 0.1),
  };
}

function stateHealthScore(state: ConnectionScenarioState) {
  return (
    state.trust +
    state.emotionalSafety +
    state.curiosity * 0.5 +
    state.reciprocity +
    state.openness * 0.6 +
    state.repairWillingness +
    state.commitmentTendency -
    state.irritation -
    state.disengagementRisk * 1.2
  );
}

function averageScenarioState(samples: ConnectionScenarioState[]): ConnectionScenarioState {
  const keys = Object.keys(samples[0]) as Array<keyof ConnectionScenarioState>;
  return keys.reduce((accumulator, key) => {
    accumulator[key] = clamp(samples.reduce((sum, sample) => sum + sample[key], 0) / samples.length);
    return accumulator;
  }, {} as ConnectionScenarioState);
}

function stateSpread(samples: ConnectionScenarioState[]) {
  const keys = Object.keys(samples[0]) as Array<keyof ConnectionScenarioState>;
  const totalSpread = keys.reduce((sum, key) => {
    const values = samples.map((sample) => sample[key]);
    return sum + (Math.max(...values) - Math.min(...values));
  }, 0);
  return totalSpread / keys.length;
}

function simulationNotes(input: {
  riskBand: ConnectionScenarioSimulation["riskBand"];
  stability: number;
  riskCase: ConnectionScenarioState;
}) {
  const notes = [
    input.riskBand === "wide"
      ? "상황 압력이 커지면 결과 범위가 넓어질 수 있습니다."
      : "현재 신호에서는 장면 결과 범위가 비교적 제한적입니다.",
  ];
  if (input.riskCase.disengagementRisk >= 0.55) {
    notes.push("위험 샘플에서는 거리두기 신호가 먼저 커질 수 있습니다.");
  }
  if (input.stability >= 0.68) {
    notes.push("반복 샘플에서도 관계 상태가 비교적 안정적으로 유지됩니다.");
  }
  return notes;
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

  const scenarios: Omit<ConnectionScenarioPreview, "simulation">[] = [
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
    {
      type: "reselection",
      title: "Reselection",
      likelyDynamic:
        axes.emotionalSafety + axes.repairPotential + axes.complementarity >= 1.72
          ? "다른 선택지나 바쁜 일정이 생겨도 이 관계를 다시 선택할 이유가 비교적 선명하게 남을 수 있습니다."
          : "좋은 순간이 있어도 피로, 대안, 거리감이 쌓이면 이 관계를 계속 선택해야 하는 이유가 흐려질 수 있습니다.",
      supportMove: "관계를 당연하게 두기보다, 서로에게 실제로 도움이 된 순간과 계속 남기고 싶은 리듬을 주기적으로 확인하는 편이 좋습니다.",
      riskSignal: "편안함을 방치로 착각하거나, 한쪽만 계속 조율하는 구조가 되면 재선택 가능성이 빠르게 낮아질 수 있습니다.",
      state: state({
        trust: axes.emotionalSafety * 0.28 + axes.repairPotential * 0.26 + axes.complementarity * 0.22,
        emotionalSafety: axes.emotionalSafety * 0.46 + empathy * 0.18 + warmth * 0.12,
        curiosity: axes.structuralSimilarity * 0.28 + axes.complementarity * 0.22 + (hasGoal ? 0.14 : 0),
        reciprocity: axes.dialogueCompatibility * 0.26 + axes.repairPotential * 0.22 + empathy * 0.16,
        repairWillingness: axes.repairPotential * 0.52 + empathy * 0.18,
        disengagementRisk: 0.18 + (1 - axes.complementarity) * 0.22 + conflictSensitivity * 0.22,
        commitmentTendency:
          axes.complementarity * 0.28 + axes.emotionalSafety * 0.24 + axes.repairPotential * 0.2 + (hasGoal ? 0.12 : 0),
      }),
      confidence: scenarioConfidence,
    },
    {
      type: "longitudinal_drift",
      title: "Longitudinal Drift",
      likelyDynamic:
        axes.structuralSimilarity + axes.dialogueCompatibility + axes.repairPotential >= 1.68
          ? "시간이 지나며 생활 리듬이 달라져도 대화와 수리 루틴이 유지되면 관계의 방향을 다시 맞출 여지가 있습니다."
          : "초기 호감이 있어도 반복되는 오해나 속도 차이를 방치하면 서서히 멀어지는 흐름이 생길 수 있습니다.",
      supportMove: "관계가 조용히 식기 전에 기대, 피로, 고마움, 서운함을 작게라도 갱신하는 정기적인 대화가 도움이 됩니다.",
      riskSignal: "갈등이 폭발하지 않아도 무응답, 미루기, 짧아지는 대화가 반복되면 drift 신호로 봐야 합니다.",
      state: state({
        trust: axes.structuralSimilarity * 0.22 + axes.repairPotential * 0.28 + axes.emotionalSafety * 0.2,
        emotionalSafety: axes.emotionalSafety * 0.36 + axes.conflictCompatibility * 0.2 + warmth * 0.14,
        irritation: conflictSensitivity * 0.3 + (1 - axes.dialogueCompatibility) * 0.18,
        curiosity: axes.structuralSimilarity * 0.22 + pacing * 0.18 + (hasValue ? 0.12 : 0),
        reciprocity: axes.dialogueCompatibility * 0.34 + pacing * 0.18 + empathy * 0.14,
        openness: disclosure * 0.24 + axes.emotionalSafety * 0.24 + directness * 0.12,
        repairWillingness: axes.repairPotential * 0.48 + axes.conflictCompatibility * 0.18,
        disengagementRisk:
          0.16 + (1 - axes.repairPotential) * 0.2 + (1 - axes.dialogueCompatibility) * 0.2 + conflictSensitivity * 0.18,
        commitmentTendency:
          axes.structuralSimilarity * 0.18 + axes.complementarity * 0.2 + axes.emotionalSafety * 0.2 + axes.repairPotential * 0.16,
      }),
      confidence: scenarioConfidence,
    },
  ];

  return scenarios.map((scenario) => ({
    ...scenario,
    simulation: buildScenarioSimulation(scenario.state, scenario.type, {
      confidence: scenario.confidence,
      conflictSensitivity,
      dialogueCompatibility: axes.dialogueCompatibility,
      emotionalSafety: axes.emotionalSafety,
      repairPotential: axes.repairPotential,
    }),
  }));
}
