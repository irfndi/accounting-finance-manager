"use strict";
/**
 * Database Services
 * Corporate Finance Manager - Database service layer with user management
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
exports.createDatabaseService = createDatabaseService;
exports.createEnhancedDatabase = createEnhancedDatabase;
const d1_1 = require("drizzle-orm/d1");
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("./schema");
const schema = __importStar(require("./schema"));
/**
 * Database service class with user management methods
 */
class DatabaseService {
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
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.email, email))
            .limit(1);
        return result[0] || null;
    }
    /**
     * Get user by ID
     */
    async getUserById(id) {
        const result = await this.db
            .select()
            .from(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
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
            .insert(schema_1.users)
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
            .update(schema_1.users)
            .set(updateData)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return result[0];
    }
    /**
     * Delete user by ID
     */
    async deleteUser(id) {
        const result = await this.db
            .delete(schema_1.users)
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, id))
            .returning();
        return result[0] || null;
    }
}
exports.DatabaseService = DatabaseService;
/**
 * Create a database service with user management methods
 */
function createDatabaseService(database) {
    return new DatabaseService(database);
}
/**
 * Enhanced createDatabase function that returns both raw db and service methods
 */
function createEnhancedDatabase(d1Database) {
    const db = (0, d1_1.drizzle)(d1Database, { schema });
    return db;
}
