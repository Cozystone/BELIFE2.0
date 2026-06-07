import { clamp, isoNow, toPercent } from "@/lib/utils";
import type { DataTrustScore, EvidenceType } from "./types";

export interface DataTrustInput {
  profileCompleteness: number;
  validSessionDensity: number;
  ontologyStability: number;
  behaviorCoverage: number;
  contradictionInverse?: number;
  recencyCoverage?: number;
  memoryQuality?: number;
}

export function calculateContradictionInverse(evidenceTypes: EvidenceType[]): number {
  if (!evidenceTypes.length) return 0.9;
  const ambiguous = evidenceTypes.filter((type) => type === "AMBIGUOUS").length;
  const inferred = evidenceTypes.filter((type) => type === "INFERRED").length;
  const ambiguousRatio = ambiguous / evidenceTypes.length;
  const inferredRatio = inferred / evidenceTypes.length;
  const uncertaintyPenalty = ambiguousRatio * 0.85 + Math.max(0, inferredRatio - 0.65) * 0.2;
  return clamp(1 - uncertaintyPenalty);
}

export function calculateDataTrust(input: DataTrustInput): DataTrustScore {
  const profileCompleteness = clamp(input.profileCompleteness);
  const validSessionDensity = clamp(input.validSessionDensity);
  const ontologyStability = clamp(input.ontologyStability);
  const behaviorCoverage = clamp(input.behaviorCoverage);
  const contradictionInverse = clamp(input.contradictionInverse ?? 0.9);
  const recencyCoverage = clamp(input.recencyCoverage ?? validSessionDensity);
  const memoryQuality = clamp(input.memoryQuality ?? ontologyStability);

  const score =
    0.27 * profileCompleteness +
    0.22 * validSessionDensity +
    0.18 * ontologyStability +
    0.14 * behaviorCoverage +
    0.07 * contradictionInverse +
    0.04 * recencyCoverage +
    0.08 * memoryQuality;

  const label =
    score >= 0.78 ? "strong" : score >= 0.58 ? "clear" : score >= 0.34 ? "building" : "low";

  return {
    score: toPercent(score),
    label,
    profileCompleteness,
    validSessionDensity,
    ontologyStability,
    behaviorCoverage,
    contradictionInverse,
    recencyCoverage,
    memoryQuality,
    explanation:
      label === "strong"
        ? "BELIFE가 유용한 확신으로 말할 만큼 반복 신호를 충분히 모았습니다."
        : label === "clear"
          ? "초기 자기 구조는 의미 있게 잡혔고, 자연스러운 대화가 쌓일수록 더 선명해집니다."
          : label === "building"
            ? "BELIFE가 당신의 구조를 이해하기 시작했습니다. 해석은 유용한 가설로 받아들이면 좋습니다."
            : "BELIFE는 아직 방향을 잡는 중입니다. 초기 해석은 가볍게 다루는 것이 좋습니다.",
    createdAt: isoNow(),
  };
}
