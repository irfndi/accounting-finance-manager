/**
 * Database Services
 * Corporate Finance Manager - Database service layer with user management
 */

import { drizzle } from "drizzle-orm/d1";
import { eq } from "drizzle-orm";
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
export class DatabaseService {
  /**
   * Get current user by session
   */
  async getCurrentUser(session: Session) {
    if (!session?.userId) {
      return null;
    }

    const user = await this.getUserById(session.userId);
    return user;
  }
  constructor(public db: Database) {}

  /**
   * Get user by email
   */
  async getUserByEmail(email: string) {
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
  async getUserById(id: string) {
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
  async createUser(userData: CreateUserData) {
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
  async updateUser(id: string, userData: UpdateUserData) {
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
  async deleteUser(id: string) {
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
export function createDatabaseService(database: Database): DatabaseService {
  return new DatabaseService(database);
}

/**
 * Enhanced createDatabase function that returns both raw db and service methods
 */
export function createEnhancedDatabase(d1Database: D1Database) {
  const db = drizzle(d1Database, { schema });
  return db;
}