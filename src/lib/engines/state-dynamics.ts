import { clamp, isoNow } from "@/lib/utils";
import type {
  MentalStateEstimate,
  MentalStateTrendMetric,
  StateDynamicsCoupling,
  StateDynamicsReport,
} from "./types";

const dynamicsMetrics: MentalStateTrendMetric[] = [
  "stressLoad",
  "burnoutRisk",
  "rumination",
  "emotionalVolatility",
  "motivation",
  "socialWithdrawal",
  "supportNeed",
  "cognitiveDistortionRisk",
  "motivationalCollapseRisk",
  "abstentionRisk",
];

const labels: Record<MentalStateTrendMetric, string> = {
  stressLoad: "스트레스",
  burnoutRisk: "번아웃 위험",
  rumination: "반복 사고",
  emotionalVolatility: "정서 변동성",
  motivation: "동기",
  socialWithdrawal: "사회적 거리두기",
  supportNeed: "지지 필요",
  cognitiveDistortionRisk: "왜곡 주의",
  motivationalCollapseRisk: "동기 저하 위험",
  baselineDeviation: "기준선 변화",
  abstentionRisk: "해석 주의",
};

const stabilizingMetric = new Set<MentalStateTrendMetric>(["motivation"]);

export function buildStateDynamicsReport(states: MentalStateEstimate[]): StateDynamicsReport {
  const items = [...states].sort((left, right) => new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime());
  const current = items.at(-1) ?? null;
  const deltas = stateDeltas(items);
  const laggedCouplings = buildLaggedCouplings(deltas);
  const heuristicCouplings = buildHeuristicCouplings(items, deltas);
  const couplings = (laggedCouplings.length ? laggedCouplings : heuristicCouplings).slice(0, 6);
  const modelKind: StateDynamicsReport["modelKind"] = laggedCouplings.length ? "lagged-delta" : "early-heuristic";
  const confidence = clamp(
    Math.min(1, items.length / 8) * 0.38 +
      Math.min(1, deltas.length / 6) * 0.22 +
      average(items.map((item) => item.confidence)) * 0.24 +
      (laggedCouplings.length ? 0.16 : 0.04),
  );
  const baselineShift = buildBaselineShift(items);

  return {
    generatedAt: isoNow(),
    modelKind,
    sampleSize: items.length,
    confidence,
    summary: buildSummary({ modelKind, sampleSize: items.length, confidence, baselineShift, couplings }),
    guardrail:
      "상태 다이내믹은 BELIFE의 비공개 개인 변화 가설입니다. 진단, 치료, 인과관계의 증명이 아닙니다.",
    baselineShift,
    couplings,
    stabilizers: buildStabilizers(couplings, current),
    watchlist: buildWatchlist(couplings, baselineShift, current),
  };
}

function stateDeltas(items: MentalStateEstimate[]) {
  const deltas: Array<{
    from: MentalStateEstimate;
    to: MentalStateEstimate;
    values: Record<MentalStateTrendMetric, number>;
  }> = [];

  for (let index = 1; index < items.length; index += 1) {
    const from = items[index - 1];
    const to = items[index];
    const values = {} as Record<MentalStateTrendMetric, number>;
    for (const metric of dynamicsMetrics) values[metric] = to[metric] - from[metric];
    values.baselineDeviation = to.baselineDeviation - from.baselineDeviation;
    deltas.push({ from, to, values });
  }

  return deltas;
}

function buildLaggedCouplings(deltas: ReturnType<typeof stateDeltas>): StateDynamicsCoupling[] {
  if (deltas.length < 3) return [];
  const couplings: StateDynamicsCoupling[] = [];

  for (const source of dynamicsMetrics) {
    for (const target of dynamicsMetrics) {
      if (source === target) continue;
      const xs = deltas.slice(0, -1).map((delta) => delta.values[source]);
      const ys = deltas.slice(1).map((delta) => delta.values[target]);
      const correlation = pearson(xs, ys);
      const movement = average(ys.map((value) => Math.abs(value)));
      const strength = clamp(Math.abs(correlation) * 0.72 + Math.min(1, movement * 4) * 0.28);
      if (strength < 0.34) continue;

      couplings.push(
        coupling({
          source,
          target,
          strength,
          correlation,
          evidence: `Lagged delta correlation ${signed(correlation)} across ${deltas.length} state transitions.`,
        }),
      );
    }
  }

  return couplings.sort((left, right) => right.strength - left.strength).slice(0, 8);
}

function buildHeuristicCouplings(
  items: MentalStateEstimate[],
  deltas: ReturnType<typeof stateDeltas>,
): StateDynamicsCoupling[] {
  const current = items.at(-1);
  const latest = deltas.at(-1)?.values;
  if (!current) return [];

  const candidates: Array<{
    source: MentalStateTrendMetric;
    target: MentalStateTrendMetric;
    strength: number;
    correlation: number;
    evidence: string;
  }> = [
    {
      source: "stressLoad",
      target: "supportNeed",
      strength: current.stressLoad * 0.42 + current.supportNeed * 0.42 + Math.max(0, latest?.supportNeed ?? 0) * 0.16,
      correlation: 0.52,
      evidence: `Current stress ${percent(current.stressLoad)} and support need ${percent(current.supportNeed)}.`,
    },
    {
      source: "rumination",
      target: "cognitiveDistortionRisk",
      strength: current.rumination * 0.44 + current.cognitiveDistortionRisk * 0.44 + Math.max(0, latest?.rumination ?? 0) * 0.12,
      correlation: 0.48,
      evidence: `Current rumination ${percent(current.rumination)} and interpretation caution ${percent(
        current.cognitiveDistortionRisk,
      )}.`,
    },
    {
      source: "burnoutRisk",
      target: "motivationalCollapseRisk",
      strength: current.burnoutRisk * 0.44 + current.motivationalCollapseRisk * 0.44 + Math.max(0, latest?.burnoutRisk ?? 0) * 0.12,
      correlation: 0.5,
      evidence: `번아웃 위험 ${percent(current.burnoutRisk)}와 동기 저하 위험 ${percent(
        current.motivationalCollapseRisk,
      )}.`,
    },
    {
      source: "motivation",
      target: "motivationalCollapseRisk",
      strength: current.motivation * 0.36 + (1 - current.motivationalCollapseRisk) * 0.38 + Math.max(0, latest?.motivation ?? 0) * 0.26,
      correlation: -0.48,
      evidence: `동기 ${percent(current.motivation)}와 동기 저하 위험 역지표 ${percent(
        1 - current.motivationalCollapseRisk,
      )}.`,
    },
    {
      source: "stressLoad",
      target: "socialWithdrawal",
      strength: current.stressLoad * 0.34 + current.socialWithdrawal * 0.44 + Math.max(0, latest?.socialWithdrawal ?? 0) * 0.22,
      correlation: 0.45,
      evidence: `스트레스 ${percent(current.stressLoad)}와 사회적 거리두기 ${percent(current.socialWithdrawal)}.`,
    },
  ];

  return candidates
    .map(coupling)
    .filter((item) => item.strength >= 0.2)
    .sort((left, right) => right.strength - left.strength)
    .slice(0, 5);
}

function coupling(input: {
  source: MentalStateTrendMetric;
  target: MentalStateTrendMetric;
  strength: number;
  correlation: number;
  evidence: string;
}): StateDynamicsCoupling {
  const strength = clamp(input.strength);
  const direction = couplingDirection(input.source, input.target, input.correlation);
  return {
    id: `${input.source}->${input.target}`,
    source: input.source,
    target: input.target,
    sourceLabel: labels[input.source],
    targetLabel: labels[input.target],
    strength,
    direction,
    evidence: input.evidence,
    interpretation: interpretationFor(input.source, input.target, direction, strength),
    nextObservation: nextObservationFor(input.source, input.target, direction),
  };
}

function couplingDirection(
  source: MentalStateTrendMetric,
  target: MentalStateTrendMetric,
  correlation: number,
): StateDynamicsCoupling["direction"] {
  const sourceStabilizes = stabilizingMetric.has(source);
  const targetStabilizes = stabilizingMetric.has(target);
  if (sourceStabilizes || targetStabilizes) {
    return correlation < 0 ? "protective" : "mixed";
  }
  return correlation >= 0 ? "amplifying" : "protective";
}

function interpretationFor(
  source: MentalStateTrendMetric,
  target: MentalStateTrendMetric,
  direction: StateDynamicsCoupling["direction"],
  strength: number,
) {
  const confidencePhrase = strength >= 0.62 ? "a stronger working signal" : "an early working signal";
  if (direction === "protective") {
    return `${labels[source]} may buffer ${labels[target].toLowerCase()} in this user's recent state pattern; treat it as ${confidencePhrase}.`;
  }
  if (direction === "mixed") {
    return `${labels[source]} and ${labels[target].toLowerCase()} move together in a mixed way, so BELIFE should ask for more context before advising.`;
  }
  return `${labels[source]} may amplify ${labels[target].toLowerCase()} in this user's recent state pattern; treat it as ${confidencePhrase}.`;
}

function nextObservationFor(
  source: MentalStateTrendMetric,
  target: MentalStateTrendMetric,
  direction: StateDynamicsCoupling["direction"],
) {
  if (direction === "protective") {
    return `When ${labels[source].toLowerCase()} changes, check whether ${labels[target].toLowerCase()} becomes easier to regulate.`;
  }
  return `When ${labels[source].toLowerCase()} rises, ask what happened just before ${labels[target].toLowerCase()} shifted.`;
}

function buildBaselineShift(items: MentalStateEstimate[]): StateDynamicsReport["baselineShift"] {
  const current = items.at(-1)?.baselineDeviation ?? 0;
  const recent = items.slice(-5);
  const trend = average(recent.map((item) => item.baselineDeviation));
  const level: StateDynamicsReport["baselineShift"]["level"] =
    Math.max(current, trend) >= 0.34 ? "high" : Math.max(current, trend) >= 0.18 ? "moderate" : "low";
  const interpretation =
    level === "high"
      ? "Recent state differs enough from baseline that BELIFE should slow down and ask for evidence."
      : level === "moderate"
        ? "There is a moderate baseline shift; compare this with recent sleep, pressure, and relationship context."
        : "기준선 변화는 낮습니다. 지금은 이상치 해석보다 반복 패턴이 더 중요합니다.";

  return {
    current: clamp(current),
    trend: clamp(trend),
    level,
    interpretation,
  };
}

function buildSummary(input: {
  modelKind: StateDynamicsReport["modelKind"];
  sampleSize: number;
  confidence: number;
  baselineShift: StateDynamicsReport["baselineShift"];
  couplings: StateDynamicsCoupling[];
}) {
  if (!input.sampleSize) {
    return "BELIFE does not have enough state history to model personal dynamics yet.";
  }
  const strongest = input.couplings[0];
  if (!strongest) {
    return `State dynamics are still thin. BELIFE has ${input.sampleSize} state estimate(s), so it should ask for more repeated check-ins before drawing links.`;
  }
  const method = input.modelKind === "lagged-delta" ? "지연 상태 변화" : "초기 휴리스틱 신호";
  return `${strongest.sourceLabel} -> ${strongest.targetLabel}이 현재 가장 또렷한 상태 다이내믹 가설입니다. 방법은 ${method}이고, 기준선 변화는 ${input.baselineShift.level}입니다. 신뢰도 ${percent(input.confidence)}.`;
}

function buildStabilizers(couplings: StateDynamicsCoupling[], current: MentalStateEstimate | null) {
  const items = [
    "Use small repeated check-ins so BELIFE can compare patterns across time, not single moods.",
    "Separate body load, thought loops, and relationship pressure before choosing an action.",
  ];
  const protective = couplings.find((item) => item.direction === "protective");
  if (protective) {
    items.unshift(protective.nextObservation);
  } else if (current && current.motivation < 0.42) {
    items.unshift("Make the next action small enough that motivation can recover without needing a full plan.");
  } else if (!current) {
    items.unshift("Start with one short check-in so BELIFE can create the first state transition.");
  }
  return items.slice(0, 3);
}

function buildWatchlist(
  couplings: StateDynamicsCoupling[],
  baselineShift: StateDynamicsReport["baselineShift"],
  current: MentalStateEstimate | null,
) {
  const watchlist = couplings
    .filter((item) => item.direction === "amplifying")
    .slice(0, 2)
    .map((item) => `${item.sourceLabel} may amplify ${item.targetLabel.toLowerCase()}; watch the next repeated trigger.`);
  if (baselineShift.level !== "low") {
    watchlist.push(baselineShift.interpretation);
  }
  if ((current?.abstentionRisk ?? 0) >= 0.45) {
    watchlist.push("Interpretation caution is elevated, so BELIFE should avoid confident conclusions without fresh evidence.");
  }
  return watchlist.length ? watchlist.slice(0, 3) : ["No strong amplification watch item yet; collect more state transitions."];
}

function pearson(xs: number[], ys: number[]) {
  if (xs.length !== ys.length || xs.length < 2) return 0;
  const meanX = average(xs);
  const meanY = average(ys);
  const numerator = xs.reduce((sum, x, index) => sum + (x - meanX) * (ys[index] - meanY), 0);
  const denomX = Math.sqrt(xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0));
  const denomY = Math.sqrt(ys.reduce((sum, y) => sum + (y - meanY) ** 2, 0));
  if (!denomX || !denomY) return 0;
  return clamp(numerator / (denomX * denomY), -1, 1);
}

function signed(value: number) {
  const rounded = Math.round(value * 100);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
}

function percent(value: number) {
  return Math.round(clamp(value) * 100);
}

function average(values: number[]) {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}
