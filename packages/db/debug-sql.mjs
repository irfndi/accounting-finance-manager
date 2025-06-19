import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { accounts } from './dist/schema/accounts.js';

// Create in-memory database
const sqliteDb = new Database(':memory:');

// Create the accounts table manually to see the exact schema
const createTableSQL = `
CREATE TABLE accounts (
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
)`;

console.log('Creating table with SQL:', createTableSQL);
sqliteDb.exec(createTableSQL);

const db = drizzle(sqliteDb, { schema: { accounts } });

// Test data that should work
const testAccount = {
  code: '1000',
  name: 'Cash',
  type: 'ASSET',
  normalBalance: 'DEBIT',
  entityId: 'test-entity',
  path: '1000',
  level: 0,
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log('Attempting to insert:', testAccount);

try {
  const result = await db.insert(accounts).values(testAccount).returning();
  console.log('Success! Inserted account:', result);
} catch (error) {
  console.error('Error inserting account:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
}

sqliteDb.close();