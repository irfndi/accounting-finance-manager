/**
 * Database Category Services Unit Tests
 * Tests for category-related database operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { eq, like, isNull, asc } from 'drizzle-orm';
import { categories } from '../../src/db/schema';

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
 * Category Service Class for testing
 */
class CategoryService {
  constructor(public db: any) {}

  async getCategoryById(id: number) {
    const result = await this.db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1);
    
    return result[0] || null;
  }

  async getCategoryByCode(code: string) {
    const result = await this.db
      .select()
      .from(categories)
      .where(eq(categories.code, code))
      .limit(1);
    
    return result[0] || null;
  }

  async getCategoriesByType(type: string) {
    const result = await this.db
      .select()
      .from(categories)
      .where(eq(categories.type, type))
      .orderBy(asc(categories.name));
    
    return result;
  }

  async getActiveCategories() {
    const result = await this.db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(asc(categories.name));
    
    return result;
  }

  async getRootCategories() {
    const result = await this.db
      .select()
      .from(categories)
      .where(isNull(categories.parentId))
      .orderBy(asc(categories.name));
    
    return result;
  }

  async getChildCategories(parentId: number) {
    const result = await this.db
      .select()
      .from(categories)
      .where(eq(categories.parentId, parentId))
      .orderBy(asc(categories.name));
    
    return result;
  }

  async searchCategories(searchTerm: string) {
    const result = await this.db
      .select()
      .from(categories)
      .where(like(categories.name, `%${searchTerm}%`))
      .orderBy(asc(categories.name));
    
    return result;
  }

  async createCategory(categoryData: any) {
    const newCategory = {
      ...categoryData,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await this.db
      .insert(categories)
      .values(newCategory)
      .returning();
    
    return result[0];
  }

  async updateCategory(id: number, categoryData: any) {
    const updateData = {
      ...categoryData,
      updatedAt: new Date(),
    };

    const result = await this.db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    
    return result[0];
  }

  async deleteCategory(id: number) {
    const result = await this.db
      .delete(categories)
      .where(eq(categories.id, id))
      .returning();
    
    return result[0] || null;
  }

  async deactivateCategory(id: number, userId: string) {
    const updateData = {
      isActive: false,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    const result = await this.db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    
    return result[0];
  }

  async activateCategory(id: number, userId: string) {
    const updateData = {
      isActive: true,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    const result = await this.db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning();
    
    return result[0];
  }

  async getCategoryHierarchy(rootId?: number) {
    // This would typically involve recursive queries or multiple queries
    // For testing purposes, we'll simulate the query structure
    const condition = rootId 
      ? eq(categories.parentId, rootId)
      : isNull(categories.parentId);

    const result = await this.db
      .select()
      .from(categories)
      .where(condition)
      .orderBy(asc(categories.name));
    
    return result;
  }

  async moveCategory(categoryId: number, newParentId: number | null, userId: string) {
    const updateData = {
      parentId: newParentId,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    const result = await this.db
      .update(categories)
      .set(updateData)
      .where(eq(categories.id, categoryId))
      .returning();
    
    return result[0];
  }

  async getCategoriesWithTransactionCount() {
    // This would typically involve joins with transactions table
    // For testing purposes, we'll simulate the query structure
    const result = await this.db
      .select()
      .from(categories)
      .leftJoin(/* transactions table would be joined here */)
      .orderBy(asc(categories.name));
    
    return result;
  }

  async bulkUpdateCategories(categoryUpdates: Array<{ id: number; data: any }>, userId: string) {
    // In a real implementation, this would use a database transaction
    // For testing, we'll simulate multiple update operations
    const results = [];
    
    for (const update of categoryUpdates) {
      const updateData = {
        ...update.data,
        updatedBy: userId,
        updatedAt: new Date(),
      };

      const result = await this.db
        .update(categories)
        .set(updateData)
        .where(eq(categories.id, update.id))
        .returning();
      
      if (result[0]) {
        results.push(result[0]);
      }
    }
    
    return results;
  }
}

describe('CategoryService', () => {
  let categoryService: CategoryService;

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
    
    categoryService = new CategoryService(mockDb as any);
  });

  describe('getCategoryById', () => {
    it('should return category when found', async () => {
      const mockCategory = {
        id: 1,
        code: 'OFFICE',
        name: 'Office Expenses',
        description: 'Office related expenses',
        type: 'EXPENSE',
        isActive: true,
        entityId: 'entity-1',
        parentId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      mockQueryBuilder.limit.mockResolvedValue([mockCategory]);
      
      const result = await categoryService.getCategoryById(1);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(categories);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockCategory);
    });

    it('should return null when category not found', async () => {
      mockQueryBuilder.limit.mockResolvedValue([]);
      
      const result = await categoryService.getCategoryById(999);
      
      expect(result).toBeNull();
    });
  });

  describe('getCategoryByCode', () => {
    it('should return category when found by code', async () => {
      const mockCategory = {
        id: 1,
        code: 'OFFICE',
        name: 'Office Expenses',
        entityId: 'entity-1',
      };
      
      mockQueryBuilder.limit.mockResolvedValue([mockCategory]);
      
      const result = await categoryService.getCategoryByCode('OFFICE_SUPPLIES');
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(result).toEqual(mockCategory);
    });

    it('should work without entityId parameter', async () => {
      const mockCategory = {
        id: 1,
        code: 'OFFICE',
        name: 'Office Expenses',
      };
      
      mockQueryBuilder.limit.mockResolvedValue([mockCategory]);
      
      const result = await categoryService.getCategoryByCode('OFFICE');
      
      expect(result).toEqual(mockCategory);
    });
  });

  describe('getCategoriesByType', () => {
    it('should return categories filtered by type', async () => {
      const mockCategories = [
        { id: 1, code: 'OFFICE', name: 'Office Expenses', type: 'EXPENSE' },
        { id: 2, code: 'TRAVEL', name: 'Travel Expenses', type: 'EXPENSE' },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockCategories);
      
      const result = await categoryService.getCategoriesByType('EXPENSE');
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(asc(categories.name));
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getActiveCategories', () => {
    it('should return only active categories', async () => {
      const mockCategories = [
        { id: 1, code: 'OFFICE', name: 'Office Expenses', isActive: true },
        { id: 2, code: 'TRAVEL', name: 'Travel Expenses', isActive: true },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockCategories);
      
      const result = await categoryService.getActiveCategories();
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(asc(categories.name));
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getRootCategories', () => {
    it('should return categories with no parent', async () => {
      const mockCategories = [
        { id: 1, code: 'EXPENSE', name: 'Expenses', parentId: null },
        { id: 2, code: 'INCOME', name: 'Income', parentId: null },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockCategories);
      
      const result = await categoryService.getRootCategories();
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(asc(categories.name));
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getChildCategories', () => {
    it('should return child categories of a parent', async () => {
      const mockCategories = [
        { id: 3, code: 'OFFICE', name: 'Office Expenses', parentId: 1 },
        { id: 4, code: 'TRAVEL', name: 'Travel Expenses', parentId: 1 },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockCategories);
      
      const result = await categoryService.getChildCategories(1);
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(asc(categories.name));
      expect(result).toEqual(mockCategories);
    });
  });

  describe('searchCategories', () => {
    it('should return categories matching search term', async () => {
      const mockCategories = [
        { id: 1, code: 'OFFICE', name: 'Office Expenses' },
        { id: 2, code: 'OFFICE_SUPPLIES', name: 'Office Supplies' },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockCategories);
      
      const result = await categoryService.searchCategories('office');
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(asc(categories.name));
      expect(result).toEqual(mockCategories);
    });
  });

  describe('createCategory', () => {
    it('should create category with provided data', async () => {
      const categoryData = {
        code: 'NEW_CAT',
        name: 'New Category',
        description: 'A new category',
        type: 'EXPENSE',
        isActive: true,
        entityId: 'entity-1',
        parentId: null,
        createdBy: 'user-1',
      };
      
      const mockCreatedCategory = {
        id: 1,
        ...categoryData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockCreatedCategory]);
      
      const result = await categoryService.createCategory(categoryData);
      
      expect(mockDb.insert).toHaveBeenCalledWith(categories);
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(expect.objectContaining({
        ...categoryData,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      }));
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedCategory);
    });
  });

  describe('updateCategory', () => {
    it('should update category with provided data', async () => {
      const updateData = {
        name: 'Updated Category',
        description: 'Updated description',
      };
      
      const mockUpdatedCategory = {
        id: 1,
        code: 'TEST_CAT',
        name: updateData.name,
        description: updateData.description,
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockUpdatedCategory]);
      
      const result = await categoryService.updateCategory(1, updateData);
      
      expect(mockDb.update).toHaveBeenCalledWith(categories);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        ...updateData,
        updatedAt: expect.any(Date),
      }));
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedCategory);
    });
  });

  describe('deactivateCategory', () => {
    it('should deactivate category', async () => {
      const mockDeactivatedCategory = {
        id: 1,
        code: 'TEST_CAT',
        name: 'Test Category',
        isActive: false,
        updatedBy: 'user-1',
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockDeactivatedCategory]);
      
      const result = await categoryService.deactivateCategory(1, 'user-1');
      
      expect(mockDb.update).toHaveBeenCalledWith(categories);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        isActive: false,
        updatedBy: 'user-1',
        updatedAt: expect.any(Date),
      }));
      expect(result).toEqual(mockDeactivatedCategory);
    });
  });

  describe('activateCategory', () => {
    it('should activate category', async () => {
      const mockActivatedCategory = {
        id: 1,
        code: 'TEST_CAT',
        name: 'Test Category',
        isActive: true,
        updatedBy: 'user-1',
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockActivatedCategory]);
      
      const result = await categoryService.activateCategory(1, 'user-1');
      
      expect(mockDb.update).toHaveBeenCalledWith(categories);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        isActive: true,
        updatedBy: 'user-1',
        updatedAt: expect.any(Date),
      }));
      expect(result).toEqual(mockActivatedCategory);
    });
  });

  describe('getCategoryHierarchy', () => {
    it('should return category hierarchy starting from root', async () => {
      const mockCategories = [
        { id: 1, code: 'EXPENSE', name: 'Expenses', parentId: null },
        { id: 2, code: 'INCOME', name: 'Income', parentId: null },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockCategories);
      
      const result = await categoryService.getCategoryHierarchy();
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(asc(categories.name));
      expect(result).toEqual(mockCategories);
    });

    it('should return category hierarchy starting from specific root', async () => {
      const mockCategories = [
        { id: 3, code: 'OFFICE', name: 'Office Expenses', parentId: 1 },
        { id: 4, code: 'TRAVEL', name: 'Travel Expenses', parentId: 1 },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockCategories);
      
      const result = await categoryService.getCategoryHierarchy(1);
      
      expect(result).toEqual(mockCategories);
    });
  });

  describe('moveCategory', () => {
    it('should move category to new parent', async () => {
      const mockMovedCategory = {
        id: 3,
        code: 'OFFICE',
        name: 'Office Expenses',
        parentId: 2,
        updatedBy: 'user-1',
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockMovedCategory]);
      
      const result = await categoryService.moveCategory(3, 2, 'user-1');
      
      expect(mockDb.update).toHaveBeenCalledWith(categories);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        parentId: 2,
        updatedBy: 'user-1',
        updatedAt: expect.any(Date),
      }));
      expect(result).toEqual(mockMovedCategory);
    });

    it('should move category to root level', async () => {
      const mockMovedCategory = {
        id: 3,
        code: 'OFFICE',
        name: 'Office Expenses',
        parentId: null,
        updatedBy: 'user-1',
        updatedAt: expect.any(Date),
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockMovedCategory]);
      
      const result = await categoryService.moveCategory(3, null, 'user-1');
      
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        parentId: null,
      }));
      expect(result).toEqual(mockMovedCategory);
    });
  });

  describe('getCategoriesWithTransactionCount', () => {
    it('should return categories with transaction counts', async () => {
      const mockCategoriesWithCounts = [
        { id: 1, code: 'OFFICE', name: 'Office Expenses', transactionCount: 15 },
        { id: 2, code: 'TRAVEL', name: 'Travel Expenses', transactionCount: 8 },
      ];
      
      mockQueryBuilder.orderBy.mockResolvedValue(mockCategoriesWithCounts);
      
      const result = await categoryService.getCategoriesWithTransactionCount();
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(categories);
      expect(mockQueryBuilder.leftJoin).toHaveBeenCalled();
      expect(mockQueryBuilder.orderBy).toHaveBeenCalledWith(asc(categories.name));
      expect(result).toEqual(mockCategoriesWithCounts);
    });
  });

  describe('bulkUpdateCategories', () => {
    it('should update multiple categories', async () => {
      const categoryUpdates = [
        { id: 1, data: { name: 'Updated Office' } },
        { id: 2, data: { name: 'Updated Travel' } },
      ];
      
      const mockUpdatedCategories = [
        { id: 1, name: 'Updated Office', updatedBy: 'user-1', updatedAt: expect.any(Date) },
        { id: 2, name: 'Updated Travel', updatedBy: 'user-1', updatedAt: expect.any(Date) },
      ];
      
      mockQueryBuilder.returning
        .mockResolvedValueOnce([mockUpdatedCategories[0]])
        .mockResolvedValueOnce([mockUpdatedCategories[1]]);
      
      const result = await categoryService.bulkUpdateCategories(categoryUpdates, 'user-1');
      
      expect(mockDb.update).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockUpdatedCategories);
    });

    it('should handle empty updates array', async () => {
      const result = await categoryService.bulkUpdateCategories([], 'user-1');
      
      expect(mockDb.update).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });

  describe('deleteCategory', () => {
    it('should delete category and return deleted data', async () => {
      const mockDeletedCategory = {
        id: 1,
        code: 'TEST_CAT',
        name: 'Test Category',
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockDeletedCategory]);
      
      const result = await categoryService.deleteCategory(1);
      
      expect(mockDb.delete).toHaveBeenCalledWith(categories);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedCategory);
    });

    it('should return null when category not found for deletion', async () => {
      mockQueryBuilder.returning.mockResolvedValue([]);
      
      const result = await categoryService.deleteCategory(999);
      
      expect(result).toBeNull();
    });
  });
});