/**
 * Financial Reports Unit Tests
 * Tests for PDF/Excel generation and financial reporting engine
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateIncomeStatementPDF,
  generateIncomeStatementExcel,
  generateTrialBalanceExcel,
  generateTrialBalancePDF,

  FinancialReportsEngine
} from '../../src/lib/financial-reports';

// Mock jsPDF
const mockJsPDF = {
  setFontSize: vi.fn(),
  text: vi.fn(),
  line: vi.fn(),
  addPage: vi.fn(),
  output: vi.fn(() => new ArrayBuffer(8))
};

vi.mock('jspdf', () => ({
  jsPDF: vi.fn(() => mockJsPDF)
}));

// Mock excelize-wasm
const mockExcelizeFile = {
  error: null as string | null,
  NewSheet: vi.fn(() => ({ index: 0 })),
  SetActiveSheet: vi.fn(),
  SetCellValue: vi.fn(),
  WriteToBuffer: vi.fn(() => ({ buffer: new Uint8Array([1, 2, 3, 4]), error: null as string | null }))
};

const mockExcelize = {
  NewFile: vi.fn(() => mockExcelizeFile)
};

vi.mock('excelize-wasm', () => ({
  init: vi.fn(() => Promise.resolve(mockExcelize))
}));

// Mock Date for consistent timestamps
const NOW = 1625097600000; // 2021-07-01T00:00:00Z
vi.spyOn(Date, 'now').mockImplementation(() => NOW);
vi.spyOn(Date.prototype, 'toISOString').mockImplementation(function() {
  return '2021-07-01T00:00:00.000Z';
});

describe('Financial Reports', () => {
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock console.error to suppress expected error messages during tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.clearAllMocks();
    consoleErrorSpy.mockRestore();
  });
  
  describe('generateIncomeStatementPDF', () => {
    const mockIncomeStatement = {
      revenue: [
        { name: 'Sales Revenue', amount: 10000 },
        { name: 'Service Revenue', amount: 5000 }
      ],
      expenses: [
        { name: 'Cost of Goods Sold', amount: 6000 },
        { name: 'Operating Expenses', amount: 2000 }
      ],
      totalRevenue: 15000,
      totalExpenses: 8000,
      netIncome: 7000
    };
    
    const mockOptions = {
      entityId: 'test-entity',
      fromDate: new Date('2021-01-01'),
      toDate: new Date('2021-12-31')
    };
    
    it('should generate PDF with complete income statement data', async () => {
      const result = await generateIncomeStatementPDF(mockIncomeStatement, mockOptions);
      
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(mockJsPDF.setFontSize).toHaveBeenCalledWith(20);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Income Statement', 20, 30);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Entity: test-entity', 20, 50);
      expect(mockJsPDF.output).toHaveBeenCalledWith('arraybuffer');
    });
    
    it('should handle missing revenue data gracefully', async () => {
      const incomeStatementWithoutRevenue = {
        ...mockIncomeStatement,
        revenue: null,
        totalRevenue: 0
      };
      
      const result = await generateIncomeStatementPDF(incomeStatementWithoutRevenue, mockOptions);
      
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Total Revenue', 25, expect.any(Number));
    });
    
    it('should handle missing expenses data gracefully', async () => {
      const incomeStatementWithoutExpenses = {
        ...mockIncomeStatement,
        expenses: undefined,
        totalExpenses: 0
      };
      
      const result = await generateIncomeStatementPDF(incomeStatementWithoutExpenses, mockOptions);
      
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Total Expenses', 25, expect.any(Number));
    });
    
    it('should handle empty income statement data', async () => {
      const emptyIncomeStatement = {
        revenue: [],
        expenses: [],
        totalRevenue: 0,
        totalExpenses: 0,
        netIncome: 0
      };
      
      const result = await generateIncomeStatementPDF(emptyIncomeStatement, mockOptions);
      
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
    
    it('should format currency values correctly', async () => {
      await generateIncomeStatementPDF(mockIncomeStatement, mockOptions);
      
      // Check that currency formatting is applied - look for any call with $ symbol
      const textCalls = mockJsPDF.text.mock.calls;
      const hasCurrencyCall = textCalls.some(call => 
        typeof call[0] === 'string' && call[0].includes('$')
      );
      expect(hasCurrencyCall).toBe(true);
    });
    
    it('should include generation date in footer', async () => {
      await generateIncomeStatementPDF(mockIncomeStatement, mockOptions);
      
      expect(mockJsPDF.text).toHaveBeenCalledWith(
        expect.stringContaining('Generated on'),
        20,
        280
      );
    });
    
    it('should throw error when PDF generation fails', async () => {
      mockJsPDF.output.mockImplementationOnce(() => {
        throw new Error('PDF generation failed');
      });
      
      await expect(
        generateIncomeStatementPDF(mockIncomeStatement, mockOptions)
      ).rejects.toThrow('Failed to generate Income Statement PDF');
    });
  });
  
  describe('generateIncomeStatementExcel', () => {
    const mockRevenue = [
      { category: 'Sales', amount: 10000, date: '2021-01-01' },
      { category: 'Services', amount: 5000, date: '2021-01-02' }
    ];
    
    const mockExpenses = [
      { category: 'COGS', amount: 6000, date: '2021-01-01' },
      { category: 'Operating', amount: 2000, date: '2021-01-02' }
    ];
    
    it('should generate Excel with revenue and expense data', async () => {
      const result = await generateIncomeStatementExcel(mockRevenue, mockExpenses);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockExcelize.NewFile).toHaveBeenCalled();
      expect(mockExcelizeFile.NewSheet).toHaveBeenCalledWith('Income Statement');
      expect(mockExcelizeFile.SetCellValue).toHaveBeenCalledWith('Income Statement', 'A1', 'Income Statement');
    });
    
    it('should calculate totals correctly', async () => {
      await generateIncomeStatementExcel(mockRevenue, mockExpenses);
      
      // Check that total revenue (15000) and total expenses (8000) are set
      expect(mockExcelizeFile.SetCellValue).toHaveBeenCalledWith(
        'Income Statement',
        expect.stringMatching(/^B\d+$/),
        15000
      );
      expect(mockExcelizeFile.SetCellValue).toHaveBeenCalledWith(
        'Income Statement',
        expect.stringMatching(/^B\d+$/),
        8000
      );
    });
    
    it('should calculate net income correctly', async () => {
      await generateIncomeStatementExcel(mockRevenue, mockExpenses);
      
      // Net income should be 15000 - 8000 = 7000
      expect(mockExcelizeFile.SetCellValue).toHaveBeenCalledWith(
        'Income Statement',
        expect.stringMatching(/^B\d+$/),
        7000
      );
    });
    
    it('should handle empty revenue and expenses', async () => {
      const result = await generateIncomeStatementExcel([], []);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockExcelizeFile.SetCellValue).toHaveBeenCalledWith(
        'Income Statement',
        expect.stringMatching(/^B\d+$/),
        0
      );
    });
    
    it('should throw error when Excel generation fails', async () => {
      mockExcelizeFile.WriteToBuffer.mockReturnValueOnce({
          buffer: undefined as unknown as Uint8Array<ArrayBuffer>,
          error: 'Excel generation failed'
        });
      
      await expect(
        generateIncomeStatementExcel(mockRevenue, mockExpenses)
      ).rejects.toThrow('Failed to generate Excel: Excel generation failed');
    });
    
    it('should throw error when workbook creation fails', async () => {
      mockExcelize.NewFile.mockReturnValueOnce({
        error: 'Failed to create workbook',
        NewSheet: vi.fn(),
        SetActiveSheet: vi.fn(),
        SetCellValue: vi.fn(),
        WriteToBuffer: vi.fn()
      });
      
      await expect(
        generateIncomeStatementExcel(mockRevenue, mockExpenses)
      ).rejects.toThrow('Failed to create workbook: Failed to create workbook');
    });
  });
  
  describe('generateTrialBalanceExcel', () => {
    const mockEntries = [
      { account: 'Cash', debit: 10000, credit: 0 },
      { account: 'Accounts Receivable', debit: 5000, credit: 0 },
      { account: 'Accounts Payable', debit: 0, credit: 3000 },
      { account: 'Revenue', debit: 0, credit: 12000 }
    ];
    
    it('should generate Excel with trial balance entries', async () => {
      const result = await generateTrialBalanceExcel(mockEntries);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockExcelizeFile.NewSheet).toHaveBeenCalledWith('Trial Balance');
      expect(mockExcelizeFile.SetCellValue).toHaveBeenCalledWith('Trial Balance', 'A1', 'Trial Balance');
    });
    
    it('should set correct headers', async () => {
      await generateTrialBalanceExcel(mockEntries);
      
      expect(mockExcelizeFile.SetCellValue).toHaveBeenCalledWith('Trial Balance', 'A3', 'Account');
      expect(mockExcelizeFile.SetCellValue).toHaveBeenCalledWith('Trial Balance', 'B3', 'Debit');
      expect(mockExcelizeFile.SetCellValue).toHaveBeenCalledWith('Trial Balance', 'C3', 'Credit');
    });
    
    it('should calculate totals correctly', async () => {
      await generateTrialBalanceExcel(mockEntries);
      
      // Total debits: 10000 + 5000 = 15000
      // Total credits: 3000 + 12000 = 15000
      expect(mockExcelizeFile.SetCellValue).toHaveBeenCalledWith(
        'Trial Balance',
        expect.stringMatching(/^B\d+$/),
        15000
      );
      expect(mockExcelizeFile.SetCellValue).toHaveBeenCalledWith(
        'Trial Balance',
        expect.stringMatching(/^C\d+$/),
        15000
      );
    });
    
    it('should handle empty entries', async () => {
      const result = await generateTrialBalanceExcel([]);
      
      expect(result).toBeInstanceOf(Buffer);
      expect(mockExcelizeFile.SetCellValue).toHaveBeenCalledWith(
        'Trial Balance',
        expect.stringMatching(/^B\d+$/),
        0
      );
    });
  });
  
  describe('generateTrialBalancePDF', () => {
    const mockTrialBalance = {
      accounts: [
        { name: 'Cash', debit: 10000, credit: 0 },
        { name: 'Revenue', debit: 0, credit: 10000 }
      ],
      totals: {
        totalDebits: 10000,
        totalCredits: 10000,
        isBalanced: true
      }
    };
    
    const mockOptions = {
      entityId: 'test-entity',
      asOfDate: new Date('2021-07-01')
    };
    
    it('should generate PDF with trial balance data', async () => {
      const result = await generateTrialBalancePDF(mockTrialBalance, mockOptions);
      
      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Trial Balance', 20, 30);
      expect(mockJsPDF.text).toHaveBeenCalledWith('Entity: test-entity', 20, 50);
    });
    
    it('should show balanced status when trial balance is balanced', async () => {
      await generateTrialBalancePDF(mockTrialBalance, mockOptions);
      
      expect(mockJsPDF.text).toHaveBeenCalledWith(
        'Status: BALANCED',
        20,
        expect.any(Number)
      );
    });
    
    it('should show out of balance status when not balanced', async () => {
      const unbalancedTrialBalance = {
        ...mockTrialBalance,
        totals: {
          totalDebits: 10000,
          totalCredits: 9000,
          isBalanced: false
        }
      };
      
      await generateTrialBalancePDF(unbalancedTrialBalance, mockOptions);
      
      expect(mockJsPDF.text).toHaveBeenCalledWith(
        'Status: OUT OF BALANCE',
        20,
        expect.any(Number)
      );
    });
    
    it('should handle missing accounts gracefully', async () => {
      const trialBalanceWithoutAccounts = {
        accounts: null,
        totals: {
          totalDebits: 0,
          totalCredits: 0,
          isBalanced: true
        }
      };
      
      const result = await generateTrialBalancePDF(trialBalanceWithoutAccounts, mockOptions);
      
      expect(result).toBeInstanceOf(ArrayBuffer);
    });
    
    it('should add new page when content exceeds page height', async () => {
      // Create many accounts to trigger page break
      const manyAccounts = Array.from({ length: 50 }, (_, i) => ({
        name: `Account ${i}`,
        debit: 100,
        credit: 0
      }));
      
      const largeTrialBalance = {
        accounts: manyAccounts,
        totals: {
          totalDebits: 5000,
          totalCredits: 5000,
          isBalanced: true
        }
      };
      
      await generateTrialBalancePDF(largeTrialBalance, mockOptions);
      
      expect(mockJsPDF.addPage).toHaveBeenCalled();
    });
  });
  
  describe('FinancialReportsEngine', () => {
    let engine: FinancialReportsEngine;
    let mockDbAdapter: any;
    
    beforeEach(() => {
      mockDbAdapter = {
        query: vi.fn().mockResolvedValue([])
      };
      engine = new FinancialReportsEngine(mockDbAdapter);
    });
    
    describe('constructor', () => {
      it('should initialize with database adapter', () => {
        expect(engine).toBeInstanceOf(FinancialReportsEngine);
      });
      
      it('should work without database adapter', () => {
        const engineWithoutDb = new FinancialReportsEngine(null);
        expect(engineWithoutDb).toBeInstanceOf(FinancialReportsEngine);
      });
    });
    
    describe('generateTrialBalance', () => {
      it('should generate trial balance with default entity', async () => {
        const asOfDate = new Date('2021-07-01');
        const result = await engine.generateTrialBalance(asOfDate);
        
        expect(result).toEqual({
          asOfDate: '2021-07-01T00:00:00.000Z',
          entityId: 'default',
          accounts: [],
          totals: {
            totalDebits: 0,
            totalCredits: 0,
            isBalanced: true
          }
        });
      });
      
      it('should generate trial balance with specified entity', async () => {
        const asOfDate = new Date('2021-07-01');
        const result = await engine.generateTrialBalance(asOfDate, 'custom-entity');
        
        expect(result.entityId).toBe('custom-entity');
      });
      
      it('should call database adapter when available', async () => {
        const asOfDate = new Date('2021-07-01');
        await engine.generateTrialBalance(asOfDate);
        
        expect(mockDbAdapter.query).toHaveBeenCalledWith('SELECT 1');
      });
      
      it('should work without database adapter', async () => {
        const engineWithoutDb = new FinancialReportsEngine(null);
        const asOfDate = new Date('2021-07-01');
        
        const result = await engineWithoutDb.generateTrialBalance(asOfDate);
        
        expect(result).toBeDefined();
        expect(result.entityId).toBe('default');
      });
    });
    
    describe('generateBalanceSheet', () => {
      it('should generate balance sheet structure', async () => {
        const asOfDate = new Date('2021-07-01');
        const result = await engine.generateBalanceSheet(asOfDate);
        
        expect(result).toEqual({
          asOfDate: '2021-07-01T00:00:00.000Z',
          entityId: 'default',
          assets: {
            current: [],
            nonCurrent: [],
            total: 0
          },
          liabilities: {
            current: [],
            nonCurrent: [],
            total: 0
          },
          equity: {
            accounts: [],
            total: 0
          }
        });
      });
      
      it('should use custom entity ID', async () => {
        const asOfDate = new Date('2021-07-01');
        const result = await engine.generateBalanceSheet(asOfDate, 'test-entity');
        
        expect(result.entityId).toBe('test-entity');
      });
    });
    
    describe('generateIncomeStatement', () => {
      it('should generate income statement structure', async () => {
        const startDate = new Date('2021-01-01');
        const endDate = new Date('2021-12-31');
        const result = await engine.generateIncomeStatement(startDate, endDate);
        
        expect(result).toEqual({
          startDate: '2021-07-01T00:00:00.000Z',
          endDate: '2021-07-01T00:00:00.000Z',
          periodStart: '2021-07-01T00:00:00.000Z',
          periodEnd: '2021-07-01T00:00:00.000Z',
          entityId: 'default',
          revenue: {
            accounts: [],
            operating: [],
            nonOperating: [],
            total: 0
          },
          expenses: {
            accounts: [],
            operating: [],
            nonOperating: [],
            total: 0
          },
          netIncome: 0
        });
      });
    });
    
    describe('generateCashFlowStatement', () => {
      it('should generate cash flow statement structure', async () => {
        const startDate = new Date('2021-01-01');
        const endDate = new Date('2021-12-31');
        const result = await engine.generateCashFlowStatement(startDate, endDate);
        
        expect(result).toEqual({
          startDate: '2021-07-01T00:00:00.000Z',
          endDate: '2021-07-01T00:00:00.000Z',
          entityId: 'default',
          operating: {
            activities: [],
            total: 0
          },
          investing: {
            activities: [],
            total: 0
          },
          financing: {
            activities: [],
            total: 0
          },
          netChangeInCash: 0
        });
      });
    });
    
    describe('getFinancialMetrics', () => {
      it('should return financial metrics', async () => {
        const asOfDate = new Date('2021-07-01');
        const result = await engine.getFinancialMetrics(asOfDate);
        
        expect(result).toEqual({
          currentRatio: 0,
          quickRatio: 0,
          debtToEquityRatio: 0
        });
      });
    });
  });
});