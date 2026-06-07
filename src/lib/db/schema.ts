import { jsonb, pgTable, real, text, timestamp, uniqueIndex, uuid, integer } from "drizzle-orm/pg-core";
import type {
  BehaviorSnapshot,
  CompatibilityAxes,
  DataTrustScore,
  EvidenceType,
  ImportanceTier,
  MentalStateEstimate,
  MessageRole,
  MessageSource,
  OntologyLayer,
  OntologyNodeType,
} from "@/lib/engines/types";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
};

export const profiles = pgTable("profiles", {
  userId: text("user_id").primaryKey(),
  displayName: text("display_name").notNull(),
  nickname: text("nickname").notNull(),
  role: text("role").notNull().default(""),
  mainWorry: text("main_worry").notNull().default(""),
  currentGoal: text("current_goal").notNull().default(""),
  importantValue: text("important_value").notNull().default(""),
  stressReaction: text("stress_reaction").notNull().default(""),
  emotionalClimate: text("emotional_climate").notNull().default(""),
  preferredTone: text("preferred_tone").notNull().default("calm"),
  onboardingAnswers: jsonb("onboarding_answers").$type<Record<string, string>>().notNull().default({}),
  ...timestamps,
});

export const nativeAuthAccounts = pgTable(
  "native_auth_accounts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash").notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("native_auth_accounts_email_idx").on(table.email)],
);

export const nativeAuthSessions = pgTable(
  "native_auth_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    accountId: uuid("account_id").notNull().references(() => nativeAuthAccounts.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [uniqueIndex("native_auth_sessions_token_hash_idx").on(table.tokenHash)],
);

export const conversations = pgTable("conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  title: text("title").notNull().default("BELIFE conversation"),
  ...timestamps,
});

export const messages = pgTable("messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  role: text("role").$type<MessageRole>().notNull(),
  content: text("content").notNull(),
  source: text("source").$type<MessageSource>().notNull().default("text"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const memoryChunks = pgTable("memory_chunks", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  messageId: uuid("message_id").references(() => messages.id, { onDelete: "set null" }),
  content: text("content").notNull(),
  kind: text("kind").notNull(),
  salience: real("salience").notNull().default(0.5),
  evidenceType: text("evidence_type").$type<EvidenceType>().notNull().default("EXTRACTED"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const ontologyNodes = pgTable(
  "ontology_nodes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
    type: text("type").$type<OntologyNodeType>().notNull(),
    label: text("label").notNull(),
    summary: text("summary").notNull(),
    layer: text("layer").$type<OntologyLayer>().notNull().default("active"),
    tier: text("tier").$type<ImportanceTier>().notNull().default("L2"),
    certainty: text("certainty").$type<EvidenceType>().notNull().default("INFERRED"),
    confidence: real("confidence").notNull().default(0.5),
    evidenceCount: integer("evidence_count").notNull().default(1),
    status: text("status").$type<"active" | "archived">().notNull().default("active"),
    lastEvidenceAt: timestamp("last_evidence_at", { withTimezone: true }).defaultNow().notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("ontology_nodes_user_type_label_idx").on(table.userId, table.type, table.label)],
);

export const ontologyEdges = pgTable("ontology_edges", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  sourceNodeId: uuid("source_node_id").notNull().references(() => ontologyNodes.id, { onDelete: "cascade" }),
  targetNodeId: uuid("target_node_id").notNull().references(() => ontologyNodes.id, { onDelete: "cascade" }),
  relation: text("relation").notNull(),
  certainty: text("certainty").$type<EvidenceType>().notNull().default("INFERRED"),
  confidence: real("confidence").notNull().default(0.5),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const stateEstimates = pgTable("state_estimates", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  stressLoad: real("stress_load").notNull(),
  burnoutRisk: real("burnout_risk").notNull(),
  rumination: real("rumination").notNull(),
  emotionalVolatility: real("emotional_volatility").notNull(),
  motivation: real("motivation").notNull(),
  socialWithdrawal: real("social_withdrawal").notNull(),
  supportNeed: real("support_need").notNull(),
  confidence: real("confidence").notNull(),
  summary: text("summary").notNull(),
  drivers: jsonb("drivers").$type<string[]>().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const behaviorFeatures = pgTable("behavior_features", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  snapshot: jsonb("snapshot").$type<BehaviorSnapshot>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const dataTrustSnapshots = pgTable("data_trust_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  snapshot: jsonb("snapshot").$type<DataTrustScore>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const hiddenConnectionEdges = pgTable("hidden_connection_edges", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => profiles.userId, { onDelete: "cascade" }),
  preview: jsonb("preview").$type<CompatibilityAxes>().notNull(),
  status: text("status").notNull().default("latent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type StateEstimateRow = typeof stateEstimates.$inferSelect;
export type ProfileRow = typeof profiles.$inferSelect;
export type NativeAuthAccountRow = typeof nativeAuthAccounts.$inferSelect;
export type NativeAuthSessionRow = typeof nativeAuthSessions.$inferSelect;
export type MessageRow = typeof messages.$inferSelect;
export type MemoryChunkRow = typeof memoryChunks.$inferSelect;
export type OntologyNodeRow = typeof ontologyNodes.$inferSelect;
export type OntologyEdgeRow = typeof ontologyEdges.$inferSelect;
export type MentalStateInsert = MentalStateEstimate;
