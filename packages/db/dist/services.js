/**
 * Database Services
 * Corporate Finance Manager - Database service layer with user management
 */
import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
import { users } from "./schema/index.js";
import * as schema from "./schema/index.js";
/**
 * Database service class with user management methods
 */
export class DatabaseService {
    db;
    constructor(db) {
        this.db = db;
    }
    /**
     * Get user by email
     */
    async getUserByEmail(email) {
        const result = await this.db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
        return result[0] || null;
    }
    /**
     * Get user by ID
     */
    async getUserById(id) {
        const result = await this.db
            .select()
            .from(users)
            .where(eq(users.id, id))
            .limit(1);
        return result[0] || null;
    }
    /**
     * Create a new user
     */
    async createUser(userData) {
        const newUser = {
            id: crypto.randomUUID(),
            email: userData.email,
            password: userData.password,
            name: userData.name || null,
            emailVerified: userData.emailVerified || false,
            createdAt: userData.createdAt || new Date(),
            updatedAt: userData.updatedAt || new Date(),
            lastLoginAt: null,
        };
        const result = await this.db
            .insert(users)
            .values(newUser)
            .returning();
        return result[0];
    }
    /**
     * Update user data
     */
    async updateUser(id, userData) {
        const updateData = {
            ...userData,
            updatedAt: userData.updatedAt || new Date(),
        };
        const result = await this.db
            .update(users)
            .set(updateData)
            .where(eq(users.id, id))
            .returning();
        return result[0];
    }
    /**
     * Delete user by ID
     */
    async deleteUser(id) {
        const result = await this.db
            .delete(users)
            .where(eq(users.id, id))
            .returning();
        return result[0] || null;
    }
}
/**
 * Create a database service with user management methods
 */
export function createDatabaseService(database) {
    return new DatabaseService(database);
}
/**
 * Enhanced createDatabase function that returns both raw db and service methods
 */
export function createEnhancedDatabase(d1Database) {
    const db = drizzle(d1Database, { schema });
    return db;
}
