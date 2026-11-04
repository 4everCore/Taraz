import { and, eq, lte } from "drizzle-orm";
import { db } from "@/db";
import { recurringTransactions, recurringExecutionLogs, transactions } from "@/db/schema";
import { recordAuditLog } from "@/lib/audit";

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function addInterval(date: Date, frequency: string, intervalCount: number): Date {
  const next = new Date(date.getTime());
  if (frequency === "daily") {
    next.setDate(next.getDate() + intervalCount);
  } else if (frequency === "weekly") {
    next.setDate(next.getDate() + 7 * intervalCount);
  } else if (frequency === "monthly") {
    // Set day to 1 first so adding months never overflows into the next month
    // (e.g. Jan 31 + 1 month must become the last day of February, not March 3).
    const day = next.getDate();
    next.setDate(1);
    next.setMonth(next.getMonth() + intervalCount);
    next.setDate(Math.min(day, daysInMonth(next.getFullYear(), next.getMonth())));
  } else if (frequency === "yearly") {
    // Same overflow guard for leap-day (Feb 29) schedules.
    const day = next.getDate();
    next.setDate(1);
    next.setFullYear(next.getFullYear() + intervalCount);
    next.setDate(Math.min(day, daysInMonth(next.getFullYear(), next.getMonth())));
  }
  return next;
}

const MAX_ITERATIONS_PER_RUN = 60;

export async function processDueRecurringTransactions(userId: string): Promise<number> {
  const now = new Date();
  const due = await db
    .select()
    .from(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.userId, userId),
        eq(recurringTransactions.isActive, true),
        lte(recurringTransactions.nextRunDate, now),
      ),
    );

  let processedCount = 0;

  for (const recurring of due) {
    let cursor = recurring.nextRunDate;
    let iterations = 0;

    while (cursor <= now && iterations < MAX_ITERATIONS_PER_RUN) {
      if (recurring.endDate && cursor > recurring.endDate) {
        break;
      }
      iterations += 1;
      const scheduledFor = cursor;

      try {
        await db.transaction(async (tx) => {
          const [logRow] = await tx
            .insert(recurringExecutionLogs)
            .values({ recurringId: recurring.id, scheduledFor })
            .onConflictDoNothing({ target: [recurringExecutionLogs.recurringId, recurringExecutionLogs.scheduledFor] })
            .returning();

          if (!logRow) {
            return;
          }

          const [createdTransaction] = await tx
            .insert(transactions)
            .values({
              userId,
              type: recurring.type,
              status: "completed",
              accountId: recurring.accountId,
              toAccountId: recurring.toAccountId,
              categoryId: recurring.categoryId,
              amountMinor: recurring.amountMinor,
              currency: recurring.currency,
              occurredAt: scheduledFor,
              description: recurring.description,
              note: "ثبت خودکار از تراکنش تکرارشونده",
            })
            .returning();

          await tx
            .update(recurringExecutionLogs)
            .set({ transactionId: createdTransaction.id })
            .where(eq(recurringExecutionLogs.id, logRow.id));

          processedCount += 1;
        });
      } catch {
        break;
      }

      cursor = addInterval(cursor, recurring.frequency, recurring.intervalCount);
    }

    const isEnded = recurring.endDate ? cursor > recurring.endDate : false;
    await db
      .update(recurringTransactions)
      .set({ nextRunDate: cursor, lastRunDate: now, isActive: !isEnded, updatedAt: new Date() })
      .where(eq(recurringTransactions.id, recurring.id));
  }

  if (processedCount > 0) {
    await recordAuditLog({
      userId,
      action: "recurring.auto_process",
      entityType: "recurring_transaction",
      metadata: { processedCount },
    });
  }

  return processedCount;
}

export async function getUpcomingRecurring(userId: string, withinDays = 14) {
  const horizon = new Date(Date.now() + withinDays * 24 * 60 * 60 * 1000);
  return db
    .select()
    .from(recurringTransactions)
    .where(
      and(
        eq(recurringTransactions.userId, userId),
        eq(recurringTransactions.isActive, true),
        lte(recurringTransactions.nextRunDate, horizon),
      ),
    )
    .orderBy(recurringTransactions.nextRunDate);
}
