import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';

// Define accounts table schema inline
const accounts = sqliteTable("accounts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  subtype: text("subtype"),
  category: text("category"),
  parentId: integer("parent_id"),
  level: integer("level").notNull().default(0),
  path: text("path").notNull(),
  isActive: integer("is_active").notNull().default(1),
  isSystem: integer("is_system").notNull().default(0),
  allowTransactions: integer("allow_transactions").notNull().default(1),
  normalBalance: text("normal_balance").notNull(),
  reportCategory: text("report_category"),
  reportOrder: integer("report_order").default(0),
  currentBalance: real("current_balance").notNull().default(0),
  entityId: text("entity_id").notNull(),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
});

// Create in-memory database
const sqliteDb = new Database(':memory:');
const db = drizzle(sqliteDb);

// Read and execute migration
const migration = readFileSync('./migrations/0000_chubby_synch.sql', 'utf8');
const statements = migration.split('-->').map(s => s.split('statement-breakpoint')[0].trim()).filter(Boolean);

for (const statement of statements) {
  if (statement.trim()) {
    try {
      sqliteDb.exec(statement);
    } catch (error) {
      console.log('Migration error:', error.message);
    }
  }
}

console.log('Database created with migration');

// Test the exact data structure from createTestAccount
const now = Date.now();
const testAccountData = {
  code: '1000',
  name: 'Test Account',
  type: 'ASSET',
  normalBalance: 'DEBIT',
  path: '1000',
  level: 0,
  isActive: 1,
  isSystem: 0,
  allowTransactions: 1,
  currentBalance: 0,
  entityId: 'test-entity',
  createdAt: now,
  updatedAt: now
};

console.log('Testing Drizzle insert with data:', testAccountData);

try {
  const result = await db.insert(accounts).values(testAccountData).returning();
  console.log('✅ Drizzle insert successful:', result);
} catch (error) {
  console.log('❌ Drizzle insert failed:', error.message);
  console.log('Error details:', error);
  
  // Try to get more specific error info
  if (error.message.includes('SQLITE_CONSTRAINT_NOTNULL')) {
    console.log('\nTesting individual fields...');
    
    // Test with minimal fields
    const minimalData = {
      code: '1001',
      name: 'Minimal Test',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      path: '1001',
      entityId: 'test-entity',
      createdAt: now,
      updatedAt: now
    };
    
    try {
      const result2 = await db.insert(accounts).values(minimalData).returning();
      console.log('✅ Minimal insert successful:', result2);
    } catch (error2) {
      console.log('❌ Even minimal insert failed:', error2.message);
    }
  }
}

sqliteDb.close();