import { and, eq, gt, sql } from "drizzle-orm";
import { db } from "@/db";
import { loginAttempts } from "@/db/schema";

const WINDOW_MINUTES = 15;
const MAX_ATTEMPTS = 6;

export async function recordLoginAttempt(email: string, ipAddress: string | null, success: boolean) {
  await db.insert(loginAttempts).values({ email: email.toLowerCase(), ipAddress, success });
}

export async function isLoginRateLimited(email: string): Promise<boolean> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000);
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(loginAttempts)
    .where(
      and(
        eq(loginAttempts.email, email.toLowerCase()),
        eq(loginAttempts.success, false),
        gt(loginAttempts.createdAt, since),
      ),
    );
  const failedCount = Number(rows[0]?.count ?? 0);
  return failedCount >= MAX_ATTEMPTS;
}

export const LOGIN_RATE_LIMIT_WINDOW_MINUTES = WINDOW_MINUTES;
export const LOGIN_RATE_LIMIT_MAX_ATTEMPTS = MAX_ATTEMPTS;
