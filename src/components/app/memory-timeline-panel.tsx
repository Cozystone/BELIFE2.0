import { Clock3, Sparkles } from "lucide-react";
import type { BelifeMemoryTimeline, BelifeMemoryTimelineItem } from "@/lib/engines/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function metric(item: BelifeMemoryTimelineItem) {
  if (typeof item.confidence === "number") return `신뢰도 ${Math.round(item.confidence * 100)}`;
  if (typeof item.salience === "number") return `중요도 ${Math.round(item.salience * 100)}`;
  return item.evidenceType ?? item.source ?? item.kind;
}

export function MemoryTimelinePanel({ timeline }: { timeline: BelifeMemoryTimeline }) {
  return (
    <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md border border-teal-300/20 bg-teal-400/10 text-teal-200">
          <Clock3 className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">기억 타임라인</h2>
          <p className="mt-1 text-sm text-zinc-500">BELIFE가 최근 저장하고 해석한 신호입니다.</p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {timeline.items.length ? (
          timeline.items.map((item, index) => (
            <article key={`${item.kind}-${item.id}-${index}`} className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-sm bg-white/[0.08] px-2 py-1 text-[11px] uppercase text-zinc-400">
                      {item.kind}
                    </span>
                    {item.evidenceType ? (
                      <span className="rounded-sm bg-cyan-500/10 px-2 py-1 text-[11px] uppercase text-cyan-200">
                        {item.evidenceType}
                      </span>
                    ) : null}
                  </div>
                  <h3 className="mt-3 text-sm font-medium text-zinc-100">{item.title}</h3>
                </div>
                <span className="shrink-0 text-right font-mono text-xs text-zinc-500">{formatDate(item.createdAt)}</span>
              </div>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{item.body}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                <span className="inline-flex items-center gap-1 text-cyan-200">
                  <Sparkles className="h-3 w-3" />
                  {metric(item)}
                </span>
                {item.tags.slice(0, 4).map((tag, tagIndex) => (
                  <span key={`${tag}-${tagIndex}`} className="rounded-sm border border-white/[0.08] px-2 py-1">
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))
        ) : (
          <div className="rounded-md border border-white/[0.08] bg-slate-950/40 p-4 text-sm leading-6 text-zinc-500">
            아직 표시할 기억 신호가 없습니다.
          </div>
        )}
      </div>
    </section>
  );
}
