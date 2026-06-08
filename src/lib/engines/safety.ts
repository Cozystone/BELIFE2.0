import { clamp, isoNow } from "@/lib/utils";
import type { ConversationMessage, MentalStateEstimate, SafetyResource, SafetySignalReport } from "./types";

const urgentSignals = [
  "kill myself",
  "suicide",
  "end my life",
  "take my life",
  "hurt myself",
  "harm myself",
  "can't stay safe",
  "i cannot stay safe",
  "i have a plan",
  "i want to die",
  "want to die",
  "자살",
  "죽고 싶",
  "죽고싶",
  "목숨을 끊",
  "생을 끝",
  "자해",
  "해치고 싶",
  "살기 싫",
  "끝내고 싶",
];

const elevatedSignals = [
  "no reason to live",
  "hopeless",
  "can't go on",
  "cannot go on",
  "nothing matters",
  "disappear",
  "give up on everything",
  "사라지고 싶",
  "버티기 힘",
  "견딜 수 없",
  "희망이 없",
  "아무 의미 없",
  "다 포기",
  "무너질 것",
];

const lowSignals = [
  "panic",
  "crisis",
  "overwhelmed",
  "unsafe",
  "spiraling",
  "공황",
  "위기",
  "압도",
  "불안정",
  "무섭",
];

export const safetyResources: SafetyResource[] = [
  {
    label: "988 Suicide & Crisis Lifeline",
    region: "United States",
    action: "Call or text 988, or use the 988 Lifeline chat.",
    availability: "24/7",
    url: "https://988lifeline.org/",
  },
  {
    label: "Local emergency services",
    region: "Local",
    action: "Call your local emergency number if there is immediate danger.",
    availability: "Immediate emergency response",
    url: "tel:911",
  },
];

export function buildSafetySignalReport(input: {
  text?: string;
  messages?: ConversationMessage[];
  state?: MentalStateEstimate | null;
}): SafetySignalReport {
  const text = [
    input.text ?? "",
    ...(input.messages ?? [])
      .filter((message) => message.role === "user")
      .slice(-16)
      .map((message) => message.content),
  ]
    .join("\n")
    .trim();
  const lower = text.toLowerCase();
  const matchedUrgent = matched(lower, urgentSignals);
  const matchedElevated = matched(lower, elevatedSignals);
  const matchedLow = matched(lower, lowSignals);
  const statePressure = input.state
    ? clamp(
        input.state.supportNeed * 0.34 +
          input.state.socialWithdrawal * 0.2 +
          input.state.motivationalCollapseRisk * 0.22 +
          input.state.cognitiveDistortionRisk * 0.16 +
          input.state.stressLoad * 0.08,
      )
    : 0;

  const level = safetyLevel({ matchedUrgent, matchedElevated, matchedLow, statePressure });
  const confidence = confidenceFor({ level, matchedUrgent, matchedElevated, matchedLow, text, statePressure });
  const matchedSignals = [...matchedUrgent, ...matchedElevated, ...matchedLow].slice(0, 8);

  return {
    generatedAt: isoNow(),
    level,
    confidence,
    summary: summaryFor(level, matchedSignals, statePressure),
    supportiveMessage: supportiveMessageFor(level),
    matchedSignals,
    recommendedActions: actionsFor(level),
    resources: level === "none" ? [safetyResources[0]] : safetyResources,
    guardrail:
      "Safety Boundary is a non-clinical signal check, not diagnosis, therapy, emergency monitoring, or a replacement for local emergency services.",
  };
}

function matched(text: string, signals: string[]) {
  return signals.filter((signal) => text.includes(signal.toLowerCase()));
}

function safetyLevel(input: {
  matchedUrgent: string[];
  matchedElevated: string[];
  matchedLow: string[];
  statePressure: number;
}): SafetySignalReport["level"] {
  if (input.matchedUrgent.length > 0) return "urgent";
  if (input.matchedElevated.length > 0 || input.statePressure >= 0.72) return "elevated";
  if (input.matchedLow.length > 0 || input.statePressure >= 0.55) return "low";
  return "none";
}

function confidenceFor(input: {
  level: SafetySignalReport["level"];
  matchedUrgent: string[];
  matchedElevated: string[];
  matchedLow: string[];
  text: string;
  statePressure: number;
}) {
  const keywordLift =
    input.matchedUrgent.length * 0.24 + input.matchedElevated.length * 0.16 + input.matchedLow.length * 0.08;
  const lengthLift = Math.min(0.12, input.text.length / 4000);
  const levelBase = input.level === "urgent" ? 0.64 : input.level === "elevated" ? 0.52 : input.level === "low" ? 0.38 : 0.24;
  return clamp(levelBase + keywordLift + input.statePressure * 0.16 + lengthLift);
}

function summaryFor(
  level: SafetySignalReport["level"],
  matchedSignals: string[],
  statePressure: number,
) {
  if (level === "urgent") {
    return "Recent BELIFE messages include direct safety-risk language. The next step should prioritize immediate human support.";
  }
  if (level === "elevated") {
    return "Recent BELIFE signals suggest elevated distress. BELIFE should slow down and guide the user toward concrete support.";
  }
  if (level === "low") {
    return "Recent BELIFE signals show some distress pressure, but no direct urgent safety language was detected.";
  }
  if (statePressure > 0.1) {
    return "No urgent safety language was detected in recent BELIFE messages. Current state pressure is still worth tracking gently.";
  }
  return "No urgent safety language was detected in recent BELIFE messages.";
}

function supportiveMessageFor(level: SafetySignalReport["level"]) {
  if (level === "urgent") {
    return "This sounds like a moment to put safety before analysis. If you might be in immediate danger, contact local emergency services now; in the U.S., call or text 988 for crisis support.";
  }
  if (level === "elevated") {
    return "This sounds heavy enough that BELIFE should not treat it as a normal reflection prompt. It may help to contact a trusted person now and use 988 if you are in the U.S.";
  }
  if (level === "low") {
    return "BELIFE sees some distress pressure. A smaller next step is safer than a big self-analysis loop right now.";
  }
  return "BELIFE does not see urgent safety language in recent messages, but this is only a lightweight signal check.";
}

function actionsFor(level: SafetySignalReport["level"]) {
  if (level === "urgent") {
    return [
      "If there is immediate danger, call local emergency services now.",
      "If you are in the U.S., call or text 988, or use 988 Lifeline chat.",
      "Move near a trusted person or a safer public place if possible.",
      "Put distance between yourself and anything you could use to harm yourself.",
    ];
  }
  if (level === "elevated") {
    return [
      "Tell one trusted person that you should not be alone with this feeling right now.",
      "Use 988 in the U.S. if thoughts of self-harm or not wanting to live are present.",
      "Choose a concrete next 10 minutes: water, light, slower breathing, and one message to someone safe.",
    ];
  }
  if (level === "low") {
    return [
      "Name the pressure in one sentence before solving it.",
      "Choose a small stabilizer: stand up, drink water, or send one low-effort check-in.",
      "Return to BELIFE when the immediate intensity has dropped a little.",
    ];
  }
  return [
    "Keep using BELIFE as a private reflection tool, and watch whether distress language becomes more direct over time.",
  ];
}
