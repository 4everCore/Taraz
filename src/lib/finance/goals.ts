import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { savingsGoals, savingsGoalEntries, transactions, financialAccounts } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { parseAmountToMinor } from "@/lib/money";
import { recordAuditLog } from "@/lib/audit";

export async function createGoalEntry(
  userId: string,
  goalId: string,
  input: { type: "deposit" | "withdraw"; amount: string; occurredAt: Date; note?: string | null; fromAccountId?: string | null },
) {
  const goalRows = await db.select().from(savingsGoals).where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId))).limit(1);
  const goal = goalRows[0];
  if (!goal) throw new AppError("هدف پس‌انداز یافت نشد");
  if (goal.status === "completed") throw new AppError("این هدف تکمیل شده و قابل ویرایش نیست");

  const amountMinor = parseAmountToMinor(input.amount, goal.currency);
  if (amountMinor <= 0n) throw new AppError("مبلغ باید بزرگ‌تر از صفر باشد");

  if (input.type === "withdraw" && amountMinor > goal.currentAmountMinor) {
    throw new AppError("مبلغ برداشت نمی‌تواند بیشتر از موجودی هدف باشد");
  }

  return db.transaction(async (tx) => {
    let linkedTransactionId: string | null = null;

    if (goal.accountId && input.fromAccountId) {
      const accountRows = await tx
        .select()
        .from(financialAccounts)
        .where(and(eq(financialAccounts.id, input.fromAccountId), eq(financialAccounts.userId, userId)))
        .limit(1);
      if (!accountRows[0]) throw new AppError("حساب انتخاب‌شده معتبر نیست");

      const sourceAccountId = input.type === "deposit" ? input.fromAccountId : goal.accountId;
      const destinationAccountId = input.type === "deposit" ? goal.accountId : input.fromAccountId;

      const [transferTx] = await tx
        .insert(transactions)
        .values({
          userId,
          type: "transfer",
          status: "completed",
          accountId: sourceAccountId,
          toAccountId: destinationAccountId,
          amountMinor,
          currency: goal.currency,
          occurredAt: input.occurredAt,
          description: input.type === "deposit" ? `واریز به هدف: ${goal.name}` : `برداشت از هدف: ${goal.name}`,
          note: input.note ?? null,
          goalId: goal.id,
        })
        .returning();
      linkedTransactionId = transferTx.id;
    }

    const [entry] = await tx
      .insert(savingsGoalEntries)
      .values({
        goalId: goal.id,
        userId,
        type: input.type,
        amountMinor,
        occurredAt: input.occurredAt,
        note: input.note ?? null,
        transactionId: linkedTransactionId,
      })
      .returning();

    const newCurrentAmount = input.type === "deposit" ? goal.currentAmountMinor + amountMinor : goal.currentAmountMinor - amountMinor;
    const newStatus = newCurrentAmount >= goal.targetAmountMinor && goal.status === "active" ? goal.status : goal.status;

    await tx
      .update(savingsGoals)
      .set({ currentAmountMinor: newCurrentAmount, updatedAt: new Date(), status: newStatus })
      .where(eq(savingsGoals.id, goal.id));

    await recordAuditLog({
      userId,
      action: `goal.${input.type}`,
      entityType: "savings_goal",
      entityId: goal.id,
      metadata: { amountMinor: amountMinor.toString() },
    });

    return entry;
  });
}

export async function listGoalEntries(userId: string, goalId: string) {
  return db
    .select()
    .from(savingsGoalEntries)
    .where(and(eq(savingsGoalEntries.goalId, goalId), eq(savingsGoalEntries.userId, userId)))
    .orderBy(savingsGoalEntries.occurredAt);
}

export function estimateCompletionDate(
  currentAmountMinor: bigint,
  targetAmountMinor: bigint,
  recentMonthlyAverageMinor: bigint,
): { monthsRemaining: number | null; assumption: string } {
  const remaining = targetAmountMinor - currentAmountMinor;
  if (remaining <= 0n) {
    return { monthsRemaining: 0, assumption: "هدف تکمیل شده است" };
  }
  if (recentMonthlyAverageMinor <= 0n) {
    return { monthsRemaining: null, assumption: "داده کافی برای پیش‌بینی از واریزهای اخیر وجود ندارد" };
  }
  const months = Number(remaining) / Number(recentMonthlyAverageMinor);
  return {
    monthsRemaining: Math.ceil(months),
    assumption: "بر اساس میانگین واریز سه ماه اخیر به این هدف محاسبه شده است",
  };
}

export async function toggleGoalStatus(userId: string, goalId: string, status: "active" | "paused" | "completed") {
  const rows = await db.select().from(savingsGoals).where(and(eq(savingsGoals.id, goalId), eq(savingsGoals.userId, userId))).limit(1);
  if (!rows[0]) throw new AppError("هدف پس‌انداز یافت نشد");
  await db.update(savingsGoals).set({ status, updatedAt: new Date() }).where(eq(savingsGoals.id, goalId));
  await recordAuditLog({ userId, action: "goal.status_change", entityType: "savings_goal", entityId: goalId, metadata: { status } });
}
