/**
 * Test Database Setup
 * Production-ready test configuration using better-sqlite3 with Drizzle ORM
 */

import { drizzle } from 'drizzle-orm/better-sqlite3';
import { accounts, users, transactions, journalEntries, rawDocs } from '../src/schema';
import * as schema from '../src/schema';
import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { sql, eq } from 'drizzle-orm';

// Mock D1 database for testing
const mockD1 = {
  prepare: () => ({}),
  batch: async () => [],
  exec: async () => ({}),
  dump: async () => ({}),
  // Add other D1 methods as needed
};

// Type definitions
type TestDbAdapter = ReturnType<typeof drizzle<typeof schema>>;

interface TestUtils {
  createTestUser: (email: string, name: string, role?: string, entityId?: string) => Promise<any>;
  createTestAccount: (overrides?: any) => any;
  insertTestAccount: (overrides?: any) => Promise<any>;
  createTestTransaction: (data: any) => Promise<any>;
  seedTestData: () => Promise<void>;
  clearAllTables: () => Promise<void>;
}

// Extend global scope
declare global {
  var testDbAdapter: TestDbAdapter;
  var sqliteDb: Database.Database;
  var dbTestUtils: TestUtils;
}

// Create production-ready test database using better-sqlite3
export function createTestDatabase() {
  try {
    const sqliteDb = new Database(':memory:', { verbose: console.log });
    const testDbAdapter = drizzle(sqliteDb, { schema });
    
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
  
    return { sqliteDb };
  } catch (error) {
    console.error('Failed to create test database:', error);
    throw error;
  }
}
// Initialize test database and adapter
const { sqliteDb } = createTestDatabase();
const testDbAdapter = drizzle(sqliteDb, { schema });

// Make test database adapter available globally
globalThis.testDbAdapter = testDbAdapter;
globalThis.sqliteDb = sqliteDb;

// Test utilities
const dbTestUtils = {
  async createTestUser(email: string, name: string, role = 'USER', entityId?: string) {
    const id = Math.random().toString(36).substring(7);
    const now = new Date();
    await testDbAdapter.insert(users).values({ 
      id, 
      email, 
      displayName: name, 
      role, 
      entityId,
      createdAt: now,
      updatedAt: now
    }).execute();
    return testDbAdapter.select().from(users).where(eq(users.id, id)).get();
  },

  createTestAccount(overrides: any = {}) {
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

  async insertTestAccount(overrides: any = {}) {
    const now = Date.now();
    const accountData = {
      ...this.createTestAccount(overrides),
      createdAt: now,
      updatedAt: now
    };
    await testDbAdapter.insert(accounts).values(accountData).execute();
    return testDbAdapter.select().from(accounts).where(eq(accounts.code, accountData.code)).get();
  },

  async createTestTransaction(data: any) {
    const transactionData = {
      type: data.type || 'expense',
      status: data.status || 'pending',
      date: data.date || new Date().toISOString(),
      description: data.description || 'Test Transaction',
      amount: data.amount || 0,
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
      ...data
    };
    const insertResult = await testDbAdapter.insert(transactions).values(transactionData).returning({ id: transactions.id }).get();
    return testDbAdapter.select().from(transactions).where(eq(transactions.id, insertResult.id)).get();
  },

  async seedTestData(): Promise<void> {
    await this.clearAllTables();
    
    // Create test user
    const now = new Date();
    const userId = Math.random().toString(36).substring(7);
    await testDbAdapter.insert(users).values({
      id: userId,
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'USER',
      entityId: 'test-entity',
      isActive: true,
      createdAt: now,
      updatedAt: now
    }).execute();
    
    // Create test accounts
    const accountNow = Date.now();
    const testAccounts = [
      {
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        path: '1000',
        level: 0,
        isActive: 1,
        isSystem: 0,
        allowTransactions: 1,
        currentBalance: 0,
        entityId: 'test-entity',
        createdAt: accountNow,
        updatedAt: accountNow
      }
    ];
    
    for (const account of testAccounts) {
      await testDbAdapter.insert(accounts).values(account).execute();
    }
  },

  async clearAllTables() {
    try {
      // Disable foreign key checks temporarily
      sqliteDb.exec('PRAGMA foreign_keys = OFF;');

      // Delete data from tables in reverse order of dependencies
      await testDbAdapter.delete(journalEntries).execute();
      await testDbAdapter.delete(transactions).execute();
      await testDbAdapter.delete(accounts).execute();
      await testDbAdapter.delete(users).execute();
      await testDbAdapter.delete(rawDocs).execute();

      // Re-enable foreign key checks
      sqliteDb.exec('PRAGMA foreign_keys = ON;');
    } catch (error) {
      console.error('Error clearing tables:', error);
      throw error;
    }
  }
};

// Make test utilities available globally
globalThis.dbTestUtils = dbTestUtils;

// Export for direct import in tests
export { testDbAdapter, sqliteDb, dbTestUtils, mockD1 };