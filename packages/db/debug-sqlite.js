import Database from 'better-sqlite3';

try {
  const db = new Database(':memory:');
  console.log('Database created successfully');
  
  // Create table
  db.exec(`
    CREATE TABLE IF NOT EXISTS accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      subtype TEXT,
      category TEXT,
      parentId INTEGER,
      level INTEGER DEFAULT 0,
      path TEXT NOT NULL,
      isActive INTEGER DEFAULT 1,
      isSystem INTEGER DEFAULT 0,
      allowTransactions INTEGER DEFAULT 1,
      normalBalance TEXT NOT NULL,
      reportCategory TEXT,
      reportOrder INTEGER DEFAULT 0,
      currentBalance REAL DEFAULT 0,
      entityId TEXT NOT NULL,
      createdAt INTEGER NOT NULL,
      updatedAt INTEGER NOT NULL,
      createdBy TEXT,
      updatedBy TEXT,
      FOREIGN KEY (parentId) REFERENCES accounts(id)
    )
  `);
  console.log('Table created successfully');
  
  // Test insert
  const stmt = db.prepare(`
    INSERT INTO accounts (
      code, name, type, normalBalance, path, entityId, createdAt, updatedAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  const result = stmt.run(
    '1000',
    'Test Account', 
    'ASSET',
    'DEBIT',
    '1000',
    'test-entity',
    Date.now(),
    Date.now()
  );
  
  console.log('Insert successful:', result);
  
  // Test update
  const updateStmt = db.prepare(`
    UPDATE accounts SET name = ?, updatedAt = ? WHERE id = ?
  `);
  
  const updateResult = updateStmt.run('Updated Name', Date.now(), result.lastInsertRowid);
  console.log('Update successful:', updateResult);
  
} catch (error) {
  console.error('SQLite Error:', error);
  console.error('Error code:', error.code);
  console.error('Error message:', error.message);
}