import {
  Activity,
  FileText,
  HeartHandshake,
  ListFilter,
  MessageCircle,
  Network,
  Route,
  ShieldCheck,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";
import { ConnectionSimulator } from "@/components/app/connection-simulator";
import { RelationshipMemoryPanel } from "@/components/app/relationship-memory-panel";
import { ScoreBar } from "@/components/app/score-bar";
import { buildConnectionQualityLens } from "@/lib/engines/connection-quality";
import {
  getConnectionIntelligence,
  getDyadicCoping,
  getPrivacyPreferences,
  getRelationshipMemory,
  requireUserForPage,
} from "@/lib/server/belife-service";

export const dynamic = "force-dynamic";

function percent(value: number) {
  return Math.round(value * 100);
}

function signedPercent(value: number) {
  const rounded = Math.round(value * 100);
  return rounded > 0 ? `+${rounded}` : `${rounded}`;
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
  const privacy = await getPrivacyPreferences(user.id);

  if (!privacy.connectionPreviewEnabled) {
    return (
      <div className="space-y-5">
        <section className="rounded-md border border-white/[0.08] bg-slate-950/70 p-5">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-500/12 text-cyan-200">
              <Users className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-semibold">휴먼 커넥션 프리뷰</h1>
              <p className="mt-1 text-sm text-zinc-500">프라이버시 설정으로 일시 중지됨</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-zinc-400">
            이 설정이 꺼져 있는 동안 BELIFE는 숨겨진 관계 적합도 프리뷰를 만들거나 저장하지 않습니다.
          </p>
          <Link
            href="/app/settings"
            className="mt-5 inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] px-4 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.1]"
          >
            프라이버시 설정 열기
          </Link>
        </section>
      </div>
    );
  }

  const [{ preview, candidateReport, rerankingReport }, relationshipMemory, dyadicCoping] = await Promise.all([
    getConnectionIntelligence(user.id),
    getRelationshipMemory(user.id),
    getDyadicCoping(user.id),
  ]);
  const qualityReport = buildConnectionQualityLens({ preview, relationshipMemory });
  const scenarioPreviews = preview.scenarioPreviews ?? [];
  const report = preview.relationshipReport;
  const hiddenEdge = preview.hiddenEdge;

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-white/[0.08] bg-slate-950/70 p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-500/12 text-cyan-200">
            <Users className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold">휴먼 커넥션 프리뷰</h1>
            <p className="mt-1 text-sm text-zinc-500">공개 매칭이 아니라 나에게 건강한 관계 구조를 먼저 해석합니다.</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-7 text-zinc-400">{preview.summary}</p>
      </section>

      <section className="rounded-md border border-cyan-300/10 bg-cyan-500/[0.04] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-500/12 text-cyan-200">
            <FileText className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">관계 리포트</h2>
              <span className="rounded-md border border-white/[0.08] bg-slate-950/40 px-2 py-1 font-mono text-xs text-cyan-200">
                {report.confidenceLabel}
              </span>
              <span className="rounded-md border border-white/[0.08] bg-slate-950/40 px-2 py-1 font-mono text-xs text-zinc-300">
                {report.hiddenEdgeStatus}
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-zinc-300">{report.thesis}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <article className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
            <p className="text-xs text-zinc-500">적합도</p>
            <p className="mt-2 font-mono text-2xl text-zinc-100">{percent(report.compatibilityScore)}</p>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
            <p className="text-xs text-zinc-500">최종 점수</p>
            <p className="mt-2 font-mono text-2xl text-cyan-200">{percent(report.finalScore)}</p>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
            <p className="text-xs text-zinc-500">신뢰도</p>
            <p className="mt-2 font-mono text-2xl text-teal-200">{percent(report.confidence)}</p>
          </article>
        </div>
      </section>

      <section className="rounded-md border border-cyan-300/10 bg-cyan-500/[0.04] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-500/12 text-cyan-200">
            <Activity className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">관계 대처 렌즈</h2>
              <span className="rounded-md border border-white/[0.08] bg-slate-950/40 px-2 py-1 font-mono text-xs text-cyan-200">
                {percent(dyadicCoping.confidence)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-zinc-400">{dyadicCoping.summary}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-5">
          {dyadicCoping.axes.map((axis) => (
            <article key={axis.key} className="rounded-md border border-white/[0.08] bg-slate-950/35 p-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium text-zinc-100">{axis.label}</h3>
                <span className="rounded-md bg-white/[0.06] px-2 py-1 font-mono text-xs text-zinc-300">
                  {axis.level}
                </span>
              </div>
              <div className="mt-3">
                <ScoreBar
                  label={axis.polarity === "risk" ? "위험" : "역량"}
                  value={axis.score}
                  tone={axis.polarity === "risk" ? "zinc" : axis.score >= 0.56 ? "teal" : "zinc"}
                />
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{axis.interpretation}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <article className="rounded-md border border-white/[0.08] bg-slate-950/30 p-4">
            <h3 className="text-sm font-medium text-zinc-100">취약 지점</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              {dyadicCoping.vsa.enduringVulnerabilities.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-slate-950/30 p-4">
            <h3 className="text-sm font-medium text-zinc-100">스트레스 사건</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              {dyadicCoping.vsa.stressfulEvents.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-slate-950/30 p-4">
            <h3 className="text-sm font-medium text-zinc-100">적응 과정</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              {dyadicCoping.vsa.adaptiveProcesses.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_1fr_1.2fr]">
          <article className="rounded-md border border-teal-300/10 bg-teal-400/5 p-4">
            <p className="text-xs font-medium uppercase text-teal-200">도움 행동</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
              {dyadicCoping.supportMoves.map((move) => (
                <li key={move}>{move}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-md border border-cyan-300/10 bg-cyan-500/5 p-4">
            <p className="text-xs font-medium uppercase text-cyan-200">주의 신호</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
              {dyadicCoping.riskSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-slate-950/30 p-4">
            <p className="text-xs font-medium uppercase text-zinc-400">다음 대화 움직임</p>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{dyadicCoping.nextConversationMove}</p>
            <p className="mt-4 text-xs leading-5 text-zinc-600">{dyadicCoping.guardrail}</p>
          </article>
        </div>
      </section>

      <section className="rounded-md border border-teal-300/10 bg-teal-400/[0.04] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-400/10 text-teal-200">
            <HeartHandshake className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">연결 품질 렌즈</h2>
              <span className="rounded-md border border-white/[0.08] bg-slate-950/40 px-2 py-1 font-mono text-xs text-teal-200">
                {percent(qualityReport.confidence)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-zinc-400">{qualityReport.summary}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-4">
          {qualityReport.axes.map((axis) => (
            <article key={axis.key} className="rounded-md border border-white/[0.08] bg-slate-950/35 p-3">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-medium text-zinc-100">{axis.label}</h3>
                <span className="rounded-md bg-white/[0.06] px-2 py-1 font-mono text-xs text-zinc-300">
                  {axis.level}
                </span>
              </div>
              <div className="mt-3">
                <ScoreBar label="품질" value={axis.score} tone={axis.score >= 0.56 ? "teal" : "zinc"} />
              </div>
              <p className="mt-3 text-sm leading-6 text-zinc-400">{axis.interpretation}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          <article className="rounded-md border border-white/[0.08] bg-slate-950/30 p-4">
            <h3 className="text-sm font-medium text-zinc-100">편안함의 근거</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              {qualityReport.comfortSources.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-slate-950/30 p-4">
            <h3 className="text-sm font-medium text-zinc-100">긴장의 근거</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              {qualityReport.tensionSources.map((source) => (
                <li key={source}>{source}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-slate-950/30 p-4">
            <h3 className="text-sm font-medium text-zinc-100">다음 작은 실험</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              {qualityReport.nextMicroExperiments.map((experiment) => (
                <li key={experiment}>{experiment}</li>
              ))}
            </ul>
          </article>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          <article className="rounded-md border border-teal-300/10 bg-teal-400/5 p-4">
            <p className="text-xs font-medium uppercase text-teal-200">건강한 패턴</p>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{qualityReport.healthyPattern}</p>
          </article>
          <article className="rounded-md border border-cyan-300/10 bg-cyan-500/5 p-4">
            <p className="text-xs font-medium uppercase text-cyan-200">주의 패턴</p>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{qualityReport.riskyPattern}</p>
          </article>
        </div>
        <p className="mt-4 rounded-md border border-white/[0.08] bg-slate-950/30 p-3 text-xs leading-5 text-zinc-500">
          {qualityReport.guardrail}
        </p>
      </section>

      <section className="rounded-md border border-teal-300/10 bg-teal-400/[0.04] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-teal-400/10 text-teal-200">
            <Network className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">숨김 그래프</h2>
              <span className="rounded-md border border-white/[0.08] bg-slate-950/40 px-2 py-1 font-mono text-xs text-teal-200">
                {hiddenEdge.status}
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-zinc-400">
              공개 매칭이 아니라 BELIFE 내부에서 관계 가능성을 조심스럽게 보는 잠재 연결입니다.
            </p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <article className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
            <p className="text-xs text-zinc-500">연결 강도</p>
            <p className="mt-2 font-mono text-2xl text-teal-200">{percent(hiddenEdge.edgeStrength)}</p>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
            <p className="text-xs text-zinc-500">공유 현실감</p>
            <p className="mt-2 font-mono text-2xl text-zinc-100">{percent(hiddenEdge.sharedReality)}</p>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
            <p className="text-xs text-zinc-500">반응성</p>
            <p className="mt-2 font-mono text-2xl text-cyan-200">{percent(hiddenEdge.responsiveness)}</p>
          </article>
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-100">관계 모드 점수</h3>
            <ScoreBar label="우정" value={hiddenEdge.modeScores.friendship} tone="teal" />
            <ScoreBar label="협업" value={hiddenEdge.modeScores.collaboration} />
            <ScoreBar label="멘토링" value={hiddenEdge.modeScores.mentorship} tone="zinc" />
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-zinc-100">그래프 메커니즘</h3>
            <ScoreBar label="유사성" value={hiddenEdge.mechanisms.homophily} />
            <ScoreBar label="상호성" value={hiddenEdge.mechanisms.reciprocity} tone="teal" />
            <ScoreBar label="흔들림 위험" value={hiddenEdge.mechanisms.drift} tone="zinc" />
          </div>
        </div>
      </section>

      <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-5">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-500/12 text-cyan-200">
            <TrendingUp className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">점진적 재정렬</h2>
              <span className="rounded-md border border-white/[0.08] bg-slate-950/40 px-2 py-1 font-mono text-xs text-cyan-200">
                {signedPercent(rerankingReport.edgeDelta)}
              </span>
            </div>
            <p className="mt-2 text-sm leading-7 text-zinc-400">{rerankingReport.summary}</p>
          </div>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-3">
          {rerankingReport.modeRanking.map((mode) => (
            <article key={mode.mode} className="rounded-md border border-white/[0.08] bg-slate-950/35 p-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium capitalize text-zinc-100">{mode.mode}</p>
                  <p className="mt-1 text-xs text-zinc-500">
                    rank #{mode.rank}
                    {mode.previousRank ? ` from #${mode.previousRank}` : " baseline"}
                  </p>
                </div>
                <span className="rounded-md bg-white/[0.06] px-2 py-1 font-mono text-xs text-zinc-300">
                  {mode.direction}
                </span>
              </div>
              <div className="mt-3">
                <ScoreBar label="모드 점수" value={mode.score} tone={mode.rank === 1 ? "teal" : "zinc"} />
              </div>
            </article>
          ))}
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-2">
          {rerankingReport.signals.slice(0, 4).map((signal) => (
            <article key={signal.key} className="rounded-md border border-white/[0.08] bg-slate-950/30 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-medium text-zinc-100">{signal.label}</h3>
                <span className="rounded-md bg-white/[0.06] px-2 py-1 font-mono text-xs text-zinc-300">
                  {signal.direction} {signedPercent(signal.delta)}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{signal.interpretation}</p>
            </article>
          ))}
        </div>

        <div className="mt-5 rounded-md border border-white/[0.08] bg-slate-950/30 p-3">
          <p className="text-xs font-medium uppercase text-zinc-500">안정화 요인</p>
          <ul className="mt-2 space-y-1 text-sm leading-6 text-zinc-300">
            {rerankingReport.nextStabilizers.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <p className="mt-3 text-xs leading-5 text-zinc-500">{rerankingReport.guardrail}</p>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <article className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
          <h2 className="font-medium">관계 축</h2>
          <div className="mt-4 space-y-4">
            <ScoreBar label="구조 유사성" value={preview.structuralSimilarity} />
            <ScoreBar label="상호 보완성" value={preview.complementarity} tone="teal" />
            <ScoreBar label="대화 적합도" value={preview.dialogueCompatibility} />
            <ScoreBar label="갈등 적합도" value={preview.conflictCompatibility} tone="zinc" />
            <ScoreBar label="회복 가능성" value={preview.repairPotential} tone="teal" />
            <ScoreBar label="정서적 안전감" value={preview.emotionalSafety} />
          </div>
        </article>
        <article className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
          <h2 className="font-medium">관계 렌즈</h2>
          <div className="mt-4 space-y-4 text-sm leading-6">
            <div>
              <p className="text-zinc-500">이상적 패턴</p>
              <p className="mt-1 text-zinc-200">{preview.idealConnectionPattern}</p>
            </div>
            <div>
              <p className="text-zinc-500">주의 패턴</p>
              <p className="mt-1 text-zinc-200">{preview.riskyConnectionPattern}</p>
            </div>
          </div>
        </article>
      </div>

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-500/10 text-cyan-200">
            <ListFilter className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">후보 필터</h2>
            <p className="mt-1 text-sm text-zinc-500">공개 매칭 전, 내부 관계 원형을 비공개로 필터링합니다.</p>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2">
          {candidateReport.candidates.map((candidate) => (
            <article key={candidate.id} className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-medium text-zinc-100">{candidate.label}</h3>
                    <span className="rounded-md bg-slate-950/50 px-2 py-1 font-mono text-xs text-cyan-200">
                      {candidate.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{candidate.why}</p>
                </div>
                <span className="rounded-md border border-white/[0.08] bg-slate-950/40 px-2 py-1 font-mono text-xs text-zinc-300">
                  {candidate.relationshipMode}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ScoreBar label="적합도" value={candidate.fit} tone="teal" />
                <ScoreBar label="위험" value={candidate.risk} tone="zinc" />
                <ScoreBar label="신뢰도" value={candidate.confidence} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-teal-300/10 bg-teal-400/5 p-3">
                  <p className="text-xs font-medium uppercase text-teal-200">근거</p>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-zinc-300">
                    {candidate.evidence.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-md border border-cyan-300/10 bg-cyan-500/5 p-3">
                  <p className="text-xs font-medium uppercase text-cyan-200">주의 신호</p>
                  <ul className="mt-2 space-y-1 text-sm leading-6 text-zinc-300">
                    {candidate.riskSignals.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <p className="mt-4 rounded-md border border-white/[0.08] bg-slate-950/30 p-3 text-sm leading-6 text-zinc-400">
                {candidate.nextObservation}
              </p>
            </article>
          ))}
        </div>
        <p className="rounded-md border border-white/[0.08] bg-slate-950/30 p-3 text-xs leading-5 text-zinc-500">
          {candidateReport.guardrail}
        </p>
      </section>

      <ConnectionSimulator initialPreview={preview} />

      <RelationshipMemoryPanel initialReport={relationshipMemory} />

      <section className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md border border-cyan-300/20 bg-cyan-500/10 text-cyan-200">
            <ShieldCheck className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-lg font-semibold">근거 렌즈</h2>
            <p className="mt-1 text-sm text-zinc-500">관계 해석에 쓰인 축과 아직 비어 있는 근거를 함께 봅니다.</p>
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
                <span className="rounded-md bg-slate-950/50 px-2 py-1 font-mono text-xs text-cyan-200">
                  {axis.level}
                </span>
              </div>
              <div className="mt-4">
                <ScoreBar label="Signal" value={axis.score} tone={axis.score >= 0.56 ? "teal" : "zinc"} />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-teal-300/10 bg-teal-400/5 p-3">
                  <p className="text-xs font-medium uppercase text-teal-200">근거</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{axis.evidence}</p>
                </div>
                <div className="rounded-md border border-white/[0.08] bg-slate-950/30 p-3">
                  <p className="text-xs font-medium text-zinc-400">다음 신호</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{axis.nextObservation}</p>
                </div>
              </div>
            </article>
          ))}
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          <article className="rounded-md border border-white/[0.08] bg-slate-950/30 p-4">
            <h3 className="text-sm font-medium text-zinc-100">근거</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              {report.evidenceSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-slate-950/30 p-4">
            <h3 className="text-sm font-medium text-zinc-100">놓치기 쉬운 부분</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-400">
              {report.blindSpots.map((spot) => (
                <li key={spot}>{spot}</li>
              ))}
            </ul>
          </article>
          <article className="rounded-md border border-white/[0.08] bg-slate-950/30 p-4">
            <h3 className="text-sm font-medium text-zinc-100">다음 관찰</h3>
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
            <h2 className="text-lg font-semibold">시나리오 프리뷰</h2>
            <p className="mt-1 text-sm text-zinc-500">상황별로 관계가 어디에서 편해지고 어디에서 흔들리는지 봅니다.</p>
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
                <span className="flex h-9 min-w-12 items-center justify-center rounded-md bg-slate-950/50 px-2 font-mono text-xs text-cyan-200">
                  {Math.round(scenario.confidence * 100)}
                </span>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-teal-300/10 bg-teal-400/5 p-3">
                  <p className="text-xs font-medium uppercase text-teal-200">도움 행동</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{scenario.supportMove}</p>
                </div>
                <div className="rounded-md border border-cyan-300/10 bg-cyan-500/5 p-3">
                  <p className="text-xs font-medium uppercase text-cyan-200">주의 신호</p>
                  <p className="mt-2 text-sm leading-6 text-zinc-300">{scenario.riskSignal}</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ScoreBar label="신뢰" value={scenario.state.trust} tone="teal" />
                <ScoreBar label="안전감" value={scenario.state.emotionalSafety} />
                <ScoreBar label="위험" value={scenario.state.disengagementRisk} tone="zinc" />
              </div>
              <div className="mt-4 rounded-md border border-white/[0.08] bg-slate-950/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-medium uppercase text-zinc-400">시뮬레이션 범위</p>
                  <span className="rounded-md bg-white/[0.06] px-2 py-1 font-mono text-[11px] text-zinc-300">
                    {scenario.simulation.riskBand} / {scenario.simulation.iterations}
                  </span>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  <ScoreBar label="안정성" value={scenario.simulation.stability} tone="teal" />
                  <ScoreBar label="최선 신뢰" value={scenario.simulation.bestCase.trust} />
                  <ScoreBar label="위험 케이스" value={scenario.simulation.riskCase.disengagementRisk} tone="zinc" />
                </div>
              </div>
              <Link
                href={talkDraftHref(
                  `${scenario.title} 관계 장면을 연습하고 싶어. 예상 흐름은 "${scenario.likelyDynamic}"이고, 도움이 되는 움직임은 "${scenario.supportMove}", 조심할 신호는 "${scenario.riskSignal}"이야. 내 패턴을 기준으로 실제로 어떻게 말하면 좋을지 짧은 스크립트로 도와줘.`,
                )}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-slate-950/40 px-3 text-xs font-medium text-zinc-300 transition hover:border-cyan-400/30 hover:bg-cyan-500/10 hover:text-cyan-100"
              >
                <MessageCircle className="h-3.5 w-3.5 text-cyan-300" />
                대화에서 연습
              </Link>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
