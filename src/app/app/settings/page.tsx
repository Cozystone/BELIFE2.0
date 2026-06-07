import { Database, KeyRound, Server } from "lucide-react";
import { ProfileEnrichmentPanel } from "@/components/app/profile-enrichment-panel";
import { SignOutButton } from "@/components/auth/sign-out-button";
import { getOllamaBaseUrl, getOllamaHealth, getOllamaModel } from "@/lib/ai/ollama";
import { hasDatabaseUrl } from "@/lib/db/client";
import { isClerkConfigured } from "@/lib/server/auth";
import { getProfileEnrichmentSuggestions, requireUserForPage } from "@/lib/server/belife-service";
import { getReadinessReport } from "@/lib/server/readiness";
import { getStore } from "@/lib/server/store";
import { isNativeAuthAvailable } from "@/lib/server/native-auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUserForPage();
  const [profile, ollamaHealth, enrichmentSuggestions] = await Promise.all([
    getStore().getProfile(user.id),
    getOllamaHealth(),
    getProfileEnrichmentSuggestions(user.id),
  ]);
  const readiness = getReadinessReport({ ollamaHealth });
  const rows = [
    ["Auth", isClerkConfigured() ? "Clerk configured" : isNativeAuthAvailable() ? "BELIFE native auth" : "Demo mode", KeyRound],
    ["Storage", hasDatabaseUrl() ? "Neon Postgres" : "In-memory demo", Database],
    ["Ollama", `${getOllamaBaseUrl()} / ${getOllamaModel("chat")} / ${ollamaHealth.ok ? "reachable" : "not ready"}`, Server],
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
