import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { CurrencyCode } from "@/lib/money";

export type PeriodTotals = {
  incomeMinor: bigint;
  expenseMinor: bigint;
};

export async function getPeriodTotals(
  userId: string,
  start: Date,
  end: Date,
  currency: CurrencyCode,
): Promise<PeriodTotals> {
  const result = await db.execute(sql`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount_minor ELSE 0 END), 0)::bigint AS income_minor,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_minor ELSE 0 END), 0)::bigint AS expense_minor
    FROM transactions
    WHERE user_id = ${userId}
      AND status = 'completed'
      AND currency = ${currency}
      AND occurred_at BETWEEN ${start} AND ${end}
      AND deleted_at IS NULL
  `);
  const row = result.rows[0] as Record<string, unknown> | undefined;
  return {
    incomeMinor: BigInt((row?.income_minor as string) ?? "0"),
    expenseMinor: BigInt((row?.expense_minor as string) ?? "0"),
  };
}

export type DailyTrendPoint = {
  date: string;
  incomeMinor: bigint;
  expenseMinor: bigint;
};

export async function getDailyTrend(
  userId: string,
  start: Date,
  end: Date,
  currency: CurrencyCode,
): Promise<DailyTrendPoint[]> {
  const result = await db.execute(sql`
    SELECT
      to_char(occurred_at, 'YYYY-MM-DD') AS day,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount_minor ELSE 0 END), 0)::bigint AS income_minor,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_minor ELSE 0 END), 0)::bigint AS expense_minor
    FROM transactions
    WHERE user_id = ${userId}
      AND status = 'completed'
      AND currency = ${currency}
      AND occurred_at BETWEEN ${start} AND ${end}
      AND deleted_at IS NULL
    GROUP BY day
    ORDER BY day ASC
  `);
  return result.rows.map((row) => {
    const typed = row as Record<string, unknown>;
    return {
      date: String(typed.day),
      incomeMinor: BigInt(typed.income_minor as string),
      expenseMinor: BigInt(typed.expense_minor as string),
    };
  });
}

export type CategoryBreakdownPoint = {
  categoryId: string | null;
  categoryName: string;
  color: string;
  totalMinor: bigint;
};

export async function getCategoryBreakdown(
  userId: string,
  start: Date,
  end: Date,
  currency: CurrencyCode,
  kind: "income" | "expense",
): Promise<CategoryBreakdownPoint[]> {
  const result = await db.execute(sql`
    SELECT
      c.id AS category_id,
      COALESCE(c.name, 'بدون دسته‌بندی') AS category_name,
      COALESCE(c.color, '#64748B') AS color,
      SUM(t.amount_minor)::bigint AS total_minor
    FROM transactions t
    LEFT JOIN categories c ON c.id = t.category_id
    WHERE t.user_id = ${userId}
      AND t.status = 'completed'
      AND t.currency = ${currency}
      AND t.type = ${kind}
      AND t.occurred_at BETWEEN ${start} AND ${end}
      AND t.deleted_at IS NULL
    GROUP BY c.id, c.name, c.color
    ORDER BY total_minor DESC
  `);
  return result.rows.map((row) => {
    const typed = row as Record<string, unknown>;
    return {
      categoryId: typed.category_id ? String(typed.category_id) : null,
      categoryName: String(typed.category_name),
      color: String(typed.color),
      totalMinor: BigInt(typed.total_minor as string),
    };
  });
}

export async function getMonthlyComparison(
  userId: string,
  monthsBack: number,
  currency: CurrencyCode,
): Promise<{ month: string; incomeMinor: bigint; expenseMinor: bigint }[]> {
  const result = await db.execute(sql`
    SELECT
      to_char(date_trunc('month', occurred_at), 'YYYY-MM') AS month,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount_minor ELSE 0 END), 0)::bigint AS income_minor,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount_minor ELSE 0 END), 0)::bigint AS expense_minor
    FROM transactions
    WHERE user_id = ${userId}
      AND status = 'completed'
      AND currency = ${currency}
      AND deleted_at IS NULL
      AND occurred_at >= date_trunc('month', now()) - (${monthsBack} || ' months')::interval
    GROUP BY month
    ORDER BY month ASC
  `);
  return result.rows.map((row) => {
    const typed = row as Record<string, unknown>;
    return {
      month: String(typed.month),
      incomeMinor: BigInt(typed.income_minor as string),
      expenseMinor: BigInt(typed.expense_minor as string),
    };
  });
}
