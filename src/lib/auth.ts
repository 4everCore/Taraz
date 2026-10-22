import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes, createHash } from "crypto";
import { and, eq, gt, isNull, ne } from "drizzle-orm";
import { db } from "@/db";
import { sessions, users } from "@/db/schema";

export const SESSION_COOKIE_NAME = "taraz_session";
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;

export type SessionUser = {
  id: string;
  displayName: string;
  email: string;
  defaultCurrency: "IRT" | "IRR" | "USD" | "EUR";
  timezone: string;
  useJalaliCalendar: boolean;
  themePreference: "light" | "dark" | "system";
};

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function generateSessionToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(
  userId: string,
  meta: { userAgent?: string | null; ipAddress?: string | null },
): Promise<string> {
  const token = generateSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.insert(sessions).values({
    userId,
    tokenHash,
    userAgent: meta.userAgent ?? null,
    ipAddress: meta.ipAddress ?? null,
    expiresAt,
  });
  return token;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE_NAME)?.value ?? null;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const tokenHash = hashToken(token);
  const rows = await db
    .select({
      sessionId: sessions.id,
      expiresAt: sessions.expiresAt,
      revokedAt: sessions.revokedAt,
      userId: users.id,
      displayName: users.displayName,
      email: users.email,
      defaultCurrency: users.defaultCurrency,
      timezone: users.timezone,
      useJalaliCalendar: users.useJalaliCalendar,
      themePreference: users.themePreference,
      deletedAt: users.deletedAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date()), isNull(sessions.revokedAt)))
    .limit(1);
  const row = rows[0];
  if (!row || row.deletedAt) return null;
  return {
    id: row.userId,
    displayName: row.displayName,
    email: row.email,
    defaultCurrency: row.defaultCurrency,
    timezone: row.timezone,
    useJalaliCalendar: row.useJalaliCalendar,
    themePreference: row.themePreference,
  };
}

export async function getCurrentSessionId(): Promise<string | null> {
  const token = await getSessionToken();
  if (!token) return null;
  const tokenHash = hashToken(token);
  const rows = await db
    .select({ id: sessions.id })
    .from(sessions)
    .where(and(eq(sessions.tokenHash, tokenHash), gt(sessions.expiresAt, new Date()), isNull(sessions.revokedAt)))
    .limit(1);
  return rows[0]?.id ?? null;
}

export async function revokeCurrentSession() {
  const token = await getSessionToken();
  if (!token) return;
  const tokenHash = hashToken(token);
  await db.update(sessions).set({ revokedAt: new Date() }).where(eq(sessions.tokenHash, tokenHash));
}

export async function revokeAllOtherSessions(userId: string) {
  const currentSessionId = await getCurrentSessionId();
  if (!currentSessionId) return;
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId)));
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function listActiveSessions(userId: string) {
  return db
    .select({
      id: sessions.id,
      userAgent: sessions.userAgent,
      ipAddress: sessions.ipAddress,
      createdAt: sessions.createdAt,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .where(and(eq(sessions.userId, userId), gt(sessions.expiresAt, new Date()), isNull(sessions.revokedAt)));
}
