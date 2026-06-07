import { describe, expect, it } from "vitest";
import { buildConnectionPreview } from "@/lib/engines/compatibility";
import type { DataTrustScore, OntologyNode } from "@/lib/engines/types";

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
});
