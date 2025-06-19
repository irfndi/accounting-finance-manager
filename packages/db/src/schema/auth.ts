import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

/**
 * Users - Core user management for authentication
 * Supports email-based authentication with magic links and optional password
 */
export const users = sqliteTable("users", {
  id: text("id").primaryKey(), // UUID for better security
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).notNull().default(false),
  
  // Optional password for users who want traditional login
  passwordHash: text("password_hash"), // Argon2id hashed password
  
  // User profile
  firstName: text("first_name"),
  lastName: text("last_name"),
  displayName: text("display_name"),
  timezone: text("timezone").default("UTC"),
  locale: text("locale").default("en"),
  
  // Account status
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  isVerified: integer("is_verified", { mode: "boolean" }).notNull().default(false),
  
  // Role and permissions
  role: text("role").notNull().default("USER"), // USER, ADMIN, ACCOUNTANT, VIEWER
  permissions: text("permissions"), // JSON array of specific permissions
  
  // Multi-entity access
  entityId: text("entity_id"), // Primary entity for multi-company accounting
  entityAccess: text("entity_access"), // JSON array of accessible entities
  
  // Security fields
  lastLoginAt: integer("last_login_at", { mode: "timestamp" }),
  lastLoginIp: text("last_login_ip"),
  failedLoginAttempts: integer("failed_login_attempts").notNull().default(0),
  lockedUntil: integer("locked_until", { mode: "timestamp" }),
  
  // Two-factor authentication
  twoFactorEnabled: integer("two_factor_enabled", { mode: "boolean" }).notNull().default(false),
  twoFactorSecret: text("two_factor_secret"), // TOTP secret
  backupCodes: text("backup_codes"), // JSON array of backup codes
  
  // Audit fields
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
});

/**
 * Sessions - JWT session management with KV storage references
 * Links to Cloudflare KV for session data storage
 */
export const sessions = sqliteTable("sessions", {
  id: text("id").primaryKey(), // JWT token ID (jti claim)
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  
  // Session metadata
  deviceInfo: text("device_info"), // User agent, device type
  ipAddress: text("ip_address"),
  location: text("location"), // Geo location if available
  
  // Session lifecycle
  issuedAt: integer("issued_at", { mode: "timestamp" }).notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  lastActiveAt: integer("last_active_at", { mode: "timestamp" }).notNull(),
  
  // Session status
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  revokedAt: integer("revoked_at", { mode: "timestamp" }),
  revokedBy: text("revoked_by"),
  revokedReason: text("revoked_reason"),
  
  // KV storage reference
  kvKey: text("kv_key").notNull(), // Key for session data in Cloudflare KV
  
  // Audit fields
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

/**
 * Magic Links - Email-based authentication tokens
 * Temporary tokens for passwordless login and email verification
 */
export const magicLinks = sqliteTable("magic_links", {
  id: text("id").primaryKey(), // UUID token
  userId: text("user_id").references(() => users.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  
  // Token data
  token: text("token").notNull().unique(), // URL-safe random token
  tokenHash: text("token_hash").notNull(), // Hashed version for security
  
  // Link purpose and metadata
  purpose: text("purpose").notNull(), // LOGIN, REGISTER, VERIFY_EMAIL, RESET_PASSWORD
  metadata: text("metadata"), // JSON for additional context
  
  // Link lifecycle
  expiresAt: integer("expires_at", { mode: "timestamp" }).notNull(),
  usedAt: integer("used_at", { mode: "timestamp" }),
  
  // Usage tracking
  clickCount: integer("click_count").notNull().default(0),
  lastClickAt: integer("last_click_at", { mode: "timestamp" }),
  lastClickIp: text("last_click_ip"),
  
  // Status
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  
  // Audit fields
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  createdBy: text("created_by"),
});

/**
 * Audit Log - Security and activity tracking
 * Comprehensive logging for authentication and authorization events
 */
export const auditLog = sqliteTable("audit_log", {
  id: text("id").primaryKey(), // UUID
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  sessionId: text("session_id").references(() => sessions.id, { onDelete: "set null" }),
  
  // Event details
  eventType: text("event_type").notNull(), // LOGIN, LOGOUT, REGISTER, etc.
  eventCategory: text("event_category").notNull(), // AUTH, SESSION, ACCOUNT, etc.
  description: text("description").notNull(),
  
  // Request context
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: text("location"),
  
  // Additional data
  metadata: text("metadata"), // JSON for event-specific data
  
  // Status and outcome
  success: integer("success", { mode: "boolean" }).notNull(),
  errorCode: text("error_code"),
  errorMessage: text("error_message"),
  
  // Entity tracking for multi-company
  entityId: text("entity_id"),
  
  // Timestamp
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

// User role enum
export const UserRole = {
  USER: "USER",
  ACCOUNTANT: "ACCOUNTANT", 
  ADMIN: "ADMIN",
  VIEWER: "VIEWER",
  SUPER_ADMIN: "SUPER_ADMIN",
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

// Magic link purpose enum
export const MagicLinkPurpose = {
  LOGIN: "LOGIN",
  REGISTER: "REGISTER", 
  VERIFY_EMAIL: "VERIFY_EMAIL",
  RESET_PASSWORD: "RESET_PASSWORD",
  CHANGE_EMAIL: "CHANGE_EMAIL",
} as const;

export type MagicLinkPurpose = typeof MagicLinkPurpose[keyof typeof MagicLinkPurpose];

// Audit event types
export const AuditEventType = {
  // Authentication events
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGOUT: "LOGOUT", 
  REGISTER: "REGISTER",
  VERIFY_EMAIL: "VERIFY_EMAIL",
  PASSWORD_RESET: "PASSWORD_RESET",
  
  // Session events
  SESSION_CREATED: "SESSION_CREATED",
  SESSION_RENEWED: "SESSION_RENEWED",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_REVOKED: "SESSION_REVOKED",
  
  // Account events
  ACCOUNT_LOCKED: "ACCOUNT_LOCKED",
  ACCOUNT_UNLOCKED: "ACCOUNT_UNLOCKED",
  PROFILE_UPDATED: "PROFILE_UPDATED",
  ROLE_CHANGED: "ROLE_CHANGED",
  
  // Security events
  SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY",
  TWO_FACTOR_ENABLED: "TWO_FACTOR_ENABLED",
  TWO_FACTOR_DISABLED: "TWO_FACTOR_DISABLED",
} as const;

export type AuditEventType = typeof AuditEventType[keyof typeof AuditEventType];

// Zod schemas for validation - simplified for now
export const insertUserSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  role: z.enum(["USER", "ACCOUNTANT", "ADMIN", "VIEWER", "SUPER_ADMIN"]),
});

export const selectUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  role: z.enum(["USER", "ACCOUNTANT", "ADMIN", "VIEWER", "SUPER_ADMIN"]),
});

export const insertSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
});

export const selectSessionSchema = z.object({
  id: z.string(),
  userId: z.string(),
});

export const insertMagicLinkSchema = z.object({
  email: z.string().email(),
  purpose: z.enum(["LOGIN", "REGISTER", "VERIFY_EMAIL", "RESET_PASSWORD", "CHANGE_EMAIL"]),
});

export const selectMagicLinkSchema = z.object({
  id: z.string(),
  email: z.string(),
  purpose: z.enum(["LOGIN", "REGISTER", "VERIFY_EMAIL", "RESET_PASSWORD", "CHANGE_EMAIL"]),
});

export const insertAuditLogSchema = z.object({
  eventType: z.string(),
  description: z.string(),
});

export const selectAuditLogSchema = z.object({
  id: z.string(),
  eventType: z.string(),
  description: z.string(),
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>; 
export type SelectSession = z.infer<typeof selectSessionSchema>;
export type InsertMagicLink = z.infer<typeof insertMagicLinkSchema>;
export type SelectMagicLink = z.infer<typeof selectMagicLinkSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type SelectAuditLog = z.infer<typeof selectAuditLogSchema>;