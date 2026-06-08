import {
  Activity,
  BrainCircuit,
  Clock3,
  DatabaseZap,
  GitBranch,
  MessageCircle,
  Sparkles,
} from "lucide-react";
import type {
  BelifeMemoryTimeline,
  BelifeMemoryTimelineItem,
} from "@/lib/engines/types";
import { displayMemoryTag, displayTimelineTitle } from "@/lib/memory-display";

const kindLabels: Record<BelifeMemoryTimelineItem["kind"], string> = {
  message: "대화",
  memory: "장기기억",
  ontology: "자기 구조",
  ontology_edge: "구조 연결",
  state: "상태 추정",
  behavior: "행동 신호",
  connection: "관계 기억",
};

const kindIcons: Record<BelifeMemoryTimelineItem["kind"], typeof MessageCircle> = {
  message: MessageCircle,
  memory: DatabaseZap,
  ontology: BrainCircuit,
  ontology_edge: GitBranch,
  state: Activity,
  behavior: Sparkles,
  connection: GitBranch,
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function metric(item: BelifeMemoryTimelineItem) {
  if (typeof item.confidence === "number") return `신뢰도 ${Math.round(item.confidence * 100)}%`;
  if (typeof item.salience === "number") return `중요도 ${Math.round(item.salience * 100)}%`;
  return item.evidenceType ?? item.source ?? kindLabels[item.kind];
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
          <p className="mt-1 text-sm text-zinc-500">BELIFE가 최근 저장하고 해석한 근거 신호입니다.</p>
        </div>
      </div>

      <div className="mt-5">
        {timeline.items.length ? (
          <ol className="space-y-0">
            {timeline.items.map((item, index) => {
              const Icon = kindIcons[item.kind];
              return (
                <li key={`${item.kind}-${item.id}-${index}`} className="relative grid grid-cols-[32px_minmax(0,1fr)] gap-4 pb-5 last:pb-0">
                  <div className="relative flex justify-center">
                    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-slate-950 text-sky-100">
                      <Icon className="h-4 w-4" />
                    </span>
                    {index < timeline.items.length - 1 ? <span className="absolute top-8 bottom-0 w-px bg-white/10" /> : null}
                  </div>
                  <article className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3 transition hover:border-sky-200/20 hover:bg-slate-950/60">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-sm bg-white/[0.08] px-2 py-1 text-[11px] text-zinc-400">
                            {kindLabels[item.kind]}
                          </span>
                          {item.evidenceType ? (
                            <span className="rounded-sm bg-cyan-500/10 px-2 py-1 text-[11px] text-cyan-200">
                              {item.evidenceType === "EXTRACTED" ? "직접 근거" : item.evidenceType === "INFERRED" ? "추론 근거" : "확인 필요"}
                            </span>
                          ) : null}
                        </div>
                        <h3 className="mt-3 text-sm font-medium text-zinc-100">{displayTimelineTitle(item)}</h3>
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
                          {displayMemoryTag(tag)}
                        </span>
                      ))}
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        ) : (
          <div className="rounded-md border border-white/[0.08] bg-slate-950/40 p-4 text-sm leading-6 text-zinc-500">
            아직 표시할 기억 신호가 없습니다. 대화를 시작하면 장기기억 후보가 이곳에 쌓입니다.
          </div>
        )}
      </div>
    </section>
  );
}
