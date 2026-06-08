import { GitBranch, SearchCheck, ShieldAlert } from "lucide-react";
import { ScoreBar } from "@/components/app/score-bar";
import type { StateDynamicsReport } from "@/lib/engines/types";

export function StateDynamicsPanel({ dynamics }: { dynamics: StateDynamicsReport }) {
  return (
    <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-teal-300/20 bg-teal-400/10 text-teal-200">
          <GitBranch className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">상태 다이내믹스</h2>
            <span className="rounded-md border border-white/[0.08] bg-slate-950/40 px-2 py-1 font-mono text-xs text-teal-200">
              {dynamics.modelKind}
            </span>
            <span className="rounded-md border border-white/[0.08] bg-slate-950/40 px-2 py-1 font-mono text-xs text-zinc-300">
              n={dynamics.sampleSize}
            </span>
          </div>
          <p className="mt-2 text-sm leading-7 text-zinc-400">{dynamics.summary}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
        <div className="space-y-3">
          {dynamics.couplings.length ? (
            dynamics.couplings.slice(0, 4).map((coupling) => (
              <article key={coupling.id} className="rounded-md border border-white/[0.08] bg-slate-950/35 p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-medium text-zinc-100">
                      {coupling.sourceLabel}에서 {coupling.targetLabel}로
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-zinc-400">{coupling.interpretation}</p>
                  </div>
                  <span className="rounded-md bg-white/[0.06] px-2 py-1 font-mono text-xs text-zinc-300">
                    {coupling.direction}
                  </span>
                </div>
                <div className="mt-3">
                  <ScoreBar label="연결 강도" value={coupling.strength} tone={coupling.direction === "protective" ? "teal" : "zinc"} />
                </div>
                <p className="mt-3 text-xs leading-5 text-zinc-500">{coupling.evidence}</p>
              </article>
            ))
          ) : (
            <div className="rounded-md border border-white/[0.08] bg-slate-950/35 p-3 text-sm leading-6 text-zinc-500">
              BELIFE가 신호를 서로 연결하려면 상태 변화 데이터가 조금 더 필요합니다.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <article className="rounded-md border border-white/[0.08] bg-slate-950/35 p-3">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-medium text-zinc-100">기준선 변화</h3>
              <span className="rounded-md bg-white/[0.06] px-2 py-1 font-mono text-xs text-zinc-300">
                {dynamics.baselineShift.level}
              </span>
            </div>
            <div className="mt-3 space-y-3">
              <ScoreBar label="현재" value={dynamics.baselineShift.current} />
              <ScoreBar label="추세" value={dynamics.baselineShift.trend} tone="teal" />
            </div>
            <p className="mt-3 text-sm leading-6 text-zinc-400">{dynamics.baselineShift.interpretation}</p>
          </article>

          <article className="rounded-md border border-teal-300/10 bg-teal-400/5 p-3">
            <div className="flex items-center gap-2">
              <SearchCheck className="h-4 w-4 text-teal-200" />
              <h3 className="text-sm font-medium text-zinc-100">안정화 요인</h3>
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
              {dynamics.stabilizers.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="rounded-md border border-cyan-300/10 bg-cyan-500/5 p-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-cyan-200" />
              <h3 className="text-sm font-medium text-zinc-100">주의 목록</h3>
            </div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
              {dynamics.watchlist.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </div>
      <p className="mt-4 rounded-md border border-white/[0.08] bg-slate-950/30 p-3 text-xs leading-5 text-zinc-500">
        {dynamics.guardrail}
      </p>
    </section>
  );
}
