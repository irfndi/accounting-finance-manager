const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');
const schema = require('./dist/schema/index.js');

// Create test database using the same setup as tests
function createTestDatabase() {
  const sqliteDb = new Database(':memory:');
  
  // Load schema from migration files
  const migrationsDir = join(__dirname, 'migrations');
  const migrationFiles = [
    '0000_chubby_synch.sql',
    '0001_medical_payback.sql', 
    '0002_add_raw_docs_table.sql'
  ];
  
  for (const file of migrationFiles) {
    const migrationPath = join(migrationsDir, file);
    if (existsSync(migrationPath)) {
      const migrationSql = readFileSync(migrationPath, 'utf-8');
      // Split by statement breakpoint and execute each statement
      const statements = migrationSql
        .split('--> statement-breakpoint')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      for (const statement of statements) {
        if (statement.trim()) {
          sqliteDb.exec(statement);
        }
      }
    }
  }
  
  // Create Drizzle adapter with better-sqlite3 directly
  const testDbAdapter = drizzle(sqliteDb, { schema });
  
  return { sqliteDb, testDbAdapter };
}

const { sqliteDb, testDbAdapter } = createTestDatabase();

// Test data - minimal required fields only
const testAccount1 = {
  code: '1000',
  name: 'Test Account',
  type: 'ASSET',
  normalBalance: 'DEBIT',
  entityId: 'test-entity',
  path: '1000'
};

// Test data - like the working test
const testAccount2 = {
  code: '1600',
  name: 'Test Account',
  type: 'ASSET',
  normalBalance: 'DEBIT',
  entityId: 'test-entity'
};

console.log('Test account 1 (with path):', testAccount1);
console.log('Test account 2 (without path):', testAccount2);

async function testInserts() {
  try {
    console.log('\nTesting insert with path field...');
    const result1 = await testDbAdapter.insert(schema.accounts).values(testAccount1).returning();
    console.log('Insert 1 successful:', result1[0]);
  } catch (error) {
    console.error('Insert 1 failed:', error.message);
    console.error('Error code:', error.code);
  }

  try {
    console.log('\nTesting insert without path field...');
    const result2 = await testDbAdapter.insert(schema.accounts).values(testAccount2).returning();
    console.log('Insert 2 successful:', result2[0]);
  } catch (error) {
    console.error('Insert 2 failed:', error.message);
    console.error('Error code:', error.code);
  }

  sqliteDb.close();
}

testInserts();