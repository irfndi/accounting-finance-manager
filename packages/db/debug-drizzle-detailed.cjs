const Database = require('better-sqlite3');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const { accounts } = require('./dist/schema/accounts');

function createTestDatabase() {
  const sqliteDb = new Database(':memory:');
  
  // Load schema from migration files
  const migrationsDir = join(__dirname, 'migrations');
  const migrationFiles = [
    '0000_chubby_synch.sql',
    '0001_medical_payback.sql', 
    '0002_whole_shadowcat.sql'
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
          try {
            sqliteDb.exec(statement);
          } catch (error) {
            console.log('Error executing statement:', statement.substring(0, 100));
            console.log('Error:', error.message);
          }
        }
      }
    }
  }
  
  return { sqliteDb, drizzleDb: drizzle(sqliteDb, { schema: { accounts } }) };
}

function testDrizzleInsert() {
  const { sqliteDb, drizzleDb } = createTestDatabase();
  
  // Check the actual schema
  const schema = sqliteDb.prepare("PRAGMA table_info(accounts)").all();
  console.log('Accounts table schema:');
  schema.forEach(col => {
    console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  // Test data from createTestAccount (updated version)
  const testData = {
    code: '1000',
    name: 'Test Account',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    entityId: 'test-entity',
    path: '1000',
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  console.log('\nTest data to insert with Drizzle:');
  console.log(JSON.stringify(testData, null, 2));
  
  // Try inserting with Drizzle
  try {
    const result = drizzleDb.insert(accounts).values(testData).run();
    console.log('\nDrizzle insert successful! Changes:', result.changes);
    
    // Verify the inserted data
    const inserted = sqliteDb.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
    console.log('\nInserted data:');
    console.log(JSON.stringify(inserted, null, 2));
    
  } catch (error) {
    console.log('\nDrizzle insert failed:');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    console.log('Stack:', error.stack);
  }
  
  sqliteDb.close();
}

testDrizzleInsert();