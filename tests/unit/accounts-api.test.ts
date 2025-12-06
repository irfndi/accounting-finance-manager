import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { APIContext } from 'astro';

// Mock the validation functions
vi.mock('../../src/db', () => ({
  accounts: {
    id: 'id',
    code: 'code',
    name: 'name',
    type: 'type',
    subtype: 'subtype',
    category: 'category',
    description: 'description',
    parentId: 'parentId',
    isActive: 'isActive',
    allowTransactions: 'allowTransactions',
    reportOrder: 'reportOrder',
    createdAt: 'createdAt',
    updatedAt: 'updatedAt',
  },
  db: {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('../../src/lib/auth', () => ({
  validateToken: vi.fn(),
}));

// Import the functions we want to test
import { validateAccountCode, validateAccountName, validateAccountType } from '../../src/web/pages/api/accounts';

describe('Account API Validation', () => {
  describe('validateAccountCode', () => {
    it('should return null for valid account codes', () => {
      expect(validateAccountCode('1000')).toBeNull();
      expect(validateAccountCode('2001')).toBeNull();
      expect(validateAccountCode('3500')).toBeNull();
      expect(validateAccountCode('4100')).toBeNull();
      expect(validateAccountCode('5200')).toBeNull();
    });

    it('should return error for empty or null codes', () => {
      expect(validateAccountCode('')).toBe('Account code is required');
      expect(validateAccountCode(null as any)).toBe('Account code is required');
      expect(validateAccountCode(undefined as any)).toBe('Account code is required');
    });

    it('should return error for codes that are too short', () => {
      expect(validateAccountCode('1')).toBe('Account code must be at least 3 characters');
      expect(validateAccountCode('12')).toBe('Account code must be at least 3 characters');
    });

    it('should return error for codes that are too long', () => {
      const longCode = '1'.repeat(21);
      expect(validateAccountCode(longCode)).toBe('Account code must be at most 20 characters');
    });

    it('should handle whitespace properly', () => {
      expect(validateAccountCode('  ')).toBe('Account code is required');
      expect(validateAccountCode(' 1000 ')).toBeNull(); // Should trim and validate
    });
  });

  describe('validateAccountName', () => {
    it('should return null for valid account names', () => {
      expect(validateAccountName('Cash - Operating Account')).toBeNull();
      expect(validateAccountName('Accounts Receivable')).toBeNull();
      expect(validateAccountName('Office Supplies')).toBeNull();
    });

    it('should return error for empty or null names', () => {
      expect(validateAccountName('')).toBe('Account name is required');
      expect(validateAccountName(null as any)).toBe('Account name is required');
      expect(validateAccountName(undefined as any)).toBe('Account name is required');
    });

    it('should return error for names that are too short', () => {
      expect(validateAccountName('A')).toBe('Account name must be at least 2 characters');
    });

    it('should return error for names that are too long', () => {
      const longName = 'A'.repeat(101);
      expect(validateAccountName(longName)).toBe('Account name must be at most 100 characters');
    });

    it('should handle whitespace properly', () => {
      expect(validateAccountName('  ')).toBe('Account name is required');
      expect(validateAccountName(' Cash Account ')).toBeNull(); // Should trim and validate
    });

    it('should allow special characters', () => {
      expect(validateAccountName('Cash & Equivalents (Primary)')).toBeNull();
      expect(validateAccountName('A/R - Trade Customers')).toBeNull();
      expect(validateAccountName('Office Supplies - Misc.')).toBeNull();
    });
  });

  describe('validateAccountType', () => {
    it('should return null for valid account types', () => {
      expect(validateAccountType('ASSET')).toBeNull();
      expect(validateAccountType('LIABILITY')).toBeNull();
      expect(validateAccountType('EQUITY')).toBeNull();
      expect(validateAccountType('REVENUE')).toBeNull();
      expect(validateAccountType('EXPENSE')).toBeNull();
    });

    it('should return error for invalid account types', () => {
      expect(validateAccountType('INVALID')).toBe('Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE');
      expect(validateAccountType('asset')).toBe('Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE');
      expect(validateAccountType('Asset')).toBe('Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE');
    });

    it('should return error for empty or null types', () => {
      expect(validateAccountType('')).toBe('Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE');
      expect(validateAccountType(null as any)).toBe('Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE');
      expect(validateAccountType(undefined as any)).toBe('Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE');
    });

    it('should handle whitespace properly', () => {
      expect(validateAccountType('  ')).toBe('Account type must be one of: ASSET, LIABILITY, EQUITY, REVENUE, EXPENSE');
      expect(validateAccountType(' ASSET ')).toBeNull(); // Should trim and validate
    });
  });
});

describe('Account API Endpoints', () => {
  let mockContext: Partial<APIContext>;
  let mockDatabase: any;
  
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Create a mock D1 database
    mockDatabase = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true })
      }),
      exec: vi.fn().mockResolvedValue({ results: [] })
    };
    
    mockContext = {
      request: new Request('http://localhost:3000/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          code: '1000',
          name: 'Test Account',
          type: 'ASSET'
        })
      }),
      locals: {
        runtime: {
          env: {
            FINANCE_MANAGER_DB: mockDatabase
          }
        }
      }
    };
  });

  describe('POST /api/accounts', () => {
    it('should create account with valid data', async () => {
      // Mock successful database operations
      const { validateToken } = await import('../../src/lib/auth');
      
      vi.mocked(validateToken).mockResolvedValue({ valid: true, payload: { userId: 'user123' } });
      
      // Mock database to return no existing accounts (for duplicate check)
      mockDatabase.prepare.mockReturnValueOnce({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue(null)
      });
      
      // Mock database insert operation
      mockDatabase.prepare.mockReturnValueOnce({
        bind: vi.fn().mockReturnThis(),
        run: vi.fn().mockResolvedValue({
          success: true,
          meta: {
            last_row_id: 1
          }
        })
      });
      
      // Mock database select for returning the created account
      mockDatabase.prepare.mockReturnValueOnce({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({
          id: '1',
          code: '1000',
          name: 'Test Account',
          type: 'ASSET',
          isActive: true,
          allowTransactions: true,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      });

      // Import and test the POST handler
      const { POST } = await import('../../src/web/pages/api/accounts');
      const response = await POST(mockContext as APIContext);
      
      expect(response.status).toBe(201);
      const data = await response.json() as any;
      expect(data.code).toBe('1000');
      expect(data.name).toBe('Test Account');
      expect(data.type).toBe('ASSET');
    });

    it('should return 400 for missing required fields', async () => {
      mockContext.request = new Request('http://localhost:3000/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: JSON.stringify({
          code: '',
          name: '',
          type: ''
        })
      });

      const { validateToken } = await import('../../src/lib/auth');
      vi.mocked(validateToken).mockResolvedValue({ valid: true, payload: { userId: 'user123' } });

      const { POST } = await import('../../src/web/pages/api/accounts');
      const response = await POST(mockContext as APIContext);
      
      expect(response.status).toBe(400);
      const data = await response.json() as any;
      expect(data.error).toContain('Account code is required');
    });

    it('should return 409 for duplicate account code', async () => {
      const { validateToken } = await import('../../src/lib/auth');
      
      vi.mocked(validateToken).mockResolvedValue({ valid: true, payload: { userId: 'user123' } });
      
      // Mock database to return existing account (for duplicate check)
      mockDatabase.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        first: vi.fn().mockResolvedValue({ id: '1', code: '1000' })
      });

      const { POST } = await import('../../src/web/pages/api/accounts');
      const response = await POST(mockContext as APIContext);
      
      expect(response.status).toBe(409);
      const data = await response.json() as any;
      expect(data.error).toBe('Account code already exists');
    });

    it('should return 401 for invalid token', async () => {
      const { validateToken } = await import('../../src/lib/auth');
      vi.mocked(validateToken).mockResolvedValue({ valid: false, error: 'Invalid token' });

      const { POST } = await import('../../src/web/pages/api/accounts');
      const response = await POST(mockContext as APIContext);
      
      expect(response.status).toBe(401);
      const data = await response.json() as any;
      expect(data.error).toBe('Invalid token');
    });

    it('should return 400 for invalid JSON', async () => {
      mockContext.request = new Request('http://localhost:3000/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer valid-token'
        },
        body: 'invalid json'
      });

      const { validateToken } = await import('../../src/lib/auth');
      vi.mocked(validateToken).mockResolvedValue({ valid: true, payload: { userId: 'user123' } });

      const { POST } = await import('../../src/web/pages/api/accounts');
      const response = await POST(mockContext as APIContext);
      
      expect(response.status).toBe(400);
      const data = await response.json() as any;
      expect(data.error).toBe('Invalid JSON in request body');
    });
  });

  describe('GET /api/accounts', () => {
    it('should return accounts list', async () => {
      const { validateToken } = await import('../../src/lib/auth');
      
      mockContext.request = new Request('http://localhost:3000/api/accounts', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer valid-token'
        }
      });

      vi.mocked(validateToken).mockResolvedValue({ valid: true, payload: { userId: 'user123' } });
      
      // Mock the database query to return accounts
      mockDatabase.prepare.mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({
          results: [
            {
              id: '1',
              code: '1000',
              name: 'Cash Account',
              type: 'ASSET',
              isActive: true,
              balance: 1000
            },
            {
              id: '2',
              code: '2000',
              name: 'Accounts Payable',
              type: 'LIABILITY',
              isActive: true,
              balance: 500
            }
          ]
        })
      });

      const { GET } = await import('../../src/web/pages/api/accounts');
       const response = await GET(mockContext as APIContext);
       
       expect(response.status).toBe(200);
       const data = await response.json() as { accounts: any[], count: number };
       expect(data).toHaveProperty('accounts');
       expect(Array.isArray(data.accounts)).toBe(true);
       expect(data.accounts).toHaveLength(2);
       expect(data.accounts[0].code).toBe('1000');
       expect(data.accounts[1].code).toBe('2000');
    });

    it('should return 401 for invalid token', async () => {
      const { validateToken } = await import('../../src/lib/auth');
      
      mockContext.request = new Request('http://localhost:3000/api/accounts', {
        method: 'GET',
        headers: {
          'Authorization': 'Bearer invalid-token'
        }
      });

      vi.mocked(validateToken).mockResolvedValue({ valid: false, error: 'Invalid token' });

      const { GET } = await import('../../src/web/pages/api/accounts');
      const response = await GET(mockContext as APIContext);
      
      expect(response.status).toBe(401);
      const data = await response.json() as any;
      expect(data.error).toBe('Invalid token');
    });
  });
});