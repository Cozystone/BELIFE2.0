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
        ? "BELIFE has enough repeated signal to speak with useful confidence."
        : label === "clear"
          ? "BELIFE has a meaningful early structure, but it will improve with more natural conversations."
          : label === "building"
            ? "BELIFE is beginning to understand your structure. Treat interpretations as useful hypotheses."
            : "BELIFE is still getting oriented. Early interpretations should stay light.",
    createdAt: isoNow(),
  };
}
