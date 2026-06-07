import { describe, expect, it } from "vitest";
import { buildMentalStateHistoryReport } from "@/lib/engines/state-history";
import type { MentalStateEstimate } from "@/lib/engines/types";

function state(overrides: Partial<MentalStateEstimate>): MentalStateEstimate {
  return {
    stressLoad: 0.2,
    burnoutRisk: 0.2,
    rumination: 0.2,
    emotionalVolatility: 0.2,
    motivation: 0.4,
    socialWithdrawal: 0.1,
    supportNeed: 0.2,
    cognitiveDistortionRisk: 0.18,
    motivationalCollapseRisk: 0.24,
    baselineDeviation: 0.1,
    abstentionRisk: 0.2,
    confidence: 0.5,
    summary: "test state",
    drivers: ["test"],
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("buildMentalStateHistoryReport", () => {
  it("computes deltas from the previous state", () => {
    const report = buildMentalStateHistoryReport([
      state({ stressLoad: 0.2, supportNeed: 0.2, createdAt: "2026-01-01T00:00:00.000Z" }),
      state({ stressLoad: 0.42, supportNeed: 0.34, createdAt: "2026-01-02T00:00:00.000Z" }),
    ]);

    expect(report.current?.stressLoad).toBe(0.42);
    expect(report.previous?.stressLoad).toBe(0.2);
    expect(report.deltas.stressLoad).toBeCloseTo(0.22);
    expect(report.directionSummary).toContain("부담");
  });

  it("handles a first state without pretending there is a trend", () => {
    const report = buildMentalStateHistoryReport([
      state({ motivation: 0.55, createdAt: "2026-01-01T00:00:00.000Z" }),
    ]);

    expect(report.previous).toBeNull();
    expect(report.deltas.motivation).toBe(0);
    expect(report.directionSummary).toContain("첫 상태 추정");
  });

  it("tracks v2 interpretation caution signals", () => {
    const report = buildMentalStateHistoryReport([
      state({ cognitiveDistortionRisk: 0.18, abstentionRisk: 0.2, createdAt: "2026-01-01T00:00:00.000Z" }),
      state({ cognitiveDistortionRisk: 0.42, abstentionRisk: 0.34, createdAt: "2026-01-02T00:00:00.000Z" }),
    ]);

    expect(report.deltas.cognitiveDistortionRisk).toBeCloseTo(0.24);
    expect(report.deltas.abstentionRisk).toBeCloseTo(0.14);
    expect(report.directionSummary).toContain("해석을 조심");
  });
});
