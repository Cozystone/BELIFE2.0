import { compactText } from "@/lib/utils";
import type { DataTrustScore, MentalStateEstimate, OntologyNode, PatternReminder } from "./types";

export function buildPatternReminders(input: {
  nodes: OntologyNode[];
  state: MentalStateEstimate;
  dataTrust: DataTrustScore;
  limit?: number;
}): PatternReminder[] {
  const reminders: PatternReminder[] = [];
  const tierRank = { L1: 3, L2: 2, L3: 1 };
  const activeNodes = input.nodes
    .filter((node) => node.status === "active")
    .sort((left, right) => tierRank[right.tier] - tierRank[left.tier] || right.confidence - left.confidence);

  if (input.state.rumination >= 0.52 || input.state.stressLoad >= 0.58) {
    reminders.push({
      id: "state:repeating-thought",
      kind: "state",
      title: "반복 생각 신호",
      detail: "최근 상태 신호에서 같은 걱정이나 긴장이 다시 도는 흐름이 보입니다.",
      talkPrompt: "지금 반복해서 떠오르는 생각을 실제 문제, 감정 신호, 오래된 패턴으로 나눠서 같이 정리해줘.",
      confidence: input.state.confidence,
    });
  }

  const identityNode = activeNodes.find((node) => node.type === "Value" || node.type === "Belief" || node.type === "Goal");
  if (identityNode) {
    reminders.push({
      id: `ontology:${identityNode.type}:${identityNode.label}`,
      kind: "ontology",
      title: `${identityNode.label} 다시 보기`,
      detail: compactText(identityNode.summary, 150),
      talkPrompt: `${identityNode.label} 패턴이 지금 내 선택이나 감정에 어떻게 영향을 주고 있는지 짧게 해석해줘.`,
      confidence: identityNode.confidence,
    });
  }

  const relationshipNode = activeNodes.find(
    (node) => node.type === "GrowthTrajectory" || node.type === "RecoveryHint" || node.type === "FrictionPattern",
  );
  if (relationshipNode) {
    reminders.push({
      id: `relationship:${relationshipNode.type}:${relationshipNode.label}`,
      kind: "relationship",
      title: "관계 리듬 점검",
      detail: compactText(relationshipNode.summary || relationshipNode.label, 150),
      talkPrompt: "내 관계 패턴에서 지금 건강하게 가까워지는 신호와 조심해야 할 신호를 하나씩 정리해줘.",
      confidence: relationshipNode.confidence,
    });
  }

  if (input.dataTrust.score < 50) {
    reminders.push({
      id: "trust:more-signal",
      kind: "trust",
      title: "더 선명한 이해가 필요해요",
      detail: "BELIFE가 아직 충분한 반복 신호를 모으는 중입니다. 짧은 대화 하나가 구조를 더 선명하게 만듭니다.",
      talkPrompt: "BELIFE가 나를 더 잘 이해할 수 있도록 오늘 가장 선명했던 감정, 선택, 관계 장면을 하나씩 물어봐줘.",
      confidence: input.dataTrust.score / 100,
    });
  }

  if (!reminders.length) {
    reminders.push({
      id: "state:steady-check",
      kind: "state",
      title: "현재 리듬 유지",
      detail: "큰 흔들림보다 현재 리듬을 관찰하는 쪽이 더 유용해 보입니다.",
      talkPrompt: "지금 유지되고 있는 좋은 리듬과 조금만 조정하면 좋아질 부분을 같이 정리해줘.",
      confidence: input.state.confidence,
    });
  }

  return dedupeReminders(reminders)
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, input.limit ?? 3);
}

function dedupeReminders(reminders: PatternReminder[]) {
  const seen = new Set<string>();
  return reminders.filter((reminder) => {
    if (seen.has(reminder.id)) return false;
    seen.add(reminder.id);
    return true;
  });
}
