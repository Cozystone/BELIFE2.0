import { Activity, Brain, Database, MessageCircle, PenLine, Repeat2, SearchCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { ScoreBar } from "@/components/app/score-bar";
import { StateHistoryPanel } from "@/components/app/state-history-panel";
import { Button } from "@/components/ui/button";
import { getBriefing, getMentalStateHistory, requireUserForPage } from "@/lib/server/belife-service";

export const dynamic = "force-dynamic";

function talkDraftHref(draft: string) {
  const params = new URLSearchParams({
    conversation: "new",
    draft,
  });
  return `/app/talk?${params.toString()}`;
}

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

      <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <MessageCircle className="h-4 w-4 text-orange-300" />
          Quick check-in
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {[
            ["오늘 상태로 대화하기", briefing.recommendedPrompt],
            ["반복 생각 풀기", `지금 반복해서 떠오르는 생각은 무엇이고, BELIFE는 이걸 어떤 패턴으로 보고 있나요?`],
            ["관계 감각 점검", `오늘 내가 사람들과 연결되는 방식에서 조심해야 할 신호와 믿어도 되는 신호를 나눠서 봐줘.`],
          ].map(([label, draft]) => (
            <Link
              key={label}
              href={talkDraftHref(draft)}
              className="rounded-md border border-white/[0.08] bg-black/40 p-3 text-left text-sm text-zinc-300 transition hover:border-orange-400/30 hover:bg-orange-500/10 hover:text-orange-100"
            >
              <div className="flex items-center gap-2 font-medium">
                <PenLine className="h-3.5 w-3.5 text-orange-300" />
                {label}
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{draft}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <Repeat2 className="h-4 w-4 text-teal-300" />
          Pattern reminders
        </div>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {briefing.patternReminders.map((reminder) => (
            <Link
              key={reminder.id}
              href={talkDraftHref(reminder.talkPrompt)}
              className="rounded-md border border-white/[0.08] bg-black/40 p-3 text-left text-sm text-zinc-300 transition hover:border-teal-300/30 hover:bg-teal-400/10 hover:text-teal-100"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="font-medium">{reminder.title}</p>
                <span className="font-mono text-xs text-teal-200">{Math.round(reminder.confidence * 100)}</span>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{reminder.detail}</p>
            </Link>
          ))}
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
            <ScoreBar label="Interpretation caution" value={briefing.state.abstentionRisk} tone="zinc" />
            <ScoreBar label="Motivation drop risk" value={briefing.state.motivationalCollapseRisk} tone="teal" />
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
        <div className="flex items-center gap-2 text-sm font-medium text-zinc-200">
          <SearchCheck className="h-4 w-4 text-orange-300" />
          Evidence Ledger
        </div>
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          BELIFE keeps this interpretation tied to retrievable memory, message, and ontology evidence.
        </p>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {briefing.evidenceLedger.length ? (
            briefing.evidenceLedger.map((item) => (
              <article key={`${item.source}-${item.id}`} className="rounded-md border border-white/[0.08] bg-black/40 p-3">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-sm bg-orange-400/10 px-2 py-1 font-mono text-orange-200">{item.source}</span>
                  <span className="font-mono text-zinc-500">{Math.round(item.confidence * 100)} confidence</span>
                  {item.evidenceType ? <span className="font-mono text-zinc-500">{item.evidenceType}</span> : null}
                </div>
                <h2 className="mt-3 text-sm font-medium text-zinc-200">{item.label}</h2>
                <p className="mt-2 line-clamp-3 text-xs leading-5 text-zinc-500">{item.detail}</p>
              </article>
            ))
          ) : (
            <div className="rounded-md border border-white/[0.08] bg-black/40 p-3 text-sm text-zinc-500">
              Evidence is still thin. A few more conversations will make BELIFE interpretations easier to inspect.
            </div>
          )}
        </div>
      </section>

      <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <ShieldCheck className="h-4 w-4 text-teal-300" />
          {briefing.safetyNote}
        </div>
      </section>
    </div>
  );
}
