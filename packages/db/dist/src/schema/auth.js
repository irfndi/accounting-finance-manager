"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectAuditLogSchema = exports.insertAuditLogSchema = exports.selectMagicLinkSchema = exports.insertMagicLinkSchema = exports.selectSessionSchema = exports.insertSessionSchema = exports.selectUserSchema = exports.insertUserSchema = exports.AuditEventType = exports.MagicLinkPurpose = exports.UserRole = exports.auditLog = exports.magicLinks = exports.sessions = exports.users = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
const zod_1 = require("zod");
/**
 * Users - Core user management for authentication
 * Supports email-based authentication with magic links and optional password
 */
exports.users = (0, sqlite_core_1.sqliteTable)("users", {
    id: (0, sqlite_core_1.text)("id").primaryKey(), // UUID for better security
    email: (0, sqlite_core_1.text)("email").notNull().unique(),
    emailVerified: (0, sqlite_core_1.integer)("email_verified", { mode: "boolean" }).notNull().default(false),
    // Optional password for users who want traditional login
    passwordHash: (0, sqlite_core_1.text)("password_hash"), // Argon2id hashed password
    // User profile
    firstName: (0, sqlite_core_1.text)("first_name"),
    lastName: (0, sqlite_core_1.text)("last_name"),
    displayName: (0, sqlite_core_1.text)("display_name"),
    timezone: (0, sqlite_core_1.text)("timezone").default("UTC"),
    locale: (0, sqlite_core_1.text)("locale").default("en"),
    // Account status
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).notNull().default(true),
    isVerified: (0, sqlite_core_1.integer)("is_verified", { mode: "boolean" }).notNull().default(false),
    // Role and permissions
    role: (0, sqlite_core_1.text)("role").notNull().default("USER"), // USER, ADMIN, ACCOUNTANT, VIEWER
    permissions: (0, sqlite_core_1.text)("permissions"), // JSON array of specific permissions
    // Multi-entity access
    entityId: (0, sqlite_core_1.text)("entity_id"), // Primary entity for multi-company accounting
    entityAccess: (0, sqlite_core_1.text)("entity_access"), // JSON array of accessible entities
    // Security fields
    lastLoginAt: (0, sqlite_core_1.integer)("last_login_at", { mode: "timestamp" }),
    lastLoginIp: (0, sqlite_core_1.text)("last_login_ip"),
    failedLoginAttempts: (0, sqlite_core_1.integer)("failed_login_attempts").notNull().default(0),
    lockedUntil: (0, sqlite_core_1.integer)("locked_until", { mode: "timestamp" }),
    // Two-factor authentication
    twoFactorEnabled: (0, sqlite_core_1.integer)("two_factor_enabled", { mode: "boolean" }).notNull().default(false),
    twoFactorSecret: (0, sqlite_core_1.text)("two_factor_secret"), // TOTP secret
    backupCodes: (0, sqlite_core_1.text)("backup_codes"), // JSON array of backup codes
    // Audit fields
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: (0, sqlite_core_1.integer)("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    createdBy: (0, sqlite_core_1.text)("created_by"),
    updatedBy: (0, sqlite_core_1.text)("updated_by"),
});
/**
 * Sessions - JWT session management with KV storage references
 * Links to Cloudflare KV for session data storage
 */
exports.sessions = (0, sqlite_core_1.sqliteTable)("sessions", {
    id: (0, sqlite_core_1.text)("id").primaryKey(), // JWT token ID (jti claim)
    userId: (0, sqlite_core_1.text)("user_id").notNull().references(() => exports.users.id, { onDelete: "cascade" }),
    // Session metadata
    deviceInfo: (0, sqlite_core_1.text)("device_info"), // User agent, device type
    ipAddress: (0, sqlite_core_1.text)("ip_address"),
    location: (0, sqlite_core_1.text)("location"), // Geo location if available
    // Session lifecycle
    issuedAt: (0, sqlite_core_1.integer)("issued_at", { mode: "timestamp" }).notNull(),
    expiresAt: (0, sqlite_core_1.integer)("expires_at", { mode: "timestamp" }).notNull(),
    lastActiveAt: (0, sqlite_core_1.integer)("last_active_at", { mode: "timestamp" }).notNull(),
    // Session status
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).notNull().default(true),
    revokedAt: (0, sqlite_core_1.integer)("revoked_at", { mode: "timestamp" }),
    revokedBy: (0, sqlite_core_1.text)("revoked_by"),
    revokedReason: (0, sqlite_core_1.text)("revoked_reason"),
    // KV storage reference
    kvKey: (0, sqlite_core_1.text)("kv_key").notNull(), // Key for session data in Cloudflare KV
    // Audit fields
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: (0, sqlite_core_1.integer)("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
/**
 * Magic Links - Email-based authentication tokens
 * Temporary tokens for passwordless login and email verification
 */
exports.magicLinks = (0, sqlite_core_1.sqliteTable)("magic_links", {
    id: (0, sqlite_core_1.text)("id").primaryKey(), // UUID token
    userId: (0, sqlite_core_1.text)("user_id").references(() => exports.users.id, { onDelete: "cascade" }),
    email: (0, sqlite_core_1.text)("email").notNull(),
    // Token data
    token: (0, sqlite_core_1.text)("token").notNull().unique(), // URL-safe random token
    tokenHash: (0, sqlite_core_1.text)("token_hash").notNull(), // Hashed version for security
    // Link purpose and metadata
    purpose: (0, sqlite_core_1.text)("purpose").notNull(), // LOGIN, REGISTER, VERIFY_EMAIL, RESET_PASSWORD
    metadata: (0, sqlite_core_1.text)("metadata"), // JSON for additional context
    // Link lifecycle
    expiresAt: (0, sqlite_core_1.integer)("expires_at", { mode: "timestamp" }).notNull(),
    usedAt: (0, sqlite_core_1.integer)("used_at", { mode: "timestamp" }),
    // Usage tracking
    clickCount: (0, sqlite_core_1.integer)("click_count").notNull().default(0),
    lastClickAt: (0, sqlite_core_1.integer)("last_click_at", { mode: "timestamp" }),
    lastClickIp: (0, sqlite_core_1.text)("last_click_ip"),
    // Status
    isActive: (0, sqlite_core_1.integer)("is_active", { mode: "boolean" }).notNull().default(true),
    // Audit fields
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    updatedAt: (0, sqlite_core_1.integer)("updated_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
    createdBy: (0, sqlite_core_1.text)("created_by"),
});
/**
 * Audit Log - Security and activity tracking
 * Comprehensive logging for authentication and authorization events
 */
exports.auditLog = (0, sqlite_core_1.sqliteTable)("audit_log", {
    id: (0, sqlite_core_1.text)("id").primaryKey(), // UUID
    userId: (0, sqlite_core_1.text)("user_id").references(() => exports.users.id, { onDelete: "set null" }),
    sessionId: (0, sqlite_core_1.text)("session_id").references(() => exports.sessions.id, { onDelete: "set null" }),
    // Event details
    eventType: (0, sqlite_core_1.text)("event_type").notNull(), // LOGIN, LOGOUT, REGISTER, etc.
    eventCategory: (0, sqlite_core_1.text)("event_category").notNull(), // AUTH, SESSION, ACCOUNT, etc.
    description: (0, sqlite_core_1.text)("description").notNull(),
    // Request context
    ipAddress: (0, sqlite_core_1.text)("ip_address"),
    userAgent: (0, sqlite_core_1.text)("user_agent"),
    location: (0, sqlite_core_1.text)("location"),
    // Additional data
    metadata: (0, sqlite_core_1.text)("metadata"), // JSON for event-specific data
    // Status and outcome
    success: (0, sqlite_core_1.integer)("success", { mode: "boolean" }).notNull(),
    errorCode: (0, sqlite_core_1.text)("error_code"),
    errorMessage: (0, sqlite_core_1.text)("error_message"),
    // Entity tracking for multi-company
    entityId: (0, sqlite_core_1.text)("entity_id"),
    // Timestamp
    createdAt: (0, sqlite_core_1.integer)("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});
// User role enum
exports.UserRole = {
    USER: "USER",
    ACCOUNTANT: "ACCOUNTANT",
    ADMIN: "ADMIN",
    VIEWER: "VIEWER",
    SUPER_ADMIN: "SUPER_ADMIN",
};
// Magic link purpose enum
exports.MagicLinkPurpose = {
    LOGIN: "LOGIN",
    REGISTER: "REGISTER",
    VERIFY_EMAIL: "VERIFY_EMAIL",
    RESET_PASSWORD: "RESET_PASSWORD",
    CHANGE_EMAIL: "CHANGE_EMAIL",
};
// Audit event types
exports.AuditEventType = {
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
};
// Zod schemas for validation - simplified for now
exports.insertUserSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    firstName: zod_1.z.string().min(1).max(50).optional(),
    lastName: zod_1.z.string().min(1).max(50).optional(),
    role: zod_1.z.enum(["USER", "ACCOUNTANT", "ADMIN", "VIEWER", "SUPER_ADMIN"]),
});
exports.selectUserSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    firstName: zod_1.z.string().nullable(),
    lastName: zod_1.z.string().nullable(),
    role: zod_1.z.enum(["USER", "ACCOUNTANT", "ADMIN", "VIEWER", "SUPER_ADMIN"]),
});
exports.insertSessionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
});
exports.selectSessionSchema = zod_1.z.object({
    id: zod_1.z.string(),
    userId: zod_1.z.string(),
});
exports.insertMagicLinkSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    purpose: zod_1.z.enum(["LOGIN", "REGISTER", "VERIFY_EMAIL", "RESET_PASSWORD", "CHANGE_EMAIL"]),
});
exports.selectMagicLinkSchema = zod_1.z.object({
    id: zod_1.z.string(),
    email: zod_1.z.string(),
    purpose: zod_1.z.enum(["LOGIN", "REGISTER", "VERIFY_EMAIL", "RESET_PASSWORD", "CHANGE_EMAIL"]),
});
exports.insertAuditLogSchema = zod_1.z.object({
    eventType: zod_1.z.string(),
    description: zod_1.z.string(),
});
exports.selectAuditLogSchema = zod_1.z.object({
    id: zod_1.z.string(),
    eventType: zod_1.z.string(),
    description: zod_1.z.string(),
});
