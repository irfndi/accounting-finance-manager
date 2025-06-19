const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const { sqliteTable, integer, text, real } = require('drizzle-orm/sqlite-core');
const fs = require('fs');
const path = require('path');

// Define schema exactly as in the project
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
  entityId: text("entity_id"), // Made nullable to match migration
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
  createdBy: text("created_by"),
  updatedBy: text("updated_by"),
});

// Create in-memory database
const sqliteDb = new Database(':memory:');
const db = drizzle(sqliteDb, { schema: { accounts } });

// Read and execute migration
const migrationPath = path.join(__dirname, 'migrations', '0000_chubby_synch.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

// Split by statement breakpoint and execute each statement
const statements = migrationSql.split('--> statement-breakpoint');
for (const statement of statements) {
  const cleanStatement = statement.trim();
  if (cleanStatement && !cleanStatement.startsWith('-->')) {
    try {
      sqliteDb.exec(cleanStatement);
    } catch (error) {
      console.log('Error executing statement:', cleanStatement.substring(0, 100));
      console.log('Error:', error.message);
    }
  }
}

console.log('Database schema created successfully');

// Test Drizzle insert
const testData = {
  code: 'TEST001',
  name: 'Test Account',
  type: 'ASSET',
  level: 0,
  path: '/TEST001',
  isActive: 1,
  isSystem: 0,
  allowTransactions: 1,
  normalBalance: 'DEBIT',
  currentBalance: 0,
  createdAt: Date.now(),
  updatedAt: Date.now()
};

try {
  console.log('Attempting Drizzle insert with data:', testData);
  const result = db.insert(accounts).values(testData).run();
  console.log('Drizzle insert successful:', result);
  
  // Verify the insert
  const inserted = db.select().from(accounts).where(accounts.id.eq(result.lastInsertRowid)).get();
  console.log('Inserted record:', inserted);
  
} catch (error) {
  console.log('Drizzle insert failed:', error.message);
  console.log('Error code:', error.code);
  console.log('Full error:', error);
}

sqliteDb.close();