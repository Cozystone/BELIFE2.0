import { describe, expect, it } from "vitest";
import { extractOntologyCandidates, filterOntologyView } from "@/lib/engines/ontology";

describe("ontology extraction and views", () => {
  it("promotes goal and value signals into core/active nodes", () => {
    const nodes = extractOntologyCandidates("u1", "내 목표는 의미 있는 일을 만드는 것이고 성장이라는 가치가 중요해.");

    expect(nodes.some((node) => node.type === "Goal")).toBe(true);
    expect(nodes.some((node) => node.type === "Value")).toBe(true);
    expect(filterOntologyView(nodes, "core").every((node) => node.tier === "L1")).toBe(true);
  });
});
