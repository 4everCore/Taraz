"use server";

import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { THEME_COOKIE_NAME, isValidTheme } from "@/lib/theme";

export async function persistThemePreference(theme: string) {
  if (!isValidTheme(theme)) return;
  const cookieStore = await cookies();
  cookieStore.set(THEME_COOKIE_NAME, theme, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  const currentUser = await getCurrentUser();
  if (currentUser) {
    await db.update(users).set({ themePreference: theme, updatedAt: new Date() }).where(eq(users.id, currentUser.id));
  }
}
