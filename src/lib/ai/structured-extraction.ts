import { z } from "zod";
import { ollamaJson } from "@/lib/ai/ollama";
import { estimateBehavior } from "@/lib/engines/behavior";
import { estimateMentalState } from "@/lib/engines/mental-state";
import { createMemoryChunks, extractOntologyCandidates } from "@/lib/engines/ontology";
import type {
  BehaviorSnapshot,
  EvidenceType,
  ImportanceTier,
  MemoryChunk,
  MentalStateEstimate,
  MessageSource,
  OntologyLayer,
  OntologyNode,
} from "@/lib/engines/types";
import { clamp, compactText, isoNow } from "@/lib/utils";

const ontologyNodeTypes = [
  "Value",
  "Belief",
  "Goal",
  "EmotionPattern",
  "DecisionPattern",
  "FrictionPattern",
  "EnergyPattern",
  "GrowthTrajectory",
  "RiskSignal",
  "RecoveryHint",
  "CognitiveBiasCandidate",
] as const;

const evidenceTypes = ["EXTRACTED", "INFERRED", "AMBIGUOUS"] as const;
const tiers = ["L1", "L2", "L3"] as const;
const memoryKinds = ["semantic", "behavior", "state", "relationship"] as const;

const rawExtractionSchema = z.object({
  memoryChunks: z
    .array(
      z.object({
        content: z.string().min(1).max(420),
        kind: z.enum(memoryKinds).optional(),
        salience: z.number().min(0).max(1).optional(),
        evidenceType: z.enum(evidenceTypes).optional(),
        tags: z.array(z.string().min(1).max(32)).max(8).optional(),
      }),
    )
    .max(6)
    .default([]),
  ontologyCandidates: z
    .array(
      z.object({
        type: z.enum(ontologyNodeTypes),
        label: z.string().min(1).max(80),
        summary: z.string().min(1).max(220),
        tier: z.enum(tiers).optional(),
        certainty: z.enum(evidenceTypes).optional(),
        confidence: z.number().min(0).max(1).optional(),
      }),
    )
    .max(8)
    .default([]),
  mentalState: z
    .object({
      stressLoad: z.number().min(0).max(1).optional(),
      burnoutRisk: z.number().min(0).max(1).optional(),
      rumination: z.number().min(0).max(1).optional(),
      emotionalVolatility: z.number().min(0).max(1).optional(),
      motivation: z.number().min(0).max(1).optional(),
      socialWithdrawal: z.number().min(0).max(1).optional(),
      supportNeed: z.number().min(0).max(1).optional(),
      cognitiveDistortionRisk: z.number().min(0).max(1).optional(),
      motivationalCollapseRisk: z.number().min(0).max(1).optional(),
      baselineDeviation: z.number().min(0).max(1).optional(),
      abstentionRisk: z.number().min(0).max(1).optional(),
      confidence: z.number().min(0).max(1).optional(),
      summary: z.string().min(1).max(260).optional(),
      drivers: z.array(z.string().min(1).max(80)).max(6).optional(),
    })
    .default({}),
  behavior: z
    .object({
      questionFrequency: z.number().min(0).max(1).optional(),
      directness: z.number().min(0).max(1).optional(),
      disclosureSpeed: z.number().min(0).max(1).optional(),
      empathyOrientation: z.number().min(0).max(1).optional(),
      solutionOrientation: z.number().min(0).max(1).optional(),
      abstraction: z.number().min(0).max(1).optional(),
      conflictSensitivity: z.number().min(0).max(1).optional(),
      pacing: z.number().min(0).max(1).optional(),
      warmth: z.number().min(0).max(1).optional(),
      confidence: z.number().min(0).max(1).optional(),
      summary: z.string().min(1).max(260).optional(),
    })
    .default({}),
});

type RawExtraction = z.infer<typeof rawExtractionSchema>;

export interface StructuredExtraction {
  chunks: MemoryChunk[];
  nodes: OntologyNode[];
  state: MentalStateEstimate;
  behavior: BehaviorSnapshot;
  usedAi: boolean;
}

export async function buildStructuredExtraction(input: {
  userId: string;
  text: string;
  messageId?: string;
  source?: MessageSource | "onboarding" | "correction";
  previousState?: MentalStateEstimate | null;
  previousBehavior?: BehaviorSnapshot | null;
}): Promise<StructuredExtraction> {
  const fallbackChunks = createMemoryChunks(input.userId, input.text, input.messageId);
  const fallbackNodes = extractOntologyCandidates(input.userId, input.text);
  const fallbackState = estimateMentalState(input.text, input.previousState);
  const fallbackBehavior = estimateBehavior(input.text, input.previousBehavior);
  const fallback = toRawExtraction(fallbackChunks, fallbackNodes, fallbackState, fallbackBehavior);

  const raw = await ollamaJson<unknown>(
    {
      temperature: 0.12,
      system: "You extract structured personal intelligence for BELIFE. Return only valid JSON. Do not diagnose, moralize, or invent unsupported facts.",
      prompt: buildExtractionPrompt(input.text, input.source ?? "text", input.previousState, input.previousBehavior),
    },
    fallback,
  );

  const parsed = rawExtractionSchema.safeParse(raw);
  const extraction = parsed.success ? parsed.data : fallback;
  const usedAi = parsed.success && raw !== fallback;

  const chunks = mergeChunks([
    ...fallbackChunks,
    ...extraction.memoryChunks.map((chunk) => ({
      userId: input.userId,
      messageId: input.messageId,
      content: compactText(chunk.content, 420),
      kind: chunk.kind ?? "semantic",
      salience: clamp(chunk.salience ?? 0.5),
      evidenceType: chunk.evidenceType ?? "EXTRACTED",
      tags: normalizeTags(chunk.tags ?? ["conversation"]),
    })),
  ]);

  const nodes = mergeNodes([
    ...fallbackNodes,
    ...extraction.ontologyCandidates.map((node) => toOntologyNode(input.userId, node)),
  ]);

  return {
    chunks,
    nodes,
    state: normalizeState(fallbackState, extraction.mentalState),
    behavior: normalizeBehavior(fallbackBehavior, extraction.behavior),
    usedAi,
  };
}

function buildExtractionPrompt(
  text: string,
  source: MessageSource | "onboarding" | "correction",
  previousState?: MentalStateEstimate | null,
  previousBehavior?: BehaviorSnapshot | null,
) {
  return `Extract structured BELIFE signals from this Korean-first user input.

Source: ${source}
Previous state summary: ${previousState?.summary ?? "none"}
Previous behavior summary: ${previousBehavior?.summary ?? "none"}

Input:
${text}

Return JSON with this exact top-level shape:
{
  "memoryChunks": [{"content": "short attributable fact", "kind": "semantic|behavior|state|relationship", "salience": 0.0, "evidenceType": "EXTRACTED|INFERRED|AMBIGUOUS", "tags": ["tag"]}],
  "ontologyCandidates": [{"type": "Value|Belief|Goal|EmotionPattern|DecisionPattern|FrictionPattern|EnergyPattern|GrowthTrajectory|RiskSignal|RecoveryHint|CognitiveBiasCandidate", "label": "short Korean label", "summary": "evidence-based Korean summary", "tier": "L1|L2|L3", "certainty": "EXTRACTED|INFERRED|AMBIGUOUS", "confidence": 0.0}],
  "mentalState": {"stressLoad": 0.0, "burnoutRisk": 0.0, "rumination": 0.0, "emotionalVolatility": 0.0, "motivation": 0.0, "socialWithdrawal": 0.0, "supportNeed": 0.0, "cognitiveDistortionRisk": 0.0, "motivationalCollapseRisk": 0.0, "baselineDeviation": 0.0, "abstentionRisk": 0.0, "confidence": 0.0, "summary": "non-clinical Korean interpretation", "drivers": ["driver"]},
  "behavior": {"questionFrequency": 0.0, "directness": 0.0, "disclosureSpeed": 0.0, "empathyOrientation": 0.0, "solutionOrientation": 0.0, "abstraction": 0.0, "conflictSensitivity": 0.0, "pacing": 0.0, "warmth": 0.0, "confidence": 0.0, "summary": "Korean behavior summary"}
}

Rules:
- Use only evidence in the input and previous summaries.
- Prefer uncertainty over overclaiming.
- Never claim diagnosis, therapy, or deterministic relationship prediction.
- Keep labels compact and useful for a self ontology graph.`;
}

function toRawExtraction(
  chunks: MemoryChunk[],
  nodes: OntologyNode[],
  state: MentalStateEstimate,
  behavior: BehaviorSnapshot,
): RawExtraction {
  return {
    memoryChunks: chunks.map((chunk) => ({
      content: chunk.content,
      kind: chunk.kind === "raw" || chunk.kind === "correction" ? "semantic" : chunk.kind,
      salience: chunk.salience,
      evidenceType: chunk.evidenceType,
      tags: chunk.tags,
    })),
    ontologyCandidates: nodes.map((node) => ({
      type: node.type,
      label: node.label,
      summary: node.summary,
      tier: node.tier,
      certainty: node.certainty,
      confidence: node.confidence,
    })),
    mentalState: state,
    behavior,
  };
}

function toOntologyNode(userId: string, node: RawExtraction["ontologyCandidates"][number]): OntologyNode {
  const tier = node.tier ?? "L2";
  return {
    userId,
    type: node.type,
    label: compactText(node.label, 80),
    summary: compactText(node.summary, 220),
    layer: tierToLayer(tier),
    tier,
    certainty: node.certainty ?? "INFERRED",
    confidence: clamp(node.confidence ?? 0.52),
    evidenceCount: 1,
    status: "active",
    lastEvidenceAt: isoNow(),
  };
}

function tierToLayer(tier: ImportanceTier): OntologyLayer {
  return tier === "L1" ? "core" : "active";
}

function mergeChunks(chunks: MemoryChunk[]) {
  const seen = new Set<string>();
  return chunks.filter((chunk) => {
    const key = compactText(chunk.content, 120).toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mergeNodes(nodes: OntologyNode[]) {
  const byKey = new Map<string, OntologyNode>();
  for (const node of nodes) {
    const key = `${node.type}:${node.label}`;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, node);
      continue;
    }
    byKey.set(key, {
      ...existing,
      summary: existing.summary.length >= node.summary.length ? existing.summary : node.summary,
      confidence: Math.max(existing.confidence, node.confidence),
      evidenceCount: Math.max(existing.evidenceCount, node.evidenceCount),
      certainty: strongerCertainty(existing.certainty, node.certainty),
    });
  }
  return [...byKey.values()];
}

function strongerCertainty(left: EvidenceType, right: EvidenceType): EvidenceType {
  const rank: Record<EvidenceType, number> = { AMBIGUOUS: 0, INFERRED: 1, EXTRACTED: 2 };
  return rank[right] > rank[left] ? right : left;
}

function normalizeTags(tags: string[]) {
  const normalized = tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean);
  return [...new Set(normalized)].slice(0, 8);
}

function normalizeState(
  fallback: MentalStateEstimate,
  state: RawExtraction["mentalState"],
): MentalStateEstimate {
  return {
    stressLoad: clamp(state.stressLoad ?? fallback.stressLoad),
    burnoutRisk: clamp(state.burnoutRisk ?? fallback.burnoutRisk),
    rumination: clamp(state.rumination ?? fallback.rumination),
    emotionalVolatility: clamp(state.emotionalVolatility ?? fallback.emotionalVolatility),
    motivation: clamp(state.motivation ?? fallback.motivation),
    socialWithdrawal: clamp(state.socialWithdrawal ?? fallback.socialWithdrawal),
    supportNeed: clamp(state.supportNeed ?? fallback.supportNeed),
    cognitiveDistortionRisk: clamp(state.cognitiveDistortionRisk ?? fallback.cognitiveDistortionRisk),
    motivationalCollapseRisk: clamp(state.motivationalCollapseRisk ?? fallback.motivationalCollapseRisk),
    baselineDeviation: clamp(state.baselineDeviation ?? fallback.baselineDeviation),
    abstentionRisk: clamp(state.abstentionRisk ?? fallback.abstentionRisk),
    confidence: clamp(state.confidence ?? fallback.confidence),
    summary: compactText(state.summary ?? fallback.summary, 260),
    drivers: (state.drivers?.length ? state.drivers : fallback.drivers).slice(0, 6),
    createdAt: isoNow(),
  };
}

function normalizeBehavior(
  fallback: BehaviorSnapshot,
  behavior: RawExtraction["behavior"],
): BehaviorSnapshot {
  return {
    questionFrequency: clamp(behavior.questionFrequency ?? fallback.questionFrequency),
    directness: clamp(behavior.directness ?? fallback.directness),
    disclosureSpeed: clamp(behavior.disclosureSpeed ?? fallback.disclosureSpeed),
    empathyOrientation: clamp(behavior.empathyOrientation ?? fallback.empathyOrientation),
    solutionOrientation: clamp(behavior.solutionOrientation ?? fallback.solutionOrientation),
    abstraction: clamp(behavior.abstraction ?? fallback.abstraction),
    conflictSensitivity: clamp(behavior.conflictSensitivity ?? fallback.conflictSensitivity),
    pacing: clamp(behavior.pacing ?? fallback.pacing),
    warmth: clamp(behavior.warmth ?? fallback.warmth),
    confidence: clamp(behavior.confidence ?? fallback.confidence),
    summary: compactText(behavior.summary ?? fallback.summary, 260),
    createdAt: isoNow(),
  };
}
