/**
 * Budgets Schema
 * Corporate Finance Manager - Budget planning and tracking
 */

import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";
import { categories } from "./categories";

/**
 * Budget periods for organizing budgets by time
 */
export const budgetPeriods = sqliteTable("budget_periods", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // Period identification
  name: text("name").notNull(), // "Q1 2024", "January 2024", "FY 2024"
  description: text("description"),
  
  // Period timing
  periodType: text("period_type").notNull(), // monthly, quarterly, yearly, custom
  startDate: text("start_date").notNull(), // ISO date string
  endDate: text("end_date").notNull(), // ISO date string
  
  // Period status
  status: text("status").notNull().default("draft"), // draft, active, closed, archived
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  
  // Fiscal year information
  fiscalYear: integer("fiscal_year").notNull(),
  fiscalQuarter: integer("fiscal_quarter"), // 1-4 for quarterly periods
  fiscalMonth: integer("fiscal_month"), // 1-12 for monthly periods
  
  // Audit fields
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  createdBy: text("created_by"), // User ID (UUID)
});

/**
 * Main budgets table for budget line items
 */
export const budgets = sqliteTable("budgets", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // Budget identification
  name: text("name").notNull(),
  description: text("description"),
  code: text("code").unique(), // Optional budget code
  
  // Period and category association
  budgetPeriodId: integer("budget_period_id").notNull().references(() => budgetPeriods.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categories.id),
  
  // Budget amounts
  plannedAmount: real("planned_amount").notNull().default(0),
  revisedAmount: real("revised_amount"), // For budget revisions
  actualAmount: real("actual_amount").notNull().default(0),
  
  // Variance tracking
  variance: real("variance").notNull().default(0), // Actual - Planned
  variancePercent: real("variance_percent").notNull().default(0),
  
  // Budget type and behavior
  budgetType: text("budget_type").notNull(), // REVENUE, EXPENSE, CAPITAL, CASH_FLOW
  allocationMethod: text("allocation_method").default("manual"), // manual, percentage, formula
  
  // Approval workflow
  status: text("status").notNull().default("draft"), // draft, submitted, approved, rejected
  approvedBy: text("approved_by"), // User ID (UUID) of approver
  approvedAt: text("approved_at"), // ISO datetime
  
  // Monitoring and alerts
  warningThreshold: real("warning_threshold").default(80), // Percentage for warnings
  criticalThreshold: real("critical_threshold").default(95), // Percentage for critical alerts
  
  // Additional metadata
  tags: text("tags"), // JSON array of tags
  notes: text("notes"), // Free-form notes
  
  // Audit fields
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  createdBy: text("created_by"), // User ID (UUID)
});

/**
 * Budget revisions for tracking changes over time
 */
export const budgetRevisions = sqliteTable("budget_revisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // Reference to original budget
  budgetId: integer("budget_id").notNull().references(() => budgets.id, { onDelete: "cascade" }),
  
  // Revision details
  revisionNumber: integer("revision_number").notNull(),
  reason: text("reason").notNull(), // Reason for revision
  description: text("description"),
  
  // Previous and new values
  previousAmount: real("previous_amount").notNull(),
  newAmount: real("new_amount").notNull(),
  changeAmount: real("change_amount").notNull(),
  changePercent: real("change_percent").notNull(),
  
  // Approval for revision
  status: text("status").notNull().default("pending"), // pending, approved, rejected
  approvedBy: text("approved_by"), // User ID (UUID)
  approvedAt: text("approved_at"), // ISO datetime
  
  // Audit fields
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  createdBy: text("created_by"), // User ID (UUID)
});

/**
 * Budget allocations for distributing budgets across departments/projects
 */
export const budgetAllocations = sqliteTable("budget_allocations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  
  // Reference to budget and category
  budgetId: integer("budget_id").notNull().references(() => budgets.id, { onDelete: "cascade" }),
  categoryId: integer("category_id").references(() => categories.id),
  
  // Allocation details
  name: text("name"), // Department, Project, Cost Center name
  description: text("description"),
  priority: integer("priority").default(0),
  constraints: text("constraints"), // JSON constraints
  allocationType: text("allocation_type").notNull(), // department, project, cost_center, custom
  allocationCode: text("allocation_code"), // Department/Project code
  
  // Allocation amounts
  allocatedAmount: real("allocated_amount").notNull(),
  allocatedPercent: real("allocated_percent").notNull(),
  actualAmount: real("actual_amount").notNull().default(0),
  
  // Status
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  
  // Audit fields
  createdAt: text("created_at").notNull().default(sql`(datetime('now'))`),
  updatedAt: text("updated_at").notNull().default(sql`(datetime('now'))`),
  createdBy: text("created_by"), // User ID (UUID)
});