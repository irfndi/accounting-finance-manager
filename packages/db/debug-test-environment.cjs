const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const { sqliteTable, integer, text, real } = require('drizzle-orm/sqlite-core');
const { eq } = require('drizzle-orm');
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

const schema = { accounts };

// Create in-memory database
const sqliteDb = new Database(':memory:');

// Load schema from migration files
const migrationsDir = path.join(__dirname, 'migrations');
const migrationFiles = ['0000_chubby_synch.sql', '0001_medical_payback.sql', '0002_whole_shadowcat.sql'];

for (const file of migrationFiles) {
  const migrationPath = path.join(migrationsDir, file);
  if (fs.existsSync(migrationPath)) {
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
    const statements = migrationSql.split('--> statement-breakpoint').map(stmt => stmt.trim()).filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    for (const statement of statements) {
      if (statement.trim()) {
        sqliteDb.exec(statement);
      }
    }
  }
}

console.log('Database schema created successfully');

// Create Drizzle adapter
const db = drizzle(sqliteDb, { schema, logger: true });

// Test Drizzle insert
const now = Date.now();
const newAccount = {
  code: '1500',
  name: 'Equipment',
  description: 'Office equipment and machinery',
  type: 'ASSET',
  subtype: 'NON_CURRENT',
  normalBalance: 'DEBIT',
  path: '1500',
  level: 0,
  isActive: 1,
  isSystem: 0,
  allowTransactions: 1,
  currentBalance: 0,
  entityId: 'test-entity',
  createdAt: now,
  updatedAt: now
};

try {
  console.log('Attempting Drizzle insert with data:', newAccount);
  const result = db.insert(accounts).values(newAccount).run();
  console.log('Drizzle insert successful:', result);
  
  // Verify the insert
  const inserted = db.select().from(accounts).where(eq(accounts.id, result.lastInsertRowid)).get();
  console.log('Inserted record:', inserted);
  
} catch (error) {
  console.log('Drizzle insert failed:', error.message);
  console.log('Error code:', error.code);
  console.log('Full error:', error);
}

sqliteDb.close();