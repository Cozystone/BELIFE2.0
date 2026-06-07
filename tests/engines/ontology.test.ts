import { describe, expect, it } from "vitest";
import { buildOntologyGraph, extractOntologyCandidates, filterOntologyView } from "@/lib/engines/ontology";
import type { OntologyNode } from "@/lib/engines/types";

describe("ontology extraction and views", () => {
  it("promotes goal and value signals into core/active nodes", () => {
    const nodes = extractOntologyCandidates("u1", "내 목표는 의미 있는 일을 만드는 것이고 성장이라는 가치가 중요해.");

    expect(nodes.some((node) => node.type === "Goal")).toBe(true);
    expect(nodes.some((node) => node.type === "Value")).toBe(true);
    expect(filterOntologyView(nodes, "core").every((node) => node.tier === "L1")).toBe(true);
  });

  it("derives explainable ontology graph edges from node types", () => {
    const now = new Date().toISOString();
    const base = {
      userId: "u1",
      layer: "core",
      tier: "L1",
      certainty: "EXTRACTED",
      confidence: 0.74,
      evidenceCount: 3,
      status: "active",
      lastEvidenceAt: now,
    } satisfies Partial<OntologyNode>;
    const nodes: OntologyNode[] = [
      {
        ...base,
        id: "value-1",
        type: "Value",
        label: "정직함",
        summary: "결정과 관계에서 정직함을 중시합니다.",
      } as OntologyNode,
      {
        ...base,
        id: "goal-1",
        type: "Goal",
        label: "지속 가능한 관계",
        summary: "오래 유지 가능한 관계를 원합니다.",
      } as OntologyNode,
      {
        ...base,
        id: "decision-1",
        type: "DecisionPattern",
        label: "선택 전 구조화",
        summary: "결정 전에 기준을 분리해 봅니다.",
      } as OntologyNode,
    ];

    const graph = buildOntologyGraph(nodes);

    expect(graph.nodes).toHaveLength(3);
    expect(graph.edges.length).toBeGreaterThan(0);
    expect(graph.edges.some((edge) => edge.sourceNodeId === "value-1" && edge.relation === "anchors")).toBe(true);
    expect(graph.edges.every((edge) => edge.confidence >= 0 && edge.confidence <= 1)).toBe(true);
    expect(graph.summary).toContain("해석 가능한 연결");
  });
});
