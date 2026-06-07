import { Users } from "lucide-react";
import { ScoreBar } from "@/components/app/score-bar";
import { getConnectionPreview, requireUserForPage } from "@/lib/server/belife-service";

export const dynamic = "force-dynamic";

export default async function ConnectionPage() {
  const user = await requireUserForPage();
  const preview = await getConnectionPreview(user.id);

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
    </div>
  );
}
