/**
 * Database Services
 * Corporate Finance Manager - Database service layer with user management
 */
import type { D1Database } from "@cloudflare/workers-types";
import type { Database } from "./index";
import { users } from "./schema";
import * as schema from "./schema";
/**
 * Session data for authentication
 */
export interface Session {
    userId: string;
    sessionId: string;
}
/**
 * User data for creation
 */
export interface CreateUserData {
    email: string;
    password: string;
    name?: string | null;
    emailVerified?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}
/**
 * User type inferred from the database schema
 */
export type User = typeof users.$inferSelect;
/**
 * User data for updates
 */
export interface UpdateUserData {
    name?: string | null;
    password?: string;
    emailVerified?: boolean;
    lastLoginAt?: Date;
    updatedAt?: Date;
}
/**
 * Database service class with user management methods
 */
export declare class DatabaseService {
    db: Database;
    /**
     * Get current user by session
     */
    getCurrentUser(session: Session): Promise<{
        id: string;
        email: string;
        emailVerified: boolean;
        passwordHash: string | null;
        firstName: string | null;
        lastName: string | null;
        displayName: string | null;
        timezone: string | null;
        locale: string | null;
        isActive: boolean;
        isVerified: boolean;
        role: string;
        permissions: string | null;
        entityId: string | null;
        entityAccess: string | null;
        lastLoginAt: Date | null;
        lastLoginIp: string | null;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
        twoFactorEnabled: boolean;
        twoFactorSecret: string | null;
        backupCodes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
    } | null>;
    constructor(db: Database);
    /**
     * Get user by email
     */
    getUserByEmail(email: string): Promise<{
        id: string;
        email: string;
        emailVerified: boolean;
        passwordHash: string | null;
        firstName: string | null;
        lastName: string | null;
        displayName: string | null;
        timezone: string | null;
        locale: string | null;
        isActive: boolean;
        isVerified: boolean;
        role: string;
        permissions: string | null;
        entityId: string | null;
        entityAccess: string | null;
        lastLoginAt: Date | null;
        lastLoginIp: string | null;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
        twoFactorEnabled: boolean;
        twoFactorSecret: string | null;
        backupCodes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
    /**
     * Get user by ID
     */
    getUserById(id: string): Promise<{
        id: string;
        email: string;
        emailVerified: boolean;
        passwordHash: string | null;
        firstName: string | null;
        lastName: string | null;
        displayName: string | null;
        timezone: string | null;
        locale: string | null;
        isActive: boolean;
        isVerified: boolean;
        role: string;
        permissions: string | null;
        entityId: string | null;
        entityAccess: string | null;
        lastLoginAt: Date | null;
        lastLoginIp: string | null;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
        twoFactorEnabled: boolean;
        twoFactorSecret: string | null;
        backupCodes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
    }>;
    /**
     * Create a new user
     */
    createUser(userData: CreateUserData): Promise<{
        id: string;
        isActive: boolean;
        entityId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        email: string;
        emailVerified: boolean;
        passwordHash: string | null;
        firstName: string | null;
        lastName: string | null;
        displayName: string | null;
        timezone: string | null;
        locale: string | null;
        isVerified: boolean;
        role: string;
        permissions: string | null;
        entityAccess: string | null;
        lastLoginAt: Date | null;
        lastLoginIp: string | null;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
        twoFactorEnabled: boolean;
        twoFactorSecret: string | null;
        backupCodes: string | null;
    }>;
    /**
     * Update user data
     */
    updateUser(id: string, userData: UpdateUserData): Promise<{
        id: string;
        isActive: boolean;
        entityId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        email: string;
        emailVerified: boolean;
        passwordHash: string | null;
        firstName: string | null;
        lastName: string | null;
        displayName: string | null;
        timezone: string | null;
        locale: string | null;
        isVerified: boolean;
        role: string;
        permissions: string | null;
        entityAccess: string | null;
        lastLoginAt: Date | null;
        lastLoginIp: string | null;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
        twoFactorEnabled: boolean;
        twoFactorSecret: string | null;
        backupCodes: string | null;
    }>;
    /**
     * Delete user by ID
     */
    deleteUser(id: string): Promise<{
        id: string;
        isActive: boolean;
        entityId: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
        email: string;
        emailVerified: boolean;
        passwordHash: string | null;
        firstName: string | null;
        lastName: string | null;
        displayName: string | null;
        timezone: string | null;
        locale: string | null;
        isVerified: boolean;
        role: string;
        permissions: string | null;
        entityAccess: string | null;
        lastLoginAt: Date | null;
        lastLoginIp: string | null;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
        twoFactorEnabled: boolean;
        twoFactorSecret: string | null;
        backupCodes: string | null;
    }>;
}
/**
 * Create a database service with user management methods
 */
export declare function createDatabaseService(database: Database): DatabaseService;
/**
 * Enhanced createDatabase function that returns both raw db and service methods
 */
export declare function createEnhancedDatabase(d1Database: D1Database): import("drizzle-orm/d1").DrizzleD1Database<typeof schema> & {
    $client: D1Database;
};
//# sourceMappingURL=services.d.ts.map