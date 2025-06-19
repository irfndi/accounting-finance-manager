import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';

// Create in-memory database
const db = new Database(':memory:');

// Read and execute migration
const migration = readFileSync('./migrations/0000_chubby_synch.sql', 'utf8');
const statements = migration.split('-->').map(s => s.split('statement-breakpoint')[0].trim()).filter(Boolean);

for (const statement of statements) {
  if (statement.trim()) {
    try {
      db.exec(statement);
    } catch (error) {
      console.log('Statement:', statement.substring(0, 100));
      console.log('Error:', error.message);
    }
  }
}

console.log('Database created successfully');

// Test different insert scenarios
const testCases = [
  {
    name: 'Minimal required fields',
    data: {
      code: '1000',
      name: 'Test Account',
      type: 'ASSET',
      path: '1000',
      normal_balance: 'DEBIT',
      created_at: Date.now(),
      updated_at: Date.now()
    }
  },
  {
    name: 'With all defaults',
    data: {
      code: '1001',
      name: 'Test Account 2',
      type: 'ASSET',
      level: 0,
      path: '1001',
      is_active: 1,
      is_system: 0,
      allow_transactions: 1,
      normal_balance: 'DEBIT',
      current_balance: 0,
      created_at: Date.now(),
      updated_at: Date.now()
    }
  }
];

for (const testCase of testCases) {
  try {
    const stmt = db.prepare(`
      INSERT INTO accounts (${Object.keys(testCase.data).join(', ')})
      VALUES (${Object.keys(testCase.data).map(() => '?').join(', ')})
    `);
    
    const result = stmt.run(...Object.values(testCase.data));
    console.log(`✅ ${testCase.name}: Success, ID=${result.lastInsertRowid}`);
  } catch (error) {
    console.log(`❌ ${testCase.name}: ${error.message}`);
    console.log('Data:', testCase.data);
  }
}

db.close();