import { describe, expect, it } from "vitest";
import { calculateContradictionInverse, calculateDataTrust } from "@/lib/engines/data-trust";

describe("calculateDataTrust", () => {
  it("weights profile, sessions, ontology, behavior, contradiction, and recency", () => {
    const trust = calculateDataTrust({
      profileCompleteness: 1,
      validSessionDensity: 0.8,
      ontologyStability: 0.7,
      behaviorCoverage: 0.6,
      contradictionInverse: 0.9,
      recencyCoverage: 0.8,
    });

    expect(trust.score).toBeGreaterThan(75);
    expect(trust.label).toMatch(/clear|strong/);
  });

  it("keeps low evidence honest", () => {
    const trust = calculateDataTrust({
      profileCompleteness: 0.1,
      validSessionDensity: 0,
      ontologyStability: 0,
      behaviorCoverage: 0,
    });

    expect(trust.score).toBeLessThan(20);
    expect(trust.label).toBe("low");
  });

  it("lowers contradiction inverse when evidence is ambiguous", () => {
    const clear = calculateContradictionInverse(["EXTRACTED", "EXTRACTED", "INFERRED", "EXTRACTED"]);
    const ambiguous = calculateContradictionInverse(["AMBIGUOUS", "AMBIGUOUS", "INFERRED", "EXTRACTED"]);

    expect(clear).toBeGreaterThan(0.9);
    expect(ambiguous).toBeLessThan(clear);
    expect(ambiguous).toBeGreaterThanOrEqual(0);
  });
});
