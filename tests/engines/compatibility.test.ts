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
  memoryQuality: 0.72,
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
    expect(preview.relationshipReport.compatibilityScore).toBeGreaterThan(0);
    expect(preview.relationshipReport.finalScore).toBeLessThanOrEqual(preview.relationshipReport.compatibilityScore);
    expect(preview.relationshipReport.hiddenEdgeStatus).toBe("latent");
    expect(preview.relationshipReport.axisInsights).toHaveLength(6);
    expect(preview.relationshipReport.axisInsights.map((axis) => axis.key)).toContain("repairPotential");
    expect(preview.hiddenEdge.status).toBe("latent");
    expect(preview.hiddenEdge.compatibility).toBe(preview.relationshipReport.compatibilityScore);
    expect(preview.hiddenEdge.confidence).toBe(preview.relationshipReport.confidence);
    expect(preview.hiddenEdge.edgeStrength).toBeGreaterThanOrEqual(0);
    expect(preview.hiddenEdge.edgeStrength).toBeLessThanOrEqual(1);
    expect(preview.hiddenEdge.modeScores.friendship).toBeGreaterThan(0);
    expect(preview.hiddenEdge.sharedReality).toBeGreaterThan(0);
    expect(preview.hiddenEdge.responsiveness).toBeGreaterThan(0);
    expect(preview.hiddenEdge.repair).toBe(preview.repairPotential);
  });

  it("translates compatibility axes into bounded relationship scenarios", () => {
    const preview = buildConnectionPreview([], warmBehavior, trust);

    expect(preview.scenarioPreviews).toHaveLength(9);
    expect(preview.scenarioPreviews.map((scenario) => scenario.type)).toContain("repair_attempt");
    expect(preview.scenarioPreviews.map((scenario) => scenario.type)).toContain("misunderstanding");
    expect(preview.scenarioPreviews.map((scenario) => scenario.type)).toContain("reselection");
    expect(preview.scenarioPreviews.map((scenario) => scenario.type)).toContain("longitudinal_drift");

    for (const scenario of preview.scenarioPreviews) {
      expect(scenario.likelyDynamic.length).toBeGreaterThan(10);
      expect(scenario.supportMove.length).toBeGreaterThan(10);
      expect(scenario.riskSignal.length).toBeGreaterThan(10);
      expect(scenario.confidence).toBeGreaterThanOrEqual(0);
      expect(scenario.confidence).toBeLessThanOrEqual(1);
      expect(scenario.simulation.iterations).toBe(7);
      expect(scenario.simulation.stability).toBeGreaterThanOrEqual(0);
      expect(scenario.simulation.stability).toBeLessThanOrEqual(1);
      expect(["narrow", "moderate", "wide"]).toContain(scenario.simulation.riskBand);
      for (const value of Object.values(scenario.state)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
      for (const simulatedState of [
        scenario.simulation.bestCase,
        scenario.simulation.likelyCase,
        scenario.simulation.riskCase,
      ]) {
        for (const value of Object.values(simulatedState)) {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it("surfaces evidence, blind spots, and next observation prompts for internal reports", () => {
    const preview = buildConnectionPreview([], null, { ...trust, score: 28, label: "low" });

    expect(preview.relationshipReport.confidenceLabel).toBe("early");
    expect(preview.relationshipReport.evidenceSignals.length).toBeGreaterThanOrEqual(3);
    expect(preview.relationshipReport.blindSpots.join(" ")).toContain("초기 프리뷰");
    expect(preview.relationshipReport.nextObservationPrompts).toHaveLength(3);
    expect(preview.relationshipReport.thesis).toContain("탐색 리포트");
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

  it("uses repair and complementarity signals for longer-horizon relationship scenarios", () => {
    const preview = buildConnectionPreview([], warmBehavior, trust);
    const reselection = preview.scenarioPreviews.find((scenario) => scenario.type === "reselection");
    const drift = preview.scenarioPreviews.find((scenario) => scenario.type === "longitudinal_drift");

    expect(reselection?.title).toBe("Reselection");
    expect(reselection?.state.commitmentTendency).toBeGreaterThan(0.3);
    expect(reselection?.simulation.bestCase.trust).toBeGreaterThanOrEqual(reselection?.simulation.riskCase.trust ?? 1);
    expect(reselection?.supportMove).toContain("계속 남기고 싶은 리듬");
    expect(drift?.title).toBe("Longitudinal Drift");
    expect(drift?.state.repairWillingness).toBeGreaterThan(0.3);
    expect(drift?.simulation.riskCase.disengagementRisk).toBeGreaterThanOrEqual(drift?.simulation.bestCase.disengagementRisk ?? 1);
    expect(drift?.riskSignal).toContain("drift 신호");
  });

  it("uses the previous hidden edge as persistence for incremental graph updates", () => {
    const firstPreview = buildConnectionPreview([], warmBehavior, trust);
    const nextPreview = buildConnectionPreview([], warmBehavior, trust, firstPreview);

    expect(nextPreview.hiddenEdge.mechanisms.persistence).toBe(firstPreview.hiddenEdge.edgeStrength);
    expect(nextPreview.hiddenEdge.mechanisms.homophily).toBe(nextPreview.structuralSimilarity);
    expect(nextPreview.hiddenEdge.mechanisms.reciprocity).toBe(nextPreview.hiddenEdge.responsiveness);
    expect(nextPreview.hiddenEdge.mechanisms.drift).toBeGreaterThanOrEqual(0);
    expect(nextPreview.hiddenEdge.mechanisms.conflictToxicity).toBeGreaterThanOrEqual(0);
  });
});
