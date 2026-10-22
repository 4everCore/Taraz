import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { db } from "@/db";
import { financialAccounts, categories, transactions } from "@/db/schema";
import { AppError } from "@/lib/errors";
import { getAccountBalanceMinor } from "@/lib/finance/accounts";
import { parseAmountToMinor, type CurrencyCode } from "@/lib/money";
import { recordAuditLog } from "@/lib/audit";

export type TransactionInput = {
  type: "income" | "expense" | "transfer" | "adjustment";
  accountId: string;
  toAccountId?: string | null;
  categoryId?: string | null;
  amount: string;
  currency: CurrencyCode;
  occurredAt: Date;
  description: string;
  note?: string | null;
  payee?: string | null;
  tags: string[];
  status: "completed" | "pending" | "cancelled";
};

async function assertAccountOwnership(userId: string, accountId: string) {
  const rows = await db
    .select({ id: financialAccounts.id, currency: financialAccounts.currency, allowNegativeBalance: financialAccounts.allowNegativeBalance, isActive: financialAccounts.isActive })
    .from(financialAccounts)
    .where(and(eq(financialAccounts.id, accountId), eq(financialAccounts.userId, userId)))
    .limit(1);
  const account = rows[0];
  if (!account) {
    throw new AppError("حساب انتخاب‌شده معتبر نیست");
  }
  if (!account.isActive) {
    throw new AppError("حساب انتخاب‌شده غیرفعال است");
  }
  return account;
}

async function assertCategoryOwnership(userId: string, categoryId: string) {
  const rows = await db
    .select({ id: categories.id, userId: categories.userId })
    .from(categories)
    .where(eq(categories.id, categoryId))
    .limit(1);
  const category = rows[0];
  if (!category || (category.userId !== null && category.userId !== userId)) {
    throw new AppError("دسته‌بندی انتخاب‌شده معتبر نیست");
  }
}

function computeHypotheticalDrop(type: TransactionInput["type"]): boolean {
  return type === "expense" || type === "transfer";
}

export async function createTransaction(userId: string, input: TransactionInput) {
  const account = await assertAccountOwnership(userId, input.accountId);
  if (input.type === "transfer") {
    if (!input.toAccountId) throw new AppError("حساب مقصد الزامی است");
    if (input.toAccountId === input.accountId) throw new AppError("حساب مبدا و مقصد نمی‌توانند یکسان باشند");
    await assertAccountOwnership(userId, input.toAccountId);
  }
  if ((input.type === "income" || input.type === "expense") && input.categoryId) {
    await assertCategoryOwnership(userId, input.categoryId);
  }

  const amountMinor = parseAmountToMinor(input.amount, input.currency);
  if (amountMinor <= 0n) {
    throw new AppError("مبلغ باید بزرگ‌تر از صفر باشد");
  }

  if (!account.allowNegativeBalance && computeHypotheticalDrop(input.type) && input.status === "completed") {
    const currentBalance = await getAccountBalanceMinor(userId, input.accountId);
    if (currentBalance !== null && currentBalance - amountMinor < 0n) {
      throw new AppError("این عملیات باعث منفی‌شدن موجودی حساب می‌شود");
    }
  }

  return db.transaction(async (tx) => {
    const [created] = await tx
      .insert(transactions)
      .values({
        userId,
        type: input.type,
        status: input.status,
        accountId: input.accountId,
        toAccountId: input.type === "transfer" ? input.toAccountId : null,
        categoryId: input.type === "transfer" ? null : input.categoryId ?? null,
        amountMinor,
        currency: input.currency,
        occurredAt: input.occurredAt,
        description: input.description,
        note: input.note ?? null,
        payee: input.payee ?? null,
        tags: input.tags,
      })
      .returning();
    await recordAuditLog({
      userId,
      action: "transaction.create",
      entityType: "transaction",
      entityId: created.id,
      metadata: { type: input.type, amountMinor: amountMinor.toString() },
    });
    return created;
  });
}

export async function updateTransaction(userId: string, transactionId: string, input: TransactionInput) {
  const existingRows = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId), isNull(transactions.deletedAt)))
    .limit(1);
  const existing = existingRows[0];
  if (!existing) {
    throw new AppError("تراکنش مورد نظر یافت نشد");
  }
  if (existing.status === "reversed") {
    throw new AppError("تراکنش برگشت‌خورده قابل ویرایش نیست");
  }

  const account = await assertAccountOwnership(userId, input.accountId);
  if (input.type === "transfer") {
    if (!input.toAccountId) throw new AppError("حساب مقصد الزامی است");
    if (input.toAccountId === input.accountId) throw new AppError("حساب مبدا و مقصد نمی‌توانند یکسان باشند");
    await assertAccountOwnership(userId, input.toAccountId);
  }
  if ((input.type === "income" || input.type === "expense") && input.categoryId) {
    await assertCategoryOwnership(userId, input.categoryId);
  }

  const amountMinor = parseAmountToMinor(input.amount, input.currency);
  if (amountMinor <= 0n) {
    throw new AppError("مبلغ باید بزرگ‌تر از صفر باشد");
  }

  if (!account.allowNegativeBalance && computeHypotheticalDrop(input.type) && input.status === "completed") {
    const currentBalance = await getAccountBalanceMinor(userId, input.accountId);
    const priorEffect = existing.accountId === input.accountId && existing.status === "completed"
      ? (existing.type === "expense" || existing.type === "transfer" ? -existing.amountMinor : existing.amountMinor)
      : 0n;
    const projectedBalance = currentBalance !== null ? currentBalance - priorEffect - amountMinor : null;
    if (projectedBalance !== null && projectedBalance < 0n) {
      throw new AppError("این عملیات باعث منفی‌شدن موجودی حساب می‌شود");
    }
  }

  return db.transaction(async (tx) => {
    const [updated] = await tx
      .update(transactions)
      .set({
        type: input.type,
        status: input.status,
        accountId: input.accountId,
        toAccountId: input.type === "transfer" ? input.toAccountId : null,
        categoryId: input.type === "transfer" ? null : input.categoryId ?? null,
        amountMinor,
        currency: input.currency,
        occurredAt: input.occurredAt,
        description: input.description,
        note: input.note ?? null,
        payee: input.payee ?? null,
        tags: input.tags,
        updatedAt: new Date(),
      })
      .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)))
      .returning();
    await recordAuditLog({
      userId,
      action: "transaction.update",
      entityType: "transaction",
      entityId: transactionId,
      metadata: { type: input.type, amountMinor: amountMinor.toString() },
    });
    return updated;
  });
}

export async function softDeleteTransaction(userId: string, transactionId: string) {
  const existingRows = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId), isNull(transactions.deletedAt)))
    .limit(1);
  if (!existingRows[0]) {
    throw new AppError("تراکنش مورد نظر یافت نشد");
  }
  await db
    .update(transactions)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId)));
  await recordAuditLog({ userId, action: "transaction.delete", entityType: "transaction", entityId: transactionId });
}

export async function bulkSoftDeleteTransactions(userId: string, ids: string[]) {
  if (ids.length === 0) return;
  await db
    .update(transactions)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(transactions.userId, userId), inArray(transactions.id, ids), isNull(transactions.deletedAt)));
  await recordAuditLog({ userId, action: "transaction.bulk_delete", entityType: "transaction", metadata: { ids } });
}

export async function reverseTransaction(userId: string, transactionId: string, note?: string) {
  const rows = await db
    .select()
    .from(transactions)
    .where(and(eq(transactions.id, transactionId), eq(transactions.userId, userId), isNull(transactions.deletedAt)))
    .limit(1);
  const original = rows[0];
  if (!original) throw new AppError("تراکنش مورد نظر یافت نشد");
  if (original.status === "reversed") throw new AppError("این تراکنش قبلاً برگشت خورده است");
  if (original.type === "adjustment") throw new AppError("تعدیل‌ها قابل برگشت نیستند");

  return db.transaction(async (tx) => {
    await tx.update(transactions).set({ status: "reversed", updatedAt: new Date() }).where(eq(transactions.id, transactionId));
    const [reversal] = await tx
      .insert(transactions)
      .values({
        userId,
        type: original.type,
        status: "completed",
        accountId: original.type === "transfer" ? original.toAccountId! : original.accountId,
        toAccountId: original.type === "transfer" ? original.accountId : null,
        categoryId: original.categoryId,
        amountMinor: original.amountMinor,
        currency: original.currency,
        occurredAt: new Date(),
        description: `برگشت: ${original.description}`,
        note: note ?? null,
        payee: original.payee,
        tags: original.tags,
        reversedFromId: original.id,
      })
      .returning();
    await recordAuditLog({
      userId,
      action: "transaction.reverse",
      entityType: "transaction",
      entityId: transactionId,
      metadata: { reversalId: reversal.id },
    });
    return reversal;
  });
}

export async function listRecentTransactions(userId: string, limit = 8) {
  return db
    .select()
    .from(transactions)
    .where(and(eq(transactions.userId, userId), isNull(transactions.deletedAt)))
    .orderBy(desc(transactions.occurredAt))
    .limit(limit);
}
