import { and, eq, gte, isNull, lte } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { budgets, transactions } from "@/db/schema";
import { percentOf } from "@/lib/money";

export type BudgetWithProgress = typeof budgets.$inferSelect & {
  spentMinor: bigint;
  remainingMinor: bigint;
  usedPercent: number;
};

export async function getSpentMinorForBudget(
  userId: string,
  categoryId: string | null,
  startDate: Date,
  endDate: Date,
  currency: string,
): Promise<bigint> {
  const conditions = [
    eq(transactions.userId, userId),
    eq(transactions.type, "expense"),
    eq(transactions.status, "completed"),
    eq(transactions.currency, currency as "IRT" | "IRR" | "USD" | "EUR"),
    gte(transactions.occurredAt, startDate),
    lte(transactions.occurredAt, endDate),
    isNull(transactions.deletedAt),
  ];
  if (categoryId) {
    conditions.push(eq(transactions.categoryId, categoryId));
  }
  const rows = await db
    .select({ total: sql<string>`COALESCE(SUM(${transactions.amountMinor}), 0)` })
    .from(transactions)
    .where(and(...conditions));
  return BigInt(rows[0]?.total ?? "0");
}

export async function getBudgetsWithProgress(userId: string): Promise<BudgetWithProgress[]> {
  const userBudgets = await db
    .select()
    .from(budgets)
    .where(eq(budgets.userId, userId))
    .orderBy(budgets.startDate);

  const results: BudgetWithProgress[] = [];
  for (const budget of userBudgets) {
    const spentMinor = await getSpentMinorForBudget(
      userId,
      budget.categoryId,
      budget.startDate,
      budget.endDate,
      budget.currency,
    );
    const remainingMinor = budget.limitAmountMinor - spentMinor;
    results.push({
      ...budget,
      spentMinor,
      remainingMinor,
      usedPercent: percentOf(spentMinor, budget.limitAmountMinor),
    });
  }
  return results;
}
