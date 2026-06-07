import { describe, expect, it } from "vitest";
import { buildConnectionPreview } from "@/lib/engines/compatibility";
import type { BehaviorSnapshot, DataTrustScore, OntologyNode } from "@/lib/engines/types";

const trust: DataTrustScore = {
  score: 62,
  label: "clear",
  profileCompleteness: 0.8,
  validSessionDensity: 0.6,
  ontologyStability: 0.6,
  behaviorCoverage: 0.6,
  contradictionInverse: 0.9,
  recencyCoverage: 0.7,
  explanation: "test",
  createdAt: new Date().toISOString(),
};

const warmBehavior: BehaviorSnapshot = {
  questionFrequency: 0.42,
  directness: 0.58,
  disclosureSpeed: 0.5,
  empathyOrientation: 0.68,
  solutionOrientation: 0.52,
  abstraction: 0.44,
  conflictSensitivity: 0.24,
  pacing: 0.48,
  warmth: 0.7,
  confidence: 0.64,
  summary: "warm and reflective",
  createdAt: new Date().toISOString(),
};

const sensitiveBehavior: BehaviorSnapshot = {
  ...warmBehavior,
  conflictSensitivity: 0.82,
  empathyOrientation: 0.28,
  warmth: 0.32,
  confidence: 0.72,
};

describe("buildConnectionPreview", () => {
  it("keeps multidimensional axes instead of one match score", () => {
    const nodes: OntologyNode[] = [
      {
        userId: "u1",
        type: "Value",
        label: "meaning",
        summary: "meaning matters",
        layer: "core",
        tier: "L1",
        certainty: "INFERRED",
        confidence: 0.7,
        evidenceCount: 2,
        status: "active",
        lastEvidenceAt: new Date().toISOString(),
      },
    ];
    const preview = buildConnectionPreview(nodes, null, trust);

    expect(preview.structuralSimilarity).toBeGreaterThan(0.5);
    expect(preview.idealConnectionPattern).toContain("호기심");
  });

  it("translates compatibility axes into bounded relationship scenarios", () => {
    const preview = buildConnectionPreview([], warmBehavior, trust);

    expect(preview.scenarioPreviews).toHaveLength(7);
    expect(preview.scenarioPreviews.map((scenario) => scenario.type)).toContain("repair_attempt");
    expect(preview.scenarioPreviews.map((scenario) => scenario.type)).toContain("misunderstanding");

    for (const scenario of preview.scenarioPreviews) {
      expect(scenario.likelyDynamic.length).toBeGreaterThan(10);
      expect(scenario.supportMove.length).toBeGreaterThan(10);
      expect(scenario.riskSignal.length).toBeGreaterThan(10);
      expect(scenario.confidence).toBeGreaterThanOrEqual(0);
      expect(scenario.confidence).toBeLessThanOrEqual(1);
      for (const value of Object.values(scenario.state)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    }
  });

  it("raises misunderstanding disengagement risk when conflict sensitivity is high", () => {
    const calmPreview = buildConnectionPreview([], warmBehavior, trust);
    const sensitivePreview = buildConnectionPreview([], sensitiveBehavior, trust);

    const calmMisunderstanding = calmPreview.scenarioPreviews.find((scenario) => scenario.type === "misunderstanding");
    const sensitiveMisunderstanding = sensitivePreview.scenarioPreviews.find((scenario) => scenario.type === "misunderstanding");

    expect(sensitiveMisunderstanding?.state.disengagementRisk).toBeGreaterThan(
      calmMisunderstanding?.state.disengagementRisk ?? 0,
    );
  });
});
