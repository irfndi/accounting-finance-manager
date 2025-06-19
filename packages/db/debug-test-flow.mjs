import Database from 'better-sqlite3';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { accounts, users, transactions, journalEntries, documents } from './dist/schema/index.js';
const schema = { accounts, users, transactions, journalEntries, documents };
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
  
  return { sqliteDb, testDbAdapter: drizzle(sqliteDb, { schema }) };
}

function createTestAccount(data) {
  const defaults = {
    code: '1000',
    name: 'Test Account',
    type: 'ASSET',
    normalBalance: 'DEBIT',
    entityId: 'test-entity'
  };
  const accountData = { ...defaults, ...data };
  const now = new Date();
  return {
    code: accountData.code,
    name: accountData.name,
    type: accountData.type,
    normalBalance: accountData.normalBalance,
    entityId: accountData.entityId,
    path: accountData.code,
    createdAt: now,
    updatedAt: now,
    ...(accountData.description && { description: accountData.description }),
    ...(accountData.parentId && { parentId: accountData.parentId })
  };
}

async function insertTestAccount(testDbAdapter, data) {
  const accountData = createTestAccount(data);
  console.log('Inserting account data:', JSON.stringify(accountData, null, 2));
  return testDbAdapter.insert(schema.accounts).values(accountData).returning();
}

async function clearAllTables(testDbAdapter) {
  try {
    console.log('Clearing all tables...');
    await testDbAdapter.delete(schema.journalEntries);
    await testDbAdapter.delete(schema.transactions);
    await testDbAdapter.delete(schema.accounts);
    await testDbAdapter.delete(schema.users);
    await testDbAdapter.delete(schema.documents);
    console.log('Tables cleared successfully');
  } catch (error) {
    console.log('Error clearing tables:', error.message);
    throw error;
  }
}

async function seedTestData(testDbAdapter) {
  console.log('Seeding test data...');
  
  try {
    // Create test accounts
    const accounts = await Promise.all([
      insertTestAccount(testDbAdapter, {
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        entityId: 'test-entity'
      }),
      insertTestAccount(testDbAdapter, {
        code: '2000',
        name: 'Accounts Payable',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
        entityId: 'test-entity'
      })
    ]);
    
    console.log('Seed data created successfully:', accounts.length, 'accounts');
    return { accounts };
  } catch (error) {
    console.log('Error seeding test data:', error.message);
    console.log('Error code:', error.code);
    console.log('Stack:', error.stack);
    throw error;
  }
}

async function testCompleteFlow() {
  console.log('=== Testing Complete Test Flow ===');
  
  const { sqliteDb, testDbAdapter } = createTestDatabase();
  
  try {
    // Step 1: Clear all tables (like beforeEach)
    await clearAllTables(testDbAdapter);
    
    // Step 2: Seed test data (like beforeEach)
    await seedTestData(testDbAdapter);
    
    // Step 3: Try to create a new account (like the test)
    console.log('\n=== Testing Account Creation ===');
    const newAccount = {
      code: '1500',
      name: 'Equipment',
      description: 'Office equipment and machinery',
      type: 'ASSET',
      subtype: 'NON_CURRENT',
      normalBalance: 'DEBIT',
      entityId: 'test-entity'
    };
    
    const result = await testDbAdapter.insert(schema.accounts).values(newAccount).returning();
    console.log('New account created successfully:', result[0]);
    
  } catch (error) {
    console.log('\nTest flow failed:');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    console.log('Stack:', error.stack);
  }
  
  sqliteDb.close();
}

testCompleteFlow();