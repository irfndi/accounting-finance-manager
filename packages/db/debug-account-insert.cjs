const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const schema = require('./dist/schema/index.js');
const { readFileSync } = require('fs');
const { join } = require('path');

// Create in-memory database
const sqliteDb = new Database(':memory:');
const db = drizzle(sqliteDb, { schema });

// Read and execute migration
const migrationPath = join(process.cwd(), 'migrations', '0000_chubby_synch.sql');
const migrationSql = readFileSync(migrationPath, 'utf8');

// Split by statement breakpoints and execute each statement
const statements = migrationSql.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s);
for (const statement of statements) {
  if (statement) {
    try {
      sqliteDb.exec(statement);
      console.log('✓ Executed statement successfully');
    } catch (error) {
      console.error('✗ Error executing statement:', error.message);
      console.error('Statement:', statement.substring(0, 100) + '...');
    }
  }
}

// Test account data
const testAccount = {
  code: '1000',
  name: 'Test Account',
  description: null,
  type: 'ASSET',
  parentId: null,
  level: 0,
  path: '1000',
  isActive: true,
  isSystem: false,
  allowTransactions: true,
  normalBalance: 'DEBIT',
  currentBalance: 0,
  entityId: 'test-entity'
};

console.log('\nTesting account insertion...');
console.log('Account data:', JSON.stringify(testAccount, null, 2));

(async () => {
  try {
    const result = await db.insert(schema.accounts).values(testAccount).returning();
    console.log('✓ Account inserted successfully:', result[0]);
  } catch (error) {
    console.error('✗ Error inserting account:', error.message);
    console.error('Error code:', error.code);
    
    // Check which fields are missing
    console.log('\nChecking required fields...');
    const requiredFields = ['code', 'name', 'type', 'normalBalance', 'entityId'];
    for (const field of requiredFields) {
      console.log(`${field}: ${testAccount[field] !== undefined ? '✓' : '✗'} (${testAccount[field]})`);
    }
  }
  
  sqliteDb.close();
})();