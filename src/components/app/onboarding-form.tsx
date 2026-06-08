"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { belifeFetch } from "@/lib/client/auth-fetch";
import { buildOnboardingStarterDraft } from "@/lib/engines/onboarding";
import type { OnboardingAnswers } from "@/lib/engines/types";

const fields = [
  ["nickname", "어떻게 불러드릴까요?", "예: 지훈"],
  ["role", "요즘 당신의 역할은 무엇인가요?", "예: 창업을 준비하는 대학생"],
  ["mainWorry", "지금 가장 자주 떠오르는 걱정은 무엇인가요?", "짧게 적어도 괜찮아요"],
  ["currentGoal", "요즘 가장 중요한 목표는 무엇인가요?", "방향만 적어주세요"],
  ["importantValue", "결정할 때 지키고 싶은 가치는 무엇인가요?", "예: 자유, 안정, 성장"],
  ["stressReaction", "스트레스를 받을 때 보통 어떻게 반응하나요?", "예: 혼자 생각이 많아져요"],
  ["emotionalClimate", "최근 감정 날씨를 말하면 어떤가요?", "예: 조용하지만 불안함"],
  ["preferredTone", "BELIFE가 어떤 톤이면 좋겠어요?", "예: 차분하지만 솔직하게"],
  ["relationshipHope", "나에게 좋은 관계에서 바라는 것은 무엇인가요?", "예: 안전하고 오래 갈 수 있음"],
] as const;

export function OnboardingForm() {
  const router = useRouter();
  const [values, setValues] = useState<OnboardingAnswers>({
    nickname: "",
    role: "",
    mainWorry: "",
    currentGoal: "",
    importantValue: "",
    stressReaction: "",
    emotionalClimate: "",
    preferredTone: "차분하지만 솔직하게",
    relationshipHope: "",
  });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await belifeFetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (response.ok) {
        const params = new URLSearchParams({
          conversation: "new",
          draft: buildOnboardingStarterDraft(values),
        });
        router.push(`/app/talk?${params.toString()}`);
        router.refresh();
      } else {
        const body = (await response.json()) as { error?: string };
        setError(body.error || "온보딩 정보를 저장하지 못했습니다.");
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : "온보딩 정보를 저장하지 못했습니다.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {fields.map(([name, label, placeholder]) => (
        <label key={name} className="block">
          <span className="text-sm text-zinc-300">{label}</span>
          <input
            value={values[name]}
            onChange={(event) => setValues((current) => ({ ...current, [name]: event.target.value }))}
            placeholder={placeholder}
            className="mt-2 h-11 w-full rounded-md border border-white/[0.1] bg-slate-950 px-3 text-sm text-white outline-none transition placeholder:text-zinc-600 focus:border-cyan-400/60"
          />
        </label>
      ))}
      {error ? <p className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-100">{error}</p> : null}
      <Button type="submit" size="lg" className="w-full" disabled={saving}>
        BELIFE 시작
      </Button>
    </form>
  );
}
