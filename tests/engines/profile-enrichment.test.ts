import { describe, expect, it } from "vitest";
import {
  buildProfileEnrichmentSuggestions,
  filterDismissedProfileEnrichmentSuggestions,
} from "@/lib/engines/profile-enrichment";
import type { OntologyNode, UserProfile } from "@/lib/engines/types";

const now = new Date().toISOString();

function profile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    userId: "u1",
    displayName: "Test",
    nickname: "Test",
    role: "",
    mainWorry: "",
    currentGoal: "",
    importantValue: "",
    stressReaction: "",
    emotionalClimate: "",
    preferredTone: "차분하게",
    onboardingAnswers: {},
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function node(overrides: Partial<OntologyNode>): OntologyNode {
  return {
    userId: "u1",
    type: "Goal",
    label: "의미 있는 서비스를 완성하려는 목표",
    summary: "목표를 분명히 하고 전진하려는 신호가 반복됩니다.",
    layer: "active",
    tier: "L2",
    certainty: "INFERRED",
    confidence: 0.7,
    evidenceCount: 2,
    status: "active",
    lastEvidenceAt: now,
    ...overrides,
  };
}

describe("buildProfileEnrichmentSuggestions", () => {
  it("suggests filling empty profile fields from ontology evidence", () => {
    const suggestions = buildProfileEnrichmentSuggestions({
      profile: profile(),
      nodes: [node({ tier: "L1", layer: "core" })],
    });

    expect(suggestions.some((suggestion) => suggestion.kind === "profile_field")).toBe(true);
    expect(suggestions[0].question).toContain("프로필");
  });

  it("suggests promoting repeated active nodes into stable self structure", () => {
    const suggestions = buildProfileEnrichmentSuggestions({
      profile: profile({ currentGoal: "기존 목표", mainWorry: "기존 걱정" }),
      nodes: [node({ type: "EmotionPattern", label: "불확실성에서 긴장이 올라옴" })],
    });

    const promotion = suggestions.find((suggestion) => suggestion.kind === "ontology_promotion");
    expect(promotion).toBeDefined();
    expect(promotion?.question).toContain("기억");
  });

  it("filters suggestions that the user has explicitly skipped", () => {
    const suggestions = buildProfileEnrichmentSuggestions({
      profile: profile(),
      nodes: [node({ tier: "L1", layer: "core" })],
    });
    const filtered = filterDismissedProfileEnrichmentSuggestions(suggestions, [suggestions[0].id]);

    expect(suggestions.length).toBeGreaterThan(0);
    expect(filtered).not.toContainEqual(suggestions[0]);
  });
});
