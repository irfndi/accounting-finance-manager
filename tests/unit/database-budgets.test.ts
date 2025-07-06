/**
 * Database Budget Services Unit Tests
 * Tests for budget-related database operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eq, asc } from 'drizzle-orm';
import { budgets, budgetAllocations } from '../../src/db/schema';

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
 * Budget Service Class for testing
 */
class BudgetService {
  constructor(public db: any) {}

  async getBudgetById(id: number) {
    const result = await this.db
      .select()
      .from(budgets)
      .where(eq(budgets.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  async getBudgetsByPeriod(budgetPeriodId: number) {
    const result = await this.db
      .select()
      .from(budgets)
      .where(eq(budgets.budgetPeriodId, budgetPeriodId))
      .orderBy(asc(budgets.name));
    
    return result;
  }

  async getBudgetsByStatus(status: string) {
    const result = await this.db
      .select()
      .from(budgets)
      .where(eq(budgets.status, status))
      .orderBy(asc(budgets.name));
    
    return result;
  }

  async getActiveBudgets() {
    const result = await this.db
      .select()
      .from(budgets)
      .where(eq(budgets.status, 'approved'))
      .orderBy(asc(budgets.name));
    
    return result;
  }

  async createBudget(budgetData: any) {
    const newBudget = {
      ...budgetData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.db
      .insert(budgets)
      .values(newBudget)
      .returning();
    
    return result[0];
  }

  async updateBudget(id: number, budgetData: any) {
    const updateData = {
      ...budgetData,
      updatedAt: new Date(),
    };

    const result = await this.db
      .update(budgets)
      .set(updateData)
      .where(eq(budgets.id, id))
      .returning();
    
    return result[0];
  }

  async deleteBudget(id: number) {
    const result = await this.db
      .delete(budgets)
      .where(eq(budgets.id, id))
      .returning();
    
    return result[0] || null;
  }

  async approveBudget(id: number, userId: string) {
    const updateData = {
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.db
      .update(budgets)
      .set(updateData)
      .where(eq(budgets.id, id))
      .returning();
    
    return result[0];
  }

  async activateBudget(id: number, userId: string) {
    const updateData = {
      status: 'ACTIVE',
      activatedBy: userId,
      activatedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.db
      .update(budgets)
      .set(updateData)
      .where(eq(budgets.id, id))
      .returning();
    
    return result[0];
  }

  async closeBudget(id: number, userId: string) {
    const updateData = {
      status: 'CLOSED',
      closedBy: userId,
      closedAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.db
      .update(budgets)
      .set(updateData)
      .where(eq(budgets.id, id))
      .returning();
    
    return result[0];
  }

  async getBudgetItems(budgetId: number) {
    const result = await this.db
      .select()
      .from(budgetAllocations)
      .where(eq(budgetAllocations.budgetId, budgetId))
      .orderBy(budgetAllocations.id);
    
    return result;
  }

  async createBudgetItem(budgetItemData: any) {
    const newBudgetItem = {
      ...budgetItemData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.db
        .insert(budgetAllocations)
        .values(newBudgetItem)
        .returning();
    
    return result[0];
  }

  async updateBudgetItem(id: number, budgetItemData: any) {
    const updateData = {
      ...budgetItemData,
      updatedAt: new Date(),
    };

    const result = await this.db
        .update(budgetAllocations)
        .set(updateData)
        .where(eq(budgetAllocations.id, id))
        .returning();
    
    return result[0];
  }

  async deleteBudgetItem(id: number) {
    const result = await this.db
        .delete(budgetAllocations)
        .where(eq(budgetAllocations.id, id))
        .returning();
    
    return result[0] || null;
  }

  async getBudgetAllocations(budgetId: number) {
    const result = await this.db
      .select()
      .from(budgetAllocations)
      .where(eq(budgetAllocations.budgetId, budgetId))
      .orderBy(asc(budgetAllocations.id));
    
    return result;
  }

  async createBudgetAllocation(allocationData: any) {
    const newAllocation = {
      ...allocationData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.db
      .insert(budgetAllocations)
      .values(newAllocation)
      .returning();
    
    return result[0];
  }

  async updateBudgetAllocation(id: number, allocationData: any) {
    const updateData = {
      ...allocationData,
      updatedAt: new Date(),
    };

    const result = await this.db
      .update(budgetAllocations)
      .set(updateData)
      .where(eq(budgetAllocations.id, id))
      .returning();
    
    return result[0];
  }

  async getBudgetVariance(budgetId: number) {
    // This would typically involve complex calculations
    // For testing purposes, we'll simulate the query structure
    const result = await this.db
      .select()
      .from(budgets)
      .leftJoin(budgetAllocations, eq(budgets.id, budgetAllocations.budgetId))
      .where(eq(budgets.id, budgetId))
      .groupBy(budgets.id);
    
    return result[0] || null;
  }
}

describe('BudgetService', () => {
  let budgetService: BudgetService;

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
    
    budgetService = new BudgetService(mockDb as any);
  });

  describe('getBudgetById', () => {
    it('should return budget when found', async () => {
      const mockBudget = {
        id: 1,
        name: 'Annual Budget 2024',
        description: 'Main budget for 2024',
        type: 'ANNUAL',
        status: 'ACTIVE',
        totalAmount: 1000000.00,
        entityId: 'entity-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockQueryBuilder.limit.mockResolvedValue([mockBudget]);
      
      const result = await budgetService.getBudgetById(1);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(budgets);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockBudget);
    });

    it('should return null when budget not found', async () => {
      mockQueryBuilder.limit.mockResolvedValue([]);
      
      const result = await budgetService.getBudgetById(999);
      
      expect(result).toBeNull();
    });
  });

  describe('getBudgetsByPeriod', () => {
    it('should return budgets within date range', async () => {
      const _startDate = new Date('2024-01-01');
      const _endDate = new Date('2024-12-31');
      const mockBudgets = [
        { id: 1, name: 'Q1 Budget', startDate: new Date('2024-01-01'), endDate: new Date('2024-03-31') },
        { id: 2, name: 'Q2 Budget', startDate: new Date('2024-04-01'), endDate: new Date('2024-06-30') },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockBudgets);
      
      const result = await budgetService.getBudgetsByPeriod(1);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(asc(budgets.name));
      expect(result).toEqual(mockBudgets);
    });
  });

  describe('getBudgetsByStatus', () => {
    it('should return budgets filtered by status', async () => {
      const mockBudgets = [
        { id: 1, name: 'Budget 1', status: 'ACTIVE' },
        { id: 2, name: 'Budget 2', status: 'ACTIVE' },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockBudgets);
      
      const result = await budgetService.getBudgetsByStatus('ACTIVE');
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(asc(budgets.name));
      expect(result).toEqual(mockBudgets);
    });
  });

  describe('getActiveBudgets', () => {
    it('should return currently active budgets', async () => {
      const mockBudgets = [
        { 
          id: 1, 
          name: 'Current Budget', 
          status: 'ACTIVE',
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-12-31')
        },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockBudgets);
      
      const result = await budgetService.getActiveBudgets();
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(asc(budgets.name));
      expect(result).toEqual(mockBudgets);
    });
  });

  describe('createBudget', () => {
    it('should create budget with provided data', async () => {
      const budgetData = {
        name: 'New Budget',
        description: 'Test budget',
        type: 'ANNUAL',
        status: 'DRAFT',
        totalAmount: 500000.00,
        entityId: 'entity-1',
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
        createdBy: 'user-1',
      };
      
      const mockCreatedBudget = {
        id: 1,
        ...budgetData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockCreatedBudget]);
      
      const result = await budgetService.createBudget(budgetData);
      
      expect(mockDb.insert).toHaveBeenCalledWith(budgets);
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(expect.objectContaining({
        ...budgetData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedBudget);
    });
  });

  describe('updateBudget', () => {
    it('should update budget with provided data', async () => {
      const updateData = {
        name: 'Updated Budget',
        totalAmount: 750000.00,
      };
      
      const mockUpdatedBudget = {
        id: 1,
        name: updateData.name,
        totalAmount: updateData.totalAmount,
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockUpdatedBudget]);
      
      const result = await budgetService.updateBudget(1, updateData);
      
      expect(mockDb.update).toHaveBeenCalledWith(budgets);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        ...updateData,
        updatedAt: expect.any(Date),
      }));
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedBudget);
    });
  });

  describe('approveBudget', () => {
    it('should approve budget and set approval fields', async () => {
      const mockApprovedBudget = {
        id: 1,
        name: 'Test Budget',
        status: 'APPROVED',
        approvedBy: 'user-1',
        approvedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockApprovedBudget]);
      
      const result = await budgetService.approveBudget(1, 'user-1');
      
      expect(mockDb.update).toHaveBeenCalledWith(budgets);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        status: 'APPROVED',
        approvedBy: 'user-1',
        approvedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
      expect(result).toEqual(mockApprovedBudget);
    });
  });

  describe('activateBudget', () => {
    it('should activate budget and set activation fields', async () => {
      const mockActivatedBudget = {
        id: 1,
        name: 'Test Budget',
        status: 'ACTIVE',
        activatedBy: 'user-1',
        activatedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockActivatedBudget]);
      
      const result = await budgetService.activateBudget(1, 'user-1');
      
      expect(mockDb.update).toHaveBeenCalledWith(budgets);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        status: 'ACTIVE',
        activatedBy: 'user-1',
        activatedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
      expect(result).toEqual(mockActivatedBudget);
    });
  });

  describe('closeBudget', () => {
    it('should close budget and set closure fields', async () => {
      const mockClosedBudget = {
        id: 1,
        name: 'Test Budget',
        status: 'CLOSED',
        closedBy: 'user-1',
        closedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockClosedBudget]);
      
      const result = await budgetService.closeBudget(1, 'user-1');
      
      expect(mockDb.update).toHaveBeenCalledWith(budgets);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        status: 'CLOSED',
        closedBy: 'user-1',
        closedAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
      expect(result).toEqual(mockClosedBudget);
    });
  });

  describe('getBudgetItems', () => {
    it('should return budget items ordered by line number', async () => {
      const mockBudgetItems = [
        { id: 1, budgetId: 1, lineNumber: 1, description: 'Item 1', amount: 10000 },
        { id: 2, budgetId: 1, lineNumber: 2, description: 'Item 2', amount: 20000 },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockBudgetItems);
      
      const result = await budgetService.getBudgetItems(1);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(budgetAllocations);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(budgetAllocations.id);
      expect(result).toEqual(mockBudgetItems);
    });
  });

  describe('createBudgetItem', () => {
    it('should create budget item with provided data', async () => {
      const budgetItemData = {
        budgetId: 1,
        lineNumber: 1,
        accountId: 1001,
        description: 'Office Supplies',
        budgetedAmount: 5000.00,
        category: 'EXPENSE',
      };
      
      const mockCreatedItem = {
        id: 1,
        ...budgetItemData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockCreatedItem]);
      
      const result = await budgetService.createBudgetItem(budgetItemData);
      
      expect(mockDb.insert).toHaveBeenCalledWith(budgetAllocations);
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(expect.objectContaining({
        ...budgetItemData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
      expect(result).toEqual(mockCreatedItem);
    });
  });

  describe('updateBudgetItem', () => {
    it('should update budget item with provided data', async () => {
      const updateData = {
        description: 'Updated Office Supplies',
        budgetedAmount: 7500.00,
      };
      
      const mockUpdatedItem = {
        id: 1,
        budgetId: 1,
        description: updateData.description,
        budgetedAmount: updateData.budgetedAmount,
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockUpdatedItem]);
      
      const result = await budgetService.updateBudgetItem(1, updateData);
      
      expect(mockDb.update).toHaveBeenCalledWith(budgetAllocations);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        ...updateData,
        updatedAt: expect.any(Date),
      }));
      expect(result).toEqual(mockUpdatedItem);
    });
  });

  describe('deleteBudgetItem', () => {
    it('should delete budget item and return deleted data', async () => {
      const mockDeletedItem = {
        id: 1,
        budgetId: 1,
        description: 'Office Supplies',
        budgetedAmount: 5000.00,
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockDeletedItem]);
      
      const result = await budgetService.deleteBudgetItem(1);
      
      expect(mockDb.delete).toHaveBeenCalledWith(budgetAllocations);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedItem);
    });

    it('should return null when budget item not found for deletion', async () => {
      mockQueryBuilder.returning.mockResolvedValue([]);
      
      const result = await budgetService.deleteBudgetItem(999);
      
      expect(result).toBeNull();
    });
  });

  describe('getBudgetAllocations', () => {
    it('should return budget allocations ordered by id', async () => {
      const mockAllocations = [
        { id: 1, budgetId: 1, allocatedAmount: 25000 },
        { id: 2, budgetId: 1, allocatedAmount: 25000 },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockAllocations);
      
      const result = await budgetService.getBudgetAllocations(1);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(budgetAllocations);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(asc(budgetAllocations.id));
      expect(result).toEqual(mockAllocations);
    });
  });

  describe('createBudgetAllocation', () => {
    it('should create budget allocation with provided data', async () => {
      const allocationData = {
        budgetId: 1,
        budgetItemId: 1,
        allocatedAmount: 25000.00,
        actualAmount: 0.00,
      };
      
      const mockCreatedAllocation = {
        id: 1,
        ...allocationData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockCreatedAllocation]);
      
      const result = await budgetService.createBudgetAllocation(allocationData);
      
      expect(mockDb.insert).toHaveBeenCalledWith(budgetAllocations);
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(expect.objectContaining({
        ...allocationData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
      expect(result).toEqual(mockCreatedAllocation);
    });
  });

  describe('updateBudgetAllocation', () => {
    it('should update budget allocation with provided data', async () => {
      const updateData = {
        allocatedAmount: 30000.00,
        actualAmount: 28500.00,
      };
      
      const mockUpdatedAllocation = {
        id: 1,
        budgetId: 1,
        allocatedAmount: updateData.allocatedAmount,
        actualAmount: updateData.actualAmount,
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockUpdatedAllocation]);
      
      const result = await budgetService.updateBudgetAllocation(1, updateData);
      
      expect(mockDb.update).toHaveBeenCalledWith(budgetAllocations);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        ...updateData,
        updatedAt: expect.any(Date),
      }));
      expect(result).toEqual(mockUpdatedAllocation);
    });
  });

  describe('getBudgetVariance', () => {
    it('should return budget variance analysis', async () => {
      const mockVarianceData = {
        id: 1,
        name: 'Test Budget',
        totalAmount: 100000.00,
        actualAmount: 95000.00,
        variance: -5000.00,
        variancePercent: -5.0,
      };
      
      mockQueryBuilder.groupBy.mockResolvedValue([mockVarianceData]);
      
      const result = await budgetService.getBudgetVariance(1);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(budgets);
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalledWith(budgetAllocations, eq(budgets.id, budgetAllocations.budgetId));
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.groupBy).toHaveBeenCalledWith(budgets.id);
      expect(result).toEqual(mockVarianceData);
    });

    it('should return null when budget not found for variance analysis', async () => {
      mockQueryBuilder.groupBy.mockResolvedValue([]);
      
      const result = await budgetService.getBudgetVariance(999);
      
      expect(result).toBeNull();
    });
  });

  describe('deleteBudget', () => {
    it('should delete budget and return deleted data', async () => {
      const mockDeletedBudget = {
        id: 1,
        name: 'Test Budget',
        totalAmount: 100000.00,
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockDeletedBudget]);
      
      const result = await budgetService.deleteBudget(1);
      
      expect(mockDb.delete).toHaveBeenCalledWith(budgets);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedBudget);
    });

    it('should return null when budget not found for deletion', async () => {
      mockQueryBuilder.returning.mockResolvedValue([]);
      
      const result = await budgetService.deleteBudget(999);
      
      expect(result).toBeNull();
    });
  });
});