"use server";

import { randomBytes, createHash } from "crypto";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/db";
import { users, passwordResetTokens } from "@/db/schema";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { categories } from "@/db/schema";
import { hashPassword, verifyPassword, passwordStrengthIssues } from "@/lib/password";
import {
  clearSessionCookie,
  createSession,
  getCurrentUser,
  revokeAllOtherSessions,
  revokeCurrentSession,
  setSessionCookie,
} from "@/lib/auth";
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, changePasswordSchema } from "@/lib/validation";
import { isLoginRateLimited, recordLoginAttempt } from "@/lib/rateLimit";
import { getClientIp, getOrigin, getUserAgent } from "@/lib/request";
import { recordAuditLog } from "@/lib/audit";
import { sendEmail, renderPasswordResetEmail } from "@/lib/email";
import type { ActionResult } from "@/lib/errors";
import { errorResult, okResult } from "@/lib/errors";

function flattenFieldErrors(error: { fieldErrors: Record<string, string[] | undefined> }): Record<string, string> {
  const flat: Record<string, string> = {};
  for (const key of Object.keys(error.fieldErrors)) {
    const messages = error.fieldErrors[key];
    if (messages && messages[0]) {
      flat[key] = messages[0];
    }
  }
  return flat;
}

export async function registerAction(_prevState: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>> {
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return errorResult("اطلاعات وارد شده معتبر نیست", flattenFieldErrors(parsed.error.flatten()));
  }

  const strengthIssues = passwordStrengthIssues(parsed.data.password);
  if (strengthIssues.length > 0) {
    return errorResult(strengthIssues[0], { password: strengthIssues[0] });
  }

  const existing = await db.select({ id: users.id }).from(users).where(eq(users.email, parsed.data.email)).limit(1);
  if (existing[0]) {
    return errorResult("حسابی با این ایمیل قبلاً ثبت شده است", { email: "این ایمیل قبلاً استفاده شده است" });
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const [createdUser] = await db
    .insert(users)
    .values({ displayName: parsed.data.displayName, email: parsed.data.email, passwordHash })
    .returning();

  await db.insert(categories).values(
    DEFAULT_CATEGORIES.map((category, index) => ({
      userId: createdUser.id,
      name: category.name,
      kind: category.kind,
      icon: category.icon,
      color: category.color,
      isSystem: true,
      sortOrder: index,
    })),
  );

  await recordAuditLog({ userId: createdUser.id, action: "user.register", entityType: "user", entityId: createdUser.id });

  const ipAddress = await getClientIp();
  const userAgent = await getUserAgent();
  const token = await createSession(createdUser.id, { ipAddress, userAgent });
  await setSessionCookie(token);

  redirect("/dashboard");
}

export async function loginAction(_prevState: ActionResult<null> | null, formData: FormData): Promise<ActionResult<null>> {
  const parsed = loginSchema.safeParse({ email: formData.get("email"), password: formData.get("password") });
  if (!parsed.success) {
    return errorResult("اطلاعات ورود معتبر نیست", flattenFieldErrors(parsed.error.flatten()));
  }

  const ipAddress = await getClientIp();
  const userAgent = await getUserAgent();

  const limited = await isLoginRateLimited(parsed.data.email);
  if (limited) {
    return errorResult("به دلیل تلاش‌های ناموفق متعدد، ورود موقتاً مسدود شده است. چند دقیقه دیگر تلاش کنید.");
  }

  const rows = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  const user = rows[0];

  if (!user || user.deletedAt) {
    await recordLoginAttempt(parsed.data.email, ipAddress, false);
    return errorResult("ایمیل یا رمز عبور اشتباه است");
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return errorResult("حساب شما به‌طور موقت قفل شده است. کمی بعد تلاش کنید.");
  }

  const passwordValid = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!passwordValid) {
    await recordLoginAttempt(parsed.data.email, ipAddress, false);
    const newFailedCount = user.failedLoginCount + 1;
    const shouldLock = newFailedCount >= 10;
    await db
      .update(users)
      .set({
        failedLoginCount: shouldLock ? 0 : newFailedCount,
        lockedUntil: shouldLock ? new Date(Date.now() + 15 * 60 * 1000) : null,
      })
      .where(eq(users.id, user.id));
    return errorResult("ایمیل یا رمز عبور اشتباه است");
  }

  await recordLoginAttempt(parsed.data.email, ipAddress, true);
  await db.update(users).set({ failedLoginCount: 0, lockedUntil: null }).where(eq(users.id, user.id));
  await recordAuditLog({ userId: user.id, action: "user.login", entityType: "user", entityId: user.id, ipAddress });

  const token = await createSession(user.id, { ipAddress, userAgent });
  await setSessionCookie(token);

  redirect("/dashboard");
}

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) {
    await recordAuditLog({ userId: user.id, action: "user.logout", entityType: "user", entityId: user.id });
  }
  await revokeCurrentSession();
  await clearSessionCookie();
  redirect("/login");
}

export async function forgotPasswordAction(
  _prevState: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = forgotPasswordSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return errorResult("ایمیل معتبر نیست");
  }

  const rows = await db.select().from(users).where(eq(users.email, parsed.data.email)).limit(1);
  const user = rows[0];

  if (user && !user.deletedAt) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    const origin = await getOrigin();
    const resetUrl = `${origin}/reset-password/${rawToken}`;
    await sendEmail({
      to: user.email,
      subject: "بازنشانی رمز عبور تراز",
      html: renderPasswordResetEmail(resetUrl),
    });
    await recordAuditLog({ userId: user.id, action: "user.forgot_password", entityType: "user", entityId: user.id });
  }

  return okResult(null);
}

export async function resetPasswordAction(
  _prevState: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const parsed = resetPasswordSchema.safeParse({ token: formData.get("token"), password: formData.get("password") });
  if (!parsed.success) {
    return errorResult("اطلاعات وارد شده معتبر نیست");
  }

  const strengthIssues = passwordStrengthIssues(parsed.data.password);
  if (strengthIssues.length > 0) {
    return errorResult(strengthIssues[0], { password: strengthIssues[0] });
  }

  const tokenHash = createHash("sha256").update(parsed.data.token).digest("hex");
  const rows = await db
    .select()
    .from(passwordResetTokens)
    .where(
      and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        gt(passwordResetTokens.expiresAt, new Date()),
        isNull(passwordResetTokens.usedAt),
      ),
    )
    .limit(1);

  const resetToken = rows[0];
  if (!resetToken) {
    return errorResult("لینک بازنشانی نامعتبر یا منقضی شده است");
  }

  const passwordHash = await hashPassword(parsed.data.password);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, resetToken.userId));
  await db.update(passwordResetTokens).set({ usedAt: new Date() }).where(eq(passwordResetTokens.id, resetToken.id));
  await recordAuditLog({ userId: resetToken.userId, action: "user.reset_password", entityType: "user", entityId: resetToken.userId });

  return okResult(null);
}

export async function changePasswordAction(
  _prevState: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) {
    return errorResult("ابتدا وارد حساب خود شوید");
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return errorResult("اطلاعات وارد شده معتبر نیست");
  }

  const strengthIssues = passwordStrengthIssues(parsed.data.newPassword);
  if (strengthIssues.length > 0) {
    return errorResult(strengthIssues[0], { newPassword: strengthIssues[0] });
  }

  const rows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const dbUser = rows[0];
  if (!dbUser) {
    return errorResult("کاربر یافت نشد");
  }

  const isValid = await verifyPassword(parsed.data.currentPassword, dbUser.passwordHash);
  if (!isValid) {
    return errorResult("رمز عبور فعلی اشتباه است", { currentPassword: "رمز عبور فعلی اشتباه است" });
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);
  await db.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, user.id));
  await recordAuditLog({ userId: user.id, action: "user.change_password", entityType: "user", entityId: user.id });

  return okResult(null);
}

export async function deleteAccountAction(
  _prevState: ActionResult<null> | null,
  formData: FormData,
): Promise<ActionResult<null>> {
  const user = await getCurrentUser();
  if (!user) {
    return errorResult("ابتدا وارد حساب خود شوید");
  }

  const password = String(formData.get("password") ?? "");
  const confirmation = String(formData.get("confirmation") ?? "");
  if (confirmation.trim() !== "حذف حساب من") {
    return errorResult("برای تایید، عبارت «حذف حساب من» را دقیقاً وارد کنید");
  }

  const rows = await db.select().from(users).where(eq(users.id, user.id)).limit(1);
  const dbUser = rows[0];
  if (!dbUser) {
    return errorResult("کاربر یافت نشد");
  }

  const isValid = await verifyPassword(password, dbUser.passwordHash);
  if (!isValid) {
    return errorResult("رمز عبور وارد شده صحیح نیست", { password: "رمز عبور وارد شده صحیح نیست" });
  }

  await recordAuditLog({ userId: null, action: "user.delete_account", entityType: "user", entityId: user.id, metadata: { email: user.email } });
  await db.delete(users).where(eq(users.id, user.id));
  await clearSessionCookie();

  redirect("/");
}

export async function revokeOtherSessionsAction() {
  const user = await getCurrentUser();
  if (!user) return;
  await revokeAllOtherSessions(user.id);
  await recordAuditLog({ userId: user.id, action: "user.revoke_sessions", entityType: "user", entityId: user.id });
}
