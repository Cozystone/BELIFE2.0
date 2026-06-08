import { AlertTriangle, CheckCircle2, Database, KeyRound, Server, Terminal } from "lucide-react";
import { DataControlsPanel } from "@/components/app/data-controls-panel";
import { MemoryCorrectionPanel } from "@/components/app/memory-correction-panel";
import { MemoryHealthPanel } from "@/components/app/memory-health-panel";
import { MemoryImportPanel } from "@/components/app/memory-import-panel";
import { PrivacyPreferencesPanel } from "@/components/app/privacy-preferences-panel";
import { ProfileEnrichmentPanel } from "@/components/app/profile-enrichment-panel";
import { ScoreBar } from "@/components/app/score-bar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getOllamaBaseUrl, getOllamaHealth, getOllamaModel, getOllamaRuntimeDiagnostics } from "@/lib/ai/ollama";
import { hasDatabaseUrl } from "@/lib/db/client";
import {
  getDataTrustCenter,
  getMemoryHealth,
  getPrivacyPreferences,
  getProfileEnrichmentSuggestions,
  requireUserForPage,
} from "@/lib/server/belife-service";
import { getReadinessReport } from "@/lib/server/readiness";
import { getStore } from "@/lib/server/store";
import { isNativeAuthAvailable } from "@/lib/server/native-auth";

export const dynamic = "force-dynamic";

function formatOptionalDate(value?: string) {
  if (!value) return "아직 신호 없음";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function SettingsPage() {
  const user = await requireUserForPage();
  const [profile, ollamaHealth, enrichmentSuggestions, dataTrustCenter, privacyPreferences, memoryHealth] = await Promise.all([
    getStore().getProfile(user.id),
    getOllamaHealth(),
    getProfileEnrichmentSuggestions(user.id),
    getDataTrustCenter(user.id),
    getPrivacyPreferences(user.id),
    getMemoryHealth(user.id),
  ]);
  const readiness = getReadinessReport({ ollamaHealth });
  const aiRuntime = getOllamaRuntimeDiagnostics(ollamaHealth);
  const RuntimeIcon = aiRuntime.mode === "live" ? CheckCircle2 : AlertTriangle;
  const { dataTrust, audit, stats, inventory } = dataTrustCenter;
  const rows = [
    ["인증", user.authProvider === "clerk" ? "Clerk 세션" : user.authProvider === "native" ? "BELIFE 네이티브 인증" : "데모 모드", KeyRound],
    ["저장소", hasDatabaseUrl() ? "Neon Postgres" : "메모리 데모", Database],
    ["Ollama", `${getOllamaBaseUrl()} / ${getOllamaModel("chat")} / ${ollamaHealth.ok ? "연결됨" : "준비 필요"}`, Server],
  ] as const;
  const inventoryRows = [
    ["대화", inventory.counts.conversations],
    ["메시지", inventory.counts.messages],
    ["기억 조각", inventory.counts.memoryChunks],
    ["온톨로지 노드", inventory.counts.ontologyNodes],
    ["온톨로지 연결", inventory.counts.ontologyEdges],
    ["상태 추정", inventory.counts.stateEstimates],
    ["행동 스냅샷", inventory.counts.behaviorSnapshots],
    ["데이터 신뢰 기록", inventory.counts.dataTrustSnapshots],
    ["관계 프리뷰", inventory.counts.connectionPreviews],
  ] as const;
  const aiRuntimeRows = [
    ["모드", aiRuntime.mode === "live" ? "실시간 Ollama" : "결정론 보조 응답"],
    ["엔드포인트", aiRuntime.endpoint],
    ["대화 모델", aiRuntime.chatModel],
    ["추출 모델", aiRuntime.extractorModel],
    ["타임아웃", `${aiRuntime.timeoutMs}ms`],
    ["Bearer 토큰", aiRuntime.apiKeyConfigured ? "설정됨" : "설정 안 됨"],
  ] as const;

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-white/[0.08] bg-slate-950/70 p-5">
        <h1 className="text-2xl font-semibold">설정</h1>
        <p className="mt-2 text-sm text-zinc-500">
          준비 상태: <span className="font-mono text-cyan-200">{readiness.status}</span>
        </p>
      </section>

      <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
        <h2 className="font-medium">프로필</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">닉네임</dt>
            <dd className="mt-1 text-zinc-100">{profile?.nickname || user.name}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">현재 목표</dt>
            <dd className="mt-1 text-zinc-100">{profile?.currentGoal || "아직 없음"}</dd>
          </div>
        </dl>
        {isNativeAuthAvailable() ? (
          <div className="mt-5">
            <SignOutButton />
          </div>
        ) : null}
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {rows.map(([label, value, Icon]) => (
          <article key={label} className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
            <Icon className="h-5 w-5 text-cyan-300" />
            <h2 className="mt-3 text-sm font-medium">{label}</h2>
            <p className="mt-2 break-words text-sm text-zinc-500">{value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-cyan-500/12 text-cyan-200">
              <RuntimeIcon className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-medium">AI 런타임</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{aiRuntime.detail}</p>
            </div>
          </div>
          <span className={aiRuntime.mode === "live" ? "rounded-md bg-teal-400/10 px-3 py-2 text-xs font-medium text-teal-200" : "rounded-md bg-cyan-500/10 px-3 py-2 text-xs font-medium text-cyan-200"}>
            {aiRuntime.mode}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {aiRuntimeRows.map(([label, value]) => (
            <div key={label} className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
              <p className="text-xs text-zinc-500">{label}</p>
              <p className="mt-2 break-words text-sm text-zinc-100">{value}</p>
            </div>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto] md:items-center">
          <div className="rounded-md border border-cyan-300/15 bg-cyan-500/5 p-3">
            <div className="flex items-start gap-2">
              <Terminal className="mt-0.5 h-4 w-4 flex-none text-cyan-200" />
              <div>
                <p className="text-sm font-medium text-zinc-100">프로덕션 환경 변수</p>
                <p className="mt-2 text-sm leading-6 text-zinc-500">
                  필수 {aiRuntime.requiredEnv.join(", ")}. 선택 {aiRuntime.optionalEnv.join(", ")}.
                </p>
              </div>
            </div>
          </div>
          <a
            href={aiRuntime.healthPath}
            className="inline-flex h-10 items-center justify-center rounded-md border border-white/10 bg-white/[0.06] px-4 text-sm font-medium text-zinc-100 transition hover:bg-white/[0.1]"
          >
            헬스 JSON 열기
          </a>
        </div>
      </section>

      <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="font-medium">데이터 신뢰 센터</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              데이터 신뢰도는 사람의 점수가 아니라 BELIFE가 당신을 얼마나 명확하게 이해하고 있는지에 대한 점검표입니다.
            </p>
          </div>
          <div className="rounded-md border border-cyan-300/15 bg-slate-950/40 px-4 py-3 text-right">
            <p className="text-xs text-zinc-500">구조 명확도</p>
            <p className="mt-1 font-mono text-4xl text-cyan-200">{dataTrust.score}</p>
            <p className="mt-1 text-xs uppercase text-zinc-500">{dataTrust.label}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <ScoreBar label="프로필 완성도" value={dataTrust.profileCompleteness} />
            <ScoreBar label="세션 밀도" value={dataTrust.validSessionDensity} tone="teal" />
            <ScoreBar label="온톨로지 안정성" value={dataTrust.ontologyStability} />
            <ScoreBar label="행동 커버리지" value={dataTrust.behaviorCoverage} tone="teal" />
            <ScoreBar label="모순 낮음" value={dataTrust.contradictionInverse} tone="zinc" />
            <ScoreBar label="최근성 커버리지" value={dataTrust.recencyCoverage} />
            <ScoreBar label="기억 품질" value={dataTrust.memoryQuality} tone="teal" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {inventoryRows.map(([label, value]) => (
              <div key={label} className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-2 font-mono text-2xl text-zinc-100">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-3 lg:grid-cols-[1.1fr_0.9fr]">
          <article className="rounded-md border border-teal-300/10 bg-teal-400/[0.04] p-4">
            <p className="text-xs font-medium uppercase text-teal-200">해석 가드레일</p>
            <p className="mt-3 text-sm leading-6 text-zinc-300">{audit.summary}</p>
            <p className="mt-3 text-sm leading-6 text-zinc-500">{audit.interpretationGuardrail}</p>
          </article>
          <article className="rounded-md border border-cyan-300/10 bg-cyan-500/[0.04] p-4">
            <p className="text-xs font-medium uppercase text-cyan-200">다음 신뢰도 개선</p>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-zinc-300">
              {audit.nextActions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
          </article>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {audit.weakestSignals.map((signal) => (
            <article key={signal.key} className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-zinc-500">{signal.label}</p>
                <span className="font-mono text-xs text-cyan-200">{Math.round(signal.value * 100)}</span>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-300">{signal.why}</p>
            </article>
          ))}
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
            <p className="text-xs text-zinc-500">근거 구성</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              직접 근거 {inventory.evidenceMix.extracted} / 추론 근거 {inventory.evidenceMix.inferred} / 확인 필요 {inventory.evidenceMix.ambiguous}
            </p>
          </div>
          <div className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
            <p className="text-xs text-zinc-500">온톨로지 레이어</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              핵심 {inventory.ontologyLayers.core} / 활성 {inventory.ontologyLayers.active} / 보관 {inventory.ontologyLayers.archive}
            </p>
          </div>
          <div className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
            <p className="text-xs text-zinc-500">최근 기억 신호</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{formatOptionalDate(inventory.latest.memoryAt ?? inventory.latest.messageAt)}</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-zinc-500">
          {dataTrust.explanation} 현재 세션 수는 {stats.sessionCount}개, 온톨로지 노드는 {stats.ontologyCount}개입니다.
        </p>
      </section>

      <MemoryHealthPanel report={memoryHealth} />
      <PrivacyPreferencesPanel initialPreferences={privacyPreferences} />
      <MemoryImportPanel />
      <MemoryCorrectionPanel />
      <DataControlsPanel />
      <ProfileEnrichmentPanel initialSuggestions={enrichmentSuggestions} />

      <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
        <h2 className="font-medium">프로덕션 준비 상태</h2>
        <div className="mt-4 space-y-3">
          {readiness.checks.map((check) => (
            <div key={check.key} className="rounded-md border border-white/[0.08] bg-slate-950/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{check.label}</p>
                <span className={check.ok ? "text-xs text-teal-300" : "text-xs text-cyan-200"}>
                  {check.ok ? "준비됨" : "설정 필요"}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{check.detail}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
