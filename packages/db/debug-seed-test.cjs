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

async function insertTestAccount(drizzleDb, data) {
  const accountData = createTestAccount(data);
  console.log('Inserting account data:', JSON.stringify(accountData, null, 2));
  return drizzleDb.insert(accounts).values(accountData).returning();
}

async function testSeedData() {
  const { sqliteDb, drizzleDb } = createTestDatabase();
  
  console.log('Testing seed data insertion...');
  
  try {
    // Test the exact same data as seedTestData
    const testAccounts = await Promise.all([
      insertTestAccount(drizzleDb, {
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        entityId: 'test-entity'
      }),
      insertTestAccount(drizzleDb, {
        code: '2000',
        name: 'Accounts Payable',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
        entityId: 'test-entity'
      })
    ]);
    
    console.log('\nSeed data insertion successful!');
    console.log('Inserted accounts:', testAccounts.length);
    
  } catch (error) {
    console.log('\nSeed data insertion failed:');
    console.log('Error:', error.message);
    console.log('Code:', error.code);
    console.log('Stack:', error.stack);
  }
  
  sqliteDb.close();
}

testSeedData();