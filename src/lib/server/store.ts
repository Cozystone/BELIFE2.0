import { and, desc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import {
  behaviorFeatures,
  conversations,
  dataTrustSnapshots,
  hiddenConnectionEdges,
  memoryChunks,
  messages,
  ontologyNodes,
  profiles,
  stateEstimates,
  type MessageRow,
  type OntologyNodeRow,
  type ProfileRow,
  type StateEstimateRow,
} from "@/lib/db/schema";
import type {
  BehaviorSnapshot,
  BelifeUser,
  BelifeDataExport,
  BelifeMemoryInventory,
  BelifeMemoryTimeline,
  BelifeMemoryTimelineItem,
  CompatibilityAxes,
  ConversationMessage,
  DataTrustScore,
  EvidenceType,
  MemoryChunk,
  MentalStateEstimate,
  MessageRole,
  MessageSource,
  OnboardingAnswers,
  OntologyNode,
  UserProfile,
} from "@/lib/engines/types";
import { compactText, isoNow } from "@/lib/utils";

export interface BelifeStats {
  profileCompleteness: number;
  validSessionDensity: number;
  ontologyStability: number;
  behaviorCoverage: number;
  contradictionInverse: number;
  recencyCoverage: number;
  sessionCount: number;
  ontologyCount: number;
}

export interface BelifeStore {
  ensureProfile(user: BelifeUser): Promise<UserProfile>;
  updateOnboarding(userId: string, answers: OnboardingAnswers): Promise<UserProfile>;
  getProfile(userId: string): Promise<UserProfile | null>;
  createConversation(userId: string): Promise<string>;
  appendMessage(input: {
    conversationId: string;
    userId: string;
    role: MessageRole;
    content: string;
    source: MessageSource;
  }): Promise<ConversationMessage>;
  getRecentMessages(userId: string, limit?: number): Promise<ConversationMessage[]>;
  saveMemoryChunks(chunks: MemoryChunk[]): Promise<void>;
  upsertOntologyNodes(userId: string, nodes: OntologyNode[]): Promise<OntologyNode[]>;
  getOntologyNodes(userId: string): Promise<OntologyNode[]>;
  saveStateEstimate(userId: string, state: MentalStateEstimate): Promise<void>;
  getLatestState(userId: string): Promise<MentalStateEstimate | null>;
  saveBehavior(userId: string, behavior: BehaviorSnapshot): Promise<void>;
  getLatestBehavior(userId: string): Promise<BehaviorSnapshot | null>;
  saveDataTrust(userId: string, trust: DataTrustScore): Promise<void>;
  getLatestDataTrust(userId: string): Promise<DataTrustScore | null>;
  saveConnectionPreview(userId: string, preview: CompatibilityAxes): Promise<void>;
  getLatestConnectionPreview(userId: string): Promise<CompatibilityAxes | null>;
  getMemoryInventory(userId: string): Promise<BelifeMemoryInventory>;
  getMemoryTimeline(userId: string, limit?: number): Promise<BelifeMemoryTimeline>;
  exportUserData(userId: string): Promise<BelifeDataExport>;
  resetUserData(user: BelifeUser): Promise<UserProfile>;
  getStats(userId: string): Promise<BelifeStats>;
}

function dateToIso(value: Date | string | null | undefined) {
  if (!value) return isoNow();
  return value instanceof Date ? value.toISOString() : value;
}

function latestDateToIso(values: Array<Date | string | null | undefined>) {
  const timestamps = values
    .filter(Boolean)
    .map((value) => new Date(value as Date | string).getTime())
    .filter((value) => !Number.isNaN(value));
  if (!timestamps.length) return undefined;
  return new Date(Math.max(...timestamps)).toISOString();
}

function dateSafeRecord<T extends Record<string, unknown>>(row: T) {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => [key, value instanceof Date ? value.toISOString() : value]),
  );
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    userId: row.userId,
    displayName: row.displayName,
    nickname: row.nickname,
    role: row.role,
    mainWorry: row.mainWorry,
    currentGoal: row.currentGoal,
    importantValue: row.importantValue,
    stressReaction: row.stressReaction,
    emotionalClimate: row.emotionalClimate,
    preferredTone: row.preferredTone,
    onboardingAnswers: row.onboardingAnswers ?? {},
    createdAt: dateToIso(row.createdAt),
    updatedAt: dateToIso(row.updatedAt),
  };
}

function mapMessage(row: MessageRow): ConversationMessage {
  return {
    id: row.id,
    conversationId: row.conversationId,
    userId: row.userId,
    role: row.role,
    content: row.content,
    source: row.source,
    createdAt: dateToIso(row.createdAt),
  };
}

function mapNode(row: OntologyNodeRow): OntologyNode {
  return {
    id: row.id,
    userId: row.userId,
    type: row.type,
    label: row.label,
    summary: row.summary,
    layer: row.layer,
    tier: row.tier,
    certainty: row.certainty,
    confidence: row.confidence,
    evidenceCount: row.evidenceCount,
    status: row.status,
    lastEvidenceAt: dateToIso(row.lastEvidenceAt),
  };
}

function mapState(row: StateEstimateRow): MentalStateEstimate {
  return {
    stressLoad: row.stressLoad,
    burnoutRisk: row.burnoutRisk,
    rumination: row.rumination,
    emotionalVolatility: row.emotionalVolatility,
    motivation: row.motivation,
    socialWithdrawal: row.socialWithdrawal,
    supportNeed: row.supportNeed,
    confidence: row.confidence,
    summary: row.summary,
    drivers: row.drivers ?? [],
    createdAt: dateToIso(row.createdAt),
  };
}

class DbBelifeStore implements BelifeStore {
  async ensureProfile(user: BelifeUser) {
    const db = getDb();
    const existing = await db.query.profiles.findFirst({ where: eq(profiles.userId, user.id) });
    if (existing) return mapProfile(existing);

    const [created] = await db
      .insert(profiles)
      .values({
        userId: user.id,
        displayName: user.name,
        nickname: user.name,
        onboardingAnswers: {},
      })
      .returning();

    return mapProfile(created);
  }

  async updateOnboarding(userId: string, answers: OnboardingAnswers) {
    const db = getDb();
    const onboardingAnswers = { ...answers } as Record<string, string>;
    const [updated] = await db
      .update(profiles)
      .set({
        displayName: answers.nickname,
        nickname: answers.nickname,
        role: answers.role,
        mainWorry: answers.mainWorry,
        currentGoal: answers.currentGoal,
        importantValue: answers.importantValue,
        stressReaction: answers.stressReaction,
        emotionalClimate: answers.emotionalClimate,
        preferredTone: answers.preferredTone,
        onboardingAnswers,
        updatedAt: new Date(),
      })
      .where(eq(profiles.userId, userId))
      .returning();
    return mapProfile(updated);
  }

  async getProfile(userId: string) {
    const row = await getDb().query.profiles.findFirst({ where: eq(profiles.userId, userId) });
    return row ? mapProfile(row) : null;
  }

  async createConversation(userId: string) {
    const [created] = await getDb().insert(conversations).values({ userId }).returning({ id: conversations.id });
    return created.id;
  }

  async appendMessage(input: {
    conversationId: string;
    userId: string;
    role: MessageRole;
    content: string;
    source: MessageSource;
  }) {
    const [created] = await getDb().insert(messages).values(input).returning();
    return mapMessage(created);
  }

  async getRecentMessages(userId: string, limit = 20) {
    const rows = await getDb()
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.createdAt))
      .limit(limit);
    return rows.map(mapMessage).reverse();
  }

  async saveMemoryChunks(chunks: MemoryChunk[]) {
    if (!chunks.length) return;
    await getDb().insert(memoryChunks).values(
      chunks.map((chunk) => ({
        userId: chunk.userId,
        messageId: chunk.messageId,
        content: chunk.content,
        kind: chunk.kind,
        salience: chunk.salience,
        evidenceType: chunk.evidenceType,
        tags: chunk.tags,
      })),
    );
  }

  async upsertOntologyNodes(userId: string, nodes: OntologyNode[]) {
    const db = getDb();
    const saved: OntologyNode[] = [];

    for (const node of nodes) {
      const existing = await db.query.ontologyNodes.findFirst({
        where: and(
          eq(ontologyNodes.userId, userId),
          eq(ontologyNodes.type, node.type),
          eq(ontologyNodes.label, node.label),
        ),
      });

      if (existing) {
        const [updated] = await db
          .update(ontologyNodes)
          .set({
            summary: node.summary,
            layer: node.layer,
            tier: node.tier,
            certainty: node.certainty,
            confidence: Math.max(existing.confidence, node.confidence),
            evidenceCount: existing.evidenceCount + 1,
            status: "active",
            lastEvidenceAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(ontologyNodes.id, existing.id))
          .returning();
        saved.push(mapNode(updated));
      } else {
        const [created] = await db
          .insert(ontologyNodes)
          .values({
            userId,
            type: node.type,
            label: node.label,
            summary: node.summary,
            layer: node.layer,
            tier: node.tier,
            certainty: node.certainty,
            confidence: node.confidence,
            evidenceCount: node.evidenceCount,
            status: node.status,
            lastEvidenceAt: new Date(node.lastEvidenceAt),
          })
          .returning();
        saved.push(mapNode(created));
      }
    }

    return saved;
  }

  async getOntologyNodes(userId: string) {
    const rows = await getDb().select().from(ontologyNodes).where(eq(ontologyNodes.userId, userId));
    return rows.map(mapNode);
  }

  async saveStateEstimate(userId: string, state: MentalStateEstimate) {
    await getDb().insert(stateEstimates).values({
      userId,
      stressLoad: state.stressLoad,
      burnoutRisk: state.burnoutRisk,
      rumination: state.rumination,
      emotionalVolatility: state.emotionalVolatility,
      motivation: state.motivation,
      socialWithdrawal: state.socialWithdrawal,
      supportNeed: state.supportNeed,
      confidence: state.confidence,
      summary: state.summary,
      drivers: state.drivers,
    });
  }

  async getLatestState(userId: string) {
    const row = await getDb().query.stateEstimates.findFirst({
      where: eq(stateEstimates.userId, userId),
      orderBy: desc(stateEstimates.createdAt),
    });
    return row ? mapState(row) : null;
  }

  async saveBehavior(userId: string, behavior: BehaviorSnapshot) {
    await getDb().insert(behaviorFeatures).values({ userId, snapshot: behavior });
  }

  async getLatestBehavior(userId: string) {
    const row = await getDb().query.behaviorFeatures.findFirst({
      where: eq(behaviorFeatures.userId, userId),
      orderBy: desc(behaviorFeatures.createdAt),
    });
    return row?.snapshot ?? null;
  }

  async saveDataTrust(userId: string, trust: DataTrustScore) {
    await getDb().insert(dataTrustSnapshots).values({ userId, snapshot: trust });
  }

  async getLatestDataTrust(userId: string) {
    const row = await getDb().query.dataTrustSnapshots.findFirst({
      where: eq(dataTrustSnapshots.userId, userId),
      orderBy: desc(dataTrustSnapshots.createdAt),
    });
    return row?.snapshot ?? null;
  }

  async saveConnectionPreview(userId: string, preview: CompatibilityAxes) {
    await getDb().insert(hiddenConnectionEdges).values({ userId, preview, status: "latent" });
  }

  async getLatestConnectionPreview(userId: string) {
    const row = await getDb().query.hiddenConnectionEdges.findFirst({
      where: eq(hiddenConnectionEdges.userId, userId),
      orderBy: desc(hiddenConnectionEdges.createdAt),
    });
    return row?.preview ?? null;
  }

  async getMemoryInventory(userId: string): Promise<BelifeMemoryInventory> {
    const db = getDb();
    const [conversationRows, messageRows, chunkRows, nodeRows, stateRows, behaviorRows, trustRows, previewRows] =
      await Promise.all([
        db.select({ id: conversations.id, createdAt: conversations.createdAt }).from(conversations).where(eq(conversations.userId, userId)),
        db.select({ id: messages.id, createdAt: messages.createdAt }).from(messages).where(eq(messages.userId, userId)),
        db
          .select({
            id: memoryChunks.id,
            evidenceType: memoryChunks.evidenceType,
            createdAt: memoryChunks.createdAt,
          })
          .from(memoryChunks)
          .where(eq(memoryChunks.userId, userId)),
        db
          .select({
            id: ontologyNodes.id,
            layer: ontologyNodes.layer,
            certainty: ontologyNodes.certainty,
            lastEvidenceAt: ontologyNodes.lastEvidenceAt,
          })
          .from(ontologyNodes)
          .where(eq(ontologyNodes.userId, userId)),
        db.select({ id: stateEstimates.id, createdAt: stateEstimates.createdAt }).from(stateEstimates).where(eq(stateEstimates.userId, userId)),
        db.select({ id: behaviorFeatures.id, createdAt: behaviorFeatures.createdAt }).from(behaviorFeatures).where(eq(behaviorFeatures.userId, userId)),
        db.select({ id: dataTrustSnapshots.id, createdAt: dataTrustSnapshots.createdAt }).from(dataTrustSnapshots).where(eq(dataTrustSnapshots.userId, userId)),
        db.select({ id: hiddenConnectionEdges.id, createdAt: hiddenConnectionEdges.createdAt }).from(hiddenConnectionEdges).where(eq(hiddenConnectionEdges.userId, userId)),
      ]);

    return buildMemoryInventory({
      conversations: conversationRows.length,
      messages: messageRows.length,
      memoryChunks: chunkRows.length,
      ontologyNodes: nodeRows.length,
      stateEstimates: stateRows.length,
      behaviorSnapshots: behaviorRows.length,
      dataTrustSnapshots: trustRows.length,
      connectionPreviews: previewRows.length,
      evidenceTypes: [...chunkRows.map((row) => row.evidenceType), ...nodeRows.map((row) => row.certainty)],
      ontologyLayers: nodeRows.map((row) => row.layer),
      latest: {
        messageAt: latestDateToIso(messageRows.map((row) => row.createdAt)),
        memoryAt: latestDateToIso(chunkRows.map((row) => row.createdAt)),
        ontologyEvidenceAt: latestDateToIso(nodeRows.map((row) => row.lastEvidenceAt)),
        stateAt: latestDateToIso(stateRows.map((row) => row.createdAt)),
        behaviorAt: latestDateToIso(behaviorRows.map((row) => row.createdAt)),
        dataTrustAt: latestDateToIso(trustRows.map((row) => row.createdAt)),
        connectionPreviewAt: latestDateToIso(previewRows.map((row) => row.createdAt)),
      },
    });
  }

  async getMemoryTimeline(userId: string, limit = 24): Promise<BelifeMemoryTimeline> {
    const safeLimit = Math.max(1, Math.min(60, limit));
    const db = getDb();
    const [messageRows, chunkRows, nodeRows, stateRows, behaviorRows] = await Promise.all([
      db.select().from(messages).where(eq(messages.userId, userId)).orderBy(desc(messages.createdAt)).limit(safeLimit),
      db.select().from(memoryChunks).where(eq(memoryChunks.userId, userId)).orderBy(desc(memoryChunks.createdAt)).limit(safeLimit),
      db.select().from(ontologyNodes).where(eq(ontologyNodes.userId, userId)).orderBy(desc(ontologyNodes.lastEvidenceAt)).limit(safeLimit),
      db.select().from(stateEstimates).where(eq(stateEstimates.userId, userId)).orderBy(desc(stateEstimates.createdAt)).limit(safeLimit),
      db.select().from(behaviorFeatures).where(eq(behaviorFeatures.userId, userId)).orderBy(desc(behaviorFeatures.createdAt)).limit(safeLimit),
    ]);

    const items: BelifeMemoryTimelineItem[] = [
      ...messageRows.map((row) => ({
        id: row.id,
        kind: "message" as const,
        title: row.role === "user" ? "User message" : "BELIFE response",
        body: compactText(row.content, 240),
        createdAt: dateToIso(row.createdAt),
        source: row.source,
        tags: [row.role, row.source],
      })),
      ...chunkRows.map((row) => ({
        id: row.id,
        kind: "memory" as const,
        title: `${row.kind} memory`,
        body: compactText(row.content, 240),
        createdAt: dateToIso(row.createdAt),
        evidenceType: row.evidenceType,
        salience: row.salience,
        tags: row.tags ?? [],
      })),
      ...nodeRows.map((row) => ({
        id: row.id,
        kind: "ontology" as const,
        title: `${row.type} · ${row.label}`,
        body: compactText(row.summary, 240),
        createdAt: dateToIso(row.lastEvidenceAt),
        evidenceType: row.certainty,
        confidence: row.confidence,
        tags: [row.layer, row.tier],
      })),
      ...stateRows.map((row) => {
        const state = mapState(row);
        return {
          id: row.id,
          kind: "state" as const,
          title: "Mental state estimate",
          body: compactText(state.summary, 240),
          createdAt: state.createdAt,
          confidence: state.confidence,
          tags: state.drivers,
        };
      }),
      ...behaviorRows.map((row) => ({
        id: row.id,
        kind: "behavior" as const,
        title: "Behavior snapshot",
        body: compactText(row.snapshot.summary, 240),
        createdAt: dateToIso(row.createdAt),
        confidence: row.snapshot.confidence,
        tags: ["communication", "behavior"],
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, safeLimit);

    return { generatedAt: isoNow(), items };
  }

  async exportUserData(userId: string): Promise<BelifeDataExport> {
    const db = getDb();
    const [profile, inventory, conversationRows, messageRows, chunkRows, nodeRows, stateRows, behaviorRows, trustRows, previewRows] =
      await Promise.all([
        this.getProfile(userId),
        this.getMemoryInventory(userId),
        db.select().from(conversations).where(eq(conversations.userId, userId)),
        db.select().from(messages).where(eq(messages.userId, userId)).orderBy(messages.createdAt),
        db.select().from(memoryChunks).where(eq(memoryChunks.userId, userId)).orderBy(memoryChunks.createdAt),
        db.select().from(ontologyNodes).where(eq(ontologyNodes.userId, userId)).orderBy(ontologyNodes.updatedAt),
        db.select().from(stateEstimates).where(eq(stateEstimates.userId, userId)).orderBy(stateEstimates.createdAt),
        db.select().from(behaviorFeatures).where(eq(behaviorFeatures.userId, userId)).orderBy(behaviorFeatures.createdAt),
        db.select().from(dataTrustSnapshots).where(eq(dataTrustSnapshots.userId, userId)).orderBy(dataTrustSnapshots.createdAt),
        db.select().from(hiddenConnectionEdges).where(eq(hiddenConnectionEdges.userId, userId)).orderBy(hiddenConnectionEdges.createdAt),
      ]);

    return {
      schemaVersion: 1,
      exportedAt: isoNow(),
      userId,
      inventory,
      profile,
      conversations: conversationRows.map((row) => dateSafeRecord(row as unknown as Record<string, unknown>)),
      messages: messageRows.map(mapMessage),
      memoryChunks: chunkRows.map((row) => dateSafeRecord(row as unknown as Record<string, unknown>)),
      ontologyNodes: nodeRows.map(mapNode),
      stateEstimates: stateRows.map(mapState),
      behaviorSnapshots: behaviorRows.map((row) => dateSafeRecord(row as unknown as Record<string, unknown>)),
      dataTrustSnapshots: trustRows.map((row) => dateSafeRecord(row as unknown as Record<string, unknown>)),
      connectionPreviews: previewRows.map((row) => dateSafeRecord(row as unknown as Record<string, unknown>)),
    };
  }

  async resetUserData(user: BelifeUser) {
    await getDb().delete(profiles).where(eq(profiles.userId, user.id));
    return this.ensureProfile(user);
  }

  async getStats(userId: string): Promise<BelifeStats> {
    const [profile, userMessages, nodes, behavior] = await Promise.all([
      this.getProfile(userId),
      this.getRecentMessages(userId, 100),
      this.getOntologyNodes(userId),
      this.getLatestBehavior(userId),
    ]);

    return buildStats(profile, userMessages, nodes, behavior);
  }
}

interface MemoryState {
  profiles: Map<string, UserProfile>;
  conversations: Map<string, { id: string; userId: string }>;
  messages: ConversationMessage[];
  chunks: MemoryChunk[];
  nodes: OntologyNode[];
  states: Map<string, MentalStateEstimate[]>;
  behaviors: Map<string, BehaviorSnapshot[]>;
  trusts: Map<string, DataTrustScore[]>;
  previews: Map<string, CompatibilityAxes[]>;
}

const memoryState: MemoryState = {
  profiles: new Map(),
  conversations: new Map(),
  messages: [],
  chunks: [],
  nodes: [],
  states: new Map(),
  behaviors: new Map(),
  trusts: new Map(),
  previews: new Map(),
};

class MemoryBelifeStore implements BelifeStore {
  async ensureProfile(user: BelifeUser) {
    const existing = memoryState.profiles.get(user.id);
    if (existing) return existing;
    const now = isoNow();
    const profile: UserProfile = {
      userId: user.id,
      displayName: user.name,
      nickname: user.name,
      role: "",
      mainWorry: "",
      currentGoal: "",
      importantValue: "",
      stressReaction: "",
      emotionalClimate: "",
      preferredTone: "calm",
      onboardingAnswers: {},
      createdAt: now,
      updatedAt: now,
    };
    memoryState.profiles.set(user.id, profile);
    return profile;
  }

  async updateOnboarding(userId: string, answers: OnboardingAnswers) {
    const previous = memoryState.profiles.get(userId);
    const now = isoNow();
    const onboardingAnswers = { ...answers } as Record<string, string>;
    const profile: UserProfile = {
      userId,
      displayName: answers.nickname,
      nickname: answers.nickname,
      role: answers.role,
      mainWorry: answers.mainWorry,
      currentGoal: answers.currentGoal,
      importantValue: answers.importantValue,
      stressReaction: answers.stressReaction,
      emotionalClimate: answers.emotionalClimate,
      preferredTone: answers.preferredTone,
      onboardingAnswers,
      createdAt: previous?.createdAt ?? now,
      updatedAt: now,
    };
    memoryState.profiles.set(userId, profile);
    return profile;
  }

  async getProfile(userId: string) {
    return memoryState.profiles.get(userId) ?? null;
  }

  async createConversation(userId: string) {
    const id = randomUUID();
    memoryState.conversations.set(id, { id, userId });
    return id;
  }

  async appendMessage(input: {
    conversationId: string;
    userId: string;
    role: MessageRole;
    content: string;
    source: MessageSource;
  }) {
    const message: ConversationMessage = {
      id: randomUUID(),
      ...input,
      createdAt: isoNow(),
    };
    memoryState.messages.push(message);
    return message;
  }

  async getRecentMessages(userId: string, limit = 20) {
    return memoryState.messages.filter((message) => message.userId === userId).slice(-limit);
  }

  async saveMemoryChunks(chunks: MemoryChunk[]) {
    memoryState.chunks.push(...chunks.map((chunk) => ({ ...chunk, id: chunk.id ?? randomUUID(), createdAt: isoNow() })));
  }

  async upsertOntologyNodes(userId: string, nodes: OntologyNode[]) {
    const saved: OntologyNode[] = [];
    for (const node of nodes) {
      const index = memoryState.nodes.findIndex(
        (existing) => existing.userId === userId && existing.type === node.type && existing.label === node.label,
      );
      if (index >= 0) {
        const existing = memoryState.nodes[index];
        const updated = {
          ...existing,
          summary: node.summary,
          confidence: Math.max(existing.confidence, node.confidence),
          evidenceCount: existing.evidenceCount + 1,
          lastEvidenceAt: isoNow(),
        };
        memoryState.nodes[index] = updated;
        saved.push(updated);
      } else {
        const created = { ...node, id: randomUUID() };
        memoryState.nodes.push(created);
        saved.push(created);
      }
    }
    return saved;
  }

  async getOntologyNodes(userId: string) {
    return memoryState.nodes.filter((node) => node.userId === userId);
  }

  async saveStateEstimate(userId: string, state: MentalStateEstimate) {
    memoryState.states.set(userId, [...(memoryState.states.get(userId) ?? []), state]);
  }

  async getLatestState(userId: string) {
    return memoryState.states.get(userId)?.at(-1) ?? null;
  }

  async saveBehavior(userId: string, behavior: BehaviorSnapshot) {
    memoryState.behaviors.set(userId, [...(memoryState.behaviors.get(userId) ?? []), behavior]);
  }

  async getLatestBehavior(userId: string) {
    return memoryState.behaviors.get(userId)?.at(-1) ?? null;
  }

  async saveDataTrust(userId: string, trust: DataTrustScore) {
    memoryState.trusts.set(userId, [...(memoryState.trusts.get(userId) ?? []), trust]);
  }

  async getLatestDataTrust(userId: string) {
    return memoryState.trusts.get(userId)?.at(-1) ?? null;
  }

  async saveConnectionPreview(userId: string, preview: CompatibilityAxes) {
    memoryState.previews.set(userId, [...(memoryState.previews.get(userId) ?? []), preview]);
  }

  async getLatestConnectionPreview(userId: string) {
    return memoryState.previews.get(userId)?.at(-1) ?? null;
  }

  async getMemoryInventory(userId: string): Promise<BelifeMemoryInventory> {
    const conversationsForUser = [...memoryState.conversations.values()].filter((conversation) => conversation.userId === userId);
    const messageRows = memoryState.messages.filter((message) => message.userId === userId);
    const chunkRows = memoryState.chunks.filter((chunk) => chunk.userId === userId);
    const nodeRows = memoryState.nodes.filter((node) => node.userId === userId);
    const stateRows = memoryState.states.get(userId) ?? [];
    const behaviorRows = memoryState.behaviors.get(userId) ?? [];
    const trustRows = memoryState.trusts.get(userId) ?? [];
    const previewRows = memoryState.previews.get(userId) ?? [];

    return buildMemoryInventory({
      conversations: conversationsForUser.length,
      messages: messageRows.length,
      memoryChunks: chunkRows.length,
      ontologyNodes: nodeRows.length,
      stateEstimates: stateRows.length,
      behaviorSnapshots: behaviorRows.length,
      dataTrustSnapshots: trustRows.length,
      connectionPreviews: previewRows.length,
      evidenceTypes: [...chunkRows.map((chunk) => chunk.evidenceType), ...nodeRows.map((node) => node.certainty)],
      ontologyLayers: nodeRows.map((node) => node.layer),
      latest: {
        messageAt: latestDateToIso(messageRows.map((message) => message.createdAt)),
        memoryAt: latestDateToIso(chunkRows.map((chunk) => chunk.createdAt)),
        ontologyEvidenceAt: latestDateToIso(nodeRows.map((node) => node.lastEvidenceAt)),
        stateAt: latestDateToIso(stateRows.map((state) => state.createdAt)),
        behaviorAt: latestDateToIso(behaviorRows.map((behavior) => behavior.createdAt)),
        dataTrustAt: latestDateToIso(trustRows.map((trust) => trust.createdAt)),
      },
    });
  }

  async getMemoryTimeline(userId: string, limit = 24): Promise<BelifeMemoryTimeline> {
    const safeLimit = Math.max(1, Math.min(60, limit));
    const messageRows = memoryState.messages.filter((message) => message.userId === userId).slice(-safeLimit);
    const chunkRows = memoryState.chunks.filter((chunk) => chunk.userId === userId).slice(-safeLimit);
    const nodeRows = memoryState.nodes.filter((node) => node.userId === userId).slice(-safeLimit);
    const stateRows = (memoryState.states.get(userId) ?? []).slice(-safeLimit);
    const behaviorRows = (memoryState.behaviors.get(userId) ?? []).slice(-safeLimit);
    const items: BelifeMemoryTimelineItem[] = [
      ...messageRows.map((message) => ({
        id: message.id,
        kind: "message" as const,
        title: message.role === "user" ? "User message" : "BELIFE response",
        body: compactText(message.content, 240),
        createdAt: message.createdAt,
        source: message.source,
        tags: [message.role, message.source],
      })),
      ...chunkRows.map((chunk) => ({
        id: chunk.id ?? randomUUID(),
        kind: "memory" as const,
        title: `${chunk.kind} memory`,
        body: compactText(chunk.content, 240),
        createdAt: chunk.createdAt ?? isoNow(),
        evidenceType: chunk.evidenceType,
        salience: chunk.salience,
        tags: chunk.tags,
      })),
      ...nodeRows.map((node) => ({
        id: node.id ?? `${node.type}-${node.label}`,
        kind: "ontology" as const,
        title: `${node.type} · ${node.label}`,
        body: compactText(node.summary, 240),
        createdAt: node.lastEvidenceAt,
        evidenceType: node.certainty,
        confidence: node.confidence,
        tags: [node.layer, node.tier],
      })),
      ...stateRows.map((state) => ({
        id: `state-${state.createdAt}`,
        kind: "state" as const,
        title: "Mental state estimate",
        body: compactText(state.summary, 240),
        createdAt: state.createdAt,
        confidence: state.confidence,
        tags: state.drivers,
      })),
      ...behaviorRows.map((behavior) => ({
        id: `behavior-${behavior.createdAt}`,
        kind: "behavior" as const,
        title: "Behavior snapshot",
        body: compactText(behavior.summary, 240),
        createdAt: behavior.createdAt,
        confidence: behavior.confidence,
        tags: ["communication", "behavior"],
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, safeLimit);

    return { generatedAt: isoNow(), items };
  }

  async exportUserData(userId: string): Promise<BelifeDataExport> {
    const inventory = await this.getMemoryInventory(userId);
    return {
      schemaVersion: 1,
      exportedAt: isoNow(),
      userId,
      inventory,
      profile: memoryState.profiles.get(userId) ?? null,
      conversations: [...memoryState.conversations.values()]
        .filter((conversation) => conversation.userId === userId)
        .map((conversation) => ({ ...conversation })),
      messages: memoryState.messages.filter((message) => message.userId === userId),
      memoryChunks: memoryState.chunks.filter((chunk) => chunk.userId === userId).map((chunk) => ({ ...chunk })),
      ontologyNodes: memoryState.nodes.filter((node) => node.userId === userId),
      stateEstimates: memoryState.states.get(userId) ?? [],
      behaviorSnapshots: (memoryState.behaviors.get(userId) ?? []).map((snapshot) => ({ ...snapshot })),
      dataTrustSnapshots: (memoryState.trusts.get(userId) ?? []).map((snapshot) => ({ ...snapshot })),
      connectionPreviews: (memoryState.previews.get(userId) ?? []).map((preview) => ({ ...preview })),
    };
  }

  async resetUserData(user: BelifeUser) {
    const conversationIds = new Set(
      [...memoryState.conversations.values()]
        .filter((conversation) => conversation.userId === user.id)
        .map((conversation) => conversation.id),
    );
    memoryState.profiles.delete(user.id);
    for (const id of conversationIds) memoryState.conversations.delete(id);
    memoryState.messages = memoryState.messages.filter((message) => message.userId !== user.id);
    memoryState.chunks = memoryState.chunks.filter((chunk) => chunk.userId !== user.id);
    memoryState.nodes = memoryState.nodes.filter((node) => node.userId !== user.id);
    memoryState.states.delete(user.id);
    memoryState.behaviors.delete(user.id);
    memoryState.trusts.delete(user.id);
    memoryState.previews.delete(user.id);
    return this.ensureProfile(user);
  }

  async getStats(userId: string): Promise<BelifeStats> {
    return buildStats(
      memoryState.profiles.get(userId) ?? null,
      memoryState.messages.filter((message) => message.userId === userId),
      memoryState.nodes.filter((node) => node.userId === userId),
      memoryState.behaviors.get(userId)?.at(-1) ?? null,
    );
  }
}

function buildMemoryInventory(input: {
  conversations: number;
  messages: number;
  memoryChunks: number;
  ontologyNodes: number;
  stateEstimates: number;
  behaviorSnapshots: number;
  dataTrustSnapshots: number;
  connectionPreviews: number;
  evidenceTypes: EvidenceType[];
  ontologyLayers: Array<"core" | "active" | "archive">;
  latest: BelifeMemoryInventory["latest"];
}): BelifeMemoryInventory {
  return {
    counts: {
      conversations: input.conversations,
      messages: input.messages,
      memoryChunks: input.memoryChunks,
      ontologyNodes: input.ontologyNodes,
      stateEstimates: input.stateEstimates,
      behaviorSnapshots: input.behaviorSnapshots,
      dataTrustSnapshots: input.dataTrustSnapshots,
      connectionPreviews: input.connectionPreviews,
    },
    evidenceMix: {
      extracted: input.evidenceTypes.filter((type) => type === "EXTRACTED").length,
      inferred: input.evidenceTypes.filter((type) => type === "INFERRED").length,
      ambiguous: input.evidenceTypes.filter((type) => type === "AMBIGUOUS").length,
    },
    ontologyLayers: {
      core: input.ontologyLayers.filter((layer) => layer === "core").length,
      active: input.ontologyLayers.filter((layer) => layer === "active").length,
      archive: input.ontologyLayers.filter((layer) => layer === "archive").length,
    },
    latest: input.latest,
  };
}

function buildStats(
  profile: UserProfile | null,
  userMessages: ConversationMessage[],
  nodes: OntologyNode[],
  behavior: BehaviorSnapshot | null,
): BelifeStats {
  const fields = profile
    ? [
        profile.nickname,
        profile.role,
        profile.mainWorry,
        profile.currentGoal,
        profile.importantValue,
        profile.stressReaction,
        profile.emotionalClimate,
        profile.preferredTone,
      ]
    : [];
  const filled = fields.filter((value) => value && value.trim().length > 0).length;
  const sessionCount = new Set(userMessages.map((message) => message.conversationId)).size;
  return {
    profileCompleteness: fields.length ? filled / fields.length : 0,
    validSessionDensity: Math.min(1, userMessages.filter((message) => message.role === "user").length / 8),
    ontologyStability: Math.min(1, nodes.reduce((sum, node) => sum + node.evidenceCount, 0) / 18),
    behaviorCoverage: behavior ? behavior.confidence : 0,
    contradictionInverse: 0.92,
    recencyCoverage: userMessages.length ? 0.8 : 0.1,
    sessionCount,
    ontologyCount: nodes.length,
  };
}

const dbStore = new DbBelifeStore();
const memoryStore = new MemoryBelifeStore();

export function getStore(): BelifeStore {
  return hasDatabaseUrl() ? dbStore : memoryStore;
}
