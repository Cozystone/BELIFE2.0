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
  };
}
