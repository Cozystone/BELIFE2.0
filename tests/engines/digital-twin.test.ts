import { describe, expect, it } from "vitest";
import { buildTwinReflection, calculateTwinConfidence } from "@/lib/engines/digital-twin";
import type { BehaviorSnapshot, DataTrustScore, MentalStateEstimate, OntologyNode, UserProfile } from "@/lib/engines/types";

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

const trust: DataTrustScore = {
  score: 72,
  label: "clear",
  profileCompleteness: 1,
  validSessionDensity: 0.7,
  ontologyStability: 0.68,
  behaviorCoverage: 0.66,
  contradictionInverse: 0.92,
  recencyCoverage: 0.8,
  memoryQuality: 0.74,
  explanation: "신뢰도 형성 중",
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
  it("wraps a twin answer with evidence, uncertainty, trust gate, and a next question", () => {
    const reflection = buildTwinReflection({
      answer: "응답",
      question: "왜 같은 생각이 반복돼?",
      profile,
      state,
      behavior,
      nodes: [node({}), node({ type: "Goal", label: "완성", summary: "완성을 원합니다." })],
      dataTrust: trust,
    });

    expect(reflection.answer).toBe("응답");
    expect(reflection.evidence.length).toBeGreaterThanOrEqual(4);
    expect(reflection.confidence).toBeGreaterThan(0.4);
    expect(reflection.trustGate.score).toBe(72);
    expect(reflection.nextQuestion).toContain("반복 생각");
    expect(reflection.guardrail).toContain("데이터 신뢰도");
    expect(reflection.guardrail).toContain("진단");
  });

  it("keeps confidence low when evidence is missing", () => {
    const confidence = calculateTwinConfidence([], null, null, []);

    expect(confidence).toBe(0);
  });

  it("caps twin confidence by data trust", () => {
    const reflection = buildTwinReflection({
      answer: "응답",
      question: "내 구조를 말해줘",
      profile,
      state: { ...state, confidence: 0.95 },
      behavior: { ...behavior, confidence: 0.95 },
      nodes: [
        node({ confidence: 0.95 }),
        node({ type: "Goal", label: "완성", summary: "완성을 원합니다.", confidence: 0.95 }),
        node({ type: "EmotionPattern", label: "긴장", summary: "긴장이 올라옵니다.", confidence: 0.95 }),
        node({ type: "RecoveryHint", label: "회복", summary: "회복 단서가 있습니다.", confidence: 0.95 }),
      ],
      dataTrust: { ...trust, score: 24, label: "low" },
    });

    expect(reflection.trustGate.ceiling).toBeCloseTo(0.4224);
    expect(reflection.confidence).toBeLessThanOrEqual(reflection.trustGate.ceiling);
    expect(reflection.uncertainties.some((item) => item.includes("Data trust") || item.includes("데이터 신뢰도"))).toBe(true);
  });
});
