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

export interface ConversationSummary {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
  lastMessageAt?: string;
}

export interface MemoryChunk {
  id?: string;
  userId: string;
  messageId?: string;
  content: string;
  kind: "raw" | "semantic" | "behavior" | "state" | "relationship" | "correction";
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
  createdAt?: string;
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
  cognitiveDistortionRisk: number;
  motivationalCollapseRisk: number;
  baselineDeviation: number;
  abstentionRisk: number;
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
  | "supportNeed"
  | "cognitiveDistortionRisk"
  | "motivationalCollapseRisk"
  | "baselineDeviation"
  | "abstentionRisk";

export type MentalStateTrendDeltas = Record<MentalStateTrendMetric, number>;
export type MentalStateTrendValues = Record<MentalStateTrendMetric, number>;

export interface MentalStateEwmaTrend {
  lambda: number;
  values: MentalStateTrendValues;
  deltas: MentalStateTrendDeltas;
  summary: string;
}

export interface MentalStateHistoryReport {
  generatedAt: string;
  current: MentalStateEstimate | null;
  previous: MentalStateEstimate | null;
  deltas: MentalStateTrendDeltas;
  trend: MentalStateEwmaTrend;
  directionSummary: string;
  items: MentalStateEstimate[];
}

export type StateDynamicsCouplingDirection = "amplifying" | "protective" | "mixed";

export interface StateDynamicsCoupling {
  id: string;
  source: MentalStateTrendMetric;
  target: MentalStateTrendMetric;
  sourceLabel: string;
  targetLabel: string;
  strength: number;
  direction: StateDynamicsCouplingDirection;
  evidence: string;
  interpretation: string;
  nextObservation: string;
}

export interface StateDynamicsReport {
  generatedAt: string;
  modelKind: "lagged-delta" | "early-heuristic";
  sampleSize: number;
  confidence: number;
  summary: string;
  guardrail: string;
  baselineShift: {
    current: number;
    trend: number;
    level: "low" | "moderate" | "high";
    interpretation: string;
  };
  couplings: StateDynamicsCoupling[];
  stabilizers: string[];
  watchlist: string[];
}

export type SafetySignalLevel = "none" | "low" | "elevated" | "urgent";

export interface SafetyResource {
  label: string;
  region: string;
  action: string;
  availability: string;
  url: string;
}

export interface SafetySignalReport {
  generatedAt: string;
  level: SafetySignalLevel;
  confidence: number;
  summary: string;
  supportiveMessage: string;
  matchedSignals: string[];
  recommendedActions: string[];
  resources: SafetyResource[];
  guardrail: string;
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
  memoryQuality: number;
  explanation: string;
  createdAt: string;
}

export type DataTrustSignalKey =
  | "profileCompleteness"
  | "validSessionDensity"
  | "ontologyStability"
  | "behaviorCoverage"
  | "contradictionInverse"
  | "recencyCoverage"
  | "memoryQuality";

export interface DataTrustAuditSignal {
  key: DataTrustSignalKey;
  label: string;
  value: number;
  impact: number;
  why: string;
}

export interface DataTrustAudit {
  generatedAt: string;
  summary: string;
  interpretationGuardrail: string;
  weakestSignals: DataTrustAuditSignal[];
  nextActions: string[];
}

export interface BelifeMemoryInventory {
  counts: {
    conversations: number;
    messages: number;
    memoryChunks: number;
    ontologyNodes: number;
    ontologyEdges: number;
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

export type MemoryHealthLabel = "thin" | "building" | "healthy" | "rich";
export type MemoryHealthSeverity = "low" | "medium" | "high";
export type MemoryHealthWatchKind = "contradiction" | "stale" | "low_confidence" | "correction";
export type MemoryHealthAnchorSource = "memory" | "message" | "ontology";

export interface MemoryHealthFreshnessWindow {
  label: "7d" | "30d" | "90d";
  count: number;
}

export interface MemoryHealthWatchItem {
  id: string;
  kind: MemoryHealthWatchKind;
  label: string;
  severity: MemoryHealthSeverity;
  reason: string;
  evidence: string;
  suggestedAction: string;
  createdAt?: string;
}

export interface MemoryHealthAnchor {
  id: string;
  source: MemoryHealthAnchorSource;
  label: string;
  detail: string;
  confidence: number;
  salience?: number;
  createdAt?: string;
}

export interface MemoryHealthReport {
  generatedAt: string;
  score: number;
  label: MemoryHealthLabel;
  summary: string;
  guardrail: string;
  freshness: {
    score: number;
    latestMemoryAt?: string;
    latestMessageAt?: string;
    windows: MemoryHealthFreshnessWindow[];
  };
  evidenceBalance: {
    extracted: number;
    inferred: number;
    ambiguous: number;
    correctionCount: number;
    ambiguityRatio: number;
  };
  contradictionWatchlist: MemoryHealthWatchItem[];
  forgettingCandidates: MemoryHealthWatchItem[];
  episodicAnchors: MemoryHealthAnchor[];
  nextActions: string[];
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
  ontologyEdges: OntologyEdge[];
  stateEstimates: MentalStateEstimate[];
  behaviorSnapshots: Record<string, unknown>[];
  dataTrustSnapshots: Record<string, unknown>[];
  connectionPreviews: Record<string, unknown>[];
}

export interface PrivacyPreferences {
  showEvidenceLedger: boolean;
  connectionPreviewEnabled: boolean;
}

export type BelifeMemoryTimelineKind =
  | "message"
  | "memory"
  | "ontology"
  | "ontology_edge"
  | "state"
  | "behavior"
  | "connection";

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

export type MemoryEvidenceSource = "memory" | "message" | "ontology";

export interface MemoryEvidenceItem {
  id: string;
  source: MemoryEvidenceSource;
  label: string;
  detail: string;
  score: number;
  confidence: number;
  evidenceType?: EvidenceType;
  createdAt?: string;
  tags: string[];
}

export type ConnectionScenarioType =
  | "first_contact"
  | "light_disagreement"
  | "emotional_vulnerability"
  | "pressure"
  | "misunderstanding"
  | "repair_attempt"
  | "collaboration"
  | "reselection"
  | "longitudinal_drift";

export type ConnectionRelationshipMode = "friendship" | "collaboration" | "mentorship";
export type ConnectionSimulationHorizon = "immediate" | "next_month" | "long_term";

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

export interface ConnectionScenarioSimulation {
  iterations: number;
  stability: number;
  riskBand: "narrow" | "moderate" | "wide";
  bestCase: ConnectionScenarioState;
  likelyCase: ConnectionScenarioState;
  riskCase: ConnectionScenarioState;
  notes: string[];
}

export interface ConnectionScenarioPreview {
  type: ConnectionScenarioType;
  title: string;
  likelyDynamic: string;
  supportMove: string;
  riskSignal: string;
  state: ConnectionScenarioState;
  confidence: number;
  simulation: ConnectionScenarioSimulation;
}

export interface ConnectionSimulationInput {
  scenarioType: ConnectionScenarioType;
  relationshipMode: ConnectionRelationshipMode;
  timeHorizon: ConnectionSimulationHorizon;
  scene: string;
  pressure: number;
  vulnerability: number;
}

export interface ConnectionSimulationGuidance {
  openingMove: string;
  supportMove: string;
  riskToWatch: string;
  repairMove: string;
}

export interface ConnectionSimulationResult {
  input: ConnectionSimulationInput;
  scenario: ConnectionScenarioPreview;
  readiness: number;
  modeFit: number;
  stressLoad: number;
  guidance: ConnectionSimulationGuidance;
  guardrail: string;
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

export interface ConnectionModeScores {
  friendship: number;
  collaboration: number;
  mentorship: number;
}

export interface ConnectionGraphMechanisms {
  homophily: number;
  reciprocity: number;
  closure: number;
  persistence: number;
  drift: number;
  conflictToxicity: number;
}

export interface ConnectionHiddenEdge {
  status: "latent";
  compatibility: number;
  confidence: number;
  edgeStrength: number;
  modeScores: ConnectionModeScores;
  sharedReality: number;
  responsiveness: number;
  repair: number;
  mechanisms: ConnectionGraphMechanisms;
  lastSimulatedAt: string;
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

export type ConnectionCandidateStatus = "prioritize" | "watch" | "defer";

export interface ConnectionCandidateFilter {
  id: string;
  label: string;
  relationshipMode: ConnectionRelationshipMode;
  scenarioType: ConnectionScenarioType;
  status: ConnectionCandidateStatus;
  fit: number;
  risk: number;
  confidence: number;
  why: string;
  evidence: string[];
  riskSignals: string[];
  nextObservation: string;
}

export interface ConnectionCandidateFilteringReport {
  generatedAt: string;
  confidence: number;
  guardrail: string;
  candidates: ConnectionCandidateFilter[];
  prioritized: ConnectionCandidateFilter[];
  deferred: ConnectionCandidateFilter[];
}

export type ConnectionRerankingDirection = "new" | "up" | "down" | "stable";

export interface ConnectionModeRank {
  mode: ConnectionRelationshipMode;
  rank: number;
  previousRank: number | null;
  score: number;
  previousScore: number | null;
  delta: number;
  direction: ConnectionRerankingDirection;
}

export interface ConnectionRerankingSignal {
  key: string;
  label: string;
  previous: number | null;
  current: number;
  delta: number;
  direction: ConnectionRerankingDirection;
  impact: number;
  interpretation: string;
}

export interface ConnectionRerankingReport {
  generatedAt: string;
  confidence: number;
  edgeDelta: number;
  summary: string;
  guardrail: string;
  modeRanking: ConnectionModeRank[];
  signals: ConnectionRerankingSignal[];
  nextStabilizers: string[];
}

export type ConnectionQualityAxisKey =
  | "sharedReality"
  | "partnerResponsiveness"
  | "participantInterest"
  | "affectiveExperience";

export interface ConnectionQualityAxis {
  key: ConnectionQualityAxisKey;
  label: string;
  score: number;
  level: ConnectionAxisInsight["level"];
  interpretation: string;
  evidence: string[];
  nextObservation: string;
}

export interface ConnectionQualityLensReport {
  generatedAt: string;
  confidence: number;
  summary: string;
  guardrail: string;
  memoryCoverage: {
    pairCount: number;
    totalInteractions: number;
    strongestPair?: string;
    riskiestPair?: string;
  };
  axes: ConnectionQualityAxis[];
  comfortSources: string[];
  tensionSources: string[];
  healthyPattern: string;
  riskyPattern: string;
  nextMicroExperiments: string[];
}

export type DyadicCopingAxisKey =
  | "stressCommunication"
  | "supportiveResponse"
  | "jointRegulation"
  | "repairAfterStress"
  | "withdrawalRisk";

export interface DyadicCopingAxis {
  key: DyadicCopingAxisKey;
  label: string;
  score: number;
  level: ConnectionAxisInsight["level"];
  polarity: "protective" | "risk";
  interpretation: string;
  evidence: string[];
  nextObservation: string;
}

export interface DyadicCopingReport {
  generatedAt: string;
  confidence: number;
  summary: string;
  guardrail: string;
  memoryCoverage: {
    pairCount: number;
    totalInteractions: number;
    strongestPair?: string;
    riskiestPair?: string;
  };
  vsa: {
    enduringVulnerabilities: string[];
    stressfulEvents: string[];
    adaptiveProcesses: string[];
  };
  axes: DyadicCopingAxis[];
  stressSignals: string[];
  supportMoves: string[];
  riskSignals: string[];
  nextConversationMove: string;
}

export type RelationshipMemoryKind =
  | "friendship"
  | "collaboration"
  | "mentorship"
  | "family"
  | "romantic"
  | "other";

export interface RelationshipMemoryInput {
  personLabel: string;
  relationshipType: RelationshipMemoryKind;
  interactionNote: string;
  interactionQuality: number;
  emotionalSafety: number;
  reciprocity: number;
  repairAttempted: boolean;
  consent: true;
}

export interface RelationshipPairMemorySummary {
  pairKey: string;
  personLabel: string;
  relationshipType: RelationshipMemoryKind;
  interactionCount: number;
  averageQuality: number;
  emotionalSafety: number;
  reciprocity: number;
  repairEvidence: number;
  confidence: number;
  riskLevel: "low" | "moderate" | "high";
  summary: string;
  signals: string[];
  nextObservation: string;
  latestAt: string;
}

export interface RelationshipMemoryReport {
  generatedAt: string;
  pairCount: number;
  totalInteractions: number;
  guardrail: string;
  pairs: RelationshipPairMemorySummary[];
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
  hiddenEdge: ConnectionHiddenEdge;
  scenarioPreviews: ConnectionScenarioPreview[];
  relationshipReport: ConnectionRelationshipReport;
}

export type TwinEvidenceSource = "profile" | "state" | "behavior" | "ontology" | "memory" | "message";

export interface TwinEvidenceItem {
  source: TwinEvidenceSource;
  label: string;
  detail: string;
  confidence: number;
}

export interface TwinReflection {
  answer: string;
  confidence: number;
  confidenceLabel: "early" | "forming" | "grounded" | "strong";
  trustGate: {
    score: number;
    label: DataTrustScore["label"];
    ceiling: number;
    note: string;
  };
  evidence: TwinEvidenceItem[];
  uncertainties: string[];
  nextQuestion: string;
  guardrail: string;
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
  patternReminders: PatternReminder[];
  evidenceLedger: MemoryEvidenceItem[];
  privacy: PrivacyPreferences;
  dataTrust: DataTrustScore;
  state: MentalStateEstimate;
  ontologyHighlights: OntologyNode[];
  safetyNote: string;
}

export interface PatternReminder {
  id: string;
  kind: "state" | "ontology" | "relationship" | "trust";
  title: string;
  detail: string;
  talkPrompt: string;
  confidence: number;
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
