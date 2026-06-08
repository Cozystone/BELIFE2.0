import { describe, expect, it } from "vitest";
import { buildConnectionPreview } from "@/lib/engines/compatibility";
import { buildDyadicCopingReport } from "@/lib/engines/dyadic-coping";
import { buildRelationshipMemoryReport, relationshipMemoryChunk } from "@/lib/engines/relationship-memory";
import type { BehaviorSnapshot, DataTrustScore, MentalStateEstimate } from "@/lib/engines/types";

const createdAt = new Date().toISOString();

const trust: DataTrustScore = {
  score: 72,
  label: "clear",
  profileCompleteness: 0.82,
  validSessionDensity: 0.66,
  ontologyStability: 0.7,
  behaviorCoverage: 0.7,
  contradictionInverse: 0.88,
  recencyCoverage: 0.72,
  memoryQuality: 0.78,
  explanation: "test",
  createdAt,
};

const behavior: BehaviorSnapshot = {
  questionFrequency: 0.42,
  directness: 0.62,
  disclosureSpeed: 0.48,
  empathyOrientation: 0.72,
  solutionOrientation: 0.56,
  abstraction: 0.44,
  conflictSensitivity: 0.24,
  pacing: 0.54,
  warmth: 0.72,
  confidence: 0.68,
  summary: "warm, direct, and repair-capable",
  createdAt,
};

const stableState: MentalStateEstimate = {
  stressLoad: 0.34,
  burnoutRisk: 0.24,
  rumination: 0.32,
  emotionalVolatility: 0.26,
  motivation: 0.66,
  socialWithdrawal: 0.22,
  supportNeed: 0.38,
  cognitiveDistortionRisk: 0.22,
  motivationalCollapseRisk: 0.18,
  baselineDeviation: 0.28,
  abstentionRisk: 0.18,
  confidence: 0.7,
  summary: "steady enough to test relationship repair",
  drivers: ["lower stress", "clearer pacing"],
  createdAt,
};

describe("dyadic coping lens", () => {
  it("maps VSA and dyadic coping into five private relationship axes", () => {
    const preview = buildConnectionPreview([], behavior, trust);
    const relationshipMemory = buildRelationshipMemoryReport([
      relationshipMemoryChunk("u1", {
        personLabel: "Alex",
        relationshipType: "friendship",
        interactionNote:
          "Alex noticed stress early, asked what kind of support would help, and repaired a small misunderstanding calmly.",
        interactionQuality: 0.8,
        emotionalSafety: 0.78,
        reciprocity: 0.76,
        repairAttempted: true,
        consent: true,
      }),
    ]);
    const report = buildDyadicCopingReport({ preview, relationshipMemory, state: stableState });

    expect(report.guardrail).toContain("not public matching");
    expect(report.guardrail).toContain("not");
    expect(report.axes.map((axis) => axis.key)).toEqual([
      "stressCommunication",
      "supportiveResponse",
      "jointRegulation",
      "repairAfterStress",
      "withdrawalRisk",
    ]);
    expect(report.axes).toHaveLength(5);
    expect(report.vsa.enduringVulnerabilities.length).toBeGreaterThan(1);
    expect(report.vsa.stressfulEvents.length).toBeGreaterThan(1);
    expect(report.vsa.adaptiveProcesses.length).toBeGreaterThan(1);
    expect(report.memoryCoverage).toMatchObject({
      pairCount: 1,
      totalInteractions: 1,
      strongestPair: "Alex",
      riskiestPair: "Alex",
    });
    expect(report.supportMoves.length).toBeGreaterThanOrEqual(3);
    expect(report.riskSignals.length).toBeGreaterThanOrEqual(3);
    expect(report.nextConversationMove.length).toBeGreaterThan(40);
    for (const axis of report.axes) {
      expect(axis.score).toBeGreaterThanOrEqual(0);
      expect(axis.score).toBeLessThanOrEqual(1);
      expect(axis.evidence.length).toBeGreaterThan(1);
    }
  });

  it("raises withdrawal risk when stress, low repair, and social withdrawal combine", () => {
    const preview = buildConnectionPreview([], { ...behavior, conflictSensitivity: 0.7, warmth: 0.32 }, { ...trust, score: 42 });
    const sparseMemory = buildRelationshipMemoryReport([]);
    const stressedState: MentalStateEstimate = {
      ...stableState,
      stressLoad: 0.78,
      emotionalVolatility: 0.68,
      socialWithdrawal: 0.72,
      supportNeed: 0.76,
      confidence: 0.62,
      drivers: ["high stress", "distance impulse"],
    };
    const report = buildDyadicCopingReport({ preview, relationshipMemory: sparseMemory, state: stressedState });
    const withdrawal = report.axes.find((axis) => axis.key === "withdrawalRisk");

    expect(withdrawal?.polarity).toBe("risk");
    expect(withdrawal?.score).toBeGreaterThan(0.48);
    expect(report.summary).toContain("Stress");
    expect(report.nextConversationMove).toContain("go quiet");
    expect(report.memoryCoverage.pairCount).toBe(0);
  });
});
