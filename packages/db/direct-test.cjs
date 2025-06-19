const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Create in-memory database
const db = new Database(':memory:');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Load and execute migrations
const migrationsDir = path.join(__dirname, 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort();

console.log('Applying migrations:', migrationFiles);

for (const file of migrationFiles) {
  const migrationPath = path.join(migrationsDir, file);
  const migration = fs.readFileSync(migrationPath, 'utf8');
  
  const statements = migration.split('--> statement-breakpoint')
    .map(stmt => stmt.trim())
    .filter(stmt => stmt && !stmt.startsWith('--'));
  
  console.log(`Executing ${file} with ${statements.length} statements`);
  
  for (const statement of statements) {
    if (statement.trim()) {
      try {
        db.exec(statement);
        console.log(`  ✅ Executed: ${statement.substring(0, 50)}...`);
      } catch (error) {
        console.error(`  ❌ Error in ${file}:`, error.message);
        console.error(`  Statement: ${statement}`);
      }
    }
  }
}

// Check final table schema
console.log('\n=== Final accounts table schema ===');
const schema = db.prepare('PRAGMA table_info(accounts)').all();
schema.forEach(col => {
  console.log(`${col.name}: ${col.type} ${col.notnull ? 'NOT NULL' : 'NULL'} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
});

// Test the exact same data as in the test
const testAccount = {
  code: '1500',
  name: 'Equipment',
  description: 'Office equipment and machinery',
  type: 'ASSET',
  subtype: 'NON_CURRENT',
  normal_balance: 'DEBIT',
  path: '1500',
  level: 0,
  is_active: 1,
  is_system: 0,
  allow_transactions: 1,
  current_balance: 0,
  entity_id: 'test-entity',
  created_at: Date.now(),
  updated_at: Date.now()
};

console.log('\n=== Testing account creation ===');
console.log('Test data:', JSON.stringify(testAccount, null, 2));

try {
  const stmt = db.prepare(`
    INSERT INTO accounts (
      code, name, description, type, subtype, normal_balance, 
      path, level, is_active, is_system, allow_transactions, 
      current_balance, entity_id, created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);
  
  const result = stmt.run(
    testAccount.code,
    testAccount.name,
    testAccount.description,
    testAccount.type,
    testAccount.subtype,
    testAccount.normal_balance,
    testAccount.path,
    testAccount.level,
    testAccount.is_active,
    testAccount.is_system,
    testAccount.allow_transactions,
    testAccount.current_balance,
    testAccount.entity_id,
    testAccount.created_at,
    testAccount.updated_at
  );
  
  console.log('✅ Account created successfully with ID:', result.lastInsertRowid);
  
  // Verify the inserted data
  const inserted = db.prepare('SELECT * FROM accounts WHERE id = ?').get(result.lastInsertRowid);
  console.log('Inserted account:', inserted);
  
} catch (error) {
  console.error('❌ Error creating account:', error.message);
  console.error('Error code:', error.code);
  console.error('Full error:', error);
}

db.close();