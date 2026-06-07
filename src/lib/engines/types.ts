export type EvidenceType = "EXTRACTED" | "INFERRED" | "AMBIGUOUS";
export type OntologyLayer = "core" | "active" | "archive";
export type ImportanceTier = "L1" | "L2" | "L3";
export type OntologyNodeType =
  | "Value"
  | "Belief"
  | "Goal"
  | "EmotionPattern"
  | "DecisionPattern"
  | "FrictionPattern"
  | "EnergyPattern"
  | "GrowthTrajectory"
  | "RiskSignal"
  | "RecoveryHint"
  | "CognitiveBiasCandidate";

export type MessageRole = "user" | "assistant" | "system";
export type MessageSource = "text" | "voice" | "system";

export interface BelifeUser {
  id: string;
  name: string;
  email?: string;
  isDemo: boolean;
  authProvider: "clerk" | "native" | "demo";
}

export interface UserProfile {
  userId: string;
  displayName: string;
  nickname: string;
  role: string;
  mainWorry: string;
  currentGoal: string;
  importantValue: string;
  stressReaction: string;
  emotionalClimate: string;
  preferredTone: string;
  onboardingAnswers: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationMessage {
  id: string;
  conversationId: string;
  userId: string;
  role: MessageRole;
  content: string;
  source: MessageSource;
  createdAt: string;
}

export interface MemoryChunk {
  id?: string;
  userId: string;
  messageId?: string;
  content: string;
  kind: "raw" | "semantic" | "behavior" | "state" | "relationship";
  salience: number;
  evidenceType: EvidenceType;
  tags: string[];
  createdAt?: string;
}

export interface OntologyNode {
  id?: string;
  userId: string;
  type: OntologyNodeType;
  label: string;
  summary: string;
  layer: OntologyLayer;
  tier: ImportanceTier;
  certainty: EvidenceType;
  confidence: number;
  evidenceCount: number;
  status: "active" | "archived";
  lastEvidenceAt: string;
}

export interface OntologyEdge {
  id?: string;
  userId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relation: string;
  certainty: EvidenceType;
  confidence: number;
}

export type OntologyGraphRelation =
  | "anchors"
  | "drives"
  | "shapes"
  | "amplifies"
  | "needs_recovery"
  | "orients_connection"
  | "co_occurs";

export interface OntologyGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relation: OntologyGraphRelation;
  label: string;
  certainty: EvidenceType;
  confidence: number;
  explanation: string;
}

export interface OntologyGraphModel {
  generatedAt: string;
  nodes: OntologyNode[];
  edges: OntologyGraphEdge[];
  summary: string;
}

export interface MentalStateEstimate {
  stressLoad: number;
  burnoutRisk: number;
  rumination: number;
  emotionalVolatility: number;
  motivation: number;
  socialWithdrawal: number;
  supportNeed: number;
  confidence: number;
  summary: string;
  drivers: string[];
  createdAt: string;
}

export type MentalStateTrendMetric =
  | "stressLoad"
  | "burnoutRisk"
  | "rumination"
  | "emotionalVolatility"
  | "motivation"
  | "socialWithdrawal"
  | "supportNeed";

export type MentalStateTrendDeltas = Record<MentalStateTrendMetric, number>;

export interface MentalStateHistoryReport {
  generatedAt: string;
  current: MentalStateEstimate | null;
  previous: MentalStateEstimate | null;
  deltas: MentalStateTrendDeltas;
  directionSummary: string;
  items: MentalStateEstimate[];
}

export interface BehaviorSnapshot {
  questionFrequency: number;
  directness: number;
  disclosureSpeed: number;
  empathyOrientation: number;
  solutionOrientation: number;
  abstraction: number;
  conflictSensitivity: number;
  pacing: number;
  warmth: number;
  confidence: number;
  summary: string;
  createdAt: string;
}

export interface DataTrustScore {
  score: number;
  label: "low" | "building" | "clear" | "strong";
  profileCompleteness: number;
  validSessionDensity: number;
  ontologyStability: number;
  behaviorCoverage: number;
  contradictionInverse: number;
  recencyCoverage: number;
  explanation: string;
  createdAt: string;
}

export interface BelifeMemoryInventory {
  counts: {
    conversations: number;
    messages: number;
    memoryChunks: number;
    ontologyNodes: number;
    stateEstimates: number;
    behaviorSnapshots: number;
    dataTrustSnapshots: number;
    connectionPreviews: number;
  };
  evidenceMix: {
    extracted: number;
    inferred: number;
    ambiguous: number;
  };
  ontologyLayers: {
    core: number;
    active: number;
    archive: number;
  };
  latest: {
    messageAt?: string;
    memoryAt?: string;
    ontologyEvidenceAt?: string;
    stateAt?: string;
    behaviorAt?: string;
    dataTrustAt?: string;
    connectionPreviewAt?: string;
  };
}

export interface BelifeDataExport {
  schemaVersion: 1;
  exportedAt: string;
  userId: string;
  inventory: BelifeMemoryInventory;
  profile: UserProfile | null;
  conversations: Record<string, unknown>[];
  messages: ConversationMessage[];
  memoryChunks: Record<string, unknown>[];
  ontologyNodes: OntologyNode[];
  stateEstimates: MentalStateEstimate[];
  behaviorSnapshots: Record<string, unknown>[];
  dataTrustSnapshots: Record<string, unknown>[];
  connectionPreviews: Record<string, unknown>[];
}

export type BelifeMemoryTimelineKind = "message" | "memory" | "ontology" | "state" | "behavior";

export interface BelifeMemoryTimelineItem {
  id: string;
  kind: BelifeMemoryTimelineKind;
  title: string;
  body: string;
  createdAt: string;
  evidenceType?: EvidenceType;
  confidence?: number;
  salience?: number;
  source?: string;
  tags: string[];
}

export interface BelifeMemoryTimeline {
  generatedAt: string;
  items: BelifeMemoryTimelineItem[];
}

export type ConnectionScenarioType =
  | "first_contact"
  | "light_disagreement"
  | "emotional_vulnerability"
  | "pressure"
  | "misunderstanding"
  | "repair_attempt"
  | "collaboration";

export interface ConnectionScenarioState {
  trust: number;
  emotionalSafety: number;
  irritation: number;
  curiosity: number;
  reciprocity: number;
  openness: number;
  repairWillingness: number;
  disengagementRisk: number;
  commitmentTendency: number;
}

export interface ConnectionScenarioPreview {
  type: ConnectionScenarioType;
  title: string;
  likelyDynamic: string;
  supportMove: string;
  riskSignal: string;
  state: ConnectionScenarioState;
  confidence: number;
}

export type ConnectionAxisKey =
  | "structuralSimilarity"
  | "complementarity"
  | "dialogueCompatibility"
  | "conflictCompatibility"
  | "repairPotential"
  | "emotionalSafety";

export interface ConnectionAxisInsight {
  key: ConnectionAxisKey;
  label: string;
  score: number;
  level: "low" | "building" | "clear" | "strong";
  interpretation: string;
  evidence: string;
  nextObservation: string;
}

export interface ConnectionRelationshipReport {
  compatibilityScore: number;
  finalScore: number;
  confidence: number;
  confidenceLabel: "early" | "building" | "usable" | "strong";
  hiddenEdgeStatus: "latent";
  thesis: string;
  axisInsights: ConnectionAxisInsight[];
  evidenceSignals: string[];
  blindSpots: string[];
  nextObservationPrompts: string[];
}

export interface CompatibilityAxes {
  structuralSimilarity: number;
  complementarity: number;
  dialogueCompatibility: number;
  conflictCompatibility: number;
  repairPotential: number;
  emotionalSafety: number;
  confidence: number;
  summary: string;
  comfortSignals: string[];
  tensionSignals: string[];
  idealConnectionPattern: string;
  riskyConnectionPattern: string;
  scenarioPreviews: ConnectionScenarioPreview[];
  relationshipReport: ConnectionRelationshipReport;
}

export type ProfileEnrichmentKind = "profile_field" | "ontology_promotion";
export type ProfileEnrichmentField =
  | "mainWorry"
  | "currentGoal"
  | "importantValue"
  | "stressReaction"
  | "emotionalClimate"
  | "relationshipHope";

export interface ProfileEnrichmentSuggestion {
  id: string;
  kind: ProfileEnrichmentKind;
  title: string;
  question: string;
  detail: string;
  confidence: number;
  targetField?: ProfileEnrichmentField;
  proposedValue?: string;
  ontologyNode?: OntologyNode;
}

export interface Briefing {
  headline: string;
  stateSummary: string;
  patternSummary: string;
  recommendedPrompt: string;
  dataTrust: DataTrustScore;
  state: MentalStateEstimate;
  ontologyHighlights: OntologyNode[];
  safetyNote: string;
}

export interface OnboardingAnswers {
  nickname: string;
  role: string;
  mainWorry: string;
  currentGoal: string;
  importantValue: string;
  stressReaction: string;
  emotionalClimate: string;
  preferredTone: string;
  relationshipHope: string;
}
