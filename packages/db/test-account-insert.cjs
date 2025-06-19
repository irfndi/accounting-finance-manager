const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { accounts } = require('./dist/schema/accounts.js');

// Create in-memory database
const sqliteDb = new Database(':memory:');
const db = drizzle(sqliteDb);

// Create the accounts table
sqliteDb.exec(`
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
);
`);

// Test account data
const testAccount = {
  code: '1000',
  name: 'Test Account',
  description: null,
  type: 'ASSET',
  parentId: null,
  level: 0,
  path: '1000',
  isActive: 1,
  isSystem: 0,
  allowTransactions: 1,
  normalBalance: 'DEBIT',
  currentBalance: 0,
  entityId: 'test-entity',
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log('Test account data:', testAccount);

try {
  // Try to insert using raw SQL first
  const stmt = sqliteDb.prepare(`
    INSERT INTO accounts (
      code, name, description, type, parent_id, level, path,
      is_active, is_system, allow_transactions, normal_balance,
      current_balance, entity_id, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    testAccount.code,
    testAccount.name,
    testAccount.description,
    testAccount.type,
    testAccount.parentId,
    testAccount.level,
    testAccount.path,
    testAccount.isActive,
    testAccount.isSystem,
    testAccount.allowTransactions,
    testAccount.normalBalance,
    testAccount.currentBalance,
    testAccount.entityId,
    Date.now(),
    Date.now()
  );
  
  console.log('Raw SQL insert successful:', result);
  
} catch (error) {
  console.error('Raw SQL insert failed:', error.message);
}

sqliteDb.close();