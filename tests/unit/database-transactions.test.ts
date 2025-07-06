/**
 * Database Transactions Services Unit Tests
 * Tests for transaction-related database operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eq, and, gte, lte, desc } from 'drizzle-orm';
import { transactions } from '../../src/db/schema';

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
  transaction: vi.fn(),
};

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
});

/**
 * Transaction Service Class for testing
 */
class TransactionService {
  constructor(public db: any) {}

  async getTransactionById(id: number) {
    const result = await this.db
      .select()
      .from(transactions)
      .where(eq(transactions.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  async getTransactionByNumber(transactionNumber: string, entityId?: string) {
    const conditions = [eq(transactions.transactionNumber, transactionNumber)];
    if (entityId) {
      conditions.push(eq(transactions.entityId, entityId));
    }

    const result = await this.db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .limit(1);
    
    return result[0] || null;
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date, entityId?: string) {
    const conditions = [
      gte(transactions.transactionDate, startDate),
      lte(transactions.transactionDate, endDate),
    ];
    
    if (entityId) {
      conditions.push(eq(transactions.entityId, entityId));
    }

    const result = await this.db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.transactionDate));
    
    return result;
  }

  async getTransactionsByStatus(status: string, entityId?: string) {
    const conditions = [eq(transactions.status, status)];
    if (entityId) {
      conditions.push(eq(transactions.entityId, entityId));
    }

    const result = await this.db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.createdAt));
    
    return result;
  }

  async createTransaction(transactionData: any) {
    const newTransaction = {
      ...transactionData,
      transactionNumber: transactionData.transactionNumber || this.generateTransactionNumber(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.db
      .insert(transactions)
      .values(newTransaction)
      .returning();
    
    return result[0];
  }

  async updateTransaction(id: number, transactionData: any) {
    const updateData = {
      ...transactionData,
      updatedAt: new Date(),
    };

    const result = await this.db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();
    
    return result[0];
  }

  async deleteTransaction(id: number) {
    const result = await this.db
      .delete(transactions)
      .where(eq(transactions.id, id))
      .returning();
    
    return result[0] || null;
  }

  async postTransaction(id: number, userId: string) {
    const updateData = {
      status: 'POSTED',
      approvedBy: userId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.db
      .update(transactions)
      .set(updateData)
      .where(eq(transactions.id, id))
      .returning();
    
    return result[0];
  }

  async reverseTransaction(id: number, userId: string, reason: string) {
    // Create reversal transaction
    const originalTransaction = await this.getTransactionById(id);
    if (!originalTransaction) {
      throw new Error('Transaction not found');
    }

    const reversalData = {
      ...originalTransaction,
      id: undefined, // Let database generate new ID
      transactionNumber: this.generateTransactionNumber(),
      description: `REVERSAL: ${originalTransaction.description} - ${reason}`,
      totalAmount: -originalTransaction.totalAmount,
      reversedTransactionId: id,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const reversalResult = await this.createTransaction(reversalData);

    // Mark original as reversed
    await this.updateTransaction(id, {
      isReversed: true,
      updatedBy: userId,
    });

    return reversalResult;
  }

  async getTransactionsByType(type: string, entityId?: string, limit = 50, offset = 0) {
    const conditions = [eq(transactions.type, type)];
    if (entityId) {
      conditions.push(eq(transactions.entityId, entityId));
    }

    const result = await this.db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(desc(transactions.transactionDate))
      .limit(limit)
      .offset(offset)
      .execute();
    
    return result;
  }

  private generateTransactionNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `TXN-${timestamp}-${random}`;
  }
}

describe('TransactionService', () => {
  let transactionService: TransactionService;

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
    
    transactionService = new TransactionService(mockDb as any);
  });

  describe('getTransactionById', () => {
    it('should return transaction when found', async () => {
      const mockTransaction = {
        id: 1,
        transactionNumber: 'TXN-001',
        description: 'Test transaction',
        totalAmount: 1000.00,
        status: 'POSTED',
        entityId: 'entity-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockQueryBuilder.limit.mockResolvedValue([mockTransaction]);
      
      const result = await transactionService.getTransactionById(1);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(transactions);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTransaction);
    });

    it('should return null when transaction not found', async () => {
      mockQueryBuilder.limit.mockResolvedValue([]);
      
      const result = await transactionService.getTransactionById(999);
      
      expect(result).toBeNull();
    });
  });

  describe('getTransactionByNumber', () => {
    it('should return transaction when found by number', async () => {
      const mockTransaction = {
        id: 1,
        transactionNumber: 'TXN-001',
        description: 'Test transaction',
        entityId: 'entity-1',
      };
      
      mockQueryBuilder.limit.mockResolvedValue([mockTransaction]);
      
      const result = await transactionService.getTransactionByNumber('TXN-001', 'entity-1');
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(result).toEqual(mockTransaction);
    });

    it('should work without entityId parameter', async () => {
      const mockTransaction = {
        id: 1,
        transactionNumber: 'TXN-001',
        description: 'Test transaction',
      };
      
      mockQueryBuilder.limit.mockResolvedValue([mockTransaction]);
      
      const result = await transactionService.getTransactionByNumber('TXN-001');
      
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('getTransactionsByDateRange', () => {
    it('should return transactions within date range', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-01-31');
      const mockTransactions = [
        { id: 1, transactionNumber: 'TXN-001', transactionDate: new Date('2024-01-15') },
        { id: 2, transactionNumber: 'TXN-002', transactionDate: new Date('2024-01-20') },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockTransactions);
      
      const result = await transactionService.getTransactionsByDateRange(startDate, endDate, 'entity-1');
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(desc(transactions.transactionDate));
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('getTransactionsByStatus', () => {
    it('should return transactions filtered by status', async () => {
      const mockTransactions = [
        { id: 1, transactionNumber: 'TXN-001', status: 'POSTED' },
        { id: 2, transactionNumber: 'TXN-002', status: 'POSTED' },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockTransactions);
      
      const result = await transactionService.getTransactionsByStatus('POSTED', 'entity-1');
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(desc(transactions.createdAt));
      expect(result).toEqual(mockTransactions);
    });
  });

  describe('createTransaction', () => {
    it('should create transaction with provided data', async () => {
      const transactionData = {
        description: 'Test transaction',
        totalAmount: 1000.00,
        type: 'JOURNAL',
        source: 'MANUAL',
        status: 'DRAFT',
        entityId: 'entity-1',
        createdBy: 'user-1',
        transactionDate: new Date(),
        postingDate: new Date(),
      };
      
      const mockCreatedTransaction = {
        id: 1,
        ...transactionData,
        transactionNumber: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockCreatedTransaction]);
      
      const result = await transactionService.createTransaction(transactionData);
      
      expect(mockDb.insert).toHaveBeenCalledWith(transactions);
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(expect.objectContaining({
        ...transactionData,
        transactionNumber: expect.any(String),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedTransaction);
    });

    it('should use provided transaction number if given', async () => {
      const transactionData = {
        transactionNumber: 'CUSTOM-001',
        description: 'Test transaction',
        totalAmount: 1000.00,
        type: 'JOURNAL',
        source: 'MANUAL',
        createdBy: 'user-1',
        transactionDate: new Date(),
        postingDate: new Date(),
      };
      
      const mockCreatedTransaction = { id: 1, ...transactionData };
      mockQueryBuilder.returning.mockResolvedValue([mockCreatedTransaction]);
      
      await transactionService.createTransaction(transactionData);
      
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(expect.objectContaining({
        transactionNumber: 'CUSTOM-001',
      }));
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction with provided data', async () => {
      const updateData = {
        description: 'Updated transaction',
        totalAmount: 1500.00,
      };
      
      const mockUpdatedTransaction = {
        id: 1,
        transactionNumber: 'TXN-001',
        description: updateData.description,
        totalAmount: updateData.totalAmount,
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockUpdatedTransaction]);
      
      const result = await transactionService.updateTransaction(1, updateData);
      
      expect(mockDb.update).toHaveBeenCalledWith(transactions);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        ...updateData,
        updatedAt: expect.any(Date),
      }));
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedTransaction);
    });
  });

  describe('postTransaction', () => {
    it('should post transaction and set approval fields', async () => {
      const mockPostedTransaction = {
        id: 1,
        transactionNumber: 'TXN-001',
        status: 'POSTED',
        approvedBy: 'user-1',
        approvedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockPostedTransaction]);
      
      const result = await transactionService.postTransaction(1, 'user-1');
      
      expect(mockDb.update).toHaveBeenCalledWith(transactions);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        status: 'POSTED',
        approvedBy: 'user-1',
        approvedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
      expect(result).toEqual(mockPostedTransaction);
    });
  });

  describe('reverseTransaction', () => {
    it('should create reversal transaction and mark original as reversed', async () => {
      const originalTransaction = {
        id: 1,
        transactionNumber: 'TXN-001',
        description: 'Original transaction',
        totalAmount: 1000.00,
        type: 'JOURNAL',
        source: 'MANUAL',
        entityId: 'entity-1',
      };
      
      const reversalTransaction = {
        id: 2,
        transactionNumber: expect.any(String),
        description: 'REVERSAL: Original transaction - Error correction',
        totalAmount: -1000.00,
        reversedTransactionId: 1,
      };
      
      // Mock getTransactionById
      mockQueryBuilder.limit.mockResolvedValueOnce([originalTransaction]);
      
      // Mock create reversal transaction
      mockQueryBuilder.returning.mockResolvedValueOnce([reversalTransaction]);
      
      // Mock update original transaction
      mockQueryBuilder.returning.mockResolvedValueOnce([{ ...originalTransaction, isReversed: true }]);
      
      const result = await transactionService.reverseTransaction(1, 'user-1', 'Error correction');
      
      expect(result).toEqual(reversalTransaction);
      expect(mockDb.insert).toHaveBeenCalledWith(transactions);
      expect(mockDb.update).toHaveBeenCalledWith(transactions);
    });

    it('should throw error when original transaction not found', async () => {
      mockQueryBuilder.limit.mockResolvedValue([]);
      
      await expect(transactionService.reverseTransaction(999, 'user-1', 'Error'))
        .rejects.toThrow('Transaction not found');
    });
  });

  describe('getTransactionsByType', () => {
    it('should return transactions filtered by type with pagination', async () => {
      const mockTransactions = [
        { id: 1, transactionNumber: 'TXN-001', type: 'JOURNAL' },
        { id: 2, transactionNumber: 'TXN-002', type: 'JOURNAL' },
      ];
      
      mockQueryBuilder.execute.mockResolvedValue(mockTransactions);
      
      const result = await transactionService.getTransactionsByType('JOURNAL', 'entity-1', 10, 0);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(desc(transactions.transactionDate));
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(0);
      expect(result).toEqual(mockTransactions);
    });

    it('should use default pagination values', async () => {
      mockQueryBuilder.execute.mockResolvedValue([]);
      
      await transactionService.getTransactionsByType('JOURNAL');
      
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(50);
      expect(mockQueryBuilder.offset).toHaveBeenCalledWith(0);
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction and return deleted data', async () => {
      const mockDeletedTransaction = {
        id: 1,
        transactionNumber: 'TXN-001',
        description: 'Test transaction',
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockDeletedTransaction]);
      
      const result = await transactionService.deleteTransaction(1);
      
      expect(mockDb.delete).toHaveBeenCalledWith(transactions);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedTransaction);
    });

    it('should return null when transaction not found for deletion', async () => {
      mockQueryBuilder.returning.mockResolvedValue([]);
      
      const result = await transactionService.deleteTransaction(999);
      
      expect(result).toBeNull();
    });
  });
});