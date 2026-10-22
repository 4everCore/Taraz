import { z } from "zod";

export const registerSchema = z.object({
  displayName: z.string().trim().min(2, "نام نمایشی باید حداقل ۲ کاراکتر باشد").max(80),
  email: z.string().trim().toLowerCase().email("ایمیل معتبر نیست"),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد").max(200),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("ایمیل معتبر نیست"),
  password: z.string().min(1, "رمز عبور را وارد کنید"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("ایمیل معتبر نیست"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد").max(200),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8, "رمز عبور باید حداقل ۸ کاراکتر باشد").max(200),
});

export const currencyEnum = z.enum(["IRT", "IRR", "USD", "EUR"]);

export const accountSchema = z.object({
  name: z.string().trim().min(1, "نام حساب الزامی است").max(80),
  type: z.enum(["bank", "cash", "wallet", "savings", "credit", "other"]),
  currency: currencyEnum,
  openingBalance: z.string().trim().min(1, "موجودی اولیه الزامی است"),
  allowNegativeBalance: z.boolean().default(true),
});

export const categorySchema = z.object({
  name: z.string().trim().min(1, "نام دسته‌بندی الزامی است").max(60),
  kind: z.enum(["income", "expense"]),
  color: z.string().trim().min(3).max(20).default("#2563EB"),
  icon: z.string().trim().min(1).max(40).default("tag"),
});

export const transactionTypeEnum = z.enum(["income", "expense", "transfer", "adjustment"]);

export const transactionSchema = z
  .object({
    type: transactionTypeEnum,
    accountId: z.string().uuid("حساب را انتخاب کنید"),
    toAccountId: z.string().uuid().optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    amount: z.string().trim().min(1, "مبلغ الزامی است"),
    currency: currencyEnum,
    occurredAt: z.string().trim().min(1, "تاریخ وقوع الزامی است"),
    description: z.string().trim().min(1, "شرح الزامی است").max(200),
    note: z.string().trim().max(1000).optional().nullable(),
    payee: z.string().trim().max(120).optional().nullable(),
    tags: z.array(z.string().trim().min(1).max(30)).max(10).default([]),
    status: z.enum(["completed", "pending", "cancelled"]).default("completed"),
  })
  .superRefine((data, ctx) => {
    if (data.type === "transfer" && !data.toAccountId) {
      ctx.addIssue({ code: "custom", message: "حساب مقصد الزامی است", path: ["toAccountId"] });
    }
    if (data.type === "transfer" && data.toAccountId === data.accountId) {
      ctx.addIssue({ code: "custom", message: "حساب مبدا و مقصد نمی‌توانند یکسان باشند", path: ["toAccountId"] });
    }
    if ((data.type === "income" || data.type === "expense") && !data.categoryId) {
      ctx.addIssue({ code: "custom", message: "دسته‌بندی الزامی است", path: ["categoryId"] });
    }
  });

export const budgetSchema = z.object({
  name: z.string().trim().min(1, "نام بودجه الزامی است").max(80),
  categoryId: z.string().uuid().optional().nullable(),
  period: z.enum(["weekly", "monthly", "custom"]),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().min(1),
  limitAmount: z.string().trim().min(1, "سقف بودجه الزامی است"),
  currency: currencyEnum,
  alertThresholdPercent: z.coerce.number().int().min(1).max(100).default(80),
});

export const recurringSchema = z.object({
  type: z.enum(["income", "expense", "transfer"]),
  accountId: z.string().uuid(),
  toAccountId: z.string().uuid().optional().nullable(),
  categoryId: z.string().uuid().optional().nullable(),
  amount: z.string().trim().min(1),
  currency: currencyEnum,
  description: z.string().trim().min(1).max(200),
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  intervalCount: z.coerce.number().int().min(1).max(365).default(1),
  startDate: z.string().trim().min(1),
  endDate: z.string().trim().optional().nullable(),
});

export const goalSchema = z.object({
  name: z.string().trim().min(1, "نام هدف الزامی است").max(80),
  targetAmount: z.string().trim().min(1),
  currency: currencyEnum,
  targetDate: z.string().trim().optional().nullable(),
  accountId: z.string().uuid().optional().nullable(),
});

export const goalEntrySchema = z.object({
  type: z.enum(["deposit", "withdraw"]),
  amount: z.string().trim().min(1),
  occurredAt: z.string().trim().min(1),
  note: z.string().trim().max(500).optional().nullable(),
});

export const debtSchema = z.object({
  direction: z.enum(["owe", "owed"]),
  counterparty: z.string().trim().min(1, "طرف حساب الزامی است").max(120),
  description: z.string().trim().max(500).optional().nullable(),
  totalAmount: z.string().trim().min(1),
  currency: currencyEnum,
  dueDate: z.string().trim().optional().nullable(),
  interestRatePercent: z.string().trim().optional().nullable(),
});

export const debtPaymentSchema = z.object({
  amount: z.string().trim().min(1),
  occurredAt: z.string().trim().min(1),
  note: z.string().trim().max(500).optional().nullable(),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2).max(80),
  defaultCurrency: currencyEnum,
  timezone: z.string().trim().min(1).max(60),
  useJalaliCalendar: z.boolean(),
});
