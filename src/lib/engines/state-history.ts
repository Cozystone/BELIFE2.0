import { isoNow } from "@/lib/utils";
import type { MentalStateEstimate, MentalStateHistoryReport, MentalStateTrendDeltas, MentalStateTrendMetric } from "./types";

export const mentalStateTrendMetrics: MentalStateTrendMetric[] = [
  "stressLoad",
  "burnoutRisk",
  "rumination",
  "emotionalVolatility",
  "motivation",
  "socialWithdrawal",
  "supportNeed",
];

function emptyDeltas(): MentalStateTrendDeltas {
  return {
    stressLoad: 0,
    burnoutRisk: 0,
    rumination: 0,
    emotionalVolatility: 0,
    motivation: 0,
    socialWithdrawal: 0,
    supportNeed: 0,
  };
}

function buildDirectionSummary(current: MentalStateEstimate | null, previous: MentalStateEstimate | null, deltas: MentalStateTrendDeltas) {
  if (!current) return "아직 상태 히스토리가 없습니다. 짧은 대화나 온보딩을 완료하면 첫 상태 추정이 생깁니다.";
  if (!previous) return "첫 상태 추정입니다. BELIFE는 이후 대화와 온보딩 신호를 기준으로 변화 방향을 비교합니다.";

  if (deltas.stressLoad > 0.08 || deltas.supportNeed > 0.08) {
    return "최근에는 부담과 지원 필요 신호가 조금 커졌습니다. 속도를 낮추고 문제와 감정을 분리해 보는 것이 좋습니다.";
  }

  if (deltas.motivation > 0.08 && deltas.stressLoad <= 0.04) {
    return "최근에는 목표를 향한 에너지가 조금 회복되는 방향으로 보입니다. 작은 실행 단위가 도움이 됩니다.";
  }

  if (deltas.rumination > 0.08) {
    return "최근에는 반복 사고 신호가 올라왔습니다. 같은 생각이 실제 문제인지, 불안의 반복인지 나누어 보는 편이 좋습니다.";
  }

  if (Math.abs(deltas.stressLoad) < 0.05 && Math.abs(deltas.motivation) < 0.05) {
    return "최근 상태는 큰 흔들림보다 완만한 유지 흐름에 가깝습니다. 더 많은 대화가 쌓이면 방향성이 선명해집니다.";
  }

  return "최근 상태에는 작은 변화가 있습니다. BELIFE는 이를 단정하지 않고 다음 대화 신호와 함께 다시 비교합니다.";
}

export function buildMentalStateHistoryReport(states: MentalStateEstimate[]): MentalStateHistoryReport {
  const items = [...states].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const current = items.at(-1) ?? null;
  const previous = items.at(-2) ?? null;
  const deltas = emptyDeltas();

  if (current && previous) {
    for (const metric of mentalStateTrendMetrics) {
      deltas[metric] = current[metric] - previous[metric];
    }
  }

  return {
    generatedAt: isoNow(),
    current,
    previous,
    deltas,
    directionSummary: buildDirectionSummary(current, previous, deltas),
    items,
  };
}
