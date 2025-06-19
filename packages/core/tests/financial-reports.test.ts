import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FinancialReportsEngine } from '@/financial-reports';

describe('FinancialReportsEngine', () => {
  let engine: FinancialReportsEngine;
  let mockDbAdapter: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDbAdapter = {
      query: vi.fn(),
      select: vi.fn(),
      execute: vi.fn()
    };
    engine = new FinancialReportsEngine(mockDbAdapter);
  });

  describe('generateTrialBalance', () => {
    it('should generate trial balance for specific date', async () => {
      const asOfDate = new Date('2023-12-31');
      const result = await engine.generateTrialBalance(asOfDate);

      expect(result).toBeDefined();
      expect(result.asOfDate).toBe(asOfDate.toISOString());
      expect(result.totals).toBeDefined();
      expect(result.totals.isBalanced).toBe(true);
      expect(result.totals.totalDebits).toBe(0);
      expect(result.totals.totalCredits).toBe(0);
    });

    it('should generate trial balance for specific entity', async () => {
      const asOfDate = new Date('2023-12-31');
      const entityId = 'test-entity-123';
      const result = await engine.generateTrialBalance(asOfDate, entityId);

      expect(result.entityId).toBe(entityId);
    });

    it('should return balanced trial balance', async () => {
      const asOfDate = new Date('2023-12-31');
      const result = await engine.generateTrialBalance(asOfDate);

      expect(result.totals.isBalanced).toBe(true);
      expect(result.totals.totalDebits).toBe(result.totals.totalCredits);
    });
  });

  describe('generateBalanceSheet', () => {
    it('should generate balance sheet for specific date', async () => {
      const asOfDate = new Date('2023-12-31');
      const result = await engine.generateBalanceSheet(asOfDate);

      expect(result).toBeDefined();
      expect(result.asOfDate).toBe(asOfDate.toISOString());
      expect(result.assets).toBeDefined();
      expect(result.liabilities).toBeDefined();
      expect(result.equity).toBeDefined();
    });

    it('should have balanced equation (Assets = Liabilities + Equity)', async () => {
      const asOfDate = new Date('2023-12-31');
      const result = await engine.generateBalanceSheet(asOfDate);

      const assetsTotal = result.assets.total;
      const liabilitiesTotal = result.liabilities.total;
      const equityTotal = result.equity.total;

      expect(assetsTotal).toBe(liabilitiesTotal + equityTotal);
    });

    it('should categorize assets correctly', async () => {
      const asOfDate = new Date('2023-12-31');
      const result = await engine.generateBalanceSheet(asOfDate);

      expect(result.assets.current).toBeInstanceOf(Array);
      expect(result.assets.nonCurrent).toBeInstanceOf(Array);
      expect(typeof result.assets.total).toBe('number');
    });
  });

  describe('generateIncomeStatement', () => {
    it('should generate income statement for date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const result = await engine.generateIncomeStatement(startDate, endDate);

      expect(result).toBeDefined();
      expect(result.startDate).toBe(startDate.toISOString());
      expect(result.endDate).toBe(endDate.toISOString());
      expect(result.revenue).toBeDefined();
      expect(result.expenses).toBeDefined();
      expect(result.netIncome).toBeDefined();
    });

    it('should calculate net income correctly', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const result = await engine.generateIncomeStatement(startDate, endDate);

      const expectedNetIncome = result.revenue.total - result.expenses.total;
      expect(result.netIncome).toBe(expectedNetIncome);
    });

    it('should categorize revenue and expenses', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const result = await engine.generateIncomeStatement(startDate, endDate);

      expect(result.revenue.operating).toBeInstanceOf(Array);
      expect(result.revenue.nonOperating).toBeInstanceOf(Array);
      expect(result.expenses.operating).toBeInstanceOf(Array);
      expect(result.expenses.nonOperating).toBeInstanceOf(Array);
    });
  });

  describe('generateCashFlowStatement', () => {
    it('should generate cash flow statement for date range', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const result = await engine.generateCashFlowStatement(startDate, endDate);

      expect(result).toBeDefined();
      expect(result.startDate).toBe(startDate.toISOString());
      expect(result.endDate).toBe(endDate.toISOString());
      expect(result.operating).toBeDefined();
      expect(result.investing).toBeDefined();
      expect(result.financing).toBeDefined();
    });

    it('should calculate net change in cash', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const result = await engine.generateCashFlowStatement(startDate, endDate);

      const expectedNetChange = result.operating.total + result.investing.total + result.financing.total;
      expect(result.netChangeInCash).toBe(expectedNetChange);
    });

    it('should provide cash flow activities breakdown', async () => {
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const result = await engine.generateCashFlowStatement(startDate, endDate);

      expect(result.operating.activities).toBeInstanceOf(Array);
      expect(result.investing.activities).toBeInstanceOf(Array);
      expect(result.financing.activities).toBeInstanceOf(Array);
    });
  });

  describe('error handling', () => {
    it('should handle database errors gracefully', async () => {
      mockDbAdapter.query.mockRejectedValue(new Error('Database connection failed'));
      
      const asOfDate = new Date('2023-12-31');
      await expect(engine.generateTrialBalance(asOfDate)).rejects.toThrow('Database connection failed');
    });

    it('should validate date inputs', async () => {
      const invalidDate = new Date('invalid-date');
      
      await expect(engine.generateTrialBalance(invalidDate)).rejects.toThrow();
    });

    it('should handle empty result sets', async () => {
      mockDbAdapter.query.mockResolvedValue([]);
      
      const asOfDate = new Date('2023-12-31');
      const result = await engine.generateTrialBalance(asOfDate);
      
      expect(result.accounts).toEqual([]);
      expect(result.totals.totalDebits).toBe(0);
      expect(result.totals.totalCredits).toBe(0);
    });
  });
});