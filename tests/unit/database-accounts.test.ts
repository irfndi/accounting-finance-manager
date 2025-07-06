/**
 * Database Accounts Services Unit Tests
 * Tests for account-related database operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eq, and, isNull } from 'drizzle-orm';
import { accounts } from '../../src/db/schema';

// Mock Drizzle ORM
const mockQueryBuilder = {
  select: vi.fn().mockReturnThis(),
  from: vi.fn().mockReturnThis(),
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  offset: vi.fn().mockReturnThis(),
  leftJoin: vi.fn().mockReturnThis(),
  innerJoin: vi.fn().mockReturnThis(),
  groupBy: vi.fn().mockReturnThis(),
  having: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  values: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  set: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  returning: vi.fn().mockReturnThis(),
  execute: vi.fn(),
};

// Ensure all chained methods return the mockQueryBuilder
mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.from.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.where.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.orderBy.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.limit.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.offset.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.leftJoin.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.innerJoin.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.groupBy.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.having.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.insert.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.values.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.update.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.set.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.delete.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.returning.mockReturnValue(mockQueryBuilder);

const mockDb = {
  select: vi.fn().mockReturnValue(mockQueryBuilder),
  insert: vi.fn().mockReturnValue(mockQueryBuilder),
  update: vi.fn().mockReturnValue(mockQueryBuilder),
  delete: vi.fn().mockReturnValue(mockQueryBuilder),
};

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
});

/**
 * Account Service Class for testing
 */
class AccountService {
  constructor(public db: any) {}

  async getAccountById(id: number) {
    const result = await this.db
      .select()
      .from(accounts)
      .where(eq(accounts.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  async getAccountByCode(code: string, entityId: string) {
    const result = await this.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.code, code), eq(accounts.entityId, entityId)))
      .limit(1);
    
    return result[0] || null;
  }

  async getAccountsByType(type: string, entityId: string) {
    const result = await this.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.type, type), eq(accounts.entityId, entityId), eq(accounts.isActive, 1)))
      .orderBy(accounts.code);
    
    return result;
  }

  async getAccountHierarchy(entityId: string) {
    const result = await this.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.entityId, entityId), eq(accounts.isActive, 1)))
      .orderBy(accounts.path);
    
    return result;
  }

  async createAccount(accountData: any) {
    const newAccount = {
      ...accountData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const result = await this.db
      .insert(accounts)
      .values(newAccount)
      .returning();
    
    return result[0];
  }

  async updateAccount(id: number, accountData: any) {
    const updateData = {
      ...accountData,
      updatedAt: Date.now(),
    };

    const result = await this.db
      .update(accounts)
      .set(updateData)
      .where(eq(accounts.id, id))
      .returning();
    
    return result[0];
  }

  async deleteAccount(id: number) {
    const result = await this.db
      .delete(accounts)
      .where(eq(accounts.id, id))
      .returning();
    
    return result[0] || null;
  }

  async getChildAccounts(parentId: number) {
    const result = await this.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.parentId, parentId), eq(accounts.isActive, 1)))
      .orderBy(accounts.code);
    
    return result;
  }

  async getRootAccounts(entityId: string) {
    const result = await this.db
      .select()
      .from(accounts)
      .where(and(eq(accounts.entityId, entityId), isNull(accounts.parentId), eq(accounts.isActive, 1)))
      .orderBy(accounts.code);
    
    return result;
  }
}

describe('AccountService', () => {
  let accountService: AccountService;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset all mock implementations to ensure they return mockQueryBuilder
    mockQueryBuilder.select.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.from.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.where.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.orderBy.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.limit.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.offset.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.leftJoin.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.innerJoin.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.groupBy.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.having.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.insert.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.values.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.update.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.set.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.delete.mockReturnValue(mockQueryBuilder);
    mockQueryBuilder.returning.mockReturnValue(mockQueryBuilder);
    
    // Reset mockDb implementations
    mockDb.select.mockReturnValue(mockQueryBuilder);
    mockDb.insert.mockReturnValue(mockQueryBuilder);
    mockDb.update.mockReturnValue(mockQueryBuilder);
    mockDb.delete.mockReturnValue(mockQueryBuilder);
    
    accountService = new AccountService(mockDb as any);
  });

  describe('getAccountById', () => {
    it('should return account when found', async () => {
      const mockAccount = {
        id: 1,
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        entityId: 'entity-1',
        isActive: 1,
        currentBalance: 1000.00,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      
      mockQueryBuilder.limit.mockResolvedValue([mockAccount]);
      
      const result = await accountService.getAccountById(1);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(accounts);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockAccount);
    });

    it('should return null when account not found', async () => {
      mockQueryBuilder.limit.mockResolvedValue([]);
      
      const result = await accountService.getAccountById(999);
      
      expect(result).toBeNull();
    });
  });

  describe('getAccountByCode', () => {
    it('should return account when found by code and entity', async () => {
      const mockAccount = {
        id: 1,
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        entityId: 'entity-1',
        isActive: 1,
      };
      
      mockQueryBuilder.limit.mockResolvedValue([mockAccount]);
      
      const result = await accountService.getAccountByCode('1000', 'entity-1');
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(result).toEqual(mockAccount);
    });

    it('should return null when account not found', async () => {
      mockQueryBuilder.limit.mockResolvedValue([]);
      
      const result = await accountService.getAccountByCode('9999', 'entity-1');
      
      expect(result).toBeNull();
    });
  });

  describe('getAccountsByType', () => {
    it('should return accounts filtered by type and entity', async () => {
      const mockAccounts = [
        { id: 1, code: '1000', name: 'Cash', type: 'ASSET', entityId: 'entity-1', isActive: 1 },
        { id: 2, code: '1100', name: 'Accounts Receivable', type: 'ASSET', entityId: 'entity-1', isActive: 1 },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockAccounts);
      
      const result = await accountService.getAccountsByType('ASSET', 'entity-1');
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(accounts.code);
      expect(result).toEqual(mockAccounts);
    });

    it('should return empty array when no accounts found', async () => {
      mockQueryBuilder.orderBy.mockResolvedValue([]);
      
      const result = await accountService.getAccountsByType('NONEXISTENT', 'entity-1');
      
      expect(result).toEqual([]);
    });
  });

  describe('createAccount', () => {
    it('should create account with provided data', async () => {
      const accountData = {
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        entityId: 'entity-1',
        normalBalance: 'DEBIT',
        isActive: 1,
        allowTransactions: 1,
      };
      
      const mockCreatedAccount = {
        id: 1,
        ...accountData,
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockCreatedAccount]);
      
      const result = await accountService.createAccount(accountData);
      
      expect(mockDb.insert).toHaveBeenCalledWith(accounts);
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(expect.objectContaining({
        ...accountData,
        createdAt: expect.any(Number),
        updatedAt: expect.any(Number),
      }));
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedAccount);
    });
  });

  describe('updateAccount', () => {
    it('should update account with provided data', async () => {
      const updateData = {
        name: 'Updated Cash Account',
        description: 'Main cash account',
      };
      
      const mockUpdatedAccount = {
        id: 1,
        code: '1000',
        name: updateData.name,
        description: updateData.description,
        updatedAt: expect.any(Number),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockUpdatedAccount]);
      
      const result = await accountService.updateAccount(1, updateData);
      
      expect(mockDb.update).toHaveBeenCalledWith(accounts);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        ...updateData,
        updatedAt: expect.any(Number),
      }));
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedAccount);
    });
  });

  describe('deleteAccount', () => {
    it('should delete account and return deleted data', async () => {
      const mockDeletedAccount = {
        id: 1,
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockDeletedAccount]);
      
      const result = await accountService.deleteAccount(1);
      
      expect(mockDb.delete).toHaveBeenCalledWith(accounts);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedAccount);
    });

    it('should return null when account not found for deletion', async () => {
      mockQueryBuilder.returning.mockResolvedValue([]);
      
      const result = await accountService.deleteAccount(999);
      
      expect(result).toBeNull();
    });
  });

  describe('getChildAccounts', () => {
    it('should return child accounts for given parent', async () => {
      const mockChildAccounts = [
        { id: 2, code: '1100', name: 'Checking Account', parentId: 1 },
        { id: 3, code: '1200', name: 'Savings Account', parentId: 1 },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockChildAccounts);
      
      const result = await accountService.getChildAccounts(1);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(accounts.code);
      expect(result).toEqual(mockChildAccounts);
    });
  });

  describe('getRootAccounts', () => {
    it('should return root accounts (no parent) for entity', async () => {
      const mockRootAccounts = [
        { id: 1, code: '1000', name: 'Assets', parentId: null, entityId: 'entity-1' },
        { id: 2, code: '2000', name: 'Liabilities', parentId: null, entityId: 'entity-1' },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockRootAccounts);
      
      const result = await accountService.getRootAccounts('entity-1');
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(accounts.code);
      expect(result).toEqual(mockRootAccounts);
    });
  });

  describe('getAccountHierarchy', () => {
    it('should return all accounts ordered by path for hierarchy display', async () => {
      const mockHierarchy = [
        { id: 1, code: '1000', name: 'Assets', path: '1000', level: 0 },
        { id: 2, code: '1100', name: 'Current Assets', path: '1000.1100', level: 1 },
        { id: 3, code: '1110', name: 'Cash', path: '1000.1100.1110', level: 2 },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockHierarchy);
      
      const result = await accountService.getAccountHierarchy('entity-1');
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(accounts.path);
      expect(result).toEqual(mockHierarchy);
    });
  });
});