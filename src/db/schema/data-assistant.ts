import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { z } from "zod";

/**
 * Data Imports - Tracks file uploads and data imports
 */
export const dataImports = sqliteTable("data_imports", {
  id: text("id").primaryKey(), // UUID
  entityId: text("entity_id").notNull(), // Multi-entity support
  userId: text("user_id").notNull(), // User who uploaded
  
  // File information
  fileName: text("file_name").notNull(),
  fileSize: integer("file_size").notNull(), // Size in bytes
  fileType: text("file_type").notNull(), // xlsx, csv, json, etc.
  
  // Import status
  status: text("status").notNull().default("pending"), // pending, processing, previewing, completed, failed
  detectedFormat: text("detected_format"), // general-ledger, accounts-payable, etc.
  
  // Processing results
  rowCount: integer("row_count"),
  importedCount: integer("imported_count"),
  errorCount: integer("error_count"),
  
  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  completedAt: integer("completed_at", { mode: "timestamp" }),
  
  // Additional metadata
  metadata: text("metadata"), // JSON string
});

/**
 * Column Mappings - Stores mapping configurations for data imports
 */
export const columnMappings = sqliteTable("column_mappings", {
  id: text("id").primaryKey(), // UUID
  importId: text("import_id").notNull(), // References data_imports.id
  
  // Mapping configuration
  sourceColumn: text("source_column").notNull(),
  targetField: text("target_field").notNull(),
  confidence: real("confidence").notNull(), // 0.0 - 1.0
  dataType: text("data_type").notNull(), // string, number, date, boolean
  
  // Transformation rules
  transformation: text("transformation"), // JSON string
  
  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Validation Warnings - Stores validation warnings and issues
 */
export const validationWarnings = sqliteTable("validation_warnings", {
  id: text("id").primaryKey(), // UUID
  entityId: text("entity_id").notNull(),
  
  // Related records
  importId: text("import_id"), // Optional reference to data import
  transactionId: text("transaction_id"), // Optional reference to transaction
  
  // Warning details
  warningType: text("warning_type").notNull(), // critical, warning, info, opportunity
  category: text("category").notNull(), // missing_field, duplicate, anomaly, etc.
  title: text("title").notNull(),
  description: text("description").notNull(),
  suggestedAction: text("suggested_action"),
  
  // Status
  status: text("status").notNull().default("active"), // active, dismissed, resolved
  
  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
});

/**
 * Insights Cache - Caches generated insights for performance
 */
export const insightsCache = sqliteTable("insights_cache", {
  id: text("id").primaryKey(), // UUID
  entityId: text("entity_id").notNull(),
  
  // Insight metadata
  insightType: text("insight_type").notNull(), // dashboard, forecast, trends, etc.
  
  // Cached data
  data: text("data").notNull(), // JSON string
  
  // Cache control
  generatedAt: integer("generated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
});

/**
 * Integrations - Tracks third-party integrations
 */
export const integrations = sqliteTable("integrations", {
  id: text("id").primaryKey(), // UUID
  entityId: text("entity_id").notNull(),
  
  // Integration details
  integrationType: text("integration_type").notNull(), // tax, payroll, bank, etc.
  status: text("status").notNull(), // connected, error, disconnected
  
  // Configuration
  config: text("config").notNull(), // JSON string (encrypted)
  
  // Sync status
  lastSyncAt: integer("last_sync_at", { mode: "timestamp" }),
  nextSyncAt: integer("next_sync_at", { mode: "timestamp" }),
  errorMessage: text("error_message"),
  
  // Timestamps
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * User Subscriptions - Tracks user tier subscriptions
 */
export const userSubscriptions = sqliteTable("user_subscriptions", {
  id: text("id").primaryKey(), // UUID
  userId: text("user_id").notNull().unique(),
  
  // Subscription details
  tier: text("tier").notNull(), // free, pro, business, enterprise
  status: text("status").notNull(), // active, cancelled, expired
  
  // Limits
  transactionLimit: integer("transaction_limit"),
  transactionCount: integer("transaction_count").default(0),
  integrationLimit: integer("integration_limit"),
  
  // Timestamps
  startedAt: integer("started_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  expiresAt: integer("expires_at", { mode: "timestamp" }),
});

// Enums
export const ImportStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  PREVIEWING: "previewing",
  COMPLETED: "completed",
  FAILED: "failed"
} as const;

export const StandardFormat = {
  GENERAL_LEDGER: "general-ledger",
  ACCOUNTS_PAYABLE: "accounts-payable",
  ACCOUNTS_RECEIVABLE: "accounts-receivable",
  INVENTORY: "inventory",
  PAYROLL: "payroll",
  BUDGET: "budget",
  PROJECT_ACCOUNTING: "project-accounting"
} as const;

export const WarningType = {
  CRITICAL: "critical",
  WARNING: "warning",
  INFO: "info",
  OPPORTUNITY: "opportunity"
} as const;

export const WarningCategory = {
  MISSING_FIELD: "missing_field",
  DUPLICATE: "duplicate",
  ANOMALY: "anomaly",
  BALANCE_ERROR: "balance_error",
  DATE_ERROR: "date_error",
  CATEGORY_MISMATCH: "category_mismatch",
  VENDOR_ERROR: "vendor_error",
  AMOUNT_UNREASONABLE: "amount_unreasonable",
  COMPLIANCE: "compliance",
  OPTIMIZATION: "optimization"
} as const;

export const UserTier = {
  FREE: "free",
  PRO: "pro",
  BUSINESS: "business",
  ENTERPRISE: "enterprise"
} as const;

// Validation Schemas
export const insertDataImportSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().min(1),
  userId: z.string().min(1),
  fileName: z.string().min(1).max(255),
  fileSize: z.number().positive(),
  fileType: z.string().min(1),
  status: z.enum(["pending", "processing", "previewing", "completed", "failed"]).default("pending"),
  detectedFormat: z.string().optional(),
  rowCount: z.number().optional(),
  importedCount: z.number().optional(),
  errorCount: z.number().optional(),
  metadata: z.string().optional()
});

export const insertColumnMappingSchema = z.object({
  id: z.string().uuid(),
  importId: z.string().uuid(),
  sourceColumn: z.string().min(1),
  targetField: z.string().min(1),
  confidence: z.number().min(0).max(1),
  dataType: z.enum(["string", "number", "date", "boolean"]),
  transformation: z.string().optional()
});

export const insertValidationWarningSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().min(1),
  importId: z.string().uuid().optional(),
  transactionId: z.string().optional(),
  warningType: z.enum(["critical", "warning", "info", "opportunity"]),
  category: z.enum([
    "missing_field",
    "duplicate",
    "anomaly",
    "balance_error",
    "date_error",
    "category_mismatch",
    "vendor_error",
    "amount_unreasonable",
    "compliance",
    "optimization"
  ]),
  title: z.string().min(1).max(200),
  description: z.string().min(1),
  suggestedAction: z.string().optional(),
  status: z.enum(["active", "dismissed", "resolved"]).default("active")
});

export const insertInsightsCacheSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().min(1),
  insightType: z.string().min(1),
  data: z.string().min(1),
  expiresAt: z.date()
});

export const insertIntegrationSchema = z.object({
  id: z.string().uuid(),
  entityId: z.string().min(1),
  integrationType: z.string().min(1),
  status: z.enum(["connected", "error", "disconnected"]),
  config: z.string().min(1),
  lastSyncAt: z.date().optional(),
  nextSyncAt: z.date().optional(),
  errorMessage: z.string().optional()
});

export const insertUserSubscriptionSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().min(1),
  tier: z.enum(["free", "pro", "business", "enterprise"]),
  status: z.enum(["active", "cancelled", "expired"]),
  transactionLimit: z.number().optional(),
  transactionCount: z.number().default(0),
  integrationLimit: z.number().optional(),
  expiresAt: z.date().optional()
});

// Types
export type DataImport = typeof dataImports.$inferSelect;
export type NewDataImport = typeof dataImports.$inferInsert;

export type ColumnMapping = typeof columnMappings.$inferSelect;
export type NewColumnMapping = typeof columnMappings.$inferInsert;

export type ValidationWarning = typeof validationWarnings.$inferSelect;
export type NewValidationWarning = typeof validationWarnings.$inferInsert;

export type InsightsCache = typeof insightsCache.$inferSelect;
export type NewInsightsCache = typeof insightsCache.$inferInsert;

export type Integration = typeof integrations.$inferSelect;
export type NewIntegration = typeof integrations.$inferInsert;

export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type NewUserSubscription = typeof userSubscriptions.$inferInsert;
