import { neon } from "@neondatabase/serverless";
import { drizzle, type NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type BelifeDb = NeonHttpDatabase<typeof schema>;

let db: BelifeDb | null = null;

export function hasDatabaseUrl() {
  return Boolean(process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith("postgres"));
}

export function getDb() {
  if (!hasDatabaseUrl()) {
    throw new Error("DATABASE_URL is not configured. BELIFE is running in demo memory mode.");
  }

  if (!db) {
    const sql = neon(process.env.DATABASE_URL!);
    db = drizzle(sql, { schema });
  }

  return db;
}
