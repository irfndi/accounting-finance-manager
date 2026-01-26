// Re-export from auth/index
export * from './auth/index';

// Re-export core classes and utilities from index.ts
export { DatabaseAdapter } from './index.js';
export { DatabaseAccountRegistry } from './index.js';
export { TransactionBuilder } from './index.js';
export { DatabaseJournalEntryManager } from './index.js';
export { formatCurrency } from './index.js';
export { getNormalBalance } from './index.js';
export { FINANCIAL_CONSTANTS } from './index.js';

// Error classes
export declare class AccountingValidationError extends Error {
  readonly code: string;
  readonly details?: any[];
  constructor(message: string, code: string, details?: any[]);
}

export declare class DoubleEntryError extends AccountingValidationError {
  constructor(message: string, details?: any[]);
}

// Worker-compatible FinancialReportsEngine
export declare class FinancialReportsEngine {
  constructor(dbAdapter: any);
  generateTrialBalance(asOfDate: Date, entityId?: string): Promise<TrialBalance>;
  generateBalanceSheet(asOfDate: Date, entityId?: string): Promise<FinancialReportsBalanceSheet>;
  generateIncomeStatement(startDate: Date, endDate: Date, entityId?: string): Promise<IncomeStatement>;
  generateCashFlowStatement(startDate: Date, endDate: Date, entityId?: string): Promise<any>;
  getFinancialMetrics(asOfDate: Date): Promise<any>;
}

// Re-export types from ../types/index.ts
export type {
  Account,
  AccountType,
  JournalEntry,
  Transaction,
  Currency,
  AccountingError,
  AccountBalance,
  FinancialReport,
  TrialBalance,
  BalanceSheet,
  FinancialReportsBalanceSheet,
  IncomeStatement,
  CashFlowStatement
} from '../types/index.js';

// PDF generation functions (placeholders in worker environment)
export declare function generateIncomeStatementPDF(data: any, options: any): never;
export declare function generateTrialBalancePDF(data: any, options: any): never;