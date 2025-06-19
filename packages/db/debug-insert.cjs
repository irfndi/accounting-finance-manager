const Database = require('better-sqlite3');
const { drizzle } = require('drizzle-orm/better-sqlite3');
const { readFileSync } = require('fs');
const { join } = require('path');

// Create in-memory database
const sqliteDb = new Database(':memory:');

// Load and apply migrations
const migrationPath = join(__dirname, 'drizzle');
try {
  const migrationFiles = require('fs').readdirSync(migrationPath)
    .filter(file => file.endsWith('.sql'))
    .sort();
  
  for (const file of migrationFiles) {
    const migration = readFileSync(join(migrationPath, file), 'utf8');
    console.log(`Applying migration: ${file}`);
    
    // Split by semicolon and execute each statement
    const statements = migration.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          sqliteDb.exec(statement.trim());
        } catch (error) {
          console.error(`Error in statement: ${statement.trim()}`);
          console.error(error);
        }
      }
    }
  }
} catch (error) {
  console.error('Migration error:', error);
}

// Check table structure
const tableInfo = sqliteDb.prepare("PRAGMA table_info(accounts)").all();
console.log('Accounts table structure:');
console.table(tableInfo);

// Try a simple insert
try {
  const result = sqliteDb.prepare(`
    INSERT INTO accounts (
      code, name, type, normal_balance, path, level, 
      is_active, is_system, allow_transactions, current_balance, entity_id
    ) VALUES (
      'TEST-123', 'Test Account', 'ASSET', 'DEBIT', '/TEST', 0,
      1, 0, 1, 0, 'test-entity'
    )
  `).run();
  console.log('Direct insert successful:', result);
} catch (error) {
  console.error('Direct insert failed:', error);
}

console.log('\nDatabase setup completed.');