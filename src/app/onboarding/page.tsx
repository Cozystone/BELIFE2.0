import { OnboardingForm } from "@/components/app/onboarding-form";
import { requireUserForPage } from "@/lib/server/belife-service";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  await requireUserForPage();

  return (
    <main className="min-h-dvh bg-[#050505] px-5 py-8 text-zinc-100">
      <div className="mx-auto max-w-2xl">
        <p className="text-sm text-orange-200">Lightweight onboarding</p>
        <h1 className="mt-2 text-3xl font-semibold">처음부터 완벽한 프로필은 필요 없어요</h1>
        <p className="mt-4 text-sm leading-7 text-zinc-500">
          BELIFE는 자연스러운 대화를 통해 더 많이 이해합니다. 지금은 시작에 필요한 최소 신호만 받습니다.
        </p>
        <div className="mt-8 rounded-md border border-white/[0.08] bg-white/[0.04] p-4">
          <OnboardingForm />
        </div>
      </div>
    </main>
  );
}
