import { Activity, Brain, Database, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ScoreBar } from "@/components/app/score-bar";
import { StateHistoryPanel } from "@/components/app/state-history-panel";
import { Button } from "@/components/ui/button";
import { getBriefing, getMentalStateHistory, requireUserForPage } from "@/lib/server/belife-service";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const user = await requireUserForPage();
  const [briefing, stateHistory] = await Promise.all([
    getBriefing(user.id),
    getMentalStateHistory(user.id, 8),
  ]);

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-white/[0.08] bg-[#090909] p-5">
        <p className="text-sm text-orange-200">Today</p>
        <h1 className="mt-2 text-2xl font-semibold leading-tight">{briefing.headline}</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-400">{briefing.stateSummary}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
          <Link href="/app/talk">
            <Button className="w-full sm:w-auto">Talk to BELIFE</Button>
          </Link>
          <Link href="/app/self-map">
            <Button variant="secondary" className="w-full sm:w-auto">View self map</Button>
          </Link>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-3">
        <article className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
          <Activity className="h-5 w-5 text-orange-300" />
          <h2 className="mt-3 text-sm font-medium">Mental State</h2>
          <div className="mt-4 space-y-3">
            <ScoreBar label="Stress load" value={briefing.state.stressLoad} />
            <ScoreBar label="Burnout risk" value={briefing.state.burnoutRisk} tone="teal" />
            <ScoreBar label="Support need" value={briefing.state.supportNeed} tone="zinc" />
          </div>
        </article>
        <article className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
          <Database className="h-5 w-5 text-teal-300" />
          <h2 className="mt-3 text-sm font-medium">Data Trust</h2>
          <p className="mt-4 font-mono text-4xl text-white">{briefing.dataTrust.score}</p>
          <p className="mt-2 text-sm text-zinc-500">{briefing.dataTrust.explanation}</p>
        </article>
        <article className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
          <Brain className="h-5 w-5 text-orange-300" />
          <h2 className="mt-3 text-sm font-medium">Next prompt</h2>
          <p className="mt-4 text-sm leading-6 text-zinc-300">{briefing.recommendedPrompt}</p>
        </article>
      </div>

      <StateHistoryPanel history={stateHistory} />

      <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-teal-300" />
          {briefing.safetyNote}
        </div>
      </section>
    </div>
  );
}
