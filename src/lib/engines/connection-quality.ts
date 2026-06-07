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
      label: "Shared Reality",
      score:
        preview.hiddenEdge.sharedReality * 0.38 +
        preview.structuralSimilarity * 0.22 +
        memorySignals.averageQuality * 0.16 +
        memorySignals.reciprocity * 0.14 +
        memorySignals.confidence * 0.1,
      interpretation:
        "How much the relationship can feel like both sides are looking at the same meaning, context, and reality.",
      evidence: [
        `Latent shared reality ${percent(preview.hiddenEdge.sharedReality)}`,
        `Structural similarity ${percent(preview.structuralSimilarity)}`,
        `Observed pair quality ${percent(memorySignals.averageQuality)}`,
      ],
      nextObservation: "In the next meaningful conversation, watch whether the other side reflects your actual meaning before moving to advice.",
    }),
    qualityAxis({
      key: "partnerResponsiveness",
      label: "Partner Responsiveness",
      score:
        preview.hiddenEdge.responsiveness * 0.32 +
        preview.dialogueCompatibility * 0.2 +
        memorySignals.reciprocity * 0.18 +
        memorySignals.repairEvidence * 0.16 +
        memorySignals.emotionalSafety * 0.14,
      interpretation:
        "How clearly the interaction shows being understood, valued, and responded to with appropriate pacing.",
      evidence: [
        `Responsiveness ${percent(preview.hiddenEdge.responsiveness)}`,
        `Dialogue fit ${percent(preview.dialogueCompatibility)}`,
        `Observed repair ${percent(memorySignals.repairEvidence)}`,
      ],
      nextObservation: "Name one small need or boundary and observe whether the response becomes more specific, calmer, and more mutual.",
    }),
    qualityAxis({
      key: "participantInterest",
      label: "Participant Interest",
      score:
        scenarioCuriosity * 0.28 +
        memorySignals.averageQuality * 0.24 +
        memorySignals.reciprocity * 0.22 +
        preview.complementarity * 0.14 +
        preview.hiddenEdge.modeScores.friendship * 0.12,
      interpretation:
        "Whether interest is sustained and mutual enough for the relationship to keep selecting itself over time.",
      evidence: [
        `Scenario curiosity ${percent(scenarioCuriosity)}`,
        `Reciprocity ${percent(memorySignals.reciprocity)}`,
        `Friendship mode ${percent(preview.hiddenEdge.modeScores.friendship)}`,
      ],
      nextObservation: "Look for repeated initiative from both sides, not only intensity in one good interaction.",
    }),
    qualityAxis({
      key: "affectiveExperience",
      label: "Affective Experience",
      score:
        preview.emotionalSafety * 0.26 +
        memorySignals.emotionalSafety * 0.26 +
        vulnerabilitySafety * 0.16 +
        preview.repairPotential * 0.12 +
        repairScenario * 0.1 +
        (1 - memorySignals.riskPenalty) * 0.1,
      interpretation:
        "Whether the emotional tone feels safe, natural, and recoverable when closeness or pressure increases.",
      evidence: [
        `Emotional safety ${percent(preview.emotionalSafety)}`,
        `Observed safety ${percent(memorySignals.emotionalSafety)}`,
        `Risk inverse ${percent(1 - memorySignals.riskPenalty)}`,
      ],
      nextObservation: "Under mild pressure, notice whether your body feels more settled after the interaction or more guarded and compressed.",
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
      "This CDCS-inspired lens is private interaction-quality reflection for BELIFE self-understanding, not public matching, diagnosis, or deterministic relationship prediction.",
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
      ? "relationship memory now has repeated interaction evidence"
      : "relationship memory is still early, so BELIFE keeps this as a working hypothesis";
  return `${strongestAxis.label} is currently the clearest quality signal, while ${weakestAxis.label} needs the next observation. ${evidencePhrase}. Confidence ${percent(confidence)}.`;
}

function buildComfortSources(
  preview: CompatibilityAxes,
  memorySignals: RelationshipMemorySignals,
  strongestAxis: ConnectionQualityAxis,
) {
  return [
    `${strongestAxis.label} is the strongest CDCS-inspired signal at ${percent(strongestAxis.score)}.`,
    `Emotional safety combines latent fit ${percent(preview.emotionalSafety)} with observed pair safety ${percent(
      memorySignals.emotionalSafety,
    )}.`,
    memorySignals.strongestPair
      ? `${memorySignals.strongestPair.personLabel} has the strongest current pair evidence.`
      : "No named pair has enough repeated evidence yet, so comfort should be tested slowly.",
  ];
}

function buildTensionSources(
  preview: CompatibilityAxes,
  memorySignals: RelationshipMemorySignals,
  weakestAxis: ConnectionQualityAxis,
) {
  return [
    `${weakestAxis.label} is the most useful tension lens to observe next.`,
    `Conflict fit ${percent(preview.conflictCompatibility)} and repair memory ${percent(
      memorySignals.repairEvidence,
    )} set the current recovery ceiling.`,
    memorySignals.riskiestPair
      ? `${memorySignals.riskiestPair.personLabel} carries the highest private risk signal.`
      : "The main tension source is missing evidence, not proof that a relationship is unsafe.",
  ];
}

function buildHealthyPattern(strongestAxis: ConnectionQualityAxis, memorySignals: RelationshipMemorySignals) {
  if (memorySignals.repairEvidence >= 0.45) {
    return `A healthier pattern is emerging when ${strongestAxis.label.toLowerCase()} is paired with explicit repair after small misunderstandings.`;
  }
  return `A healthier pattern would keep ${strongestAxis.label.toLowerCase()} while adding more observable reciprocity and repair before increasing closeness.`;
}

function buildRiskyPattern(weakestAxis: ConnectionQualityAxis, memorySignals: RelationshipMemorySignals) {
  if (memorySignals.riskPenalty >= 0.58) {
    return `The risky pattern is repeated intensity without enough ${weakestAxis.label.toLowerCase()}, especially when repair is missing after tension.`;
  }
  return `The risky pattern is over-interpreting early warmth as stable connection before ${weakestAxis.label.toLowerCase()} has repeated evidence.`;
}

function buildMicroExperiments(axes: ConnectionQualityAxis[], totalInteractions: number) {
  const weakest = [...axes].sort((left, right) => left.score - right.score)[0];
  const base = [
    weakest.nextObservation,
    "After one interaction, record whether care, initiative, and repair moved both ways.",
  ];
  if (totalInteractions < 2) {
    base.push("Add one consented relationship memory note before treating this lens as stable.");
  } else {
    base.push("Compare two recent interactions and look for the repeated quality, not the single best moment.");
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
