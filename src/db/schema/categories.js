/**
 * Categories Schema
 * Corporate Finance Manager - Transaction and expense categories
 */
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
/**
 * Categories table for organizing transactions and expenses
 * Supports hierarchical categorization with parent-child relationships
 */
export const categories = sqliteTable('categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    description: text('description'),
    code: text('code').unique(),
    type: text('type').notNull(), // INCOME, EXPENSE, TRANSFER
    subtype: text('subtype'), // Optional subcategory classification
    // Hierarchical structure
    parentId: integer('parent_id').references(() => categories.id),
    level: integer('level').default(0).notNull(),
    path: text('path'), // Materialized path for efficient queries
    // Display properties
    color: text('color'),
    icon: text('icon'),
    sortOrder: integer('sort_order').default(0),
    // Budget integration
    defaultBudgetAmount: real('default_budget_amount'),
    budgetPeriod: text('budget_period').default('monthly'), // monthly, quarterly, yearly
    // Status and permissions
    isActive: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    isSystem: integer('is_system', { mode: 'boolean' }).default(false).notNull(),
    allowSubcategories: integer('allow_subcategories', { mode: 'boolean' }).default(true).notNull(),
    // Audit fields
    createdAt: text('created_at').default(sql `(datetime('now'))`).notNull(),
    updatedAt: text('updated_at').default(sql `(datetime('now'))`).notNull(),
    createdBy: text('created_by'), // User ID (UUID)
    // Additional metadata
    tags: text('tags'), // JSON array of tags
    rules: text('rules'), // JSON rules for auto-categorization
});
/**
 * Category usage statistics for analytics
 */
export const categoryStats = sqliteTable('category_stats', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
    // Time period for statistics
    period: text('period').notNull(), // YYYY-MM format for monthly, YYYY-QQ for quarterly
    periodType: text('period_type').notNull().default('monthly'), // monthly, quarterly, yearly
    // Transaction statistics
    transactionCount: integer('transaction_count').notNull().default(0),
    totalAmount: real('total_amount').notNull().default(0),
    averageAmount: real('average_amount').notNull().default(0),
    // Budget comparison
    budgetAmount: real('budget_amount'),
    budgetVariance: real('budget_variance'), // actual - budget
    budgetVariancePercent: real('budget_variance_percent'), // (actual - budget) / budget * 100
    // Audit fields
    createdAt: text('created_at').notNull().default(sql `(datetime('now'))`),
    updatedAt: text('updated_at').notNull().default(sql `(datetime('now'))`),
});
