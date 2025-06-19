const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// Create in-memory database
const db = new Database(':memory:');

// Read and execute migration
const migrationPath = path.join(__dirname, 'migrations', '0000_chubby_synch.sql');
const migrationSql = fs.readFileSync(migrationPath, 'utf8');

// Split by statement breakpoint and execute each statement
const statements = migrationSql.split('--> statement-breakpoint');
for (const statement of statements) {
  const cleanStatement = statement.trim();
  if (cleanStatement && !cleanStatement.startsWith('-->')) {
    try {
      db.exec(cleanStatement);
    } catch (error) {
      console.log('Error executing statement:', cleanStatement.substring(0, 100));
      console.log('Error:', error.message);
    }
  }
}

console.log('Database schema created successfully');

// Test minimal insert
const testData = {
  code: 'TEST001',
  name: 'Test Account',
  type: 'ASSET',
  level: 0,
  path: '/TEST001',
  is_active: 1,
  is_system: 0,
  allow_transactions: 1,
  normal_balance: 'DEBIT',
  current_balance: 0,
  created_at: Date.now(),
  updated_at: Date.now()
};

try {
  const stmt = db.prepare(`
    INSERT INTO accounts (
      code, name, type, level, path, is_active, is_system, 
      allow_transactions, normal_balance, current_balance, 
      created_at, updated_at
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);
  
  const result = stmt.run(
    testData.code,
    testData.name, 
    testData.type,
    testData.level,
    testData.path,
    testData.is_active,
    testData.is_system,
    testData.allow_transactions,
    testData.normal_balance,
    testData.current_balance,
    testData.created_at,
    testData.updated_at
  );
  
  console.log('Insert successful:', result);
  
  // Verify the insert
  const selectStmt = db.prepare('SELECT * FROM accounts WHERE id = ?');
  const inserted = selectStmt.get(result.lastInsertRowid);
  console.log('Inserted record:', inserted);
  
} catch (error) {
  console.log('Insert failed:', error.message);
  console.log('Error code:', error.code);
}

db.close();