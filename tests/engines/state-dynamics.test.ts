import { describe, expect, it } from "vitest";
import { buildStateDynamicsReport } from "@/lib/engines/state-dynamics";
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

describe("state dynamics", () => {
  it("builds lagged personal-dynamics couplings from repeated state transitions", () => {
    const report = buildStateDynamicsReport([
      state({ stressLoad: 0.2, supportNeed: 0.18, createdAt: "2026-01-01T00:00:00.000Z" }),
      state({ stressLoad: 0.34, supportNeed: 0.24, createdAt: "2026-01-02T00:00:00.000Z" }),
      state({ stressLoad: 0.48, supportNeed: 0.36, createdAt: "2026-01-03T00:00:00.000Z" }),
      state({ stressLoad: 0.62, supportNeed: 0.5, baselineDeviation: 0.22, createdAt: "2026-01-04T00:00:00.000Z" }),
      state({ stressLoad: 0.72, supportNeed: 0.64, baselineDeviation: 0.28, createdAt: "2026-01-05T00:00:00.000Z" }),
    ]);

    expect(report.modelKind).toBe("lagged-delta");
    expect(report.sampleSize).toBe(5);
    expect(report.couplings.length).toBeGreaterThan(0);
    expect(report.guardrail).toContain("not diagnosis");
    expect(report.summary).toContain("Confidence");
    expect(report.baselineShift.level).toMatch(/low|moderate|high/);
    for (const coupling of report.couplings) {
      expect(coupling.strength).toBeGreaterThanOrEqual(0);
      expect(coupling.strength).toBeLessThanOrEqual(1);
      expect(coupling.evidence).toContain("Lagged");
    }
  });

  it("uses early heuristics without pretending causality when history is thin", () => {
    const report = buildStateDynamicsReport([
      state({
        stressLoad: 0.68,
        supportNeed: 0.62,
        rumination: 0.5,
        cognitiveDistortionRisk: 0.44,
        createdAt: "2026-01-02T00:00:00.000Z",
      }),
    ]);

    expect(report.modelKind).toBe("early-heuristic");
    expect(report.sampleSize).toBe(1);
    expect(report.couplings.length).toBeGreaterThan(0);
    expect(report.summary).toContain("early heuristic");
    expect(report.stabilizers.length).toBeGreaterThan(0);
    expect(report.watchlist.length).toBeGreaterThan(0);
  });
});
