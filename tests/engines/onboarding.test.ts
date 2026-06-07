import { describe, expect, it } from "vitest";
import { buildOnboardingStarterDraft } from "@/lib/engines/onboarding";
import type { OnboardingAnswers } from "@/lib/engines/types";

const answers: OnboardingAnswers = {
  nickname: "서연",
  role: "서비스를 만드는 사람",
  mainWorry: "관계가 애매해질 때 같은 걱정을 반복한다",
  currentGoal: "내 패턴을 이해하고 더 안전하게 관계를 회복하고 싶다",
  importantValue: "정직함과 차분한 신뢰",
  stressReaction: "혼자 오래 생각한다",
  emotionalClimate: "조용하지만 조금 긴장되어 있다",
  preferredTone: "차분하고 솔직하게",
  relationshipHope: "안전하고 오래 갈 수 있는 관계",
};

describe("buildOnboardingStarterDraft", () => {
  it("turns onboarding answers into a first Talk draft", () => {
    const draft = buildOnboardingStarterDraft(answers);

    expect(draft).toContain(answers.mainWorry);
    expect(draft).toContain(answers.currentGoal);
    expect(draft).toContain("BELIFE 첫 대화");
    expect(draft).toContain("질문 하나");
    expect(draft.length).toBeLessThanOrEqual(560);
  });

  it("falls back to useful starter language when a value is empty", () => {
    const draft = buildOnboardingStarterDraft({ ...answers, relationshipHope: "" });

    expect(draft).toContain("나에게 좋은 관계의 조건");
  });
});
