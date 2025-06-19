const { drizzle } = require('drizzle-orm/better-sqlite3');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Create production-ready test database using better-sqlite3 directly
function createTestDatabase() {
  const sqliteDb = new Database(':memory:');
  
  // Load schema from migration files
  const migrationsDir = path.join(__dirname, 'migrations');
  const migrationFiles = [
    '0000_chubby_synch.sql',
    '0001_medical_payback.sql', 
    '0002_whole_shadowcat.sql'
  ];
  
  console.log('Applying migrations:', migrationFiles);
  
  for (const file of migrationFiles) {
    const migrationPath = path.join(migrationsDir, file);
    if (fs.existsSync(migrationPath)) {
      const migrationSql = fs.readFileSync(migrationPath, 'utf-8');
      // Split by statement breakpoint and execute each statement
      const statements = migrationSql
        .split('--> statement-breakpoint')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
      
      console.log(`Executing ${file} with ${statements.length} statements`);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            sqliteDb.exec(statement);
          } catch (error) {
            console.error(`Error in ${file}:`, error.message);
          }
        }
      }
    }
  }
  
  // Create Drizzle adapter with better-sqlite3 directly
  const testDbAdapter = drizzle(sqliteDb, { logger: true });
  
  return { sqliteDb, testDbAdapter };
}

// Initialize test database
const { sqliteDb, testDbAdapter } = createTestDatabase();

// Test the EXACT same data as in the test file
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

async function runTest() {
  console.log('\n=== Testing with Drizzle ORM (raw SQL) ===');
  console.log('Test data:', JSON.stringify(newAccount, null, 2));

  // Since we can't easily import the schema, let's test with raw SQL through Drizzle
  try {
    console.log('\nInserting account using Drizzle raw SQL...');
    
    const result = await testDbAdapter.run({
      sql: `INSERT INTO accounts (
        code, name, description, type, subtype, normal_balance, 
        path, level, is_active, is_system, allow_transactions, 
        current_balance, entity_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
      params: [
        newAccount.code,
        newAccount.name,
        newAccount.description,
        newAccount.type,
        newAccount.subtype,
        newAccount.normalBalance,
        newAccount.path,
        newAccount.level,
        newAccount.isActive,
        newAccount.isSystem,
        newAccount.allowTransactions,
        newAccount.currentBalance,
        newAccount.entityId,
        newAccount.createdAt,
        newAccount.updatedAt
      ]
    });
    
    console.log('✅ Account created successfully:', result);
    
  } catch (error) {
    console.error('❌ Error creating account with Drizzle:', error.message);
    console.error('Error code:', error.code);
    console.error('Full error:', error);
    
    // Check actual database schema
    console.log('\n=== Database Schema ===');
    const dbSchema = sqliteDb.prepare('PRAGMA table_info(accounts)').all();
    dbSchema.forEach(col => {
      console.log(`${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
    });
    
    // Try a simpler insert to see what's failing
    console.log('\n=== Testing minimal insert ===');
    try {
      const minimalResult = await testDbAdapter.run({
        sql: `INSERT INTO accounts (code, name, type, normal_balance, path, level, entity_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        params: ['TEST', 'Test Account', 'ASSET', 'DEBIT', '/TEST', 0, 'test-entity', Date.now(), Date.now()]
      });
      console.log('✅ Minimal insert worked:', minimalResult);
    } catch (minError) {
      console.error('❌ Even minimal insert failed:', minError.message);
    }
  }

  sqliteDb.close();
}

runTest().catch(console.error);