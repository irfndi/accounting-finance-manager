/**
 * Database Services Unit Tests
 * Tests for the DatabaseService class and related functions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DatabaseService, createDatabaseService, type CreateUserData, type UpdateUserData } from '../../src/db/services';
import { users } from '../../src/db/schema';

// Mock the database
const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
};

// Mock drizzle query builder methods
const mockQueryBuilder = {
  from: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  values: vi.fn(),
  set: vi.fn(),
  returning: vi.fn(),
};

// Chain the mock methods
mockDb.select.mockReturnValue(mockQueryBuilder);
mockDb.insert.mockReturnValue(mockQueryBuilder);
mockDb.update.mockReturnValue(mockQueryBuilder);
mockDb.delete.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.from.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.where.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.limit.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.values.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.set.mockReturnValue(mockQueryBuilder);
mockQueryBuilder.returning.mockReturnValue(mockQueryBuilder);

// Mock crypto.randomUUID
Object.defineProperty(global, 'crypto', {
  value: {
    randomUUID: vi.fn(() => 'test-uuid-123'),
  },
});

describe('DatabaseService', () => {
  let databaseService: DatabaseService;
  
  beforeEach(() => {
    vi.clearAllMocks();
    databaseService = new DatabaseService(mockDb as any);
  });

  describe('getUserByEmail', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };
      
      mockQueryBuilder.limit.mockResolvedValue([mockUser]);
      
      const result = await databaseService.getUserByEmail('test@example.com');
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(users);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockQueryBuilder.limit.mockResolvedValue([]);
      
      const result = await databaseService.getUserByEmail('nonexistent@example.com');
      
      expect(result).toBeNull();
    });
  });

  describe('getUserById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };
      
      mockQueryBuilder.limit.mockResolvedValue([mockUser]);
      
      const result = await databaseService.getUserById('user-1');
      
      expect(mockDb.select).toHaveBeenCalled();
      expect(mockQueryBuilder.from).toHaveBeenCalledWith(users);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.limit).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockQueryBuilder.limit.mockResolvedValue([]);
      
      const result = await databaseService.getUserById('nonexistent-id');
      
      expect(result).toBeNull();
    });
  });

  describe('createUser', () => {
    it('should create user with provided data', async () => {
      const userData: CreateUserData = {
        email: 'new@example.com',
        password: 'hashed-password',
        name: 'New User',
        emailVerified: false,
      };
      
      const mockCreatedUser = {
        id: 'test-uuid-123',
        email: userData.email,
        password: userData.password,
        name: userData.name,
        emailVerified: userData.emailVerified,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        lastLoginAt: null,
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockCreatedUser]);
      
      const result = await databaseService.createUser(userData);
      
      expect(mockDb.insert).toHaveBeenCalledWith(users);
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(expect.objectContaining({
        id: 'test-uuid-123',
        email: userData.email,
        password: userData.password,
        name: userData.name,
        emailVerified: userData.emailVerified,
      }));
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockCreatedUser);
    });

    it('should create user with default values when optional fields not provided', async () => {
      const userData: CreateUserData = {
        email: 'minimal@example.com',
        password: 'hashed-password',
      };
      
      const mockCreatedUser = {
        id: 'test-uuid-123',
        email: userData.email,
        password: userData.password,
        name: null,
        emailVerified: false,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        lastLoginAt: null,
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockCreatedUser]);
      
      const result = await databaseService.createUser(userData);
      
      expect(mockQueryBuilder.values).toHaveBeenCalledWith(expect.objectContaining({
        name: null,
        emailVerified: false,
      }));
      expect(result).toEqual(mockCreatedUser);
    });
  });

  describe('updateUser', () => {
    it('should update user with provided data', async () => {
      const updateData: UpdateUserData = {
        name: 'Updated Name',
        emailVerified: true,
        lastLoginAt: new Date(),
      };
      
      const mockUpdatedUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: updateData.name,
        password: 'hashed-password',
        emailVerified: updateData.emailVerified,
        createdAt: new Date(),
        updatedAt: expect.any(Date),
        lastLoginAt: updateData.lastLoginAt,
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockUpdatedUser]);
      
      const result = await databaseService.updateUser('user-1', updateData);
      
      expect(mockDb.update).toHaveBeenCalledWith(users);
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        ...updateData,
        updatedAt: expect.any(Date),
      }));
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockUpdatedUser);
    });

    it('should set updatedAt automatically', async () => {
      const updateData: UpdateUserData = {
        name: 'Updated Name',
      };
      
      mockQueryBuilder.returning.mockResolvedValue([{}]);
      
      await databaseService.updateUser('user-1', updateData);
      
      expect(mockQueryBuilder.set).toHaveBeenCalledWith(expect.objectContaining({
        updatedAt: expect.any(Date),
      }));
    });
  });

  describe('deleteUser', () => {
    it('should delete user and return deleted user data', async () => {
      const mockDeletedUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };
      
      mockQueryBuilder.returning.mockResolvedValue([mockDeletedUser]);
      
      const result = await databaseService.deleteUser('user-1');
      
      expect(mockDb.delete).toHaveBeenCalledWith(users);
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(mockQueryBuilder.returning).toHaveBeenCalled();
      expect(result).toEqual(mockDeletedUser);
    });

    it('should return null when user not found for deletion', async () => {
      mockQueryBuilder.returning.mockResolvedValue([]);
      
      const result = await databaseService.deleteUser('nonexistent-id');
      
      expect(result).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return user when valid session provided', async () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed-password',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: null,
      };
      
      mockQueryBuilder.limit.mockResolvedValue([mockUser]);
      
      const session = { userId: 'user-1', sessionId: 'session-123' };
      const result = await databaseService.getCurrentUser(session);
      
      expect(result).toEqual(mockUser);
    });

    it('should return null when session has no userId', async () => {
      const session = { userId: '', sessionId: 'session-123' };
      const result = await databaseService.getCurrentUser(session);
      
      expect(result).toBeNull();
    });

    it('should return null when session is null', async () => {
      const result = await databaseService.getCurrentUser(null as any);
      
      expect(result).toBeNull();
    });
  });
});

describe('createDatabaseService', () => {
  it('should create a DatabaseService instance', () => {
    const service = createDatabaseService(mockDb as any);
    
    expect(service).toBeInstanceOf(DatabaseService);
    expect(service.db).toBe(mockDb);
  });
});