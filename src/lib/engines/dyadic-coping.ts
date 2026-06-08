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
      label: "Stress Communication",
      polarity: "protective",
      score:
        preview.dialogueCompatibility * 0.26 +
        vulnerability.state.openness * 0.22 +
        memorySignals.reciprocity * 0.18 +
        preview.emotionalSafety * 0.16 +
        (1 - currentWithdrawal) * 0.12 +
        stateConfidence(state) * 0.06,
      interpretation:
        "Whether stress can be named early enough that the relationship does not have to guess, test, or withdraw.",
      evidence: [
        `Dialogue fit ${percent(preview.dialogueCompatibility)}`,
        `Vulnerability openness ${percent(vulnerability.state.openness)}`,
        `Current withdrawal inverse ${percent(1 - currentWithdrawal)}`,
      ],
      nextObservation: "Name one small pressure point before it becomes a rupture and watch whether the response stays specific.",
    }),
    axis({
      key: "supportiveResponse",
      label: "Supportive Response",
      polarity: "protective",
      score:
        preview.hiddenEdge.responsiveness * 0.26 +
        preview.emotionalSafety * 0.18 +
        memorySignals.emotionalSafety * 0.18 +
        memorySignals.reciprocity * 0.16 +
        vulnerability.state.emotionalSafety * 0.14 +
        (1 - volatility) * 0.08,
      interpretation:
        "Whether pressure is met with pacing, reflection, and useful care instead of instant advice or defensiveness.",
      evidence: [
        `Responsiveness ${percent(preview.hiddenEdge.responsiveness)}`,
        `Observed safety ${percent(memorySignals.emotionalSafety)}`,
        `Volatility inverse ${percent(1 - volatility)}`,
      ],
      nextObservation: "Share a bounded need and observe whether the other side reflects impact before moving to a solution.",
    }),
    axis({
      key: "jointRegulation",
      label: "Joint Regulation",
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
        "Whether the relationship can turn stress into shared coordination rather than two isolated coping strategies.",
      evidence: [
        `Collaboration reciprocity ${percent(collaboration.state.reciprocity)}`,
        `Observed reciprocity ${percent(memorySignals.reciprocity)}`,
        `Scenario stress inverse ${percent(1 - scenarioStress)}`,
      ],
      nextObservation: "Try one explicit shared plan: what each person owns, what can wait, and what counts as enough.",
    }),
    axis({
      key: "repairAfterStress",
      label: "Repair After Stress",
      polarity: "protective",
      score:
        preview.repairPotential * 0.26 +
        preview.hiddenEdge.repair * 0.2 +
        memorySignals.repairEvidence * 0.2 +
        repair.state.repairWillingness * 0.18 +
        preview.conflictCompatibility * 0.12 +
        (1 - misunderstanding.state.irritation) * 0.04,
      interpretation:
        "Whether tension can move toward clarification, empathy, and repair after impact has already happened.",
      evidence: [
        `Repair potential ${percent(preview.repairPotential)}`,
        `Observed repair ${percent(memorySignals.repairEvidence)}`,
        `Repair scenario willingness ${percent(repair.state.repairWillingness)}`,
      ],
      nextObservation: "After a small misunderstanding, separate intention, impact, and next behavior in three short sentences.",
    }),
    axis({
      key: "withdrawalRisk",
      label: "Withdrawal Risk",
      polarity: "risk",
      score: withdrawalRisk,
      interpretation:
        "How likely pressure is to become avoidance, blame, emotional shutdown, or distance before repair can happen.",
      evidence: [
        `Current withdrawal ${percent(currentWithdrawal)}`,
        `Pressure disengagement ${percent(pressure.state.disengagementRisk)}`,
        `Memory risk ${percent(memorySignals.riskPenalty)}`,
      ],
      nextObservation: "When distance appears, ask whether this is a need for recovery time or a sign that repair is being avoided.",
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
      "This VSA and dyadic-coping lens is private BELIFE relationship reflection, not public matching, therapy, diagnosis, or deterministic prediction.",
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
  const evidence = input.totalInteractions >= 3 ? "repeated pair memory" : "early pair memory";
  if (input.withdrawalRisk >= 0.48 && input.protectiveAverage < 0.62) {
    return `Stress may still move toward distance before repair. BELIFE should treat this as ${evidence}, not proof, and slow the relationship rhythm. Confidence ${percent(input.confidence)}.`;
  }
  if (input.protectiveAverage >= 0.62) {
    return `Dyadic coping capacity is forming: stress can be named, shared, and repaired when the pace stays explicit. Evidence is ${evidence}. Confidence ${percent(input.confidence)}.`;
  }
  return `Dyadic coping is still a working hypothesis. The next signal is whether pressure leads to clarification and repair, not avoidance. Evidence is ${evidence}. Confidence ${percent(input.confidence)}.`;
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
      ? `Current stress load is elevated at ${percent(input.currentStress)}, so the relationship needs slower pacing under pressure.`
      : `Current stress load is moderate at ${percent(input.currentStress)} and still worth naming before it spikes.`,
    input.currentWithdrawal >= 0.48
      ? `Social withdrawal is a visible vulnerability at ${percent(input.currentWithdrawal)}.`
      : `Withdrawal is not the dominant signal yet, but distance should still be interpreted carefully.`,
    input.preview.conflictCompatibility < 0.5
      ? `Conflict fit is still building at ${percent(input.preview.conflictCompatibility)}.`
      : `Conflict fit has enough signal to test repair gently at ${percent(input.preview.conflictCompatibility)}.`,
  ];

  const stressfulEvents = [
    `Pressure scenario disengagement risk ${percent(input.pressure.state.disengagementRisk)}.`,
    `Misunderstanding irritation ${percent(input.misunderstanding.state.irritation)}.`,
    `Longitudinal drift risk ${percent(input.drift.state.disengagementRisk)}.`,
  ];
  if (input.state?.drivers.length) stressfulEvents.push(`Current state drivers: ${input.state.drivers.slice(0, 2).join(", ")}.`);

  const adaptiveProcesses = [
    `Repair willingness under stress ${percent(input.repair.state.repairWillingness)}.`,
    `Observed relationship repair evidence ${percent(input.memorySignals.repairEvidence)}.`,
    `Withdrawal risk to contain ${percent(input.withdrawalRisk)}.`,
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
    `Scenario stress load ${percent(input.scenarioStress)}.`,
    `Pressure irritation ${percent(input.pressure.state.irritation)} and disengagement ${percent(
      input.pressure.state.disengagementRisk,
    )}.`,
    `Misunderstanding disengagement ${percent(input.misunderstanding.state.disengagementRisk)}.`,
    input.state
      ? `Current support need ${percent(input.state.supportNeed)} with mental-state confidence ${percent(input.state.confidence)}.`
      : "No current mental-state estimate is available, so stress signals lean on relationship simulations.",
    `Withdrawal risk ${percent(input.withdrawalRisk)}.`,
  ];
}

function buildSupportMoves(axes: DyadicCopingAxis[], memorySignals: RelationshipMemorySignals) {
  const weakestProtective = [...axes]
    .filter((axisItem) => axisItem.polarity === "protective")
    .sort((left, right) => left.score - right.score)[0];
  const moves = [
    weakestProtective.nextObservation,
    "Use a two-step check: first reflect the pressure, then ask what kind of support would actually help.",
    "After a tense moment, record whether repair happened through clarification, empathy, or a concrete next behavior.",
  ];
  if (memorySignals.confidence < 0.35) {
    moves.push("Add one consented relationship memory note before treating this coping lens as stable.");
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
      ? "Distance may become the first coping move when pressure rises."
      : "Withdrawal is not dominant, but it should be checked before interpreting distance as rejection.",
    input.memorySignals.repairEvidence < 0.35
      ? "Repair evidence is still thin; warmth alone should not be treated as stability."
      : "Repair evidence exists, but it still needs consistency under different stress levels.",
    input.pressure.state.irritation >= 0.45
      ? "Pressure scenarios can raise irritation enough to distort the next response."
      : "Pressure irritation is manageable if support is named early.",
  ];
  if ((input.state?.emotionalVolatility ?? 0) >= 0.55) {
    signals.push("Current emotional volatility could make neutral silence feel more threatening than it is.");
  }
  return signals;
}

function buildNextConversationMove(axes: DyadicCopingAxis[]) {
  const withdrawal = axes.find((axisItem) => axisItem.key === "withdrawalRisk");
  const weakestProtective = [...axes]
    .filter((axisItem) => axisItem.polarity === "protective")
    .sort((left, right) => left.score - right.score)[0];
  if (withdrawal && withdrawal.score >= 0.48) {
    return "Start with: 'When pressure rises, I sometimes go quiet. Can we agree how to pause and come back without guessing?'";
  }
  return `Start with the weakest coping axis: ${weakestProtective.nextObservation}`;
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
