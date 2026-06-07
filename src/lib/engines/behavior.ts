import { clamp, isoNow } from "@/lib/utils";
import type { BehaviorSnapshot } from "./types";

export function estimateBehavior(text: string, previous?: BehaviorSnapshot | null): BehaviorSnapshot {
  const questionFrequency = clamp((text.match(/\?|왜|어떻게|뭐|what|why|how/gi)?.length ?? 0) / 5);
  const directness = clamp((text.match(/나는|내가|원해|싫|필요|I |need|want/gi)?.length ?? 0) / 8 + 0.22);
  const disclosureSpeed = clamp(Math.min(text.length, 900) / 900);
  const empathyOrientation = clamp((text.match(/상대|마음|이해|공감|feel|understand/gi)?.length ?? 0) / 6 + 0.2);
  const solutionOrientation = clamp((text.match(/해결|방법|계획|해야|next|plan|fix/gi)?.length ?? 0) / 7 + 0.2);
  const abstraction = clamp((text.match(/의미|패턴|구조|관계|가치|meaning|pattern/gi)?.length ?? 0) / 6 + 0.18);
  const conflictSensitivity = clamp((text.match(/갈등|불편|화|짜증|오해|conflict|angry/gi)?.length ?? 0) / 5 + 0.12);
  const pacing = clamp(0.35 + Math.min(text.split(/\s+/).length, 160) / 260);
  const warmth = clamp((text.match(/고마|괜찮|함께|좋|thank|care/gi)?.length ?? 0) / 6 + 0.25);

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
        ? "The user tends to seek pattern-level meaning, not only immediate fixes."
        : solutionOrientation > empathyOrientation
          ? "The user currently leans toward practical resolution and next steps."
          : "The user benefits from a warm, clarifying response before direct advice.",
    createdAt: isoNow(),
  };
}
