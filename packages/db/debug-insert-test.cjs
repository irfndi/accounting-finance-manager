const Database = require('better-sqlite3');
const { readFileSync, existsSync } = require('fs');
const { join } = require('path');

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
  
  return sqliteDb;
}

function testAccountInsert() {
  const db = createTestDatabase();
  
  // Check the actual schema
  const schema = db.prepare("PRAGMA table_info(accounts)").all();
  console.log('Accounts table schema:');
  schema.forEach(col => {
    console.log(`  ${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
  });
  
  // Test data from createTestAccount
  const testData = {
    code: 'TEST001',
    name: 'Test Account',
    type: 'asset',
    normalBalance: 'debit',
    entityId: 'test-entity',
    path: '/TEST001',
    isActive: 1,
    isSystem: 0,
    allowTransactions: 1,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  
  console.log('\nTest data to insert:');
  console.log(JSON.stringify(testData, null, 2));
  
  // Try inserting with raw SQL
  try {
    const stmt = db.prepare(`
      INSERT INTO accounts (
        code, name, type, normal_balance, entity_id, path, 
        is_active, is_system, allow_transactions, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(
      testData.code,
      testData.name, 
      testData.type,
      testData.normalBalance,
      testData.entityId,
      testData.path,
      testData.isActive,
      testData.isSystem,
      testData.allowTransactions,
      testData.createdAt,
      testData.updatedAt
    );
    
    console.log('\nInsert successful! ID:', result.lastInsertRowid);
    
    // Verify the inserted data
    const inserted = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
    console.log('\nInserted data:');
    console.log(JSON.stringify(inserted, null, 2));
    
  } catch (error) {
    console.log('\nInsert failed:');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
  }
  
  db.close();
}

testAccountInsert();