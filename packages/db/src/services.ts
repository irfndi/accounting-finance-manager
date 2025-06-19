/**
 * Database Services
 * Corporate Finance Manager - Database service layer with user management
 */

import { eq } from "drizzle-orm";
import type { Database } from "./index";
import { users } from "./schema";

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
  constructor(private db: Database) {}

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
  const service = new DatabaseService(db);
  
  // Return an object that has both the raw database and service methods
  return Object.assign(db, {
    getUserByEmail: service.getUserByEmail.bind(service),
    getUserById: service.getUserById.bind(service),
    createUser: service.createUser.bind(service),
    updateUser: service.updateUser.bind(service),
    deleteUser: service.deleteUser.bind(service),
  });
}

// Import drizzle and schema
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema"; 