import { sql } from "drizzle-orm";
import { db } from "@/db";
import type { CurrencyCode } from "@/lib/money";

export type AccountBalanceRow = {
  id: string;
  name: string;
  type: string;
  currency: CurrencyCode;
  isActive: boolean;
  openingBalanceMinor: bigint;
  balanceMinor: bigint;
};

export async function getAccountBalancesForUser(userId: string): Promise<AccountBalanceRow[]> {
  const result = await db.execute(sql`
    SELECT
      a.id AS id,
      a.name AS name,
      a.type AS type,
      a.currency AS currency,
      a.is_active AS is_active,
      a.opening_balance_minor AS opening_balance_minor,
      (
        a.opening_balance_minor
        + COALESCE(SUM(
            CASE
              WHEN t.account_id = a.id AND t.status = 'completed' AND t.type = 'income' THEN t.amount_minor
              WHEN t.account_id = a.id AND t.status = 'completed' AND t.type = 'expense' THEN -t.amount_minor
              WHEN t.account_id = a.id AND t.status = 'completed' AND t.type = 'transfer' THEN -t.amount_minor
              WHEN t.account_id = a.id AND t.status = 'completed' AND t.type = 'adjustment' THEN t.amount_minor
              ELSE 0
            END
          ), 0)
        + COALESCE(SUM(
            CASE
              WHEN t.to_account_id = a.id AND t.status = 'completed' AND t.type = 'transfer'
                THEN COALESCE(t.counter_amount_minor, t.amount_minor)
              ELSE 0
            END
          ), 0)
      )::bigint AS balance_minor
    FROM financial_accounts a
    LEFT JOIN transactions t
      ON (t.account_id = a.id OR t.to_account_id = a.id)
      AND t.user_id = a.user_id
      AND t.deleted_at IS NULL
    WHERE a.user_id = ${userId}
    GROUP BY a.id
    ORDER BY a.sort_order ASC, a.created_at ASC
  `);

  return result.rows.map((row) => {
    const typed = row as Record<string, unknown>;
    return {
      id: String(typed.id),
      name: String(typed.name),
      type: String(typed.type),
      currency: typed.currency as CurrencyCode,
      isActive: Boolean(typed.is_active),
      openingBalanceMinor: BigInt(typed.opening_balance_minor as string),
      balanceMinor: BigInt(typed.balance_minor as string),
    };
  });
}

export async function getAccountBalanceMinor(userId: string, accountId: string): Promise<bigint | null> {
  const balances = await getAccountBalancesForUser(userId);
  const match = balances.find((row) => row.id === accountId);
  return match ? match.balanceMinor : null;
}

export async function getTotalNetWorthMinorByCurrency(userId: string): Promise<Record<string, bigint>> {
  const balances = await getAccountBalancesForUser(userId);
  const totals: Record<string, bigint> = {};
  for (const row of balances) {
    if (!row.isActive) continue;
    totals[row.currency] = (totals[row.currency] ?? 0n) + row.balanceMinor;
  }
  return totals;
}
