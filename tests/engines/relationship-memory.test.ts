import { describe, expect, it } from "vitest";
import {
  buildRelationshipMemoryReport,
  relationshipMemoryChunk,
  relationshipPairTag,
} from "@/lib/engines/relationship-memory";

describe("relationship memory", () => {
  it("turns consented pairwise notes into private relationship summaries", () => {
    const first = relationshipMemoryChunk("u1", {
      personLabel: "Alex",
      relationshipType: "friendship",
      interactionNote: "Alex listened carefully, reflected the meaning, and did not rush into advice.",
      interactionQuality: 0.78,
      emotionalSafety: 0.72,
      reciprocity: 0.68,
      repairAttempted: false,
      consent: true,
    });
    const second = relationshipMemoryChunk("u1", {
      personLabel: "Alex",
      relationshipType: "friendship",
      interactionNote: "We clarified a small misunderstanding and the conversation became calmer after repair.",
      interactionQuality: 0.74,
      emotionalSafety: 0.76,
      reciprocity: 0.7,
      repairAttempted: true,
      consent: true,
    });
    const report = buildRelationshipMemoryReport([
      { ...first, createdAt: "2026-01-01T00:00:00.000Z" },
      { ...second, createdAt: "2026-01-02T00:00:00.000Z" },
    ]);

    expect(report.guardrail).toContain("공개 매칭");
    expect(report.pairCount).toBe(1);
    expect(report.totalInteractions).toBe(2);
    expect(report.pairs[0].personLabel).toBe("Alex");
    expect(report.pairs[0].interactionCount).toBe(2);
    expect(report.pairs[0].emotionalSafety).toBeGreaterThan(0.7);
    expect(report.pairs[0].repairEvidence).toBeCloseTo(0.5);
    expect(report.pairs[0].signals.length).toBeGreaterThan(3);
    expect(report.pairs[0].nextObservation.length).toBeGreaterThan(20);
  });

  it("filters summaries by person label and flags thin repair evidence", () => {
    const alex = relationshipMemoryChunk("u1", {
      personLabel: "Alex",
      relationshipType: "friendship",
      interactionNote: "A warm but still early interaction where safety needs more repetition.",
      interactionQuality: 0.62,
      emotionalSafety: 0.48,
      reciprocity: 0.52,
      repairAttempted: false,
      consent: true,
    });
    const taylor = relationshipMemoryChunk("u1", {
      personLabel: "Taylor",
      relationshipType: "collaboration",
      interactionNote: "Work felt fast, one-sided, and hard to slow down when pressure rose.",
      interactionQuality: 0.34,
      emotionalSafety: 0.28,
      reciprocity: 0.32,
      repairAttempted: false,
      consent: true,
    });

    expect(alex.tags).toContain(relationshipPairTag("Alex"));
    const report = buildRelationshipMemoryReport([alex, taylor], { personLabel: "Taylor" });

    expect(report.pairCount).toBe(1);
    expect(report.pairs[0].personLabel).toBe("Taylor");
    expect(report.pairs[0].riskLevel).toBe("high");
    expect(report.pairs[0].summary).toContain("주의가 큰");
  });
});
