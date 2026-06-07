import { describe, expect, it } from "vitest";
import {
  applyOntologyMemoryPolicy,
  buildOntologyGraph,
  extractOntologyCandidates,
  filterOntologyView,
  mergeOntologyEvidence,
} from "@/lib/engines/ontology";
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

  it("merges repeated evidence while lowering confidence for contradiction candidates", () => {
    const now = new Date().toISOString();
    const existing: OntologyNode = {
      userId: "u1",
      type: "Value",
      label: "안정감",
      summary: "안정감을 중요하게 여깁니다.",
      layer: "core",
      tier: "L1",
      certainty: "EXTRACTED",
      confidence: 0.78,
      evidenceCount: 2,
      status: "active",
      lastEvidenceAt: now,
    };
    const repeated = mergeOntologyEvidence(existing, {
      ...existing,
      summary: "결정과 관계에서 안정감을 반복해서 중요하게 말합니다.",
      confidence: 0.72,
      evidenceCount: 1,
    });
    const contradicted = mergeOntologyEvidence(repeated, {
      ...existing,
      summary: "이제는 안정감이 더 이상 가장 중요한 기준은 아니라고 말했습니다.",
      certainty: "AMBIGUOUS",
      confidence: 0.32,
      evidenceCount: 1,
      lastEvidenceAt: "2026-01-02T00:00:00.000Z",
    });

    expect(repeated.evidenceCount).toBeGreaterThan(existing.evidenceCount);
    expect(repeated.confidence).toBeGreaterThan(existing.confidence);
    expect(contradicted.certainty).toBe("AMBIGUOUS");
    expect(contradicted.confidence).toBeLessThan(repeated.confidence);
    expect(contradicted.status).toBe("active");
  });

  it("archives stale weak ontology nodes without archiving core identity", () => {
    const oldDate = "2025-01-01T00:00:00.000Z";
    const nodes: OntologyNode[] = [
      {
        userId: "u1",
        type: "RecoveryHint",
        label: "잠깐 쉬기",
        summary: "한 번 나온 약한 회복 단서입니다.",
        layer: "active",
        tier: "L3",
        certainty: "AMBIGUOUS",
        confidence: 0.33,
        evidenceCount: 1,
        status: "active",
        lastEvidenceAt: oldDate,
      },
      {
        userId: "u1",
        type: "Value",
        label: "정직함",
        summary: "핵심 가치입니다.",
        layer: "core",
        tier: "L1",
        certainty: "EXTRACTED",
        confidence: 0.72,
        evidenceCount: 4,
        status: "active",
        lastEvidenceAt: oldDate,
      },
    ];

    const reconciled = applyOntologyMemoryPolicy(nodes, "2026-01-01T00:00:00.000Z");

    expect(reconciled[0].status).toBe("archived");
    expect(reconciled[0].layer).toBe("archive");
    expect(reconciled[1].status).toBe("active");
    expect(filterOntologyView(reconciled, "full")).toHaveLength(1);
  });
});
