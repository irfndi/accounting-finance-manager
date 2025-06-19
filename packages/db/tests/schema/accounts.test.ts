import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { accounts } from '../../src/schema/accounts';

// Mock database adapter with Drizzle-like interface
let mockData: any[] = [];

const createMockAccount = (overrides: any = {}) => ({
  id: 1,
  code: '1000',
  name: 'Cash',
  description: null,
  type: 'ASSET',
  subtype: null,
  category: null,
  level: 0,
  path: '1000',
  parentId: null,
  isActive: 1,
  isSystem: 0,
  allowTransactions: 1,
  normalBalance: 'DEBIT',
  reportCategory: 'ASSETS',
  reportOrder: 0,
  currentBalance: 0,
  entityId: 'test-entity',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  ...overrides
});

const mockDbAdapter = {
  select: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue(mockData.length > 0 ? mockData : [createMockAccount()]),
      limit: vi.fn().mockResolvedValue(mockData.length > 0 ? mockData : [createMockAccount()]),
      orderBy: vi.fn().mockResolvedValue(mockData.length > 0 ? mockData : [createMockAccount()])
    })
  }),
  insert: vi.fn().mockReturnValue({
    values: vi.fn().mockResolvedValue([createMockAccount()])
  }),
  update: vi.fn().mockReturnValue({
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockResolvedValue([createMockAccount()])
    })
  }),
  delete: vi.fn().mockReturnValue({
    where: vi.fn().mockResolvedValue([createMockAccount()])
  })
};

// Mock test utilities
const dbTestUtils = {
  clearAllTables: vi.fn().mockImplementation(() => {
    mockData = [];
    return Promise.resolve();
  }),
  insertTestAccount: vi.fn().mockImplementation(() => {
    const account = createMockAccount({ id: mockData.length + 1, code: '1500', name: 'Equipment' });
    mockData.push(account);
    return Promise.resolve(account);
  }),
  createTestAccount: vi.fn().mockImplementation((overrides = {}) => 
    createMockAccount({ code: '1500', name: 'Equipment', ...overrides })
  ),
  seedTestData: vi.fn().mockImplementation(() => {
    mockData = [
      createMockAccount({ id: 1, code: '1000', name: 'Cash' }),
      createMockAccount({ id: 2, code: '1100', name: 'Accounts Receivable', type: 'ASSET' }),
      createMockAccount({ id: 3, code: '2000', name: 'Accounts Payable', type: 'LIABILITY', normalBalance: 'CREDIT' })
    ];
    return Promise.resolve();
  })
};

describe('Accounts Schema & Operations', () => {
  beforeEach(async () => {
    await dbTestUtils.clearAllTables();
  });

  const getDb = () => mockDbAdapter;

  describe('Account Creation', () => {
    it('should create a new account successfully', async () => {
      const now = Date.now();
      const newAccount = {
        code: '1500',
        name: 'Equipment',
        description: 'Office equipment and machinery',
        type: 'ASSET',
        subtype: 'FIXED_ASSET',
        category: 'EQUIPMENT',
        level: 0,
        path: '1500',
        isActive: 1,
        isSystem: 0,
        allowTransactions: 1,
        normalBalance: 'DEBIT',
        reportCategory: 'ASSETS',
        reportOrder: 0,
        currentBalance: 0,
        entityId: 'test-entity',
        createdAt: now,
        updatedAt: now
      };

      await getDb().insert(accounts).values(newAccount);
      
      const result = await getDb().select().from(accounts).where(eq(accounts.code, newAccount.code)).get();
      
      expect(result).toBeDefined();
      expect(result!.code).toBe(newAccount.code);
      expect(result!.name).toBe(newAccount.name);
      expect(result!.type).toBe(newAccount.type);
      expect(result!.normalBalance).toBe(newAccount.normalBalance);
    });

    it('should enforce unique account codes', async () => {
      const account1 = await dbTestUtils.insertTestAccount();
      const account2 = dbTestUtils.createTestAccount({ code: account1!.code });

      await expect(getDb().insert(accounts).values(account2)).rejects.toThrow();
    });

    it('should require mandatory fields', async () => {
      const incompleteAccount = {
        name: 'Test Account'
        // Missing required fields: code, type, normalBalance
      };

      await expect(getDb().insert(accounts).values(incompleteAccount as any)).rejects.toThrow();
    });

    it('should set default values correctly', async () => {
      const now = Date.now();
      const account = {
        code: '1600',
        name: 'Test Account',
        type: 'ASSET' as const,
        normalBalance: 'DEBIT' as const,
        path: '1600',
        level: 0,
        isActive: 1,
        isSystem: 0,
        allowTransactions: 1,
        currentBalance: 0,
        entityId: 'test-entity',
        createdAt: now,
        updatedAt: now
      };

            console.log('Inserting account in test:', JSON.stringify(account, null, 2));
      await getDb().insert(accounts).values(account);
      
      const result = await getDb().select().from(accounts).where(eq(accounts.code, account.code));
      
      expect(result[0].isActive).toBe(1); // Default active
      expect(result[0].createdAt).toBeDefined();
      expect(result[0].updatedAt).toBeDefined();
    });
  });

  describe('Account Queries', () => {
    beforeEach(async () => {
      await dbTestUtils.seedTestData();
    });

    it('should retrieve account by ID', async () => {
      const account = await getDb().select().from(accounts).where(eq(accounts.code, '1000')).limit(1);
      
      expect(account).toBeDefined();
      expect(account[0]).toBeDefined();
      expect(account[0].code).toBe('1000');
      expect(account[0].name).toBe('Cash');
    });

    it('should retrieve accounts by type', async () => {
      const assetAccounts = await getDb().select().from(accounts).where(eq(accounts.type, 'ASSET'));
      
      expect(assetAccounts.length).toBeGreaterThan(0);
      assetAccounts.forEach(account => {
        expect(account.type).toBe('ASSET');
      });
    });

    it('should retrieve active accounts only', async () => {
      // First, deactivate an account
      await getDb().update(accounts)
        .set({ isActive: 0 })
        .where(eq(accounts.code, '1000'));

      const activeAccounts = await getDb().select()
        .from(accounts)
        .where(eq(accounts.isActive, 1));

      expect(activeAccounts.every(acc => acc.isActive === 1)).toBe(true);
      expect(activeAccounts.find(acc => acc.code === '1000')).toBeUndefined();
    });

    it('should retrieve accounts by entity', async () => {
      const entityAccounts = await getDb().select()
        .from(accounts)
        .where(eq(accounts.entityId, 'test-entity'));

      expect(entityAccounts.length).toBeGreaterThan(0);
      entityAccounts.forEach(account => {
        expect(account.entityId).toBe('test-entity');
      });
    });
  });

  describe('Hierarchical Account Structure', () => {
    it('should create parent-child account relationships', async () => {
      const now = Date.now();
      // Create parent account
      const parentAccount = {
        code: '1000',
        name: 'Current Assets',
        type: 'ASSET' as const,
        normalBalance: 'DEBIT' as const,
        path: '1000',
        level: 0,
        isActive: 1,
        isSystem: 0,
        allowTransactions: 1,
        currentBalance: 0,
        entityId: 'test-entity',
        createdAt: now,
        updatedAt: now
      };
      
      await getDb().insert(accounts).values(parentAccount);
      
      const parent = await getDb().select().from(accounts).where(eq(accounts.code, parentAccount.code));
      
      // Create child account
      const childAccount = {
        code: '1010',
        name: 'Cash on Hand',
        type: 'ASSET' as const,
        normalBalance: 'DEBIT' as const,
        path: '1000.1010',
        level: 1,
        isActive: 1,
        isSystem: 0,
        allowTransactions: 1,
        currentBalance: 0,
        parentId: parent[0].id,
        entityId: 'test-entity',
        createdAt: now,
        updatedAt: now
      };
      
      await getDb().insert(accounts).values(childAccount);
      
      const child = await getDb().select().from(accounts).where(eq(accounts.code, childAccount.code));
      
      expect(child[0].parentId).toBe(parent[0].id);
    });

    it('should retrieve child accounts of a parent', async () => {
      // Get a parent account
      const parentAccount = await getDb().select()
        .from(accounts)
        .where(eq(accounts.code, '1000'))
        .limit(1);
      
      if (parentAccount[0]) {
        // Create child account
        const now = Date.now();
        const childAccount = {
          code: '1011',
          name: 'Petty Cash',
          type: 'ASSET' as const,
          normalBalance: 'DEBIT' as const,
          path: '1000.1011',
          level: 1,
          isActive: 1,
          isSystem: 0,
          allowTransactions: 1,
          currentBalance: 0,
          parentId: parentAccount[0].id,
          entityId: 'test-entity',
          createdAt: now,
          updatedAt: now
        };
        
        await getDb().insert(accounts).values(childAccount);
        
        // Query child accounts
        const childAccounts = await getDb().select()
          .from(accounts)
          .where(eq(accounts.parentId, parentAccount[0].id));
        
        expect(childAccounts.length).toBeGreaterThan(0);
        expect(childAccounts[0].parentId).toBe(parentAccount[0].id);
      }
    });
  });

  describe('Account Updates', () => {
    beforeEach(async () => {
      await dbTestUtils.seedTestData();
    });

    it('should update account information', async () => {
      const originalAccount = await getDb().select()
        .from(accounts)
        .where(eq(accounts.code, '1000'))
        .limit(1);
      
      const updatedData = {
        name: 'Updated Account Name',
        description: 'Updated description',
        updatedAt: Date.now()
      };
      
      await getDb().update(accounts)
        .set(updatedData)
        .where(eq(accounts.id, originalAccount[0].id));
      
      const updatedAccount = await getDb().select()
        .from(accounts)
        .where(eq(accounts.id, originalAccount[0].id))
        .limit(1);
      
      expect(updatedAccount[0].name).toBe(updatedData.name);
      expect(updatedAccount[0].description).toBe(updatedData.description);
    });

    it('should update timestamps on modification', async () => {
      const account = await getDb().select()
        .from(accounts)
        .where(eq(accounts.code, '1000'))
        .limit(1);
      
      const originalUpdatedAt = account[0].updatedAt;
      
      // Wait a moment to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      await getDb().update(accounts)
        .set({ 
          description: 'Modified description',
          updatedAt: Date.now()
        })
        .where(eq(accounts.id, account[0].id));
      
      const updatedAccount = await getDb().select()
        .from(accounts)
        .where(eq(accounts.id, account[0].id))
        .limit(1);
      
      expect(updatedAccount[0].updatedAt).not.toBe(originalUpdatedAt);
    });
  });

  describe('Account Validation', () => {
    it('should validate account types', async () => {
      const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
      
      for (const type of validTypes) {
        const now = Date.now();
        const account = {
          code: `TEST-${type}`,
          name: `Test ${type} Account`,
          type: type as any,
          normalBalance: 'DEBIT' as const,
          path: `TEST-${type}`,
          level: 0,
          isActive: 1,
          isSystem: 0,
          allowTransactions: 1,
          currentBalance: 0,
          entityId: 'test-entity',
          createdAt: now,
          updatedAt: now
        };
        
        await getDb().insert(accounts).values(account);
        const result = await getDb().select().from(accounts).where(eq(accounts.code, account.code));
        expect(result[0].type).toBe(type);
      }
    });

    it('should validate normal balance types', async () => {
      const validBalances = ['DEBIT', 'CREDIT'];
      
      for (const balance of validBalances) {
        const now = Date.now();
        const account = {
          code: `BAL-${balance}`,
          name: `Test ${balance} Account`,
          type: 'ASSET' as const,
          normalBalance: balance as any,
          path: `BAL-${balance}`,
          level: 0,
          isActive: 1,
          isSystem: 0,
          allowTransactions: 1,
          currentBalance: 0,
          entityId: 'test-entity',
          createdAt: now,
          updatedAt: now
        };
        
        await getDb().insert(accounts).values(account);
        const result = await getDb().select().from(accounts).where(eq(accounts.code, account.code));
        expect(result[0].normalBalance).toBe(balance);
      }
    });
  });
});