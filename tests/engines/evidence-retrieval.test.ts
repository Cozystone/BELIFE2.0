import { describe, expect, it } from "vitest";
import { rankMemoryEvidence } from "@/lib/engines/evidence-retrieval";
import type { ConversationMessage, MemoryChunk, OntologyNode } from "@/lib/engines/types";

const now = new Date().toISOString();

function chunk(input: Partial<MemoryChunk> & { content: string }): MemoryChunk {
  return {
    id: input.id ?? input.content,
    userId: "user-1",
    content: input.content,
    kind: input.kind ?? "semantic",
    salience: input.salience ?? 0.7,
    evidenceType: input.evidenceType ?? "EXTRACTED",
    tags: input.tags ?? [],
    createdAt: input.createdAt ?? now,
  };
}

function node(input: Partial<OntologyNode> & { label: string; summary: string }): OntologyNode {
  return {
    id: input.id ?? input.label,
    userId: "user-1",
    type: input.type ?? "EmotionPattern",
    label: input.label,
    summary: input.summary,
    layer: input.layer ?? "active",
    tier: input.tier ?? "L2",
    certainty: input.certainty ?? "INFERRED",
    confidence: input.confidence ?? 0.66,
    evidenceCount: input.evidenceCount ?? 2,
    status: "active",
    lastEvidenceAt: input.lastEvidenceAt ?? now,
  };
}

function message(content: string): ConversationMessage {
  return {
    id: content,
    conversationId: "conversation-1",
    userId: "user-1",
    role: "user",
    content,
    source: "text",
    createdAt: now,
  };
}

describe("rankMemoryEvidence", () => {
  it("prioritizes relevant memory chunks and keeps provenance", () => {
    const evidence = rankMemoryEvidence({
      query: "I feel unseen and become analytical instead of asking for care",
      chunks: [
        chunk({
          content: "When the user feels unseen, they become overly analytical instead of asking for care.",
          tags: ["relationship", "care"],
          salience: 0.86,
        }),
        chunk({
          content: "The user likes concise product roadmaps.",
          salience: 0.7,
        }),
      ],
      nodes: [
        node({
          label: "Care request freezes into analysis",
          summary: "Relational stress can turn into analytical distance.",
        }),
      ],
      messages: [message("I feel unseen in relationships.")],
      limit: 4,
    });

    expect(evidence[0]).toMatchObject({
      source: "memory",
      evidenceType: "EXTRACTED",
    });
    expect(evidence[0].detail).toContain("unseen");
    expect(evidence.some((item) => item.source === "ontology")).toBe(true);
  });

  it("falls back to strong recent evidence when query overlap is limited", () => {
    const evidence = rankMemoryEvidence({
      query: "what should I notice next",
      chunks: [
        chunk({
          content: "The user repeatedly links burnout to isolation.",
          salience: 0.92,
          evidenceType: "INFERRED",
        }),
      ],
      nodes: [],
      messages: [],
      limit: 2,
    });

    expect(evidence).toHaveLength(1);
    expect(evidence[0]).toMatchObject({
      source: "memory",
      label: "semantic memory",
    });
  });
});
