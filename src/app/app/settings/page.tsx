import { Database, KeyRound, Server } from "lucide-react";
import { DataControlsPanel } from "@/components/app/data-controls-panel";
import { ProfileEnrichmentPanel } from "@/components/app/profile-enrichment-panel";
import { ScoreBar } from "@/components/app/score-bar";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getOllamaBaseUrl, getOllamaHealth, getOllamaModel } from "@/lib/ai/ollama";
import { hasDatabaseUrl } from "@/lib/db/client";
import { getDataTrustCenter, getProfileEnrichmentSuggestions, requireUserForPage } from "@/lib/server/belife-service";
import { getReadinessReport } from "@/lib/server/readiness";
import { getStore } from "@/lib/server/store";
import { isNativeAuthAvailable } from "@/lib/server/native-auth";

export const dynamic = "force-dynamic";

function formatOptionalDate(value?: string) {
  if (!value) return "No signal yet";
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function SettingsPage() {
  const user = await requireUserForPage();
  const [profile, ollamaHealth, enrichmentSuggestions, dataTrustCenter] = await Promise.all([
    getStore().getProfile(user.id),
    getOllamaHealth(),
    getProfileEnrichmentSuggestions(user.id),
    getDataTrustCenter(user.id),
  ]);
  const readiness = getReadinessReport({ ollamaHealth });
  const { dataTrust, stats, inventory } = dataTrustCenter;
  const rows = [
    ["Auth", user.authProvider === "clerk" ? "Clerk session" : user.authProvider === "native" ? "BELIFE native auth" : "Demo mode", KeyRound],
    ["Storage", hasDatabaseUrl() ? "Neon Postgres" : "In-memory demo", Database],
    ["Ollama", `${getOllamaBaseUrl()} / ${getOllamaModel("chat")} / ${ollamaHealth.ok ? "reachable" : "not ready"}`, Server],
  ] as const;
  const inventoryRows = [
    ["Conversations", inventory.counts.conversations],
    ["Messages", inventory.counts.messages],
    ["Memory chunks", inventory.counts.memoryChunks],
    ["Ontology nodes", inventory.counts.ontologyNodes],
    ["Ontology edges", inventory.counts.ontologyEdges],
    ["State estimates", inventory.counts.stateEstimates],
    ["Behavior snapshots", inventory.counts.behaviorSnapshots],
    ["Data trust snapshots", inventory.counts.dataTrustSnapshots],
    ["Connection previews", inventory.counts.connectionPreviews],
  ] as const;

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-white/[0.08] bg-[#090909] p-5">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-zinc-500">
          Readiness: <span className="font-mono text-orange-200">{readiness.status}</span>
        </p>
      </section>
      <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
        <h2 className="font-medium">Profile</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-zinc-500">Nickname</dt>
            <dd className="mt-1 text-zinc-100">{profile?.nickname || user.name}</dd>
          </div>
          <div>
            <dt className="text-zinc-500">Current goal</dt>
            <dd className="mt-1 text-zinc-100">{profile?.currentGoal || "Not set yet"}</dd>
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
            <Icon className="h-5 w-5 text-orange-300" />
            <h2 className="mt-3 text-sm font-medium">{label}</h2>
            <p className="mt-2 break-words text-sm text-zinc-500">{value}</p>
          </article>
        ))}
      </section>
      <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="font-medium">Data Trust Center</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
              Data trust는 사람의 점수가 아니라, BELIFE가 당신을 얼마나 명확하게 이해하고 있는지에 대한 신뢰도입니다.
            </p>
          </div>
          <div className="rounded-md border border-orange-300/15 bg-black/40 px-4 py-3 text-right">
            <p className="text-xs text-zinc-500">Structure clarity</p>
            <p className="mt-1 font-mono text-4xl text-orange-200">{dataTrust.score}</p>
            <p className="mt-1 text-xs uppercase text-zinc-500">{dataTrust.label}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <ScoreBar label="Profile completeness" value={dataTrust.profileCompleteness} />
            <ScoreBar label="Session density" value={dataTrust.validSessionDensity} tone="teal" />
            <ScoreBar label="Ontology stability" value={dataTrust.ontologyStability} />
            <ScoreBar label="Behavior coverage" value={dataTrust.behaviorCoverage} tone="teal" />
            <ScoreBar label="Contradiction inverse" value={dataTrust.contradictionInverse} tone="zinc" />
            <ScoreBar label="Recency coverage" value={dataTrust.recencyCoverage} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {inventoryRows.map(([label, value]) => (
              <div key={label} className="rounded-md border border-white/[0.08] bg-black/40 p-3">
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="mt-2 font-mono text-2xl text-zinc-100">{value}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-md border border-white/[0.08] bg-black/40 p-3">
            <p className="text-xs text-zinc-500">Evidence mix</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Extracted {inventory.evidenceMix.extracted} · Inferred {inventory.evidenceMix.inferred} · Ambiguous {inventory.evidenceMix.ambiguous}
            </p>
          </div>
          <div className="rounded-md border border-white/[0.08] bg-black/40 p-3">
            <p className="text-xs text-zinc-500">Ontology layers</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">
              Core {inventory.ontologyLayers.core} · Active {inventory.ontologyLayers.active} · Archive {inventory.ontologyLayers.archive}
            </p>
          </div>
          <div className="rounded-md border border-white/[0.08] bg-black/40 p-3">
            <p className="text-xs text-zinc-500">Latest memory signal</p>
            <p className="mt-2 text-sm leading-6 text-zinc-300">{formatOptionalDate(inventory.latest.memoryAt ?? inventory.latest.messageAt)}</p>
          </div>
        </div>
        <p className="mt-5 text-sm leading-6 text-zinc-500">
          {dataTrust.explanation} 현재 세션 수는 {stats.sessionCount}개, 온톨로지 노드는 {stats.ontologyCount}개입니다.
        </p>
      </section>
      <DataControlsPanel />
      <ProfileEnrichmentPanel initialSuggestions={enrichmentSuggestions} />
      <section className="rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
        <h2 className="font-medium">Production Readiness</h2>
        <div className="mt-4 space-y-3">
          {readiness.checks.map((check) => (
            <div key={check.key} className="rounded-md border border-white/[0.08] bg-black/40 p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium">{check.label}</p>
                <span className={check.ok ? "text-xs text-teal-300" : "text-xs text-orange-200"}>
                  {check.ok ? "ready" : "needs setup"}
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
