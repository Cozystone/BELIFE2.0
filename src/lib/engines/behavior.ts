import { clamp, isoNow } from "@/lib/utils";
import type { BehaviorSnapshot } from "./types";

function countMatches(text: string, pattern: RegExp) {
  return text.match(pattern)?.length ?? 0;
}

export function estimateBehavior(text: string, previous?: BehaviorSnapshot | null): BehaviorSnapshot {
  const questionFrequency = clamp(countMatches(text, /\?|어떻게|왜|무엇|뭐|what|why|how/gi) / 5);
  const directness = clamp(countMatches(text, /나는|내가|원해|필요|해야|I |need|want/gi) / 8 + 0.22);
  const disclosureSpeed = clamp(Math.min(text.length, 900) / 900);
  const empathyOrientation = clamp(countMatches(text, /감정|마음|이해|공감|느낌|feel|understand/gi) / 6 + 0.2);
  const solutionOrientation = clamp(countMatches(text, /해결|방법|계획|다음|해야|next|plan|fix/gi) / 7 + 0.2);
  const abstraction = clamp(countMatches(text, /의미|패턴|구조|관계|가치|meaning|pattern/gi) / 6 + 0.18);
  const conflictSensitivity = clamp(countMatches(text, /갈등|불편|짜증|오해|화가|conflict|angry/gi) / 5 + 0.12);
  const pacing = clamp(0.35 + Math.min(text.split(/\s+/).length, 160) / 260);
  const warmth = clamp(countMatches(text, /고마|괜찮|따뜻|좋아|thank|care/gi) / 6 + 0.25);

  const blend = (current: number, old?: number) => (old == null ? current : clamp(0.72 * current + 0.28 * old));

  return {
    questionFrequency: blend(questionFrequency, previous?.questionFrequency),
    directness: blend(directness, previous?.directness),
    disclosureSpeed: blend(disclosureSpeed, previous?.disclosureSpeed),
    empathyOrientation: blend(empathyOrientation, previous?.empathyOrientation),
    solutionOrientation: blend(solutionOrientation, previous?.solutionOrientation),
    abstraction: blend(abstraction, previous?.abstraction),
    conflictSensitivity: blend(conflictSensitivity, previous?.conflictSensitivity),
    pacing: blend(pacing, previous?.pacing),
    warmth: blend(warmth, previous?.warmth),
    confidence: clamp(0.35 + Math.min(text.length, 800) / 1200 + (previous ? 0.15 : 0)),
    summary:
      abstraction > 0.52
        ? "사용자는 즉각적인 처방보다 패턴과 의미를 함께 이해하려는 경향이 있습니다."
        : solutionOrientation > empathyOrientation
          ? "현재 대화는 실질적인 해결과 다음 행동을 찾는 쪽으로 기울어 있습니다."
          : "사용자에게는 직접 조언 전에 따뜻한 확인과 명료화가 도움이 됩니다.",
    createdAt: isoNow(),
  };
}
