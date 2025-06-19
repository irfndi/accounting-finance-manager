const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Create in-memory database
const db = new Database(':memory:');

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Load and execute migrations exactly like the test setup
const migrationsDir = path.join(__dirname, 'migrations');
const migrationFiles = [
  '0000_chubby_synch.sql',
  '0001_medical_payback.sql', 
  '0002_whole_shadowcat.sql'
];

console.log('Applying migrations in order:', migrationFiles);

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
          db.exec(statement);
        } catch (error) {
          console.error(`Error in ${file}:`, error.message);
          console.error(`Statement: ${statement}`);
        }
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

console.log('\n=== Testing EXACT test data ===');
console.log('Test data:', JSON.stringify(newAccount, null, 2));

// Map camelCase to snake_case for database
const dbAccount = {
  code: newAccount.code,
  name: newAccount.name,
  description: newAccount.description,
  type: newAccount.type,
  subtype: newAccount.subtype,
  normal_balance: newAccount.normalBalance,
  path: newAccount.path,
  level: newAccount.level,
  is_active: newAccount.isActive,
  is_system: newAccount.isSystem,
  allow_transactions: newAccount.allowTransactions,
  current_balance: newAccount.currentBalance,
  entity_id: newAccount.entityId,
  created_at: newAccount.createdAt,
  updated_at: newAccount.updatedAt
};

console.log('\nMapped to database format:', JSON.stringify(dbAccount, null, 2));

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
    dbAccount.code,
    dbAccount.name,
    dbAccount.description,
    dbAccount.type,
    dbAccount.subtype,
    dbAccount.normal_balance,
    dbAccount.path,
    dbAccount.level,
    dbAccount.is_active,
    dbAccount.is_system,
    dbAccount.allow_transactions,
    dbAccount.current_balance,
    dbAccount.entity_id,
    dbAccount.created_at,
    dbAccount.updated_at
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