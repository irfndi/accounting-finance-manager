import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
/**
 * Chart of Accounts - Core financial accounts structure
 * Supports hierarchical account structure with parent-child relationships
 */
export const accounts = sqliteTable("accounts", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    code: text("code").notNull().unique(), // Account code (e.g., "1000", "2000")
    name: text("name").notNull(), // Account name (e.g., "Cash", "Accounts Payable")
    description: text("description"), // Optional detailed description
    // Account classification
    type: text("type").notNull(), // ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE
    subtype: text("subtype"), // Current Asset, Fixed Asset, etc.
    category: text("category"), // Cash, Inventory, Equipment, etc.
    // Hierarchical structure
    parentId: integer("parent_id").references(() => accounts.id),
    level: integer("level").notNull().default(0), // Depth in hierarchy
    path: text("path").notNull(), // Materialized path for efficient queries
    // Account properties
    isActive: integer("is_active").notNull().default(1),
    isSystem: integer("is_system").notNull().default(0), // System accounts cannot be deleted
    allowTransactions: integer("allow_transactions").notNull().default(1),
    // Normal balance (for validation)
    normalBalance: text("normal_balance").notNull(), // DEBIT or CREDIT
    // Financial reporting
    reportCategory: text("report_category"), // For financial statement grouping
    reportOrder: integer("report_order").default(0), // Display order in reports
    // Balance tracking
    currentBalance: real("current_balance").notNull().default(0),
    // Multi-entity support
    entityId: text("entity_id").notNull(), // For multi-company accounting
    // Audit fields
    createdAt: integer("created_at").notNull().$defaultFn(() => Date.now()),
    updatedAt: integer("updated_at").notNull().$defaultFn(() => Date.now()).$onUpdate(() => Date.now()),
    createdBy: text("created_by"),
    updatedBy: text("updated_by"),
});
// Account type enum
export const AccountType = {
    ASSET: "ASSET",
    LIABILITY: "LIABILITY",
    EQUITY: "EQUITY",
    REVENUE: "REVENUE",
    EXPENSE: "EXPENSE",
};
// Normal balance enum
export const NormalBalance = {
    DEBIT: "DEBIT",
    CREDIT: "CREDIT",
};
// Zod schemas for validation - simplified for now
export const insertAccountSchema = z.object({
    code: z.string().min(1).max(20),
    name: z.string().min(1).max(100),
    type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
    normalBalance: z.enum(["DEBIT", "CREDIT"]),
});
export const selectAccountSchema = z.object({
    id: z.number(),
    code: z.string(),
    name: z.string(),
    type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]),
    normalBalance: z.enum(["DEBIT", "CREDIT"]),
});
