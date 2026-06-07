import { clamp } from "@/lib/utils";
import type { BehaviorSnapshot, CompatibilityAxes, DataTrustScore, OntologyNode } from "./types";

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
        ? "BELIFE can already sketch a useful relationship-fit lens, but it will keep confidence visible."
        : "This is an early preview. BELIFE needs more natural conversations before making strong connection claims.",
    comfortSignals: [
      hasValue ? "Shared values and meaning language should matter." : "Value signals are still sparse.",
      behavior?.warmth && behavior.warmth > 0.5 ? "Warm response style may support emotional safety." : "Warmth signal is still forming.",
    ],
    tensionSignals: [
      hasFriction ? "Stress or energy mismatch could become important in close relationships." : "Friction patterns need more evidence.",
      behavior?.conflictSensitivity && behavior.conflictSensitivity > 0.45
        ? "Misunderstanding or pressure may need slower repair rituals."
        : "Conflict style is not yet clear enough to overstate.",
    ],
    idealConnectionPattern:
      "A person who responds with calm curiosity, respects your meaning-making pace, and can repair tension without rushing you.",
    riskyConnectionPattern:
      "A person who demands instant certainty, dismisses inner complexity, or turns your stress signals into pressure.",
  };
}
