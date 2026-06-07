import { Database, KeyRound, Server } from "lucide-react";
import { getOllamaBaseUrl, getOllamaModel } from "@/lib/ai/ollama";
import { hasDatabaseUrl } from "@/lib/db/client";
import { isClerkConfigured } from "@/lib/server/auth";
import { requireUserForPage } from "@/lib/server/belife-service";
import { getStore } from "@/lib/server/store";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUserForPage();
  const profile = await getStore().getProfile(user.id);
  const rows = [
    ["Auth", isClerkConfigured() ? "Clerk configured" : "Demo mode", KeyRound],
    ["Storage", hasDatabaseUrl() ? "Neon Postgres" : "In-memory demo", Database],
    ["Ollama", `${getOllamaBaseUrl()} / ${getOllamaModel("chat")}`, Server],
  ] as const;

  return (
    <div className="space-y-5">
      <section className="rounded-md border border-white/[0.08] bg-[#090909] p-5">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-2 text-sm text-zinc-500">환경변수가 연결되면 demo mode에서 운영 모드로 전환됩니다.</p>
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
    </div>
  );
}
