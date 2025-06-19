const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const fs = require('fs');
const path = require('path');

// Create in-memory database
const sqliteDb = new Database(':memory:');
const db = drizzle(sqliteDb);

// Load and execute migrations
const migrationsDir = path.join(__dirname, 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort();

console.log('Applying migrations:', migrationFiles);

for (const file of migrationFiles) {
  const migrationPath = path.join(migrationsDir, file);
  const migration = fs.readFileSync(migrationPath, 'utf8');
  
  // Split by statement breakpoint and execute each statement
  const statements = migration.split('--> statement-breakpoint')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt && !stmt.startsWith('--'));
  
  console.log(`Executing ${file} with ${statements.length} statements`);
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        sqliteDb.exec(statement);
      } catch (error) {
        console.error(`Error in ${file}:`, error.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
      }
    }
  }
}

// Test account creation with exact test data
const testAccount = {
  code: 'TEST-123',
  name: 'Test Account',
  description: 'A test account',
  type: 'ASSET',
  subtype: 'CURRENT',
  category: 'CASH',
  parentId: null,
  level: 0,
  path: '/TEST',
  isActive: 1,
  isSystem: 0,
  allowTransactions: 1,
  normalBalance: 'DEBIT',
  reportCategory: 'BALANCE_SHEET',
  reportOrder: 0,
  currentBalance: 0,
  entityId: 'test-entity-id',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  createdBy: null,
  updatedBy: null
};

console.log('\nTesting account creation with data:', JSON.stringify(testAccount, null, 2));

try {
  const stmt = sqliteDb.prepare(`
    INSERT INTO accounts (
      code, name, description, type, subtype, category, parent_id, level, path,
      is_active, is_system, allow_transactions, normal_balance, report_category,
      report_order, current_balance, entity_id, created_at, updated_at, created_by, updated_by
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?
    )
  `);
  
  const result = stmt.run(
    testAccount.code, testAccount.name, testAccount.description, testAccount.type,
    testAccount.subtype, testAccount.category, testAccount.parentId, testAccount.level,
    testAccount.path, testAccount.isActive, testAccount.isSystem, testAccount.allowTransactions,
    testAccount.normalBalance, testAccount.reportCategory, testAccount.reportOrder,
    testAccount.currentBalance, testAccount.entityId, testAccount.createdAt,
    testAccount.updatedAt, testAccount.createdBy, testAccount.updatedBy
  );
  
  console.log('✅ Account created successfully:', result);
  
  // Verify the record
  const selectStmt = sqliteDb.prepare('SELECT * FROM accounts WHERE id = ?');
  const inserted = selectStmt.get(result.lastInsertRowid);
  console.log('✅ Inserted record:', inserted);
  
} catch (error) {
  console.error('❌ Error creating account:', error.message);
  
  // Check table schema
  console.log('\nTable schema:');
  const schema = sqliteDb.prepare('PRAGMA table_info(accounts)').all();
  console.log(schema);
}

sqliteDb.close();