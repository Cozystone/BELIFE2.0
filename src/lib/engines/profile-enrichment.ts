import type {
  OntologyNode,
  OntologyNodeType,
  ProfileEnrichmentField,
  ProfileEnrichmentSuggestion,
  UserProfile,
} from "./types";
import { compactText } from "@/lib/utils";

export const profileEnrichmentDismissalTag = "profile-enrichment-dismissal";
const profileEnrichmentIdTagPrefix = "profile-enrichment-id:";

const fieldByNodeType: Partial<Record<OntologyNodeType, ProfileEnrichmentField>> = {
  Goal: "currentGoal",
  Value: "importantValue",
  Belief: "importantValue",
  EmotionPattern: "mainWorry",
  FrictionPattern: "mainWorry",
  EnergyPattern: "stressReaction",
  RecoveryHint: "stressReaction",
  GrowthTrajectory: "relationshipHope",
};

const titleByField: Record<ProfileEnrichmentField, string> = {
  mainWorry: "반복 걱정 신호",
  currentGoal: "현재 목표 신호",
  importantValue: "중요 가치 신호",
  stressReaction: "스트레스 반응 신호",
  emotionalClimate: "감정 날씨 신호",
  relationshipHope: "관계 기대 신호",
};

const promotableTypes = new Set<OntologyNodeType>([
  "Value",
  "Belief",
  "Goal",
  "EmotionPattern",
  "DecisionPattern",
  "FrictionPattern",
  "EnergyPattern",
  "GrowthTrajectory",
  "RecoveryHint",
]);

export function buildProfileEnrichmentSuggestions(input: {
  profile: UserProfile | null;
  nodes: OntologyNode[];
  limit?: number;
}): ProfileEnrichmentSuggestion[] {
  const suggestions: ProfileEnrichmentSuggestion[] = [];
  const sortedNodes = input.nodes
    .filter((node) => node.status === "active" && node.confidence >= 0.45)
    .sort((left, right) => right.confidence - left.confidence || right.evidenceCount - left.evidenceCount);

  for (const node of sortedNodes) {
    const targetField = fieldByNodeType[node.type];
    if (targetField && shouldSuggestField(input.profile, targetField, node)) {
      suggestions.push({
        id: suggestionId("field", targetField, node),
        kind: "profile_field",
        title: titleByField[targetField],
        question: "이 내용을 BELIFE 프로필에 더해둘까요?",
        detail: compactText(node.summary || node.label, 180),
        confidence: node.confidence,
        targetField,
        proposedValue: node.label,
        ontologyNode: node,
      });
    }

    if (promotableTypes.has(node.type) && node.tier !== "L1") {
      suggestions.push({
        id: suggestionId("promote", node.type, node),
        kind: "ontology_promotion",
        title: node.label,
        question: "이 신호를 안정적인 자기 구조로 기억해도 될까요?",
        detail: compactText(node.summary, 180),
        confidence: node.confidence,
        ontologyNode: node,
      });
    }
  }

  return dedupeSuggestions(suggestions).slice(0, input.limit ?? 3);
}

export function profileEnrichmentIdTag(id: string) {
  return `${profileEnrichmentIdTagPrefix}${id}`.slice(0, 220);
}

export function profileEnrichmentIdFromTag(tag: string) {
  return tag.startsWith(profileEnrichmentIdTagPrefix) ? tag.slice(profileEnrichmentIdTagPrefix.length) : null;
}

export function filterDismissedProfileEnrichmentSuggestions(
  suggestions: ProfileEnrichmentSuggestion[],
  dismissedIds: Iterable<string>,
) {
  const dismissed = new Set(dismissedIds);
  return suggestions.filter((suggestion) => !dismissed.has(suggestion.id));
}

export function findProfileEnrichmentSuggestion(input: {
  id: string;
  profile: UserProfile | null;
  nodes: OntologyNode[];
}) {
  return buildProfileEnrichmentSuggestions({ profile: input.profile, nodes: input.nodes, limit: 20 }).find(
    (suggestion) => suggestion.id === input.id,
  );
}

function shouldSuggestField(profile: UserProfile | null, field: ProfileEnrichmentField, node: OntologyNode) {
  const current = getProfileField(profile, field);
  if (!current) return true;
  const normalizedCurrent = normalize(current);
  const normalizedLabel = normalize(node.label);
  return !normalizedCurrent.includes(normalizedLabel) && node.confidence >= 0.62 && node.evidenceCount >= 2;
}

function getProfileField(profile: UserProfile | null, field: ProfileEnrichmentField) {
  if (!profile) return "";
  if (field === "relationshipHope") return profile.onboardingAnswers.relationshipHope?.trim() ?? "";
  return profile[field]?.trim() ?? "";
}

function suggestionId(prefix: string, target: string, node: OntologyNode) {
  return `${prefix}:${target}:${normalize(node.type)}:${normalize(node.label)}`.slice(0, 180);
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function dedupeSuggestions(suggestions: ProfileEnrichmentSuggestion[]) {
  const seen = new Set<string>();
  return suggestions.filter((suggestion) => {
    if (seen.has(suggestion.id)) return false;
    seen.add(suggestion.id);
    return true;
  });
}
