import { AlertTriangle, LifeBuoy, ShieldCheck } from "lucide-react";
import type { SafetySignalReport } from "@/lib/engines/types";
import { cn, toPercent } from "@/lib/utils";

const levelTone: Record<SafetySignalReport["level"], string> = {
  none: "border-teal-300/20 bg-teal-400/10 text-teal-100",
  low: "border-zinc-300/20 bg-zinc-400/10 text-zinc-100",
  elevated: "border-rose-300/25 bg-rose-500/10 text-rose-100",
  urgent: "border-red-300/25 bg-red-500/10 text-red-100",
};

export function SafetyBoundaryPanel({ safety }: { safety: SafetySignalReport }) {
  const urgent = safety.level === "urgent" || safety.level === "elevated";
  const Icon = urgent ? AlertTriangle : ShieldCheck;

  return (
    <section
      className={cn(
        "rounded-md border p-4",
        urgent ? "border-rose-300/20 bg-rose-500/[0.07]" : "border-white/[0.08] bg-white/[0.04]",
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-md border",
            urgent ? "border-rose-300/20 bg-rose-400/10 text-rose-100" : "border-teal-300/20 bg-teal-400/10 text-teal-100",
          )}
        >
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">안전 경계</h2>
            <span className={cn("rounded-md border px-2 py-1 font-mono text-xs", levelTone[safety.level])}>
              {safety.level}
            </span>
            <span className="rounded-md border border-white/[0.08] bg-slate-950/40 px-2 py-1 font-mono text-xs text-zinc-300">
              신뢰도 {toPercent(safety.confidence)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-7 text-zinc-400">{safety.summary}</p>
          <p className="mt-2 text-sm leading-7 text-zinc-300">{safety.supportiveMessage}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_.85fr]">
        <article className="rounded-md border border-white/[0.08] bg-slate-950/35 p-3">
          <h3 className="text-sm font-medium text-zinc-100">다음 안전 행동</h3>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
            {safety.recommendedActions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ul>
        </article>

        <article className="rounded-md border border-white/[0.08] bg-slate-950/35 p-3">
          <div className="flex items-center gap-2">
            <LifeBuoy className="h-4 w-4 text-cyan-200" />
            <h3 className="text-sm font-medium text-zinc-100">지원 리소스</h3>
          </div>
          <div className="mt-3 space-y-3">
            {safety.resources.map((resource) => (
              <a
                key={`${resource.region}-${resource.label}`}
                href={resource.url}
                className="block rounded-md border border-white/[0.08] bg-white/[0.03] p-3 transition hover:border-cyan-300/30 hover:bg-cyan-500/10"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium text-zinc-100">{resource.label}</span>
                  <span className="font-mono text-xs text-zinc-500">{resource.availability}</span>
                </div>
                <p className="mt-2 text-xs leading-5 text-zinc-400">{resource.action}</p>
              </a>
            ))}
          </div>
        </article>
      </div>

      {safety.matchedSignals.length ? (
        <p className="mt-3 text-xs leading-5 text-zinc-500">
          감지 신호: {safety.matchedSignals.map((signal) => signal.replace(/\s+/g, " ")).join(", ")}
        </p>
      ) : null}
      <p className="mt-3 rounded-md border border-white/[0.08] bg-slate-950/30 p-3 text-xs leading-5 text-zinc-500">
        {safety.guardrail}
      </p>
    </section>
  );
}
