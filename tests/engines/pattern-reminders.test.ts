import { describe, expect, it } from "vitest";
import { buildPatternReminders } from "@/lib/engines/pattern-reminders";
import type { DataTrustScore, MentalStateEstimate, OntologyNode } from "@/lib/engines/types";

const now = new Date().toISOString();

const state: MentalStateEstimate = {
  stressLoad: 0.62,
  burnoutRisk: 0.3,
  rumination: 0.66,
  emotionalVolatility: 0.35,
  motivation: 0.45,
  socialWithdrawal: 0.2,
  supportNeed: 0.5,
  cognitiveDistortionRisk: 0.44,
  motivationalCollapseRisk: 0.38,
  baselineDeviation: 0.14,
  abstentionRisk: 0.26,
  confidence: 0.72,
  summary: "반복 생각이 올라오는 상태",
  drivers: ["반복 생각"],
  createdAt: now,
};

const trust: DataTrustScore = {
  score: 64,
  label: "clear",
  profileCompleteness: 0.8,
  validSessionDensity: 0.62,
  ontologyStability: 0.58,
  behaviorCoverage: 0.5,
  contradictionInverse: 0.9,
  recencyCoverage: 0.7,
  explanation: "test",
  createdAt: now,
};

function node(overrides: Partial<OntologyNode>): OntologyNode {
  return {
    userId: "u1",
    type: "Value",
    label: "정직함",
    summary: "정직함을 지키려는 신호가 반복됩니다.",
    layer: "core",
    tier: "L1",
    certainty: "INFERRED",
    confidence: 0.78,
    evidenceCount: 3,
    status: "active",
    lastEvidenceAt: now,
    ...overrides,
  };
}

describe("buildPatternReminders", () => {
  it("turns state and ontology evidence into Talk prompts", () => {
    const reminders = buildPatternReminders({
      nodes: [node({}), node({ type: "GrowthTrajectory", label: "안전한 관계", summary: "안전한 관계를 지향합니다." })],
      state,
      dataTrust: trust,
    });

    expect(reminders.length).toBeGreaterThanOrEqual(2);
    expect(reminders.some((reminder) => reminder.kind === "state")).toBe(true);
    expect(reminders.some((reminder) => reminder.talkPrompt.includes("정리해줘"))).toBe(true);
  });

  it("adds a trust reminder when BELIFE needs more signal", () => {
    const reminders = buildPatternReminders({
      nodes: [],
      state: { ...state, stressLoad: 0.2, rumination: 0.2 },
      dataTrust: { ...trust, score: 24, label: "low" },
    });

    expect(reminders.some((reminder) => reminder.kind === "trust")).toBe(true);
  });
});
