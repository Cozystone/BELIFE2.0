import { Activity, TrendingDown, TrendingUp } from "lucide-react";
import { ScoreBar } from "@/components/app/score-bar";
import type { MentalStateHistoryReport, MentalStateTrendMetric } from "@/lib/engines/types";

const labels: Record<MentalStateTrendMetric, string> = {
  stressLoad: "스트레스",
  burnoutRisk: "번아웃",
  rumination: "반추",
  emotionalVolatility: "감정 변동",
  motivation: "동기",
  socialWithdrawal: "위축",
  supportNeed: "도움 필요",
  cognitiveDistortionRisk: "해석 주의",
  motivationalCollapseRisk: "동기 위험",
  baselineDeviation: "기준선 변화",
  abstentionRisk: "판단 보류",
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
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-500/10 text-cyan-200">
          <Activity className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">상태 히스토리</h2>
          <p className="mt-1 text-sm text-zinc-500">최근 상태 추정이 어떤 방향으로 움직이는지 봅니다.</p>
        </div>
      </div>

      <p className="mt-4 text-sm leading-6 text-zinc-400">{history.directionSummary}</p>

      {current ? (
        <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
          <div className="space-y-4">
            <ScoreBar label="스트레스 부하" value={current.stressLoad} />
            <ScoreBar label="번아웃 위험" value={current.burnoutRisk} tone="teal" />
            <ScoreBar label="반추" value={current.rumination} tone="zinc" />
            <ScoreBar label="동기" value={current.motivation} tone="teal" />
            <ScoreBar label="도움 필요" value={current.supportNeed} />
            <ScoreBar label="해석 주의" value={current.cognitiveDistortionRisk} tone="zinc" />
            <ScoreBar label="동기 저하 위험" value={current.motivationalCollapseRisk} tone="zinc" />
            <ScoreBar label="판단 보류" value={current.abstentionRisk} tone="zinc" />
          </div>
          <div className="space-y-3">
            <div className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
              <p className="text-xs text-zinc-500">최근 영향 요인</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {current.drivers.slice(0, 5).map((driver) => (
                  <span key={driver} className="rounded-sm border border-white/[0.08] px-2 py-1 text-xs text-zinc-300">
                    {driver}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
              <p className="text-xs text-zinc-500">이전 대비 변화</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {visibleMetrics.map((metric) => {
                  const value = history.deltas[metric];
                  const Icon = value > 0 ? TrendingUp : TrendingDown;
                  return (
                    <div key={metric} className="flex items-center justify-between rounded-sm bg-white/[0.04] px-2 py-2">
                      <span className="text-xs text-zinc-400">{labels[metric]}</span>
                      <span className={value > 0 ? "inline-flex items-center gap-1 text-xs text-cyan-200" : "inline-flex items-center gap-1 text-xs text-teal-200"}>
                        <Icon className="h-3 w-3" />
                        {deltaLabel(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-md border border-teal-300/10 bg-teal-400/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-500">완만 추세</p>
                <span className="font-mono text-[11px] text-teal-200">lambda {history.trend.lambda}</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-300">{history.trend.summary}</p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {(["stressLoad", "rumination", "motivation", "abstentionRisk"] as const).map((metric) => (
                  <div key={metric} className="rounded-sm bg-slate-950/30 px-2 py-2">
                    <p className="text-[11px] text-zinc-500">{labels[metric]}</p>
                    <p className="mt-1 font-mono text-xs text-teal-200">{Math.round(history.trend.values[metric] * 100)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {recent.length ? (
          recent.map((state) => (
            <article key={state.createdAt} className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
              <p className="font-mono text-xs text-zinc-500">{formatDate(state.createdAt)}</p>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{state.summary}</p>
              <p className="mt-3 font-mono text-xs text-cyan-200">신뢰도 {Math.round(state.confidence * 100)}</p>
            </article>
          ))
        ) : (
          <div className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3 text-sm text-zinc-500">
            아직 상태 히스토리가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
