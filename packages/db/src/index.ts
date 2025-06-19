/**
 * Database Package Index
 * Corporate Finance Manager - Database operations and schema
 */

// Schema exports
export * from "./schema";

// Service exports
export * from "./services";

// Database connection utility
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

/**
 * Create database connection for Cloudflare D1
 * @param d1Database - Cloudflare D1 database instance
 * @returns Drizzle database instance with schema
 */
export function createDatabase(d1Database: D1Database) {
  return drizzle(d1Database, { schema });
}

/**
 * Database type for use in applications
 */
export type Database = ReturnType<typeof createDatabase>;

// Re-export common Drizzle utilities
export { eq, and, or, not, isNull, isNotNull, like, ilike, desc, asc } from "drizzle-orm";
export { alias } from "drizzle-orm/sqlite-core"; 