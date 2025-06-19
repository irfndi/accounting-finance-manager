// Use require for TypeScript files
const { createTestDatabase } = require('./tests/setup.ts');
const { accounts } = require('./src/schema/index.ts');

async function testDatabase() {
  try {
    console.log('Creating test database...');
    const { testDbAdapter } = createTestDatabase();
    console.log('Database created successfully');
    
    const now = Date.now();
    const testAccount = {
      code: 'DEBUG',
      name: 'Debug Account',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      path: 'DEBUG',
      level: 0,
      isActive: 1,
      isSystem: 0,
      allowTransactions: 1,
      currentBalance: 0,
      entityId: 'test-entity',
      createdAt: now,
      updatedAt: now
    };
    
    console.log('Attempting to insert test account...');
    const result = await testDbAdapter.insert(accounts).values(testAccount).returning();
    console.log('Insert successful:', result);
    
  } catch (error) {
    console.error('Error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
  }
}

testDatabase();