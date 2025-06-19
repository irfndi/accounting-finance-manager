import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import Database from 'better-sqlite3';

// Test with the actual schema from the project
import { accounts } from './dist/schema/accounts.js';

try {
  // Create SQLite database
  const sqliteDb = new Database(':memory:');
  
  // Create table with complete schema from migration
  sqliteDb.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      subtype TEXT,
      category TEXT,
      parent_id INTEGER,
      level INTEGER DEFAULT 0 NOT NULL,
      path TEXT NOT NULL,
      is_active INTEGER DEFAULT 1 NOT NULL,
      is_system INTEGER DEFAULT 0 NOT NULL,
      allow_transactions INTEGER DEFAULT 1 NOT NULL,
      normal_balance TEXT NOT NULL,
      report_category TEXT,
      report_order INTEGER DEFAULT 0,
      current_balance REAL DEFAULT 0 NOT NULL,
      entity_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      created_by TEXT,
      updated_by TEXT
    )
  `);
  
  // Create Drizzle instance with better-sqlite3 directly
  const db = drizzle(sqliteDb, { schema: { accounts } });
  
  // Test insert
  console.log('Testing Drizzle insert...');
  const result = await db.insert(accounts).values({
    code: '1000',
    name: 'Test Account',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    path: '1000',
    entityId: 'test-entity'
    // Let Drizzle handle createdAt and updatedAt with $defaultFn
  }).returning();
  
  console.log('Insert result:', result);
  
} catch (error) {
  console.error('Error:', error);
  console.error('Stack:', error.stack);
}