import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { ScoreBar } from "@/components/app/score-bar";
import type { MentalStateHistoryReport, MentalStateTrendMetric } from "@/lib/engines/types";

const labels: Record<MentalStateTrendMetric, string> = {
  stressLoad: "Stress",
  burnoutRisk: "Burnout",
  rumination: "Rumination",
  emotionalVolatility: "Volatility",
  motivation: "Motivation",
  socialWithdrawal: "Withdrawal",
  supportNeed: "Support",
  cognitiveDistortionRisk: "Distortion candidate",
  motivationalCollapseRisk: "Motivation risk",
  baselineDeviation: "Baseline shift",
  abstentionRisk: "Caution",
};

const visibleMetrics: MentalStateTrendMetric[] = [
  "stressLoad",
  "burnoutRisk",
  "rumination",
  "motivation",
  "supportNeed",
  "cognitiveDistortionRisk",
  "motivationalCollapseRisk",
  "abstentionRisk",
];

function deltaLabel(value: number) {
  const percent = Math.round(value * 100);
  if (percent === 0) return "0";
  return percent > 0 ? `+${percent}` : `${percent}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function StateHistoryPanel({ history }: { history: MentalStateHistoryReport }) {
  const current = history.current;
  const recent = history.items.slice(-4).reverse();

  return (
    <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-orange-300/20 bg-orange-500/10 text-orange-200">
          <Activity className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">State History</h2>
          <p className="mt-1 text-sm text-zinc-500">최근 상태 추정이 어떤 방향으로 움직이는지 봅니다.</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-400">{history.directionSummary}</p>

      {current ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-4">
            <ScoreBar label="Stress load" value={current.stressLoad} />
            <ScoreBar label="Burnout risk" value={current.burnoutRisk} tone="teal" />
            <ScoreBar label="Rumination" value={current.rumination} tone="zinc" />
            <ScoreBar label="Motivation" value={current.motivation} tone="teal" />
            <ScoreBar label="Support need" value={current.supportNeed} />
            <ScoreBar label="Distortion candidate" value={current.cognitiveDistortionRisk} tone="zinc" />
            <ScoreBar label="Motivation drop risk" value={current.motivationalCollapseRisk} tone="zinc" />
            <ScoreBar label="Interpretation caution" value={current.abstentionRisk} tone="zinc" />
          </div>
          <div className="space-y-3">
            <div className="rounded-md border border-white/[0.08] bg-black/40 p-3">
              <p className="text-xs text-zinc-500">Latest drivers</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {current.drivers.slice(0, 5).map((driver) => (
                  <span key={driver} className="rounded-sm border border-white/[0.08] px-2 py-1 text-xs text-zinc-300">
                    {driver}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-white/[0.08] bg-black/40 p-3">
              <p className="text-xs text-zinc-500">Delta vs previous</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {visibleMetrics.map((metric) => {
                  const value = history.deltas[metric];
                  const Icon = value > 0 ? TrendingUp : TrendingDown;
                  return (
                    <div key={metric} className="flex items-center justify-between rounded-sm bg-white/[0.04] px-2 py-2">
                      <span className="text-xs text-zinc-400">{labels[metric]}</span>
                      <span className={value > 0 ? "inline-flex items-center gap-1 text-xs text-orange-200" : "inline-flex items-center gap-1 text-xs text-teal-200"}>
                        <Icon className="h-3 w-3" />
                        {deltaLabel(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {recent.length ? (
          recent.map((state) => (
            <article key={state.createdAt} className="rounded-md border border-white/[0.08] bg-black/40 p-3">
              <p className="font-mono text-xs text-zinc-500">{formatDate(state.createdAt)}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{state.summary}</p>
              <p className="mt-3 font-mono text-xs text-orange-200">confidence {Math.round(state.confidence * 100)}</p>
            </article>
          ))
        ) : (
          <div className="rounded-md border border-white/[0.08] bg-black/40 p-3 text-sm text-zinc-500">
            아직 상태 히스토리가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
