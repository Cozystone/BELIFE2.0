import { describe, expect, it } from "vitest";
import { buildTwinReflection, calculateTwinConfidence } from "@/lib/engines/digital-twin";
import type { BehaviorSnapshot, MentalStateEstimate, OntologyNode, UserProfile } from "@/lib/engines/types";

const now = new Date().toISOString();

const profile: UserProfile = {
  userId: "u1",
  displayName: "Test",
  nickname: "Test",
  role: "builder",
  mainWorry: "반복되는 걱정",
  currentGoal: "의미 있는 서비스를 완성하고 싶다",
  importantValue: "정직함과 안정감",
  stressReaction: "혼자 생각이 많아진다",
  emotionalClimate: "차분하지만 피로함",
  preferredTone: "차분하게",
  onboardingAnswers: {},
  createdAt: now,
  updatedAt: now,
};

const state: MentalStateEstimate = {
  stressLoad: 0.48,
  burnoutRisk: 0.36,
  rumination: 0.68,
  emotionalVolatility: 0.32,
  motivation: 0.58,
  socialWithdrawal: 0.24,
  supportNeed: 0.44,
  cognitiveDistortionRisk: 0.46,
  motivationalCollapseRisk: 0.32,
  baselineDeviation: 0.16,
  abstentionRisk: 0.28,
  confidence: 0.62,
  summary: "반복 생각이 조금 강하지만 동기는 유지됩니다.",
  drivers: ["rumination"],
  createdAt: now,
};

const behavior: BehaviorSnapshot = {
  questionFrequency: 0.4,
  directness: 0.52,
  disclosureSpeed: 0.42,
  empathyOrientation: 0.58,
  solutionOrientation: 0.54,
  abstraction: 0.48,
  conflictSensitivity: 0.32,
  pacing: 0.5,
  warmth: 0.6,
  confidence: 0.66,
  summary: "차분하게 구조를 확인하려는 대화 패턴입니다.",
  createdAt: now,
};

function node(overrides: Partial<OntologyNode>): OntologyNode {
  return {
    userId: "u1",
    type: "Value",
    label: "정직함",
    summary: "관계와 결정에서 정직함을 중요하게 봅니다.",
    layer: "core",
    tier: "L1",
    certainty: "EXTRACTED",
    confidence: 0.78,
    evidenceCount: 3,
    status: "active",
    lastEvidenceAt: now,
    ...overrides,
  };
}

describe("digital twin reflection", () => {
  it("wraps a twin answer with evidence, uncertainty, and a next question", () => {
    const reflection = buildTwinReflection({
      answer: "답변",
      question: "왜 같은 생각이 반복돼?",
      profile,
      state,
      behavior,
      nodes: [node({}), node({ type: "Goal", label: "완성", summary: "완성을 원합니다." })],
    });

    expect(reflection.answer).toBe("답변");
    expect(reflection.evidence.length).toBeGreaterThanOrEqual(4);
    expect(reflection.confidence).toBeGreaterThan(0.4);
    expect(reflection.nextQuestion).toContain("반복 생각");
    expect(reflection.guardrail).toContain("진단");
  });

  it("keeps confidence low when evidence is missing", () => {
    const confidence = calculateTwinConfidence([], null, null, []);

    expect(confidence).toBe(0);
  });
});
