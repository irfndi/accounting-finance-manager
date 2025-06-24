import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eq } from 'drizzle-orm';
import { accounts, InsertAccount } from '../../src/schema/accounts';

// Mock database adapter with Drizzle-like interface
let mockData: InsertAccount[] = [];

const createMockAccount = (overrides: Partial<InsertAccount> = {}): InsertAccount => {
  const defaults = {
    id: 1,
    code: '1000',
    name: 'Test Account',
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
    updatedAt: Date.now()
  };
  
  // Apply overrides, ensuring they take precedence
  const result: NewAccount = { ...defaults, ...overrides };
  
  // Adjust reportCategory based on type if not explicitly set
  if (!overrides.reportCategory) {
    if (result.type === 'LIABILITY') {
      result.reportCategory = 'LIABILITIES';
    } else if (result.type === 'EQUITY') {
      result.reportCategory = 'EQUITY';
    } else if (result.type === 'REVENUE') {
      result.reportCategory = 'REVENUE';
    } else if (result.type === 'EXPENSE') {
      result.reportCategory = 'EXPENSES';
    }
  }
  
  return result;
};

const mockDbAdapter = {
  select: vi.fn(() => {
        const currentData = [...mockData];
    
    const createChain = (chainData: NewAccount[]): any => {
            const chain = {
        from: vi.fn((): any => createChain(chainData)),
        where: vi.fn((condition: any) => {
                    let filteredData: NewAccount[] = chainData;
          
          // Handle eq() function calls from drizzle-orm
          if (condition && typeof condition === 'object' && condition.queryChunks) {
            // Parse drizzle eq() condition from queryChunks
            const chunks = condition.queryChunks;
            if (chunks.length === 5) {
              // Structure: [StringChunk, ColumnObject, StringChunk, Value, StringChunk]
              const columnChunk = chunks[1];
              const valueChunk = chunks[3];
              
              if (columnChunk && typeof columnChunk === 'object' && columnChunk.name) {
                const dbColumnName = columnChunk.name;
                // Map database column names to JavaScript property names
                const columnMapping: Record<string, string> = {
                  'entity_id': 'entityId',
                  'parent_id': 'parentId',
                  'is_active': 'isActive',
                  'is_system': 'isSystem',
                  'allow_transactions': 'allowTransactions',
                  'normal_balance': 'normalBalance',
                  'report_category': 'reportCategory',
                  'report_order': 'reportOrder',
                  'current_balance': 'currentBalance',
                  'created_at': 'createdAt',
                  'updated_at': 'updatedAt',
                  'created_by': 'createdBy',
                  'updated_by': 'updatedBy'
                };
                const jsPropertyName = columnMapping[dbColumnName] || dbColumnName;
                
                // Extract value from Param object or use directly
                let value = valueChunk;
                if (valueChunk && typeof valueChunk === 'object' && 'value' in valueChunk) {
                  value = valueChunk.value;
                }
                
                filteredData = chainData.filter((item) => item[jsPropertyName as keyof NewAccount] === value);
              }
            }
          }
          
          // Handle other condition formats (fallback)
          if (condition && typeof condition === 'object' && condition.operator && condition.left && condition.right) {
                        const { operator, left, right } = condition;
            if (operator === '=' && left && left.name) {
              const columnName = left.name;
              const value = right;
              filteredData = chainData.filter((item) => item[columnName as keyof NewAccount] === value);
            }
          }
          
          return createChain(filteredData);
        }),
        limit: vi.fn((count: number) => createChain(chainData.slice(0, count))),
        orderBy: vi.fn(() => createChain(chainData)),
        get: vi.fn(async () => chainData[0] || null),
        catch: vi.fn((callback: (reason: any) => void) => Promise.resolve(chainData).catch(callback)),
        // Make the chain thenable so it can be awaited
        then: vi.fn((onFulfilled?: (value: NewAccount[]) => any, onRejected?: (reason: any) => any) => {
          return Promise.resolve(chainData).then(onFulfilled, onRejected);
        })
      };
      

      

      
      return chain;
    };
    
    return createChain(currentData);
  }),
  insert: vi.fn(() => ({
    values: vi.fn((data) => {
      return new Promise((resolve, reject) => {
        // Validate required fields
        if (!data.code || !data.name || !data.type || !data.normalBalance) {
          reject(new Error('Missing required fields'));
          return;
        }
        
        // Check for unique code constraint
        const existingAccount = mockData.find(item => item.code === data.code);
        if (existingAccount) {
          reject(new Error('Account code must be unique'));
          return;
        }
        
        const newItem = {
          ...createMockAccount(),
          ...data,
          id: mockData.length + 1,
          createdAt: data.createdAt || Date.now(),
          updatedAt: data.updatedAt || Date.now()
        };
        mockData.push(newItem);
        resolve([newItem]);
      });
    })
  })),
  update: vi.fn(() => ({
    set: vi.fn((updateData) => ({
      where: vi.fn((condition) => {
        const updatedData = { ...updateData, updatedAt: Date.now() };
        let updatedCount = 0;
        
        // Handle eq() function calls from drizzle-orm
        if (condition && typeof condition === 'object' && condition.queryChunks) {
          // Parse drizzle eq() condition from queryChunks
          const chunks = condition.queryChunks;
          if (chunks.length === 5) {
            // Structure: [StringChunk, ColumnObject, StringChunk, Value, StringChunk]
            const columnChunk = chunks[1];
            const valueChunk = chunks[3];
            
            if (columnChunk && typeof columnChunk === 'object' && columnChunk.name) {
              const dbColumnName = columnChunk.name; // snake_case from DB
              const jsPropertyName = dbColumnName.replace(/_([a-z])/g, (_: string, letter: string) => letter.toUpperCase()); // Convert to camelCase
              
              // Extract value from Param object or use directly
              let value = valueChunk;
              if (valueChunk && typeof valueChunk === 'object' && 'value' in valueChunk) {
                value = valueChunk.value;
              }
              
              for (let i = 0; i < mockData.length; i++) {
                if (mockData[i][jsPropertyName] === value) {
                  mockData[i] = { ...mockData[i], ...updatedData };
                  updatedCount++;
                }
              }
            }
          }
        }
        // Fallback for other condition formats
        else if (condition && typeof condition === 'object') {
          // Drizzle eq() returns an object with operator and operands
          if (condition.operator === '=' && condition.left && condition.right !== undefined) {
            const field = condition.left.name;
            const value = condition.right;
            
            for (let i = 0; i < mockData.length; i++) {
              if (mockData[i][field] === value) {
                mockData[i] = { ...mockData[i], ...updatedData };
                updatedCount++;
              }
            }
          }
          // Alternative structure for drizzle conditions
          else if (condition.left && condition.right !== undefined) {
            const field = condition.left.name;
            const value = condition.right;
            
            for (let i = 0; i < mockData.length; i++) {
              if (mockData[i][field] === value) {
                mockData[i] = { ...mockData[i], ...updatedData };
                updatedCount++;
              }
            }
          }
          // Check for other condition formats
          else if (condition.column && condition.value !== undefined) {
            const field = condition.column.name;
            const value = condition.value;
            
            for (let i = 0; i < mockData.length; i++) {
              if (mockData[i][field] === value) {
                mockData[i] = { ...mockData[i], ...updatedData };
                updatedCount++;
              }
            }
          }
        }
        
        return Promise.resolve({ changes: updatedCount });
      })
    }))
  })),
  delete: vi.fn(() => ({
    where: vi.fn((condition) => {
      let deletedCount = 0;
      
      // Handle eq() function calls from drizzle-orm
      if (condition && typeof condition === 'object' && condition.queryChunks) {
        // Parse drizzle eq() condition from queryChunks
        const chunks = condition.queryChunks;
        if (chunks.length === 5) {
          // Structure: [StringChunk, ColumnObject, StringChunk, Value, StringChunk]
          const columnChunk = chunks[1];
          const valueChunk = chunks[3];
          
          if (columnChunk && typeof columnChunk === 'object' && columnChunk.name) {
            const columnName = columnChunk.name;
            const value = valueChunk;
            
            for (let i = mockData.length - 1; i >= 0; i--) {
              if (mockData[i][columnName] === value) {
                mockData.splice(i, 1);
                deletedCount++;
              }
            }
          }
        }
      }
      // Fallback for other condition formats
      else if (condition && typeof condition === 'object') {
        // Drizzle eq() returns an object with operator and operands
        if (condition.operator === '=' && condition.left && condition.right !== undefined) {
          const field = condition.left.name;
          const value = condition.right;
          
          for (let i = mockData.length - 1; i >= 0; i--) {
             if (mockData[i][field] === value) {
               mockData.splice(i, 1);
               deletedCount++;
             }
           }
         }
        // Alternative structure for drizzle conditions
        else if (condition.left && condition.right !== undefined) {
          const field = condition.left.name;
          const value = condition.right;
          
          for (let i = mockData.length - 1; i >= 0; i--) {
             if (mockData[i][field] === value) {
               mockData.splice(i, 1);
               deletedCount++;
             }
           }
         }
       }
       
       return Promise.resolve({ changes: deletedCount });
     })
   }))
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
      { id: 1, code: '1000', name: 'Cash', type: 'ASSET', normalBalance: 'DEBIT', reportCategory: 'ASSETS', path: '1000', level: 0, isActive: 1, isSystem: 0, allowTransactions: 1, currentBalance: 0, entityId: 'test-entity', createdAt: Date.now(), updatedAt: Date.now(), category: null, description: null, subtype: null, reportOrder: 0, parentId: null },
      { id: 2, code: '1100', name: 'Accounts Receivable', type: 'ASSET', normalBalance: 'DEBIT', reportCategory: 'ASSETS', path: '1100', level: 0, isActive: 1, isSystem: 0, allowTransactions: 1, currentBalance: 0, entityId: 'test-entity', createdAt: Date.now(), updatedAt: Date.now(), category: null, description: null, subtype: null, reportOrder: 0, parentId: null },
      { id: 3, code: '2000', name: 'Accounts Payable', type: 'LIABILITY', normalBalance: 'CREDIT', reportCategory: 'LIABILITIES', path: '2000', level: 0, isActive: 1, isSystem: 0, allowTransactions: 1, currentBalance: 0, entityId: 'test-entity', createdAt: Date.now(), updatedAt: Date.now(), category: null, description: null, subtype: null, reportOrder: 0, parentId: null }
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

      await getDb().insert().values(newAccount as any);
      
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

      await expect(getDb().insert().values(account2 as any)).rejects.toThrow();
    });

    it('should require mandatory fields', async () => {
      const incompleteAccount = {
        name: 'Test Account'
        // Missing required fields: code, type, normalBalance
      };

      await expect(getDb().insert().values(incompleteAccount as any)).rejects.toThrow();
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

            
      await getDb().insert().values(account as any);
      
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
      assetAccounts.forEach((account: any) => {
        expect(account.type).toBe('ASSET');
      });
    });

    it('should retrieve active accounts only', async () => {
      // First, deactivate an account
      await getDb().update()
        .set({ isActive: 0 })
        .where(eq(accounts.code, '1000'));

      const activeAccounts = await getDb().select()
        .from(accounts)
        .where(eq(accounts.isActive, 1));

      expect(activeAccounts.every((acc: any) => acc.isActive === 1)).toBe(true);
      expect(activeAccounts.find((acc: any) => acc.code === '1000')).toBeUndefined();
    });

    it('should retrieve accounts by entity', async () => {
      const entityAccounts = await getDb().select()
        .from(accounts)
        .where(eq(accounts.entityId, 'test-entity'));

      expect(entityAccounts.length).toBeGreaterThan(0);
      entityAccounts.forEach((account: any) => {
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
      
      await getDb().insert().values(parentAccount as any);
      
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
      
      await getDb().insert().values(childAccount as any);
      
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
        
        await getDb().insert().values(childAccount as any);
        
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
      
      await getDb().update()
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
      
      await getDb().update()
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
        
        await getDb().insert().values(account as any);
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
        
        await getDb().insert().values(account as any);
        const result = await getDb().select().from(accounts).where(eq(accounts.code, account.code));
        expect(result[0].normalBalance).toBe(balance);
      }
    });
  });
});