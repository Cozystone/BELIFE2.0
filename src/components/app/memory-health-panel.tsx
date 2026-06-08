import { Archive, History, ShieldAlert } from "lucide-react";
import type { MemoryHealthReport } from "@/lib/engines/types";
import { ScoreBar } from "./score-bar";

export function MemoryHealthPanel({ report }: { report: MemoryHealthReport }) {
  return (
    <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-400/10 text-teal-200">
            <History className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-medium">기억 건강도</h2>
            <p className="mt-2 text-sm leading-6 text-zinc-500">{report.summary}</p>
          </div>
        </div>
        <div className="rounded-md border border-teal-300/15 bg-slate-950/40 px-4 py-3 text-right">
          <p className="text-xs text-zinc-500">기억 건강도</p>
          <p className="mt-1 font-mono text-4xl text-teal-200">{Math.round(report.score * 100)}</p>
          <p className="mt-1 text-xs uppercase text-zinc-500">{report.label}</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <ScoreBar label="최신성" value={report.freshness.score} tone="teal" />
          <ScoreBar label="근거 명확도" value={1 - report.evidenceBalance.ambiguityRatio} />
          <ScoreBar label="모순 낮음" value={1 - Math.min(1, report.contradictionWatchlist.length / 5)} tone="zinc" />
          <div className="grid gap-3 sm:grid-cols-3">
            {report.freshness.windows.map((window) => (
              <div key={window.label} className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
                <p className="text-xs text-zinc-500">{window.label} 신호</p>
                <p className="mt-2 font-mono text-2xl text-zinc-100">{window.count}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <article className="rounded-md border border-cyan-300/10 bg-cyan-500/[0.04] p-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-cyan-200" />
              <h3 className="text-sm font-medium text-zinc-100">모순 관찰</h3>
            </div>
            <div className="mt-3 space-y-3">
              {report.contradictionWatchlist.slice(0, 3).map((item, index) => (
                <div key={`${item.id}-${index}`} className="rounded-md border border-white/[0.08] bg-slate-950/30 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                    <span className="font-mono text-xs text-cyan-200">{item.severity}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{item.reason}</p>
                </div>
              ))}
              {!report.contradictionWatchlist.length ? (
                <p className="text-sm leading-6 text-zinc-500">최근 기억에는 모순 관찰 항목이 없습니다.</p>
              ) : null}
            </div>
          </article>

          <article className="rounded-md border border-white/[0.08] bg-slate-950/30 p-4">
            <div className="flex items-center gap-2">
              <Archive className="h-4 w-4 text-zinc-300" />
              <h3 className="text-sm font-medium text-zinc-100">잊어도 되는 후보</h3>
            </div>
            <div className="mt-3 space-y-3">
              {report.forgettingCandidates.slice(0, 3).map((item, index) => (
                <div key={`${item.id}-${index}`} className="rounded-md border border-white/[0.08] bg-slate-950/35 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                    <span className="font-mono text-xs text-zinc-400">{item.severity}</span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-500">{item.suggestedAction}</p>
                </div>
              ))}
              {!report.forgettingCandidates.length ? (
                <p className="text-sm leading-6 text-zinc-500">최근 기억에는 오래된 저신뢰 후보가 없습니다.</p>
              ) : null}
            </div>
          </article>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_0.9fr]">
        <article className="rounded-md border border-teal-300/10 bg-teal-400/[0.04] p-4">
          <p className="text-xs font-medium uppercase text-teal-200">에피소드 기준점</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {report.episodicAnchors.slice(0, 4).map((anchor) => (
              <div key={anchor.id} className="rounded-md border border-white/[0.08] bg-slate-950/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium text-cyan-200">{sourceLabel(anchor.source)}</p>
                  <p className="font-mono text-xs text-zinc-500">{Math.round(anchor.confidence * 100)}</p>
                </div>
                <p className="mt-2 text-sm font-medium text-zinc-100">{anchor.label}</p>
                <p className="mt-1 text-sm leading-6 text-zinc-500">{anchor.detail}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-md border border-white/[0.08] bg-slate-950/30 p-4">
          <p className="text-xs font-medium uppercase text-zinc-400">다음 행동</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
            {report.nextActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs leading-5 text-zinc-600">{report.guardrail}</p>
        </article>
      </div>
    </section>
  );
}

function sourceLabel(source: string) {
  const labels: Record<string, string> = {
    memory: "기억",
    message: "대화",
    ontology: "온톨로지",
  };
  return labels[source] ?? source;
}
