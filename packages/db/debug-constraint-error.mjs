import Database from 'better-sqlite3';
import { readFileSync } from 'fs';
import { join } from 'path';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { accounts } from './dist/schema/accounts.js';

// Create in-memory database
const sqliteDb = new Database(':memory:');

// Apply actual migration to see the real schema
const migrationPath = join(process.cwd(), 'migrations', '0000_chubby_synch.sql');
const migrationSql = readFileSync(migrationPath, 'utf-8');

console.log('Applying migration...');
const statements = migrationSql
  .split('--> statement-breakpoint')
  .map(stmt => stmt.trim())
  .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

for (const statement of statements) {
  if (statement.trim()) {
    try {
      sqliteDb.exec(statement);
      console.log('Executed statement successfully');
    } catch (error) {
      console.error('Error executing statement:', error.message);
      console.error('Statement:', statement.substring(0, 200) + '...');
    }
  }
}

const db = drizzle(sqliteDb, { schema: { accounts } });

// Test different combinations to find the exact issue
const testCases = [
  {
    name: 'Minimal required fields only',
    data: {
      code: '1000',
      name: 'Cash',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      path: '1000',
      level: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  {
    name: 'With entityId',
    data: {
      code: '1001',
      name: 'Cash with Entity',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      path: '1001',
      level: 0,
      entityId: 'test-entity',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  },
  {
    name: 'All default fields',
    data: {
      code: '1002',
      name: 'Full Account',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      path: '1002',
      level: 0,
      isActive: 1,
      isSystem: 0,
      allowTransactions: 1,
      currentBalance: 0,
      reportOrder: 0,
      entityId: 'test-entity',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  }
];

for (const testCase of testCases) {
  console.log(`\nTesting: ${testCase.name}`);
  console.log('Data:', JSON.stringify(testCase.data, null, 2));
  
  try {
    const result = await db.insert(accounts).values(testCase.data).returning();
    console.log('✅ Success! Inserted:', result[0]?.id);
  } catch (error) {
    console.log('❌ Failed!');
    console.log('Error code:', error.code);
    console.log('Error message:', error.message);
    
    // Try to get more details about which column failed
    if (error.message.includes('NOT NULL')) {
      const match = error.message.match(/NOT NULL constraint failed: (\w+\.\w+)/);
      if (match) {
        console.log('Failed column:', match[1]);
      }
    }
  }
}

sqliteDb.close();