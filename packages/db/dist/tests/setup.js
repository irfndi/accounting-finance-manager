"use strict";
/**
 * Test Database Setup
 * Production-ready test configuration using better-sqlite3 with Drizzle ORM
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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mockD1 = exports.dbTestUtils = exports.sqliteDb = exports.testDbAdapter = void 0;
exports.createTestDatabase = createTestDatabase;
const better_sqlite3_1 = require("drizzle-orm/better-sqlite3");
const schema_1 = require("../src/schema");
const schema = __importStar(require("../src/schema"));
const better_sqlite3_2 = __importDefault(require("better-sqlite3"));
const drizzle_orm_1 = require("drizzle-orm");
// Mock D1 database for testing
const mockD1 = {
    prepare: () => ({}),
    batch: async () => [],
    exec: async () => ({}),
    dump: async () => ({}),
    // Add other D1 methods as needed
};
exports.mockD1 = mockD1;
// Create production-ready test database using better-sqlite3
function createTestDatabase() {
    try {
        const sqliteDb = new better_sqlite3_2.default(':memory:', { verbose: console.log });
        const testDbAdapter = (0, better_sqlite3_1.drizzle)(sqliteDb, { schema });
        // Enable WAL mode for better concurrency
        sqliteDb.pragma('journal_mode = WAL');
        sqliteDb.pragma('foreign_keys = ON');
        // Create tables using Drizzle schema
        sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      subtype TEXT,
      category TEXT,
      parent_id INTEGER REFERENCES accounts(id),
      level INTEGER NOT NULL DEFAULT 0,
      path TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      is_system INTEGER NOT NULL DEFAULT 0,
      allow_transactions INTEGER NOT NULL DEFAULT 1,
      normal_balance TEXT NOT NULL,
      report_category TEXT,
      report_order INTEGER DEFAULT 0,
      current_balance REAL NOT NULL DEFAULT 0,
      entity_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      created_by TEXT,
      updated_by TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      entity_id TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      date INTEGER NOT NULL,
      description TEXT,
      entity_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      created_by TEXT,
      updated_by TEXT
    );

    CREATE TABLE IF NOT EXISTS journal_entries (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL REFERENCES transactions(id),
      account_id INTEGER NOT NULL REFERENCES accounts(id),
      debit REAL NOT NULL DEFAULT 0,
      credit REAL NOT NULL DEFAULT 0,
      entity_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS raw_docs (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      metadata TEXT,
      entity_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);
        // Create Drizzle adapter with better-sqlite3
        const testDbAdapter = (0, better_sqlite3_1.drizzle)(sqliteDb, { schema });
        return { sqliteDb, testDbAdapter };
    }
    catch (error) {
        console.error('Failed to create test database:', error);
        throw error;
    }
}
// Initialize test database and adapter
const { sqliteDb, testDbAdapter } = createTestDatabase();
exports.sqliteDb = sqliteDb;
exports.testDbAdapter = testDbAdapter;
// Make test database adapter available globally
globalThis.testDbAdapter = testDbAdapter;
globalThis.sqliteDb = sqliteDb;
// Test utilities
const dbTestUtils = {
    async createTestUser(email, name, role = 'user', entityId) {
        const id = Math.random().toString(36).substring(7);
        await testDbAdapter.insert(schema_1.users).values({ id, email, name, role, entityId }).execute();
        return testDbAdapter.select().from(schema_1.users).where((0, drizzle_orm_1.eq)(schema_1.users.id, id)).get();
    },
    createTestAccount(overrides = {}) {
        const code = 'TEST-' + Math.random().toString(36).substring(7);
        return {
            code,
            name: 'Test Account',
            description: 'Test account for unit tests',
            type: 'ASSET',
            subtype: 'CURRENT_ASSET',
            category: 'CASH',
            level: 0,
            path: code,
            isActive: 1,
            isSystem: 0,
            allowTransactions: 1,
            normalBalance: 'DEBIT',
            reportCategory: 'ASSETS',
            reportOrder: 0,
            currentBalance: 0,
            entityId: 'test-entity',
            ...overrides
        };
    },
    async insertTestAccount(overrides = {}) {
        const accountData = this.createTestAccount(overrides);
        await testDbAdapter.insert(schema_1.accounts).values(accountData).execute();
        return testDbAdapter.select().from(schema_1.accounts).where((0, drizzle_orm_1.eq)(schema_1.accounts.id, accountData.id)).get();
    },
    async createTestTransaction(data) {
        const id = Math.random().toString(36).substring(7);
        const transactionData = {
            id,
            type: data.type || 'expense',
            status: data.status || 'pending',
            date: data.date || new Date().toISOString(),
            description: data.description || 'Test Transaction',
            amount: data.amount || 0,
            created_at: Math.floor(Date.now() / 1000),
            updated_at: Math.floor(Date.now() / 1000),
            ...data
        };
        await testDbAdapter.insert(schema_1.transactions).values(transactionData).execute();
        return testDbAdapter.select().from(schema_1.transactions).where((0, drizzle_orm_1.eq)(schema_1.transactions.id, id)).get();
    },
    async seedTestData() {
        await this.clearAllTables();
        await this.createTestUser('test@example.com', 'Test User');
        await this.insertTestAccount();
    },
    async clearAllTables() {
        try {
            // Disable foreign key checks temporarily
            sqliteDb.exec('PRAGMA foreign_keys = OFF;');
            // Delete data from tables in reverse order of dependencies
            await testDbAdapter.delete(schema_1.journalEntries).execute();
            await testDbAdapter.delete(schema_1.transactions).execute();
            await testDbAdapter.delete(schema_1.accounts).execute();
            await testDbAdapter.delete(schema_1.users).execute();
            await testDbAdapter.delete(schema_1.rawDocs).execute();
            // Re-enable foreign key checks
            sqliteDb.exec('PRAGMA foreign_keys = ON;');
        }
        catch (error) {
            console.error('Error clearing tables:', error);
            throw error;
        }
    }
};
exports.dbTestUtils = dbTestUtils;
// Make test utilities available globally
globalThis.dbTestUtils = dbTestUtils;
