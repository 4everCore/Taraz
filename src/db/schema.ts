import { sql } from "drizzle-orm";
import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const currencyCodeEnum = pgEnum("currency_code", ["IRT", "IRR", "USD", "EUR"]);
export const themePreferenceEnum = pgEnum("theme_preference", ["light", "dark", "system"]);
export const accountTypeEnum = pgEnum("account_type", [
  "bank",
  "cash",
  "wallet",
  "savings",
  "credit",
  "other",
]);
export const categoryKindEnum = pgEnum("category_kind", ["income", "expense"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
  "transfer",
  "adjustment",
]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "completed",
  "pending",
  "cancelled",
  "reversed",
]);
export const budgetPeriodEnum = pgEnum("budget_period", ["weekly", "monthly", "custom"]);
export const recurrenceFrequencyEnum = pgEnum("recurrence_frequency", [
  "daily",
  "weekly",
  "monthly",
  "yearly",
]);
export const goalStatusEnum = pgEnum("goal_status", ["active", "paused", "completed"]);
export const goalEntryTypeEnum = pgEnum("goal_entry_type", ["deposit", "withdraw"]);
export const debtDirectionEnum = pgEnum("debt_direction", ["owe", "owed"]);
export const debtStatusEnum = pgEnum("debt_status", ["open", "partial", "settled"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  defaultCurrency: currencyCodeEnum("default_currency").notNull().default("IRT"),
  timezone: text("timezone").notNull().default("Asia/Tehran"),
  useJalaliCalendar: boolean("use_jalali_calendar").notNull().default(true),
  themePreference: themePreferenceEnum("theme_preference").notNull().default("system"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  failedLoginCount: integer("failed_login_count").notNull().default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("users_email_unique_idx").on(table.email)]);

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
}, (table) => [
  index("sessions_user_id_idx").on(table.userId),
  uniqueIndex("sessions_token_hash_idx").on(table.tokenHash),
]);

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("password_reset_token_hash_idx").on(table.tokenHash)]);

export const loginAttempts = pgTable("login_attempts", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull(),
  ipAddress: text("ip_address"),
  success: boolean("success").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("login_attempts_email_idx").on(table.email, table.createdAt)]);

export const financialAccounts = pgTable("financial_accounts", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: accountTypeEnum("type").notNull(),
  currency: currencyCodeEnum("currency").notNull().default("IRT"),
  openingBalanceMinor: bigint("opening_balance_minor", { mode: "bigint" }).notNull().default(sql`0`),
  isActive: boolean("is_active").notNull().default(true),
  allowNegativeBalance: boolean("allow_negative_balance").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("financial_accounts_user_id_idx").on(table.userId)]);

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  kind: categoryKindEnum("kind").notNull(),
  icon: text("icon").notNull().default("tag"),
  color: text("color").notNull().default("#2563EB"),
  isSystem: boolean("is_system").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("categories_user_id_idx").on(table.userId)]);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  status: transactionStatusEnum("status").notNull().default("completed"),
  accountId: uuid("account_id").notNull().references(() => financialAccounts.id, { onDelete: "restrict" }),
  toAccountId: uuid("to_account_id").references(() => financialAccounts.id, { onDelete: "restrict" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
  currency: currencyCodeEnum("currency").notNull(),
  counterAmountMinor: bigint("counter_amount_minor", { mode: "bigint" }),
  counterCurrency: currencyCodeEnum("counter_currency"),
  exchangeRate: text("exchange_rate"),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  description: text("description").notNull(),
  note: text("note"),
  payee: text("payee"),
  tags: text("tags").array().notNull().default([]),
  reversedFromId: uuid("reversed_from_id"),
  goalId: uuid("goal_id"),
  debtId: uuid("debt_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
}, (table) => [
  index("transactions_user_id_idx").on(table.userId),
  index("transactions_account_id_idx").on(table.accountId),
  index("transactions_category_id_idx").on(table.categoryId),
  index("transactions_occurred_at_idx").on(table.occurredAt),
  index("transactions_user_occurred_idx").on(table.userId, table.occurredAt),
]);

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "cascade" }),
  period: budgetPeriodEnum("period").notNull().default("monthly"),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  limitAmountMinor: bigint("limit_amount_minor", { mode: "bigint" }).notNull(),
  currency: currencyCodeEnum("currency").notNull().default("IRT"),
  alertThresholdPercent: integer("alert_threshold_percent").notNull().default(80),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("budgets_user_id_idx").on(table.userId)]);

export const budgetRevisions = pgTable("budget_revisions", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  budgetId: uuid("budget_id").notNull().references(() => budgets.id, { onDelete: "cascade" }),
  previousLimitMinor: bigint("previous_limit_minor", { mode: "bigint" }).notNull(),
  newLimitMinor: bigint("new_limit_minor", { mode: "bigint" }).notNull(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("budget_revisions_budget_id_idx").on(table.budgetId)]);

export const recurringTransactions = pgTable("recurring_transactions", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: transactionTypeEnum("type").notNull(),
  accountId: uuid("account_id").notNull().references(() => financialAccounts.id, { onDelete: "restrict" }),
  toAccountId: uuid("to_account_id").references(() => financialAccounts.id, { onDelete: "restrict" }),
  categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
  amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
  currency: currencyCodeEnum("currency").notNull().default("IRT"),
  description: text("description").notNull(),
  frequency: recurrenceFrequencyEnum("frequency").notNull(),
  intervalCount: integer("interval_count").notNull().default(1),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  nextRunDate: timestamp("next_run_date", { withTimezone: true }).notNull(),
  lastRunDate: timestamp("last_run_date", { withTimezone: true }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("recurring_transactions_user_id_idx").on(table.userId)]);

export const recurringExecutionLogs = pgTable("recurring_execution_logs", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  recurringId: uuid("recurring_id").notNull().references(() => recurringTransactions.id, { onDelete: "cascade" }),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }).notNull(),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  executedAt: timestamp("executed_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [uniqueIndex("recurring_execution_unique_idx").on(table.recurringId, table.scheduledFor)]);

export const savingsGoals = pgTable("savings_goals", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  accountId: uuid("account_id").references(() => financialAccounts.id, { onDelete: "set null" }),
  name: text("name").notNull(),
  targetAmountMinor: bigint("target_amount_minor", { mode: "bigint" }).notNull(),
  currentAmountMinor: bigint("current_amount_minor", { mode: "bigint" }).notNull().default(sql`0`),
  currency: currencyCodeEnum("currency").notNull().default("IRT"),
  targetDate: timestamp("target_date", { withTimezone: true }),
  status: goalStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("savings_goals_user_id_idx").on(table.userId)]);

export const savingsGoalEntries = pgTable("savings_goal_entries", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  goalId: uuid("goal_id").notNull().references(() => savingsGoals.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: goalEntryTypeEnum("type").notNull(),
  amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  note: text("note"),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("savings_goal_entries_goal_id_idx").on(table.goalId)]);

export const debts = pgTable("debts", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  direction: debtDirectionEnum("direction").notNull(),
  counterparty: text("counterparty").notNull(),
  description: text("description"),
  totalAmountMinor: bigint("total_amount_minor", { mode: "bigint" }).notNull(),
  settledAmountMinor: bigint("settled_amount_minor", { mode: "bigint" }).notNull().default(sql`0`),
  currency: currencyCodeEnum("currency").notNull().default("IRT"),
  dueDate: timestamp("due_date", { withTimezone: true }),
  interestRatePercent: text("interest_rate_percent"),
  status: debtStatusEnum("status").notNull().default("open"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("debts_user_id_idx").on(table.userId)]);

export const debtPayments = pgTable("debt_payments", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  debtId: uuid("debt_id").notNull().references(() => debts.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountMinor: bigint("amount_minor", { mode: "bigint" }).notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  note: text("note"),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("debt_payments_debt_id_idx").on(table.debtId)]);

export const attachments = pgTable("attachments", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  transactionId: uuid("transaction_id").references(() => transactions.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  storedPath: text("stored_path").notNull(),
  mimeType: text("mime_type").notNull(),
  sizeBytes: integer("size_bytes").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("attachments_transaction_id_idx").on(table.transactionId)]);

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id"),
  metadata: jsonb("metadata"),
  ipAddress: text("ip_address"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [index("audit_logs_user_id_idx").on(table.userId, table.createdAt)]);
