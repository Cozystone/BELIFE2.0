import { FileText, MessageCircle, Network, Route, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { ScoreBar } from "@/components/app/score-bar";
import { getConnectionPreview, requireUserForPage } from "@/lib/server/belife-service";

export const dynamic = "force-dynamic";

function percent(value: number) {
  return Math.round(value * 100);
}

function talkDraftHref(draft: string) {
  const params = new URLSearchParams({
    conversation: "new",
    draft,
  });
  return `/app/talk?${params.toString()}`;
}

export default async function ConnectionPage() {
  const user = await requireUserForPage();
  const preview = await getConnectionPreview(user.id);
  const scenarioPreviews = preview.scenarioPreviews ?? [];
  const report = preview.relationshipReport;
  const hiddenEdge = preview.hiddenEdge;

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

      <section className="rounded-md border border-orange-300/10 bg-orange-500/[0.04] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-orange-500/12 text-orange-200">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Relationship Report</h2>
              <span className="rounded-md border border-white/[0.08] bg-black/40 px-2 py-1 font-mono text-xs text-orange-200">
                {report.confidenceLabel}
              </span>
              <span className="rounded-md border border-white/[0.08] bg-black/40 px-2 py-1 font-mono text-xs text-zinc-300">
                {report.hiddenEdgeStatus}
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-zinc-300">{report.thesis}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <article className="rounded-md border border-white/[0.08] bg-black/40 p-3">
            <p className="text-xs text-zinc-500">Compatibility</p>
            <p className="mt-2 font-mono text-2xl text-zinc-100">{percent(report.compatibilityScore)}</p>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-black/40 p-3">
            <p className="text-xs text-zinc-500">Final score</p>
            <p className="mt-2 font-mono text-2xl text-orange-200">{percent(report.finalScore)}</p>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-black/40 p-3">
            <p className="text-xs text-zinc-500">Confidence</p>
            <p className="mt-2 font-mono text-2xl text-teal-200">{percent(report.confidence)}</p>
          </article>
        </div>
      </section>

      <section className="rounded-md border border-teal-300/10 bg-teal-400/[0.04] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-400/10 text-teal-200">
            <Network className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">Hidden Graph</h2>
              <span className="rounded-md border border-white/[0.08] bg-black/40 px-2 py-1 font-mono text-xs text-teal-200">
                {hiddenEdge.status}
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-zinc-400">
              공개 매칭이 아니라, BELIFE 내부에서 관계 가능성을 조심스럽게 보관하는 잠재 엣지입니다.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <article className="rounded-md border border-white/[0.08] bg-black/40 p-3">
            <p className="text-xs text-zinc-500">Edge strength</p>
            <p className="mt-2 font-mono text-2xl text-teal-200">{percent(hiddenEdge.edgeStrength)}</p>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-black/40 p-3">
            <p className="text-xs text-zinc-500">Shared reality</p>
            <p className="mt-2 font-mono text-2xl text-zinc-100">{percent(hiddenEdge.sharedReality)}</p>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-black/40 p-3">
            <p className="text-xs text-zinc-500">Responsiveness</p>
            <p className="mt-2 font-mono text-2xl text-orange-200">{percent(hiddenEdge.responsiveness)}</p>
          </article>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-100">Mode scores</h3>
            <ScoreBar label="Friendship" value={hiddenEdge.modeScores.friendship} tone="teal" />
            <ScoreBar label="Collaboration" value={hiddenEdge.modeScores.collaboration} />
            <ScoreBar label="Mentorship" value={hiddenEdge.modeScores.mentorship} tone="zinc" />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-100">Graph mechanisms</h3>
            <ScoreBar label="Homophily" value={hiddenEdge.mechanisms.homophily} />
            <ScoreBar label="Reciprocity" value={hiddenEdge.mechanisms.reciprocity} tone="teal" />
            <ScoreBar label="Drift risk" value={hiddenEdge.mechanisms.drift} tone="zinc" />
          </div>
        </div>
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
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-orange-300/20 bg-orange-500/10 text-orange-200">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">Evidence Lens</h2>
            <p className="mt-1 text-sm text-zinc-500">축별 근거와 아직 비워둬야 할 부분을 함께 봅니다.</p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {report.axisInsights.map((axis) => (
            <article key={axis.key} className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-medium text-zinc-100">{axis.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{axis.interpretation}</p>
                </div>
                <span className="rounded-md bg-black/50 px-2 py-1 font-mono text-xs text-orange-200">
                  {axis.level}
                </span>
              </div>
              <div className="mt-4">
                <ScoreBar label="Signal" value={axis.score} tone={axis.score >= 0.56 ? "teal" : "zinc"} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-teal-300/10 bg-teal-400/5 p-3">
                  <p className="text-xs font-medium uppercase text-teal-200">Evidence</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{axis.evidence}</p>
                </div>
                <div className="rounded-md border border-white/[0.08] bg-black/30 p-3">
                  <p className="text-xs font-medium uppercase text-zinc-400">Next signal</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{axis.nextObservation}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <article className="rounded-md border border-white/[0.08] bg-black/30 p-4">
            <h3 className="text-sm font-medium text-zinc-100">Evidence</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              {report.evidenceSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-black/30 p-4">
            <h3 className="text-sm font-medium text-zinc-100">Blind Spots</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              {report.blindSpots.map((spot) => (
                <li key={spot}>{spot}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-black/30 p-4">
            <h3 className="text-sm font-medium text-zinc-100">Next Observations</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              {report.nextObservationPrompts.map((prompt) => (
                <li key={prompt}>{prompt}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

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
              <div className="mt-4 rounded-md border border-white/[0.08] bg-black/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase text-zinc-400">Simulation spread</p>
                  <span className="rounded-md bg-white/[0.06] px-2 py-1 font-mono text-[11px] text-zinc-300">
                    {scenario.simulation.riskBand} / {scenario.simulation.iterations}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <ScoreBar label="Stability" value={scenario.simulation.stability} tone="teal" />
                  <ScoreBar label="Best trust" value={scenario.simulation.bestCase.trust} />
                  <ScoreBar label="Risk case" value={scenario.simulation.riskCase.disengagementRisk} tone="zinc" />
                </div>
              </div>
              <Link
                href={talkDraftHref(
                  `${scenario.title} 관계 장면을 연습하고 싶어. 예상 흐름은 "${scenario.likelyDynamic}"이고, 도움이 되는 움직임은 "${scenario.supportMove}", 조심할 신호는 "${scenario.riskSignal}"이야. 내 패턴을 기준으로 실제로 어떻게 말하면 좋을지 짧은 대화 스크립트로 도와줘.`,
                )}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 text-xs font-medium text-zinc-300 transition hover:border-orange-400/30 hover:bg-orange-500/10 hover:text-orange-100"
              >
                <MessageCircle className="h-3.5 w-3.5 text-orange-300" />
                Rehearse in Talk
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
