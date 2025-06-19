"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectAccountSchema = exports.insertAccountSchema = exports.NormalBalance = exports.AccountType = exports.accounts = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const zod_1 = require("zod");
/**
 * Chart of Accounts - Core financial accounts structure
 * Supports hierarchical account structure with parent-child relationships
 */
exports.accounts = (0, sqlite_core_1.sqliteTable)("accounts", {
    id: (0, sqlite_core_1.integer)("id").primaryKey({ autoIncrement: true }),
    code: (0, sqlite_core_1.text)("code").notNull().unique(), // Account code (e.g., "1000", "2000")
    name: (0, sqlite_core_1.text)("name").notNull(), // Account name (e.g., "Cash", "Accounts Payable")
    description: (0, sqlite_core_1.text)("description"), // Optional detailed description
    // Account classification
    type: (0, sqlite_core_1.text)("type").notNull(), // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    subtype: (0, sqlite_core_1.text)("subtype"), // Current Asset, Fixed Asset, etc.
    category: (0, sqlite_core_1.text)("category"), // Cash, Inventory, Equipment, etc.
    // Hierarchical structure
    parentId: (0, sqlite_core_1.integer)("parent_id").references(() => exports.accounts.id),
    level: (0, sqlite_core_1.integer)("level").notNull().default(0), // Depth in hierarchy
    path: (0, sqlite_core_1.text)("path").notNull(), // Materialized path for efficient queries
    // Account properties
    isActive: (0, sqlite_core_1.integer)("is_active").notNull().default(1),
    isSystem: (0, sqlite_core_1.integer)("is_system").notNull().default(0), // System accounts cannot be deleted
    allowTransactions: (0, sqlite_core_1.integer)("allow_transactions").notNull().default(1),
    // Normal balance (for validation)
    normalBalance: (0, sqlite_core_1.text)("normal_balance").notNull(), // DEBIT or CREDIT
    // Financial reporting
    reportCategory: (0, sqlite_core_1.text)("report_category"), // For financial statement grouping
    reportOrder: (0, sqlite_core_1.integer)("report_order").default(0), // Display order in reports
    // Balance tracking
    currentBalance: (0, sqlite_core_1.real)("current_balance").notNull().default(0),
    // Multi-entity support
    entityId: (0, sqlite_core_1.text)("entity_id").notNull(), // For multi-company accounting
    // Audit fields
    createdAt: (0, sqlite_core_1.integer)("created_at").notNull().$defaultFn(() => Date.now()),
    updatedAt: (0, sqlite_core_1.integer)("updated_at").notNull().$defaultFn(() => Date.now()).$onUpdate(() => Date.now()),
    createdBy: (0, sqlite_core_1.text)("created_by"),
    updatedBy: (0, sqlite_core_1.text)("updated_by"),
});
// Account type enum
exports.AccountType = {
    ASSET: "ASSET",
    LIABILITY: "LIABILITY",
    EQUITY: "EQUITY",
    REVENUE: "REVENUE",
    EXPENSE: "EXPENSE",
};
// Normal balance enum
exports.NormalBalance = {
    DEBIT: "DEBIT",
    CREDIT: "CREDIT",
};
// Zod schemas for validation - simplified for now
exports.insertAccountSchema = zod_1.z.object({
    code: zod_1.z.string().min(1).max(20),
    name: zod_1.z.string().min(1).max(100),
    type: zod_1.z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
    normalBalance: zod_1.z.enum(["DEBIT", "CREDIT"]),
});
exports.selectAccountSchema = zod_1.z.object({
    id: zod_1.z.number(),
    code: zod_1.z.string(),
    name: zod_1.z.string(),
    type: zod_1.z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
    normalBalance: zod_1.z.enum(["DEBIT", "CREDIT"]),
});
