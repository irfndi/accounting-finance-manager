/**
 * Database Package Index
 * Corporate Finance Manager - Database operations and schema
 */
// Schema exports
export * from "./schema/index.js";
// Service exports
export * from "./services.js";
// Database connection utility
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema/index.js";
/**
 * Create database connection for Cloudflare D1
 * @param d1Database - Cloudflare D1 database instance
 * @returns Drizzle database instance with schema
 */
export function createDatabase(d1Database) {
    return drizzle(d1Database, { schema });
}
// Re-export all Drizzle utilities to ensure consistent symbol resolution in monorepo
export { eq, and, or, not, isNull, isNotNull, like, ilike, desc, asc, sql, count, sum, avg, min, max } from "drizzle-orm";
export { alias, sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
