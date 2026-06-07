import { describe, expect, it } from "vitest";
import { buildMemoryHealthReport } from "@/lib/engines/memory-health";
import type { BelifeMemoryInventory, ConversationMessage, MemoryChunk, OntologyNode } from "@/lib/engines/types";

const now = "2026-06-08T00:00:00.000Z";

const inventory: BelifeMemoryInventory = {
  counts: {
    conversations: 2,
    messages: 7,
    memoryChunks: 4,
    ontologyNodes: 2,
    ontologyEdges: 1,
    stateEstimates: 2,
    behaviorSnapshots: 1,
    dataTrustSnapshots: 1,
    connectionPreviews: 0,
  },
  evidenceMix: {
    extracted: 2,
    inferred: 2,
    ambiguous: 1,
  },
  ontologyLayers: {
    core: 1,
    active: 1,
    archive: 0,
  },
  latest: {
    memoryAt: "2026-06-07T00:00:00.000Z",
    messageAt: "2026-06-07T00:00:00.000Z",
  },
};

function chunk(input: Partial<MemoryChunk> & { content: string }): MemoryChunk {
  return {
    id: input.id ?? input.content,
    userId: "u1",
    content: input.content,
    kind: input.kind ?? "semantic",
    salience: input.salience ?? 0.68,
    evidenceType: input.evidenceType ?? "EXTRACTED",
    tags: input.tags ?? [],
    createdAt: input.createdAt ?? "2026-06-07T00:00:00.000Z",
  };
}

function node(input: Partial<OntologyNode> & { label: string }): OntologyNode {
  return {
    id: input.id ?? input.label,
    userId: "u1",
    type: input.type ?? "EmotionPattern",
    label: input.label,
    summary: input.summary ?? "A pattern BELIFE is testing.",
    layer: input.layer ?? "active",
    tier: input.tier ?? "L2",
    certainty: input.certainty ?? "INFERRED",
    confidence: input.confidence ?? 0.56,
    evidenceCount: input.evidenceCount ?? 1,
    status: input.status ?? "active",
    lastEvidenceAt: input.lastEvidenceAt ?? "2026-06-07T00:00:00.000Z",
  };
}

function message(content: string): ConversationMessage {
  return {
    id: content,
    conversationId: "c1",
    userId: "u1",
    role: "user",
    content,
    source: "text",
    createdAt: "2026-06-07T00:00:00.000Z",
  };
}

describe("memory health", () => {
  it("flags corrections, ambiguous evidence, stale memory, and recent episodic anchors", () => {
    const report = buildMemoryHealthReport({
      inventory,
      now,
      messages: [message("I need BELIFE to remember the corrected version.")],
      chunks: [
        chunk({
          content: "User-confirmed BELIFE memory correction. Correction: I value slow evidence-based interpretation.",
          kind: "correction",
          tags: ["user-correction"],
          salience: 0.92,
        }),
        chunk({
          content: "The user might avoid every hard conversation.",
          evidenceType: "AMBIGUOUS",
          tags: ["avoidance"],
          salience: 0.78,
        }),
        chunk({
          content: "Old inferred note that has not been confirmed recently.",
          evidenceType: "INFERRED",
          salience: 0.3,
          createdAt: "2026-02-01T00:00:00.000Z",
        }),
      ],
      nodes: [
        node({ label: "Slow evidence-based interpretation", certainty: "EXTRACTED", confidence: 0.78, tier: "L1" }),
        node({
          label: "Avoids hard conversation",
          certainty: "AMBIGUOUS",
          confidence: 0.32,
          lastEvidenceAt: "2026-02-01T00:00:00.000Z",
        }),
      ],
    });

    expect(report.guardrail).toContain("append-only");
    expect(report.evidenceBalance.correctionCount).toBe(1);
    expect(report.contradictionWatchlist.some((item) => item.kind === "correction")).toBe(true);
    expect(report.contradictionWatchlist.some((item) => item.kind === "contradiction")).toBe(true);
    expect(report.forgettingCandidates.length).toBeGreaterThan(0);
    expect(report.episodicAnchors.length).toBeGreaterThan(0);
    expect(report.nextActions.length).toBeGreaterThan(0);
    expect(report.score).toBeGreaterThanOrEqual(0);
    expect(report.score).toBeLessThanOrEqual(1);
  });

  it("stays cautious when no memory evidence exists", () => {
    const report = buildMemoryHealthReport({
      inventory: {
        ...inventory,
        counts: { ...inventory.counts, memoryChunks: 0, ontologyNodes: 0, messages: 0 },
        latest: {},
      },
      chunks: [],
      nodes: [],
      messages: [],
      now,
    });

    expect(report.label).toBe("thin");
    expect(report.freshness.score).toBeLessThan(0.2);
    expect(report.summary).toContain("early");
    expect(report.nextActions.join(" ")).toContain("ordinary conversations");
  });
});
