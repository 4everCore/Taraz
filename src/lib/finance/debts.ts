import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { debts, debtPayments, transactions, financialAccounts, categories } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { parseAmountToMinor } from "@/lib/money";
import { getAccountBalanceMinor } from "@/lib/finance/accounts";
import { recordAuditLog } from "@/lib/audit";

export async function recordDebtPayment(
  userId: string,
  debtId: string,
  input: { amount: string; occurredAt: Date; note?: string | null; accountId?: string | null; categoryId?: string | null },
) {
  const debtRows = await db.select().from(debts).where(and(eq(debts.id, debtId), eq(debts.userId, userId))).limit(1);
  const debt = debtRows[0];
  if (!debt) throw new AppError("مورد بدهی یافت نشد");
  if (debt.status === "settled") throw new AppError("این مورد قبلاً تسویه شده است");

  const amountMinor = parseAmountToMinor(input.amount, debt.currency);
  if (amountMinor <= 0n) throw new AppError("مبلغ باید بزرگ‌تر از صفر باشد");

  const remaining = debt.totalAmountMinor - debt.settledAmountMinor;
  if (amountMinor > remaining) {
    throw new AppError("مبلغ پرداخت نمی‌تواند بیشتر از مانده بدهی باشد");
  }

  if (input.categoryId) {
    const categoryRows = await db
      .select({ id: categories.id, userId: categories.userId })
      .from(categories)
      .where(eq(categories.id, input.categoryId))
      .limit(1);
    const category = categoryRows[0];
    if (!category || (category.userId !== null && category.userId !== userId)) {
      throw new AppError("دسته‌بندی انتخاب‌شده معتبر نیست");
    }
  }

  if (input.accountId && debt.direction === "owe") {
    const accountRows = await db
      .select({ id: financialAccounts.id, allowNegativeBalance: financialAccounts.allowNegativeBalance })
      .from(financialAccounts)
      .where(and(eq(financialAccounts.id, input.accountId), eq(financialAccounts.userId, userId)))
      .limit(1);
    const account = accountRows[0];
    if (!account) throw new AppError("حساب انتخاب‌شده معتبر نیست");
    if (!account.allowNegativeBalance) {
      const balance = await getAccountBalanceMinor(userId, input.accountId);
      if (balance !== null && balance - amountMinor < 0n) {
        throw new AppError("این پرداخت باعث منفی‌شدن موجودی حساب می‌شود");
      }
    }
  }

  return db.transaction(async (tx) => {
    let linkedTransactionId: string | null = null;

    if (input.accountId) {
      const accountRows = await tx
        .select()
        .from(financialAccounts)
        .where(and(eq(financialAccounts.id, input.accountId), eq(financialAccounts.userId, userId)))
        .limit(1);
      if (!accountRows[0]) throw new AppError("حساب انتخاب‌شده معتبر نیست");

      const [transactionRow] = await tx
        .insert(transactions)
        .values({
          userId,
          type: debt.direction === "owe" ? "expense" : "income",
          status: "completed",
          accountId: input.accountId,
          categoryId: input.categoryId ?? null,
          amountMinor,
          currency: debt.currency,
          occurredAt: input.occurredAt,
          description:
            debt.direction === "owe"
              ? `پرداخت بدهی به ${debt.counterparty}`
              : `دریافت مطالبات از ${debt.counterparty}`,
          note: input.note ?? null,
          payee: debt.counterparty,
          debtId: debt.id,
        })
        .returning();
      linkedTransactionId = transactionRow.id;
    }

    const [payment] = await tx
      .insert(debtPayments)
      .values({
        debtId: debt.id,
        userId,
        amountMinor,
        occurredAt: input.occurredAt,
        note: input.note ?? null,
        transactionId: linkedTransactionId,
      })
      .returning();

    const newSettledAmount = debt.settledAmountMinor + amountMinor;
    const newStatus = newSettledAmount >= debt.totalAmountMinor ? "settled" : newSettledAmount > 0n ? "partial" : "open";

    await tx
      .update(debts)
      .set({ settledAmountMinor: newSettledAmount, status: newStatus, updatedAt: new Date() })
      .where(eq(debts.id, debt.id));

    await recordAuditLog({
      userId,
      action: "debt.payment",
      entityType: "debt",
      entityId: debt.id,
      metadata: { amountMinor: amountMinor.toString() },
    });

    return payment;
  });
}

export async function listDebtPayments(userId: string, debtId: string) {
  return db
    .select()
    .from(debtPayments)
    .where(and(eq(debtPayments.debtId, debtId), eq(debtPayments.userId, userId)))
    .orderBy(debtPayments.occurredAt);
}
