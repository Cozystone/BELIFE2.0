import { cookies } from "next/headers";
import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { and, eq, gt } from "drizzle-orm";
import { getDb, hasDatabaseUrl } from "@/lib/db/client";
import { nativeAuthAccounts, nativeAuthSessions, profiles } from "@/lib/db/schema";
import type { BelifeUser } from "@/lib/engines/types";

const scrypt = promisify(scryptCallback);
const sessionCookieName = "belife_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 60;

export function isNativeAuthAvailable() {
  return hasDatabaseUrl();
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derived.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string) {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;

  const expected = Buffer.from(key, "hex");
  const derived = (await scrypt(password, salt, expected.length)) as Buffer;
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}

function isUniqueEmailConflict(error: unknown) {
  const detail = error instanceof Error ? error.message : String(error);
  return detail.includes("native_auth_accounts_email_idx") || detail.includes("duplicate key value");
}

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

export async function clearNativeSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

async function createNativeSession(accountId: string) {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + sessionMaxAgeSeconds * 1000);

  await getDb().insert(nativeAuthSessions).values({
    accountId,
    tokenHash,
    expiresAt,
  });
  await setSessionCookie(token, expiresAt);
}

export async function getNativeBelifeUser(): Promise<BelifeUser | null> {
  if (!isNativeAuthAvailable()) return null;

  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName)?.value;
  if (!token) return null;

  const tokenHash = hashToken(token);
  const db = getDb();
  const session = await db.query.nativeAuthSessions.findFirst({
    where: and(eq(nativeAuthSessions.tokenHash, tokenHash), gt(nativeAuthSessions.expiresAt, new Date())),
  });
  if (!session) return null;

  const account = await db.query.nativeAuthAccounts.findFirst({
    where: eq(nativeAuthAccounts.id, session.accountId),
  });
  if (!account) return null;

  return {
    id: account.id,
    name: account.displayName || account.email,
    email: account.email,
    isDemo: false,
    authProvider: "native",
  };
}

export async function signUpNative(input: { email: string; password: string; displayName: string }) {
  if (!isNativeAuthAvailable()) {
    throw new Error("네이티브 인증에는 DATABASE_URL이 필요합니다.");
  }

  const email = normalizeEmail(input.email);
  const displayName = input.displayName.trim();
  const db = getDb();
  const existing = await db.query.nativeAuthAccounts.findFirst({
    where: eq(nativeAuthAccounts.email, email),
  });
  if (existing) {
    throw new Error("이미 등록된 이메일입니다.");
  }

  const passwordHash = await hashPassword(input.password);
  const [account] = await db
    .insert(nativeAuthAccounts)
    .values({
      email,
      displayName,
      passwordHash,
    })
    .returning()
    .catch((error: unknown) => {
      if (isUniqueEmailConflict(error)) throw new Error("이미 등록된 이메일입니다.");
      throw error;
    });

  await db.insert(profiles).values({
    userId: account.id,
    displayName,
    nickname: displayName,
    onboardingAnswers: {},
  });

  await createNativeSession(account.id);
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
  };
}

export async function signInNative(input: { email: string; password: string }) {
  if (!isNativeAuthAvailable()) {
    throw new Error("네이티브 인증에는 DATABASE_URL이 필요합니다.");
  }

  const email = normalizeEmail(input.email);
  const account = await getDb().query.nativeAuthAccounts.findFirst({
    where: eq(nativeAuthAccounts.email, email),
  });

  if (!account || !(await verifyPassword(input.password, account.passwordHash))) {
    throw new Error("이메일 또는 비밀번호가 올바르지 않습니다.");
  }

  await createNativeSession(account.id);
  return {
    id: account.id,
    email: account.email,
    displayName: account.displayName,
  };
}

export async function signOutNative() {
  if (isNativeAuthAvailable()) {
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookieName)?.value;
    if (token) {
      await getDb().delete(nativeAuthSessions).where(eq(nativeAuthSessions.tokenHash, hashToken(token)));
    }
  }
  await clearNativeSessionCookie();
}

export function shouldAllowDemoUser() {
  return process.env.BELIFE_DEMO_MODE === "true" || !hasDatabaseUrl();
}
