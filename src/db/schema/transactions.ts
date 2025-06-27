import { z } from "zod";
import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { accounts } from "./accounts";

/**
 * Financial Transactions - Header record for double-entry transactions
 * Each transaction contains multiple journal entries that must balance
 */
export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // Transaction identification
  transactionNumber: text("transaction_number").notNull().unique(), // Auto-generated or manual
  reference: text("reference"), // External reference (invoice #, check #, etc.)
  description: text("description").notNull(), // Transaction description
  
  // Transaction details
  transactionDate: integer("transaction_date", { mode: "timestamp" }).notNull(),
  postingDate: integer("posting_date", { mode: "timestamp" }).notNull(),
  
  // Transaction classification
  type: text("type").notNull(), // JOURNAL, PAYMENT, RECEIPT, ADJUSTMENT, etc.
  source: text("source").notNull(), // MANUAL, IMPORT, API, etc.
  category: text("category"), // For grouping similar transactions
  
  // Financial amounts
  totalAmount: real("total_amount").notNull(), // Total transaction amount
  
  // Transaction status
  status: text("status").notNull().default("DRAFT"), // DRAFT, POSTED, REVERSED, VOID
  isReversed: integer("is_reversed", { mode: "boolean" }).notNull().default(false),
  reversedTransactionId: integer("reversed_transaction_id").references((): any => transactions.id),
  
  // Multi-entity support
  entityId: text("entity_id"), // For multi-company accounting
  
  // Approval workflow
  approvedBy: text("approved_by"),
  approvedAt: integer("approved_at", { mode: "timestamp" }),
  
  // Document attachments
  documentCount: integer("document_count").notNull().default(0),
  
  // Audit fields
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  createdBy: text("created_by").notNull(),
  updatedBy: text("updated_by"),
  
  // Posting audit
  postedAt: integer("posted_at", { mode: "timestamp" }),
  postedBy: text("posted_by"),
});

/**
 * Journal Entries - Individual debit/credit entries for each transaction
 * Implements double-entry accounting where debits must equal credits
 */
export const journalEntries = sqliteTable("journal_entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // Link to parent transaction
  transactionId: integer("transaction_id").notNull().references((): any => transactions.id, { onDelete: "cascade" }),
  
  // Entry identification
  lineNumber: integer("line_number").notNull(), // Order within transaction
  
  // Account reference
  accountId: integer("account_id").notNull().references((): any => accounts.id),
  
  // Entry details
  description: text("description"), // Line-specific description
  memo: text("memo"), // Additional notes
  
  // Amounts (one will be zero, the other will have the amount)
  debitAmount: real("debit_amount").notNull().default(0),
  creditAmount: real("credit_amount").notNull().default(0),
  
  // Multi-currency support (future)
  currencyCode: text("currency_code").default("USD"),
  exchangeRate: real("exchange_rate").default(1.0),
  
  // Reconciliation
  isReconciled: integer("is_reconciled", { mode: "boolean" }).notNull().default(false),
  reconciledAt: integer("reconciled_at", { mode: "timestamp" }),
  reconciliationReference: text("reconciliation_reference"),
  
  // Multi-entity support
  entityId: text("entity_id"),
  
  // Audit fields
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// Transaction type enum
export const TransactionType = {
  JOURNAL: "JOURNAL",
  PAYMENT: "PAYMENT",
  RECEIPT: "RECEIPT",
  ADJUSTMENT: "ADJUSTMENT",
  TRANSFER: "TRANSFER",
  ACCRUAL: "ACCRUAL",
  DEPRECIATION: "DEPRECIATION",
} as const;

export type TransactionType = typeof TransactionType[keyof typeof TransactionType];

// Transaction status enum
export const TransactionStatus = {
  DRAFT: "DRAFT",
  POSTED: "POSTED",
  REVERSED: "REVERSED",
  VOID: "VOID",
} as const;

export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];

// Transaction source enum
export const TransactionSource = {
  MANUAL: "MANUAL",
  IMPORT: "IMPORT",
  API: "API",
  SYSTEM: "SYSTEM",
} as const;

export type TransactionSource = typeof TransactionSource[keyof typeof TransactionSource];

// Zod schemas for validation - simplified for now
export const insertTransactionSchema = z.object({
  transactionNumber: z.string().min(1).max(50),
  description: z.string().min(1).max(500),
  type: z.enum(["JOURNAL", "PAYMENT", "RECEIPT", "ADJUSTMENT", "TRANSFER", "ACCRUAL", "DEPRECIATION"]),
  source: z.enum(["MANUAL", "IMPORT", "API", "SYSTEM"]),
  status: z.enum(["DRAFT", "POSTED", "REVERSED", "VOID"]),
  totalAmount: z.number().positive(),
});

export const insertJournalEntrySchema = z.object({
  transactionId: z.number(),
  accountId: z.number(),
  debitAmount: z.number().min(0),
  creditAmount: z.number().min(0),
  description: z.string().max(500).optional(),
});

export const selectTransactionSchema = z.object({
  id: z.number(),
  transactionNumber: z.string(),
  description: z.string(),
  type: z.enum(["JOURNAL", "PAYMENT", "RECEIPT", "ADJUSTMENT", "TRANSFER", "ACCRUAL", "DEPRECIATION"]),
  status: z.enum(["DRAFT", "POSTED", "REVERSED", "VOID"]),
});

export const selectJournalEntrySchema = z.object({
  id: z.number(),
  transactionId: z.number(),
  accountId: z.number(),
  debitAmount: z.number(),
  creditAmount: z.number(),
});

export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type SelectTransaction = z.infer<typeof selectTransactionSchema>;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type SelectJournalEntry = z.infer<typeof selectJournalEntrySchema>;