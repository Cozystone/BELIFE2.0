import { clamp, isoNow, toPercent } from "@/lib/utils";
import type { DataTrustScore } from "./types";

export interface DataTrustInput {
  profileCompleteness: number;
  validSessionDensity: number;
  ontologyStability: number;
  behaviorCoverage: number;
  contradictionInverse?: number;
  recencyCoverage?: number;
}

export function calculateDataTrust(input: DataTrustInput): DataTrustScore {
  const profileCompleteness = clamp(input.profileCompleteness);
  const validSessionDensity = clamp(input.validSessionDensity);
  const ontologyStability = clamp(input.ontologyStability);
  const behaviorCoverage = clamp(input.behaviorCoverage);
  const contradictionInverse = clamp(input.contradictionInverse ?? 0.9);
  const recencyCoverage = clamp(input.recencyCoverage ?? validSessionDensity);

  const score =
    0.3 * profileCompleteness +
    0.25 * validSessionDensity +
    0.2 * ontologyStability +
    0.15 * behaviorCoverage +
    0.06 * contradictionInverse +
    0.04 * recencyCoverage;

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
