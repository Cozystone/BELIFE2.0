import { describe, expect, it } from "vitest";
import { buildConnectionPreview } from "@/lib/engines/compatibility";
import { buildConnectionQualityLens } from "@/lib/engines/connection-quality";
import { buildRelationshipMemoryReport, relationshipMemoryChunk } from "@/lib/engines/relationship-memory";
import type { BehaviorSnapshot, DataTrustScore } from "@/lib/engines/types";

const trust: DataTrustScore = {
  score: 68,
  label: "clear",
  profileCompleteness: 0.82,
  validSessionDensity: 0.65,
  ontologyStability: 0.62,
  behaviorCoverage: 0.68,
  contradictionInverse: 0.92,
  recencyCoverage: 0.72,
  memoryQuality: 0.76,
  explanation: "test",
  createdAt: new Date().toISOString(),
};

const behavior: BehaviorSnapshot = {
  questionFrequency: 0.44,
  directness: 0.58,
  disclosureSpeed: 0.48,
  empathyOrientation: 0.7,
  solutionOrientation: 0.5,
  abstraction: 0.42,
  conflictSensitivity: 0.22,
  pacing: 0.52,
  warmth: 0.72,
  confidence: 0.66,
  summary: "warm and reciprocal",
  createdAt: new Date().toISOString(),
};

describe("connection quality lens", () => {
  it("maps relationship preview and pair memory into CDCS-inspired four axes", () => {
    const preview = buildConnectionPreview([], behavior, trust);
    const memory = buildRelationshipMemoryReport([
      relationshipMemoryChunk("u1", {
        personLabel: "Alex",
        relationshipType: "friendship",
        interactionNote: "Alex reflected the meaning back, stayed curious, and clarified a small misunderstanding.",
        interactionQuality: 0.78,
        emotionalSafety: 0.76,
        reciprocity: 0.72,
        repairAttempted: true,
        consent: true,
      }),
    ]);
    const report = buildConnectionQualityLens({ preview, relationshipMemory: memory });

    expect(report.guardrail).toContain("공개 매칭");
    expect(report.axes).toHaveLength(4);
    expect(report.axes.map((axis) => axis.key)).toEqual([
      "sharedReality",
      "partnerResponsiveness",
      "participantInterest",
      "affectiveExperience",
    ]);
    expect(report.memoryCoverage).toMatchObject({
      pairCount: 1,
      totalInteractions: 1,
      strongestPair: "Alex",
      riskiestPair: "Alex",
    });
    expect(report.confidence).toBeGreaterThan(0);
    expect(report.confidence).toBeLessThanOrEqual(1);
    expect(report.comfortSources.length).toBe(3);
    expect(report.tensionSources.length).toBe(3);
    expect(report.nextMicroExperiments.length).toBe(3);
    for (const axis of report.axes) {
      expect(axis.score).toBeGreaterThanOrEqual(0);
      expect(axis.score).toBeLessThanOrEqual(1);
      expect(axis.evidence.length).toBeGreaterThan(1);
      expect(axis.nextObservation.length).toBeGreaterThan(20);
    }
  });

  it("keeps confidence bounded and asks for more evidence when pair memory is absent", () => {
    const preview = buildConnectionPreview([], null, { ...trust, score: 24, label: "low" });
    const memory = buildRelationshipMemoryReport([]);
    const report = buildConnectionQualityLens({ preview, relationshipMemory: memory });

    expect(report.memoryCoverage.pairCount).toBe(0);
    expect(report.memoryCoverage.totalInteractions).toBe(0);
    expect(report.summary).toContain("작업 가설");
    expect(report.nextMicroExperiments.join(" ")).toContain("관계 기억 메모");
    expect(report.confidence).toBeGreaterThanOrEqual(0);
    expect(report.confidence).toBeLessThanOrEqual(1);
  });
});
