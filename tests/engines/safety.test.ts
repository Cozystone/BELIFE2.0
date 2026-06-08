import { describe, expect, it } from "vitest";
import { buildSafetySignalReport } from "@/lib/engines/safety";
import type { MentalStateEstimate } from "@/lib/engines/types";

function state(overrides: Partial<MentalStateEstimate>): MentalStateEstimate {
  return {
    stressLoad: 0.2,
    burnoutRisk: 0.2,
    rumination: 0.2,
    emotionalVolatility: 0.2,
    motivation: 0.5,
    socialWithdrawal: 0.2,
    supportNeed: 0.2,
    cognitiveDistortionRisk: 0.18,
    motivationalCollapseRisk: 0.2,
    baselineDeviation: 0.1,
    abstentionRisk: 0.2,
    confidence: 0.62,
    summary: "test state",
    drivers: ["test"],
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("safety boundary", () => {
  it("detects direct urgent self-harm language and exposes crisis resources", () => {
    const report = buildSafetySignalReport({
      text: "I want to die and I might hurt myself tonight.",
      state: state({ supportNeed: 0.72 }),
    });

    expect(report.level).toBe("urgent");
    expect(report.confidence).toBeGreaterThan(0.7);
    expect(report.matchedSignals).toEqual(expect.arrayContaining(["want to die", "hurt myself"]));
    expect(report.resources.some((resource) => resource.label.includes("988"))).toBe(true);
    expect(report.recommendedActions.join(" ")).toContain("emergency services");
    expect(report.guardrail).toContain("not diagnosis");
  });

  it("recognizes Korean urgent language without claiming diagnosis", () => {
    const report = buildSafetySignalReport({
      text: "요즘 자살 생각이 자꾸 나고 죽고 싶다는 말이 떠올라.",
    });

    expect(report.level).toBe("urgent");
    expect(report.matchedSignals).toEqual(expect.arrayContaining(["자살", "죽고 싶"]));
    expect(report.supportiveMessage).toContain("988");
    expect(report.guardrail).toContain("emergency monitoring");
  });

  it("uses state pressure as an elevated lightweight signal when words are indirect", () => {
    const report = buildSafetySignalReport({
      text: "I am not saying anything dramatic, but everything feels impossible.",
      state: state({
        stressLoad: 0.82,
        socialWithdrawal: 0.9,
        supportNeed: 0.92,
        motivationalCollapseRisk: 0.88,
        cognitiveDistortionRisk: 0.8,
      }),
    });

    expect(report.level).toBe("elevated");
    expect(report.summary).toContain("elevated distress");
  });

  it("stays neutral when recent signals are ordinary", () => {
    const report = buildSafetySignalReport({
      text: "Today I want to understand my work pattern and talk through a small conflict.",
      state: state({ supportNeed: 0.2, stressLoad: 0.24 }),
    });

    expect(report.level).toBe("none");
    expect(report.resources.some((resource) => resource.label.includes("988"))).toBe(true);
    expect(report.summary).toContain("No urgent safety language");
  });
});
