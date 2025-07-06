// Worker-compatible re-exports from the main library
// This file provides the implementation for the declarations in index.worker.d.ts

// Re-export from auth/index
export * from './auth/index';

// Re-export core classes and utilities from index.ts
export {
  DatabaseAdapter,
  DatabaseAccountRegistry,
  TransactionBuilder,
  DatabaseJournalEntryManager,
  formatCurrency,
  getNormalBalance,
  FINANCIAL_CONSTANTS,
  AccountingValidationError,
  DoubleEntryError,
  BalanceSheetError,
  AccountRegistryError,
  CurrencyConversionError,
  PeriodClosureError,
  FiscalYearError,
  ComplianceError,
  ErrorAggregator,
  TransactionValidator,
  BalanceCalculator,
  AccountingEngine,
  AccountBalanceManager,
  AccountRegistry,
  JournalEntryManager,
  roundToDecimalPlaces
} from './index.js';

// Re-export types
export type {
  Account,
  AccountType,
  JournalEntry,
  Transaction,
  Currency,
  AccountingError,
  AccountBalance,
  TrialBalance,
  BalanceSheet,
  FinancialReportsBalanceSheet,
  IncomeStatement,
  NormalBalance,
  TransactionStatus,
  TransactionEntry,
  TransactionData,
  ValidationError
} from '../types/index.js';

// Worker-compatible FinancialReportsEngine - simplified implementation
export class FinancialReportsEngine {
  private dbAdapter: any;

  constructor(dbAdapter: any) {
    this.dbAdapter = dbAdapter;
  }

  async generateTrialBalance(asOfDate: Date, entityId?: string): Promise<any> {
    // Simplified implementation for worker environment
    return {
      asOfDate,
      entityId: entityId || 'default',
      accounts: [],
      totalDebits: 0,
      totalCredits: 0,
      isBalanced: true
    };
  }

  async generateBalanceSheet(asOfDate: Date, entityId?: string): Promise<any> {
    return {
      asOfDate,
      entityId: entityId || 'default',
      assets: { total: 0, accounts: [] },
      liabilities: { total: 0, accounts: [] },
      equity: { total: 0, accounts: [] }
    };
  }

  async generateIncomeStatement(startDate: Date, endDate: Date, entityId?: string): Promise<any> {
    return {
      startDate,
      endDate,
      entityId: entityId || 'default',
      revenue: { total: 0, accounts: [] },
      expenses: { total: 0, accounts: [] },
      netIncome: 0
    };
  }

  async generateCashFlowStatement(startDate: Date, endDate: Date, entityId?: string): Promise<any> {
    return {
      startDate,
      endDate,
      entityId: entityId || 'default',
      operatingActivities: { total: 0, items: [] },
      investingActivities: { total: 0, items: [] },
      financingActivities: { total: 0, items: [] },
      netCashFlow: 0
    };
  }

  async getFinancialMetrics(asOfDate: Date): Promise<any> {
    return {
      asOfDate,
      currentRatio: 0,
      quickRatio: 0,
      debtToEquityRatio: 0,
      returnOnAssets: 0,
      returnOnEquity: 0
    };
  }
}

// PDF generation functions (not available in worker environment)
export function generateIncomeStatementPDF(_data: any, _options: any): never {
  throw new Error('PDF generation is not available in worker environment');
}

export function generateTrialBalancePDF(_data: any, _options: any): never {
  throw new Error('PDF generation is not available in worker environment');
} 