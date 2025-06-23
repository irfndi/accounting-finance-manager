/**
 * Database Package Index
 * Corporate Finance Manager - Database operations and schema
 */
export * from "./schema";
export * from "./schema/documents";
export * from "./raw-docs";
export * from "./services";
import * as schema from "./schema";
/**
 * Create database connection for Cloudflare D1
 * @param d1Database - Cloudflare D1 database instance
 * @returns Drizzle database instance with schema
 */
export declare function createDatabase(d1Database: D1Database): import("drizzle-orm/d1").DrizzleD1Database<typeof schema> & {
    $client: D1Database;
};
/**
 * Database type for use in applications
 */
export type Database = ReturnType<typeof createDatabase>;
export { eq, and, or, not, isNull, isNotNull, like, ilike, desc, asc, sql, count, sum, avg, min, max } from "drizzle-orm";
export { alias, sqliteTable, text, integer, real, blob } from "drizzle-orm/sqlite-core";
export type { DrizzleD1Database } from "drizzle-orm/d1";
//# sourceMappingURL=index.d.ts.map