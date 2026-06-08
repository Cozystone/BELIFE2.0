import { compactText } from "@/lib/utils";
import type { OnboardingAnswers } from "./types";

export function buildOnboardingStarterDraft(answers: OnboardingAnswers) {
  const worry = compactText(answers.mainWorry || "지금 반복되는 걱정", 90);
  const goal = compactText(answers.currentGoal || "지금 중요하게 붙잡고 싶은 목표", 90);
  const value = compactText(answers.importantValue || "내가 지키고 싶은 가치", 70);
  const relationshipHope = compactText(answers.relationshipHope || "나에게 좋은 관계의 조건", 80);

  return compactText(
    `방금 온보딩에서 나는 "${worry}"가 자주 떠오르고, 지금은 "${goal}"을 중요하게 보고 있다고 적었어. "${value}"를 지키면서 "${relationshipHope}"에 가까운 관계를 만들고 싶어. 이걸 바탕으로 BELIFE 첫 대화를 시작해줘. 내 현재 상태와 반복 패턴을 짧게 정리하고, 내가 답하기 쉬운 질문 하나부터 물어봐줘.`,
    560,
  );
}
