"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectJournalEntrySchema = exports.selectTransactionSchema = exports.insertJournalEntrySchema = exports.insertTransactionSchema = exports.TransactionSource = exports.TransactionStatus = exports.TransactionType = exports.journalEntries = exports.transactions = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const zod_1 = require("zod");
const accounts_1 = require("./accounts");
/**
 * Financial Transactions - Header record for double-entry transactions
 * Each transaction contains multiple journal entries that must balance
 */
exports.transactions = (0, sqlite_core_1.sqliteTable)("transactions", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    // Transaction identification
    transactionNumber: (0, sqlite_core_1.text)("transaction_number").notNull().unique(), // Auto-generated or manual
    reference: (0, sqlite_core_1.text)("reference"), // External reference (invoice #, check #, etc.)
    description: (0, sqlite_core_1.text)("description").notNull(), // Transaction description
    // Transaction details
    transactionDate: (0, sqlite_core_1.integer)("transaction_date", { mode: "timestamp" }).notNull(),
    postingDate: (0, sqlite_core_1.integer)("posting_date", { mode: "timestamp" }).notNull(),
    // Transaction classification
    type: (0, sqlite_core_1.text)("type").notNull(), // JOURNAL, PAYMENT, RECEIPT, ADJUSTMENT, etc.
    source: (0, sqlite_core_1.text)("source").notNull(), // MANUAL, IMPORT, API, etc.
    category: (0, sqlite_core_1.text)("category"), // For grouping similar transactions
    // Financial amounts
    totalAmount: (0, sqlite_core_1.real)("total_amount").notNull(), // Total transaction amount
    // Transaction status
    status: (0, sqlite_core_1.text)("status").notNull().default("DRAFT"), // DRAFT, POSTED, REVERSED, VOID
    isReversed: (0, sqlite_core_1.integer)("is_reversed", { mode: "boolean" }).notNull().default(false),
    reversedTransactionId: (0, sqlite_core_1.integer)("reversed_transaction_id").references(() => exports.transactions.id),
    // Multi-entity support
    entityId: (0, sqlite_core_1.text)("entity_id"), // For multi-company accounting
    // Approval workflow
    approvedBy: (0, sqlite_core_1.text)("approved_by"),
    approvedAt: (0, sqlite_core_1.integer)("approved_at", { mode: "timestamp" }),
    // Document attachments
    documentCount: (0, sqlite_core_1.integer)("document_count").notNull().default(0),
    // Audit fields
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: (0, sqlite_core_1.integer)("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    createdBy: (0, sqlite_core_1.text)("created_by").notNull(),
    updatedBy: (0, sqlite_core_1.text)("updated_by"),
    // Posting audit
    postedAt: (0, sqlite_core_1.integer)("posted_at", { mode: "timestamp" }),
    postedBy: (0, sqlite_core_1.text)("posted_by"),
});
/**
 * Journal Entries - Individual debit/credit entries for each transaction
 * Implements double-entry accounting where debits must equal credits
 */
exports.journalEntries = (0, sqlite_core_1.sqliteTable)("journal_entries", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    // Link to parent transaction
    transactionId: (0, sqlite_core_1.integer)("transaction_id").notNull().references(() => exports.transactions.id, { onDelete: "cascade" }),
    // Entry identification
    lineNumber: (0, sqlite_core_1.integer)("line_number").notNull(), // Order within transaction
    // Account reference
    accountId: (0, sqlite_core_1.integer)("account_id").notNull().references(() => accounts_1.accounts.id),
    // Entry details
    description: (0, sqlite_core_1.text)("description"), // Line-specific description
    memo: (0, sqlite_core_1.text)("memo"), // Additional notes
    // Amounts (one will be zero, the other will have the amount)
    debitAmount: (0, sqlite_core_1.real)("debit_amount").notNull().default(0),
    creditAmount: (0, sqlite_core_1.real)("credit_amount").notNull().default(0),
    // Multi-currency support (future)
    currencyCode: (0, sqlite_core_1.text)("currency_code").default("USD"),
    exchangeRate: (0, sqlite_core_1.real)("exchange_rate").default(1.0),
    // Reconciliation
    isReconciled: (0, sqlite_core_1.integer)("is_reconciled", { mode: "boolean" }).notNull().default(false),
    reconciledAt: (0, sqlite_core_1.integer)("reconciled_at", { mode: "timestamp" }),
    reconciliationReference: (0, sqlite_core_1.text)("reconciliation_reference"),
    // Multi-entity support
    entityId: (0, sqlite_core_1.text)("entity_id"),
    // Audit fields
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: (0, sqlite_core_1.integer)("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
// Transaction type enum
exports.TransactionType = {
    JOURNAL: "JOURNAL",
    PAYMENT: "PAYMENT",
    RECEIPT: "RECEIPT",
    ADJUSTMENT: "ADJUSTMENT",
    TRANSFER: "TRANSFER",
    ACCRUAL: "ACCRUAL",
    DEPRECIATION: "DEPRECIATION",
};
// Transaction status enum
exports.TransactionStatus = {
    DRAFT: "DRAFT",
    POSTED: "POSTED",
    REVERSED: "REVERSED",
    VOID: "VOID",
};
// Transaction source enum
exports.TransactionSource = {
    MANUAL: "MANUAL",
    IMPORT: "IMPORT",
    API: "API",
    SYSTEM: "SYSTEM",
};
// Zod schemas for validation - simplified for now
exports.insertTransactionSchema = zod_1.z.object({
    transactionNumber: zod_1.z.string().min(1).max(50),
    description: zod_1.z.string().min(1).max(500),
    type: zod_1.z.enum(["JOURNAL", "PAYMENT", "RECEIPT", "ADJUSTMENT", "TRANSFER", "ACCRUAL", "DEPRECIATION"]),
    source: zod_1.z.enum(["MANUAL", "IMPORT", "API", "SYSTEM"]),
    status: zod_1.z.enum(["DRAFT", "POSTED", "REVERSED", "VOID"]),
    totalAmount: zod_1.z.number().positive(),
});
exports.insertJournalEntrySchema = zod_1.z.object({
    transactionId: zod_1.z.number(),
    accountId: zod_1.z.number(),
    debitAmount: zod_1.z.number().min(0),
    creditAmount: zod_1.z.number().min(0),
    description: zod_1.z.string().max(500).optional(),
});
exports.selectTransactionSchema = zod_1.z.object({
    id: zod_1.z.number(),
    transactionNumber: zod_1.z.string(),
    description: zod_1.z.string(),
    type: zod_1.z.enum(["JOURNAL", "PAYMENT", "RECEIPT", "ADJUSTMENT", "TRANSFER", "ACCRUAL", "DEPRECIATION"]),
    status: zod_1.z.enum(["DRAFT", "POSTED", "REVERSED", "VOID"]),
});
exports.selectJournalEntrySchema = zod_1.z.object({
    id: zod_1.z.number(),
    transactionId: zod_1.z.number(),
    accountId: zod_1.z.number(),
    debitAmount: zod_1.z.number(),
    creditAmount: zod_1.z.number(),
});
