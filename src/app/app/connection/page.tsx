import { Route, Users } from "lucide-react";
import { ScoreBar } from "@/components/app/score-bar";
import { getConnectionPreview, requireUserForPage } from "@/lib/server/belife-service";

export const dynamic = "force-dynamic";

export default async function ConnectionPage() {
  const user = await requireUserForPage();
  const preview = await getConnectionPreview(user.id);
  const scenarioPreviews = preview.scenarioPreviews ?? [];

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-white/[0.08] bg-[#090909] p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-500/12 text-orange-200">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">Human Connection Preview</h1>
            <p className="mt-1 text-sm text-zinc-500">공개 매칭이 아니라, 나에게 건강한 관계 구조를 먼저 해석합니다.</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-7 text-zinc-400">{preview.summary}</p>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <article className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
          <h2 className="font-medium">Axes</h2>
          <div className="mt-4 space-y-4">
            <ScoreBar label="Structural similarity" value={preview.structuralSimilarity} />
            <ScoreBar label="Complementarity" value={preview.complementarity} tone="teal" />
            <ScoreBar label="Dialogue fit" value={preview.dialogueCompatibility} />
            <ScoreBar label="Conflict fit" value={preview.conflictCompatibility} tone="zinc" />
            <ScoreBar label="Repair potential" value={preview.repairPotential} tone="teal" />
            <ScoreBar label="Emotional safety" value={preview.emotionalSafety} />
          </div>
        </article>
        <article className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
          <h2 className="font-medium">Relationship Lens</h2>
          <div className="mt-4 space-y-4 text-sm leading-6">
            <div>
              <p className="text-zinc-500">Ideal pattern</p>
              <p className="mt-1 text-zinc-200">{preview.idealConnectionPattern}</p>
            </div>
            <div>
              <p className="text-zinc-500">Risk pattern</p>
              <p className="mt-1 text-zinc-200">{preview.riskyConnectionPattern}</p>
            </div>
          </div>
        </article>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-teal-300/20 bg-teal-400/10 text-teal-200">
            <Route className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Scenario Preview</h2>
            <p className="mt-1 text-sm text-zinc-500">장면별로 관계가 어디서 편해지고 어디서 흔들릴 수 있는지 봅니다.</p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {scenarioPreviews.map((scenario) => (
            <article key={scenario.type} className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-medium text-zinc-100">{scenario.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{scenario.likelyDynamic}</p>
                </div>
                <span className="flex h-9 min-w-12 items-center justify-center rounded-md bg-black/50 px-2 font-mono text-xs text-orange-200">
                  {Math.round(scenario.confidence * 100)}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-teal-300/10 bg-teal-400/5 p-3">
                  <p className="text-xs font-medium uppercase text-teal-200">Support move</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{scenario.supportMove}</p>
                </div>
                <div className="rounded-md border border-orange-300/10 bg-orange-500/5 p-3">
                  <p className="text-xs font-medium uppercase text-orange-200">Risk signal</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{scenario.riskSignal}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ScoreBar label="Trust" value={scenario.state.trust} tone="teal" />
                <ScoreBar label="Safety" value={scenario.state.emotionalSafety} />
                <ScoreBar label="Risk" value={scenario.state.disengagementRisk} tone="zinc" />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
