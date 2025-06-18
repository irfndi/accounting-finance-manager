/**
 * Finance Manager Core Module
 * Corporate Finance & Accounting Core Functionality
 * Professional Double-Entry Bookkeeping Engine
 */

import type {
  Currency,
  AccountType,
  NormalBalance,
  TransactionStatus,
  Account,
  Transaction,
  JournalEntry,
  TransactionEntry,
  TransactionData,
  ValidationError,
  AccountingError,
  AccountBalance,
  TrialBalance,
  BalanceSheet,
  IncomeStatement,
} from '@finance-manager/types';

// Core financial constants
export const FINANCIAL_CONSTANTS = {
  DECIMAL_PLACES: 2,
  DEFAULT_CURRENCY: 'IDR' as const,
  SUPPORTED_CURRENCIES: ['IDR', 'USD', 'EUR', 'GBP', 'SGD', 'MYR'] as const,
  CURRENCY_SYMBOLS: {
    IDR: 'Rp',
    USD: '$',
    EUR: '€',
    GBP: '£',
    SGD: 'S$',
    MYR: 'RM'
  },
  CURRENCY_LOCALES: {
    IDR: 'id-ID',
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    SGD: 'en-SG',
    MYR: 'ms-MY'
  },
  ACCOUNT_TYPES: {
    ASSET: 'ASSET',
    LIABILITY: 'LIABILITY',
    EQUITY: 'EQUITY',
    REVENUE: 'REVENUE',
    EXPENSE: 'EXPENSE'
  } as const,
  NORMAL_BALANCES: {
    ASSET: 'DEBIT',
    EXPENSE: 'DEBIT',
    LIABILITY: 'CREDIT',
    EQUITY: 'CREDIT',
    REVENUE: 'CREDIT'
  } as const
} as const;

// Custom Error Classes
export class AccountingValidationError extends Error implements AccountingError {
  public readonly code: string;
  public readonly details?: ValidationError[];

  constructor(message: string, code: string, details?: ValidationError[]) {
    super(message);
    this.name = 'AccountingValidationError';
    this.code = code;
    this.details = details;
  }
}

export class DoubleEntryError extends AccountingValidationError {
  constructor(message: string, details?: ValidationError[]) {
    super(message, 'DOUBLE_ENTRY_VIOLATION', details);
    this.name = 'DoubleEntryError';
  }
}

// Enhanced Error System - Severity and Categories
export type ErrorSeverity = 'WARNING' | 'ERROR' | 'CRITICAL';
export type ErrorCategory = 'VALIDATION' | 'BUSINESS_RULE' | 'SYSTEM' | 'COMPLIANCE';

export interface EnhancedValidationError extends ValidationError {
  severity: ErrorSeverity;
  category: ErrorCategory;
  suggestions?: string[];
  context?: Record<string, unknown>;
  timestamp?: Date;
}

// Specialized Error Classes
export class BalanceSheetError extends AccountingValidationError {
  constructor(message: string, details?: ValidationError[]) {
    super(message, 'BALANCE_SHEET_VIOLATION', details);
    this.name = 'BalanceSheetError';
  }
}

export class AccountRegistryError extends AccountingValidationError {
  constructor(message: string, details?: ValidationError[]) {
    super(message, 'ACCOUNT_REGISTRY_ERROR', details);
    this.name = 'AccountRegistryError';
  }
}

export class CurrencyConversionError extends AccountingValidationError {
  constructor(message: string, details?: ValidationError[]) {
    super(message, 'CURRENCY_CONVERSION_ERROR', details);
    this.name = 'CurrencyConversionError';
  }
}

export class PeriodClosureError extends AccountingValidationError {
  constructor(message: string, details?: ValidationError[]) {
    super(message, 'PERIOD_CLOSURE_VIOLATION', details);
    this.name = 'PeriodClosureError';
  }
}

export class FiscalYearError extends AccountingValidationError {
  constructor(message: string, details?: ValidationError[]) {
    super(message, 'FISCAL_YEAR_VIOLATION', details);
    this.name = 'FiscalYearError';
  }
}

export class ComplianceError extends AccountingValidationError {
  constructor(message: string, details?: ValidationError[]) {
    super(message, 'COMPLIANCE_VIOLATION', details);
    this.name = 'ComplianceError';
  }
}

// Error Handling Utilities
export class ErrorAggregator {
  private errors: EnhancedValidationError[] = [];
  private warnings: EnhancedValidationError[] = [];

  addError(error: EnhancedValidationError): void {
    if (error.severity === 'WARNING') {
      this.warnings.push(error);
    } else {
      this.errors.push(error);
    }
  }

  addErrors(errors: EnhancedValidationError[]): void {
    for (const error of errors) {
      this.addError(error);
    }
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  hasWarnings(): boolean {
    return this.warnings.length > 0;
  }

  getErrors(): EnhancedValidationError[] {
    return [...this.errors];
  }

  getWarnings(): EnhancedValidationError[] {
    return [...this.warnings];
  }

  getAllIssues(): EnhancedValidationError[] {
    return [...this.errors, ...this.warnings];
  }

  getCriticalErrors(): EnhancedValidationError[] {
    return this.errors.filter(error => error.severity === 'CRITICAL');
  }

  getErrorsByCategory(category: ErrorCategory): EnhancedValidationError[] {
    return this.getAllIssues().filter(error => error.category === category);
  }

  clear(): void {
    this.errors = [];
    this.warnings = [];
  }

  generateReport(): {
    summary: {
      totalErrors: number;
      totalWarnings: number;
      criticalErrors: number;
      byCategory: Record<ErrorCategory, number>;
      bySeverity: Record<ErrorSeverity, number>;
    };
    issues: EnhancedValidationError[];
  } {
    const allIssues = this.getAllIssues();
    
    const byCategory: Record<ErrorCategory, number> = {
      VALIDATION: 0,
      BUSINESS_RULE: 0,
      SYSTEM: 0,
      COMPLIANCE: 0
    };

    const bySeverity: Record<ErrorSeverity, number> = {
      WARNING: 0,
      ERROR: 0,
      CRITICAL: 0
    };

    for (const issue of allIssues) {
      byCategory[issue.category]++;
      bySeverity[issue.severity]++;
    }

    return {
      summary: {
        totalErrors: this.errors.length,
        totalWarnings: this.warnings.length,
        criticalErrors: this.getCriticalErrors().length,
        byCategory,
        bySeverity
      },
      issues: allIssues
    };
  }
}

// Enhanced Error Factory
export namespace AccountingErrorFactory {
  export function createValidationError(
    field: string,
    message: string,
    code: string,
    severity: ErrorSeverity = 'ERROR',
    category: ErrorCategory = 'VALIDATION',
    suggestions?: string[],
    context?: Record<string, unknown>
  ): EnhancedValidationError {
    return {
      field,
      message,
      code,
      severity,
      category,
      suggestions,
      context,
      timestamp: new Date()
    };
  }

  export function createBusinessRuleError(
    field: string,
    message: string,
    code: string,
    suggestions?: string[]
  ): EnhancedValidationError {
    return createValidationError(
      field,
      message,
      code,
      'ERROR',
      'BUSINESS_RULE',
      suggestions
    );
  }

  export function createComplianceError(
    field: string,
    message: string,
    code: string,
    severity: ErrorSeverity = 'CRITICAL'
  ): EnhancedValidationError {
    return createValidationError(
      field,
      message,
      code,
      severity,
      'COMPLIANCE'
    );
  }

  export function createSystemError(
    field: string,
    message: string,
    code: string,
    context?: Record<string, unknown>
  ): EnhancedValidationError {
    return createValidationError(
      field,
      message,
      code,
      'CRITICAL',
      'SYSTEM',
      undefined,
      context
    );
  }
}

// Error Recovery Strategies
export namespace ErrorRecoveryManager {
  const RECOVERY_STRATEGIES: Record<string, string[]> = {
    UNBALANCED_TRANSACTION: [
      'Check if all journal entries have been recorded',
      'Verify debit and credit amounts are correct',
      'Ensure rounding differences are accounted for'
    ],
    MISSING_ACCOUNT_ID: [
      'Verify the account exists in the chart of accounts',
      'Check if the account ID is correctly formatted',
      'Ensure the account is active and allows transactions'
    ],
    CURRENCY_CONVERSION_ERROR: [
      'Check if exchange rates are available for the transaction date',
      'Verify the currencies are supported',
      'Update exchange rate data if necessary'
    ],
    PERIOD_CLOSURE_VIOLATION: [
      'Check if the accounting period is still open',
      'Verify transaction date is within allowed period',
      'Contact system administrator to reopen period if necessary'
    ],
    BALANCE_SHEET_VIOLATION: [
      'Verify asset accounts have debit balances',
      'Check liability accounts have credit balances',
      'Ensure equity accounts maintain proper balance types'
    ]
  };

  export function getSuggestions(errorCode: string): string[] {
    return RECOVERY_STRATEGIES[errorCode] || [
      'Review the transaction details',
      'Check accounting policies and procedures',
      'Contact system administrator if issue persists'
    ];
  }

  export function enhanceError(error: ValidationError): EnhancedValidationError {
    const suggestions = getSuggestions(error.code);
    
    return {
      ...error,
      severity: determineSeverity(error.code),
      category: determineCategory(error.code),
      suggestions,
      timestamp: new Date()
    };
  }

  function determineSeverity(errorCode: string): ErrorSeverity {
    const criticalCodes = [
      'BALANCE_SHEET_VIOLATION',
      'COMPLIANCE_VIOLATION',
      'SYSTEM_ERROR',
      'FISCAL_YEAR_VIOLATION'
    ];
    
    const warningCodes = [
      'ROUNDING_DIFFERENCE',
      'EXCHANGE_RATE_OUTDATED'
    ];

    if (criticalCodes.some(code => errorCode.includes(code))) {
      return 'CRITICAL';
    }
    
    if (warningCodes.some(code => errorCode.includes(code))) {
      return 'WARNING';
    }

    return 'ERROR';
  }

  function determineCategory(errorCode: string): ErrorCategory {
    if (errorCode.includes('COMPLIANCE')) return 'COMPLIANCE';
    if (errorCode.includes('SYSTEM')) return 'SYSTEM';
    if (errorCode.includes('BUSINESS_RULE')) return 'BUSINESS_RULE';
    return 'VALIDATION';
  }
}

// Utility functions
export function formatCurrency(
  amount: number, 
  currency: Currency = FINANCIAL_CONSTANTS.DEFAULT_CURRENCY
): string {
  const locale = FINANCIAL_CONSTANTS.CURRENCY_LOCALES[currency];
  const symbol = FINANCIAL_CONSTANTS.CURRENCY_SYMBOLS[currency];
  
  // For IDR, we don't typically use decimal places in everyday formatting
  const options: Intl.NumberFormatOptions = {
    style: 'decimal',
    minimumFractionDigits: currency === 'IDR' ? 0 : FINANCIAL_CONSTANTS.DECIMAL_PLACES,
    maximumFractionDigits: currency === 'IDR' ? 0 : FINANCIAL_CONSTANTS.DECIMAL_PLACES,
  };
  
  const formattedAmount = new Intl.NumberFormat(locale, options).format(amount);
  return `${symbol} ${formattedAmount}`;
}

export function roundToDecimalPlaces(amount: number, places: number = FINANCIAL_CONSTANTS.DECIMAL_PLACES): number {
  const factor = 10 ** places;
  return Math.round(amount * factor) / factor;
}

export function getNormalBalance(accountType: AccountType): NormalBalance {
  return FINANCIAL_CONSTANTS.NORMAL_BALANCES[accountType] as NormalBalance;
}

// Transaction Validator Class
export class TransactionValidator {
  /**
   * Validates that the sum of debits equals the sum of credits
   */
  static validateDoubleEntry(entries: TransactionEntry[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    if (!entries || entries.length === 0) {
      errors.push({
        field: 'entries',
        message: 'Transaction must have at least one journal entry',
        code: 'NO_ENTRIES'
      });
      return errors;
    }

    if (entries.length < 2) {
      errors.push({
        field: 'entries',
        message: 'Transaction must have at least two journal entries for double-entry bookkeeping',
        code: 'INSUFFICIENT_ENTRIES'
      });
    }

    let totalDebits = 0;
    let totalCredits = 0;

    entries.forEach((entry, index) => {
      // Validate entry structure
      if (!entry.accountId) {
        errors.push({
          field: `entries[${index}].accountId`,
          message: 'Account ID is required for each entry',
          code: 'MISSING_ACCOUNT_ID'
        });
      }

      // Validate amounts
      const debitAmount = entry.debitAmount || 0;
      const creditAmount = entry.creditAmount || 0;

      if (debitAmount < 0) {
        errors.push({
          field: `entries[${index}].debitAmount`,
          message: 'Debit amount cannot be negative',
          code: 'NEGATIVE_DEBIT'
        });
      }

      if (creditAmount < 0) {
        errors.push({
          field: `entries[${index}].creditAmount`,
          message: 'Credit amount cannot be negative',
          code: 'NEGATIVE_CREDIT'
        });
      }

      if (debitAmount > 0 && creditAmount > 0) {
        errors.push({
          field: `entries[${index}]`,
          message: 'Entry cannot have both debit and credit amounts',
          code: 'BOTH_DEBIT_AND_CREDIT'
        });
      }

      if (debitAmount === 0 && creditAmount === 0) {
        errors.push({
          field: `entries[${index}]`,
          message: 'Entry must have either a debit or credit amount',
          code: 'NO_AMOUNT'
        });
      }

      totalDebits += roundToDecimalPlaces(debitAmount);
      totalCredits += roundToDecimalPlaces(creditAmount);
    });

    // Check double-entry balance
    const debitTotal = roundToDecimalPlaces(totalDebits);
    const creditTotal = roundToDecimalPlaces(totalCredits);

    if (debitTotal !== creditTotal) {
      errors.push({
        field: 'entries',
        message: `Total debits (${debitTotal}) must equal total credits (${creditTotal})`,
        code: 'UNBALANCED_TRANSACTION'
      });
    }

    return errors;
  }

  /**
   * Validates transaction data structure
   */
  static validateTransactionData(transactionData: TransactionData): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!transactionData.description?.trim()) {
      errors.push({
        field: 'description',
        message: 'Transaction description is required',
        code: 'MISSING_DESCRIPTION'
      });
    }

    if (!transactionData.transactionDate) {
      errors.push({
        field: 'transactionDate',
        message: 'Transaction date is required',
        code: 'MISSING_TRANSACTION_DATE'
      });
    }

    if (!transactionData.currency) {
      errors.push({
        field: 'currency',
        message: 'Transaction currency is required',
        code: 'MISSING_CURRENCY'
      });
    }

    // Validate journal entries
    const entryErrors = this.validateDoubleEntry(transactionData.entries);
    errors.push(...entryErrors);

    return errors;
  }
}

// Transaction Builder Class
export class TransactionBuilder {
  private transactionData: Partial<TransactionData> = {
    entries: [],
    currency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
    transactionDate: new Date(),
  };

  constructor() {
    this.reset();
  }

  reset(): TransactionBuilder {
    this.transactionData = {
      entries: [],
      currency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
      transactionDate: new Date(),
    };
    return this;
  }

  setDescription(description: string): TransactionBuilder {
    this.transactionData.description = description;
    return this;
  }

  setReference(reference: string): TransactionBuilder {
    this.transactionData.reference = reference;
    return this;
  }

  setDate(date: Date): TransactionBuilder {
    this.transactionData.transactionDate = date;
    return this;
  }

  setCurrency(currency: Currency): TransactionBuilder {
    this.transactionData.currency = currency;
    return this;
  }

  debit(accountId: number, amount: number, description?: string): TransactionBuilder {
    if (!this.transactionData.entries) {
      this.transactionData.entries = [];
    }
    this.transactionData.entries.push({
      accountId,
      debitAmount: roundToDecimalPlaces(amount),
      creditAmount: 0,
      description,
      currency: this.transactionData.currency,
    });
    return this;
  }

  credit(accountId: number, amount: number, description?: string): TransactionBuilder {
    if (!this.transactionData.entries) {
      this.transactionData.entries = [];
    }
    this.transactionData.entries.push({
      accountId,
      debitAmount: 0,
      creditAmount: roundToDecimalPlaces(amount),
      description,
      currency: this.transactionData.currency,
    });
    return this;
  }

  validate(): ValidationError[] {
    return TransactionValidator.validateTransactionData(this.transactionData as TransactionData);
  }

  build(): TransactionData {
    const errors = this.validate();
    if (errors.length > 0) {
      throw new DoubleEntryError('Invalid transaction data', errors);
    }
    return { ...this.transactionData } as TransactionData;
  }
}

// Balance Calculator
export class BalanceCalculator {
  /**
   * Calculates the balance for an account based on its normal balance type
   */
  static calculateAccountBalance(
    accountType: AccountType,
    normalBalance: NormalBalance,
    debitTotal: number,
    creditTotal: number
  ): number {
    const debits = roundToDecimalPlaces(debitTotal);
    const credits = roundToDecimalPlaces(creditTotal);

    if (normalBalance === 'DEBIT') {
      return debits - credits;
    } else {
      return credits - debits;
    }
  }
}

// Core Accounting Engine
export class AccountingEngine {
  /**
   * Creates a new transaction with validation
   */
  static createTransaction(transactionData: TransactionData): TransactionData {
    const errors = TransactionValidator.validateTransactionData(transactionData);
    if (errors.length > 0) {
      throw new DoubleEntryError('Transaction validation failed', errors);
    }
    return transactionData;
  }

  /**
   * Validates an existing transaction
   */
  static validateTransaction(transaction: Transaction, journalEntries: JournalEntry[]): ValidationError[] {
    const errors: ValidationError[] = [];

    const transactionEntries = journalEntries.filter(entry => entry.transactionId.toString() === transaction.id);
    
    if (transactionEntries.length === 0) {
      errors.push({
        field: 'journalEntries',
        message: 'Transaction has no journal entries',
        code: 'NO_JOURNAL_ENTRIES'
      });
      return errors;
    }

    // Convert journal entries to transaction entries for validation
    const entries: TransactionEntry[] = transactionEntries.map(entry => ({
      accountId: entry.accountId,
      debitAmount: entry.debitAmount,
      creditAmount: entry.creditAmount,
      description: entry.description,
      currency: entry.currency,
    }));

    const entryErrors = TransactionValidator.validateDoubleEntry(entries);
    errors.push(...entryErrors);

    return errors;
  }
}

// Export everything
export * from '@finance-manager/types';

/**
 * Account Balance Manager - Handles balance calculations and account management
 */
export class AccountBalanceManager {
  private accountBalances: Map<string, AccountBalance> = new Map();
  private transactions: Transaction[] = [];

  /**
   * Add a transaction to the balance manager
   */
  addTransaction(transaction: Transaction): void {
    this.transactions.push(transaction);
    this.updateBalancesFromTransaction(transaction);
  }

  /**
   * Update account balances based on a transaction
   */
  private updateBalancesFromTransaction(transaction: Transaction): void {
    for (const entry of transaction.entries) {
      const accountId = entry.accountId.toString();
      const currentBalance = this.accountBalances.get(accountId) || {
        accountId,
        balance: 0,
        currency: 'IDR' as Currency,
        lastUpdated: new Date(),
        normalBalance: this.getNormalBalanceForAccount(accountId)
      };

      // Update balance based on debit/credit and normal balance
      const debitAmount = entry.debitAmount || 0;
      const creditAmount = entry.creditAmount || 0;
      const balanceChange = debitAmount - creditAmount;
      const newBalance = currentBalance.balance + balanceChange;

      this.accountBalances.set(accountId, {
        ...currentBalance,
        balance: roundToDecimalPlaces(newBalance, FINANCIAL_CONSTANTS.DECIMAL_PLACES),
        lastUpdated: new Date()
      });
    }
  }

  /**
   * Get balance for a specific account
   */
  getAccountBalance(accountId: string): AccountBalance | null {
    return this.accountBalances.get(accountId) || null;
  }

  /**
   * Get all account balances
   */
  getAllBalances(): Map<string, AccountBalance> {
    return new Map(this.accountBalances);
  }

  /**
   * Calculate balance for an account based on all transactions
   */
  calculateAccountBalance(
    accountId: string, 
    accountType: AccountType,
    asOfDate?: Date
  ): number {
    const relevantTransactions = asOfDate 
      ? this.transactions.filter(t => new Date(t.date) <= asOfDate)
      : this.transactions;

    let balance = 0;
    
    for (const transaction of relevantTransactions) {
      for (const entry of transaction.entries) {
        if (entry.accountId === accountId) {
          const amount = entry.amount.amount;
          if (entry.type === 'DEBIT') {
            balance += amount;
          } else {
            balance -= amount;
          }
        }
      }
    }

    // Adjust for normal balance
    const normalBalance = getNormalBalance(accountType);
    if (normalBalance === 'CREDIT') {
      balance = -balance;
    }

    return roundToDecimalPlaces(balance, FINANCIAL_CONSTANTS.DECIMAL_PLACES);
  }

  /**
   * Generate trial balance
   */
  generateTrialBalance(asOfDate?: Date): TrialBalance {
    const accounts = Array.from(this.accountBalances.keys());
    const balances: { [accountId: string]: number } = {};
    let totalDebits = 0;
    let totalCredits = 0;

    for (const accountId of accounts) {
      const accountBalance = this.accountBalances.get(accountId);
      if (!accountBalance) continue;

      const balance = this.calculateAccountBalance(
        accountId, 
        this.getAccountTypeForAccount(accountId),
        asOfDate
      );

      balances[accountId] = balance;

      if (balance > 0) {
        totalDebits += balance;
      } else if (balance < 0) {
        totalCredits += Math.abs(balance);
      }
    }

    return {
      asOfDate: asOfDate || new Date(),
      accounts: balances,
      totalDebits: roundToDecimalPlaces(totalDebits, FINANCIAL_CONSTANTS.DECIMAL_PLACES),
      totalCredits: roundToDecimalPlaces(totalCredits, FINANCIAL_CONSTANTS.DECIMAL_PLACES),
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
      currency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY
    };
  }

  /**
   * Generate balance sheet
   */
  generateBalanceSheet(asOfDate?: Date): BalanceSheet {
    const trialBalance = this.generateTrialBalance(asOfDate);
    const assets: { [accountId: string]: number } = {};
    const liabilities: { [accountId: string]: number } = {};
    const equity: { [accountId: string]: number } = {};

    for (const [accountId, balance] of Object.entries(trialBalance.accounts)) {
      const accountType = this.getAccountTypeForAccount(accountId);
      
      switch (accountType) {
        case 'ASSET':
          assets[accountId] = balance;
          break;
        case 'LIABILITY':
          liabilities[accountId] = Math.abs(balance);
          break;
        case 'EQUITY':
          equity[accountId] = Math.abs(balance);
          break;
      }
    }

    const totalAssets = Object.values(assets).reduce((sum, val) => sum + val, 0);
    const totalLiabilities = Object.values(liabilities).reduce((sum, val) => sum + val, 0);
    const totalEquity = Object.values(equity).reduce((sum, val) => sum + val, 0);

    return {
      asOfDate: asOfDate || new Date(),
      assets,
      liabilities,
      equity,
      totalAssets: roundToDecimalPlaces(totalAssets, FINANCIAL_CONSTANTS.DECIMAL_PLACES),
      totalLiabilities: roundToDecimalPlaces(totalLiabilities, FINANCIAL_CONSTANTS.DECIMAL_PLACES),
      totalEquity: roundToDecimalPlaces(totalEquity, FINANCIAL_CONSTANTS.DECIMAL_PLACES),
      isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01,
      currency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY
    };
  }

  /**
   * Generate income statement
   */
  generateIncomeStatement(
    startDate: Date, 
    endDate: Date
  ): IncomeStatement {
    const relevantTransactions = this.transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    const revenues: { [accountId: string]: number } = {};
    const expenses: { [accountId: string]: number } = {};

    for (const transaction of relevantTransactions) {
      for (const entry of transaction.entries) {
        const accountType = this.getAccountTypeForAccount(entry.accountId);
        const amount = entry.amount.amount;

        if (accountType === 'REVENUE') {
          const currentRevenue = revenues[entry.accountId] || 0;
          revenues[entry.accountId] = currentRevenue + (entry.type === 'CREDIT' ? amount : -amount);
        } else if (accountType === 'EXPENSE') {
          const currentExpense = expenses[entry.accountId] || 0;
          expenses[entry.accountId] = currentExpense + (entry.type === 'DEBIT' ? amount : -amount);
        }
      }
    }

    const totalRevenues = Object.values(revenues).reduce((sum, val) => sum + val, 0);
    const totalExpenses = Object.values(expenses).reduce((sum, val) => sum + val, 0);
    const netIncome = totalRevenues - totalExpenses;

    return {
      startDate,
      endDate,
      revenues,
      expenses,
      totalRevenues: roundToDecimalPlaces(totalRevenues, FINANCIAL_CONSTANTS.DECIMAL_PLACES),
      totalExpenses: roundToDecimalPlaces(totalExpenses, FINANCIAL_CONSTANTS.DECIMAL_PLACES),
      netIncome: roundToDecimalPlaces(netIncome, FINANCIAL_CONSTANTS.DECIMAL_PLACES),
      currency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY
    };
  }

  /**
   * Reset all balances and transactions
   */
  reset(): void {
    this.accountBalances.clear();
    this.transactions = [];
  }

  /**
   * Get normal balance for account (helper method)
   */
  private getNormalBalanceForAccount(accountId: string): NormalBalance {
    // This would typically come from a database or account registry
    // For now, we'll use a simple mapping based on account ID patterns
    const accountType = this.getAccountTypeForAccount(accountId);
    return getNormalBalance(accountType);
  }

  /**
   * Get account type for account (helper method)
   */
  private getAccountTypeForAccount(accountId: string): AccountType {
    // This would typically come from a database or account registry
    // For now, we'll use a simple mapping based on account ID patterns
    if (accountId.startsWith('1')) return 'ASSET';
    if (accountId.startsWith('2')) return 'LIABILITY';
    if (accountId.startsWith('3')) return 'EQUITY';
    if (accountId.startsWith('4')) return 'REVENUE';
    if (accountId.startsWith('5')) return 'EXPENSE';
    
    // Default fallback
    return 'ASSET';
  }
}

/**
 * Account Registry - Manages account definitions and metadata
 */
export class AccountRegistry {
  private accounts: Map<string, Account> = new Map();

  /**
   * Register an account
   */
  registerAccount(account: Account): void {
    this.accounts.set(account.id.toString(), account);
  }

  /**
   * Get account by ID
   */
  getAccount(accountId: string): Account | null {
    return this.accounts.get(accountId) || null;
  }

  /**
   * Get all accounts of a specific type
   */
  getAccountsByType(accountType: AccountType): Account[] {
    return Array.from(this.accounts.values()).filter(
      account => account.type === accountType
    );
  }

  /**
   * Get all accounts
   */
  getAllAccounts(): Account[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Check if account exists
   */
  hasAccount(accountId: string): boolean {
    return this.accounts.has(accountId);
  }

  /**
   * Remove account
   */
  removeAccount(accountId: string): boolean {
    return this.accounts.delete(accountId);
  }

  /**
   * Get account balance type
   */
  getAccountNormalBalance(accountId: string): NormalBalance | null {
    const account = this.accounts.get(accountId);
    return account ? getNormalBalance(account.type) : null;
  }
}

/**
 * Journal Entry Manager - Handles journal entry creation, validation, and posting
 */
export class JournalEntryManager {
  private journalEntries: Map<number, JournalEntry> = new Map();
  private nextId: number = 1;
  private accountRegistry: AccountRegistry;

  constructor(accountRegistry?: AccountRegistry) {
    this.accountRegistry = accountRegistry || new AccountRegistry();
  }

  /**
   * Create journal entries from transaction data
   */
  createJournalEntriesFromTransaction(
    transactionId: number,
    transactionData: TransactionData,
    createdBy?: string
  ): JournalEntry[] {
    const entries: JournalEntry[] = [];
    const now = new Date();

    for (const entry of transactionData.entries) {
      // Validate account exists if registry is populated
      if (this.accountRegistry.hasAccount(entry.accountId.toString())) {
        const account = this.accountRegistry.getAccount(entry.accountId.toString());
        if (account && !account.allowTransactions) {
          throw new DoubleEntryError(`Account ${entry.accountId} does not allow transactions`);
        }
      }

      const journalEntry: JournalEntry = {
        id: this.nextId++,
        transactionId,
        accountId: entry.accountId,
        description: entry.description || transactionData.description,
        debitAmount: entry.debitAmount || 0,
        creditAmount: entry.creditAmount || 0,
        currency: entry.currency || transactionData.currency,
        exchangeRate: 1.0, // Default to 1.0 for same currency
        baseCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
        baseDebitAmount: entry.debitAmount || 0,
        baseCreditAmount: entry.creditAmount || 0,
        entityId: entry.entityId || transactionData.entityId,
        departmentId: entry.departmentId || transactionData.departmentId,
        projectId: entry.projectId || transactionData.projectId,
        reconciliationId: undefined,
        isReconciled: false,
        reconciledAt: undefined,
        reconciledBy: undefined,
        createdAt: now,
        updatedAt: now,
        createdBy,
        updatedBy: createdBy
      };

      // Handle currency conversion if needed
      if (journalEntry.currency !== FINANCIAL_CONSTANTS.DEFAULT_CURRENCY) {
        // In a real system, you'd fetch exchange rates from an external service
        // For now, we'll use a placeholder rate
        journalEntry.exchangeRate = this.getExchangeRate(
          journalEntry.currency, 
          FINANCIAL_CONSTANTS.DEFAULT_CURRENCY
        );
        journalEntry.baseDebitAmount = (entry.debitAmount || 0) * journalEntry.exchangeRate;
        journalEntry.baseCreditAmount = (entry.creditAmount || 0) * journalEntry.exchangeRate;
      }

      entries.push(journalEntry);
      this.journalEntries.set(journalEntry.id, journalEntry);
    }

    return entries;
  }

  /**
   * Validate journal entries for a transaction
   */
  validateJournalEntries(entries: JournalEntry[]): ValidationError[] {
    const errors: ValidationError[] = [];

    if (entries.length === 0) {
      errors.push({
        field: 'entries',
        message: 'At least one journal entry is required',
        code: 'NO_ENTRIES'
      });
      return errors;
    }

    if (entries.length === 1) {
      errors.push({
        field: 'entries',
        message: 'At least two journal entries are required for double-entry bookkeeping',
        code: 'SINGLE_ENTRY'
      });
      // Continue validation to catch other errors
    }

    // Validate each entry
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const entryErrors = this.validateSingleJournalEntry(entry, i);
      errors.push(...entryErrors);
    }

    // Validate double-entry balance
    const balanceErrors = this.validateDoubleEntryBalance(entries);
    errors.push(...balanceErrors);

    // Validate account compatibility
    const accountErrors = this.validateAccountCompatibility(entries);
    errors.push(...accountErrors);

    return errors;
  }

  /**
   * Validate a single journal entry
   */
  private validateSingleJournalEntry(entry: JournalEntry, index: number): ValidationError[] {
    const errors: ValidationError[] = [];
    const fieldPrefix = `entries[${index}]`;

    // Validate account ID
    if (!entry.accountId || entry.accountId <= 0) {
      errors.push({
        field: `${fieldPrefix}.accountId`,
        message: 'Valid account ID is required',
        code: 'INVALID_ACCOUNT_ID'
      });
    }

    // Validate amounts
    if (entry.debitAmount < 0 || entry.creditAmount < 0) {
      errors.push({
        field: `${fieldPrefix}.amount`,
        message: 'Amounts cannot be negative',
        code: 'NEGATIVE_AMOUNT'
      });
    }

    if (entry.debitAmount === 0 && entry.creditAmount === 0) {
      errors.push({
        field: `${fieldPrefix}.amount`,
        message: 'Either debit or credit amount must be greater than zero',
        code: 'ZERO_AMOUNT'
      });
    }

    if (entry.debitAmount > 0 && entry.creditAmount > 0) {
      errors.push({
        field: `${fieldPrefix}.amount`,
        message: 'Entry cannot have both debit and credit amounts',
        code: 'BOTH_DEBIT_CREDIT'
      });
    }

    // Validate currency
    if (!entry.currency || !FINANCIAL_CONSTANTS.SUPPORTED_CURRENCIES.includes(entry.currency)) {
      errors.push({
        field: `${fieldPrefix}.currency`,
        message: `Currency must be one of: ${FINANCIAL_CONSTANTS.SUPPORTED_CURRENCIES.join(', ')}`,
        code: 'INVALID_CURRENCY'
      });
    }

    // Validate exchange rate
    if (entry.exchangeRate && entry.exchangeRate <= 0) {
      errors.push({
        field: `${fieldPrefix}.exchangeRate`,
        message: 'Exchange rate must be positive',
        code: 'INVALID_EXCHANGE_RATE'
      });
    }

    // Validate description
    if (!entry.description || entry.description.trim().length === 0) {
      errors.push({
        field: `${fieldPrefix}.description`,
        message: 'Description is required',
        code: 'MISSING_DESCRIPTION'
      });
    }

    return errors;
  }

  /**
   * Validate double-entry balance
   */
  private validateDoubleEntryBalance(entries: JournalEntry[]): ValidationError[] {
    const errors: ValidationError[] = [];
    
    // Group by currency for balance validation
    const currencyBalances: { [currency: string]: { debits: number; credits: number } } = {};
    
    for (const entry of entries) {
      if (!currencyBalances[entry.currency]) {
        currencyBalances[entry.currency] = { debits: 0, credits: 0 };
      }
      
      currencyBalances[entry.currency].debits += entry.debitAmount;
      currencyBalances[entry.currency].credits += entry.creditAmount;
    }

    // Validate balance for each currency
    for (const [currency, balance] of Object.entries(currencyBalances)) {
      const roundedDebits = roundToDecimalPlaces(balance.debits, FINANCIAL_CONSTANTS.DECIMAL_PLACES);
      const roundedCredits = roundToDecimalPlaces(balance.credits, FINANCIAL_CONSTANTS.DECIMAL_PLACES);
      
      if (Math.abs(roundedDebits - roundedCredits) > 0.01) {
        errors.push({
          field: 'entries',
          message: `Transaction is not balanced for currency ${currency}. Debits: ${formatCurrency(roundedDebits, currency as Currency)}, Credits: ${formatCurrency(roundedCredits, currency as Currency)}`,
          code: 'UNBALANCED_TRANSACTION'
        });
      }
    }

    return errors;
  }

  /**
   * Validate account compatibility with registry
   */
  private validateAccountCompatibility(entries: JournalEntry[]): ValidationError[] {
    const errors: ValidationError[] = [];

    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const account = this.accountRegistry.getAccount(entry.accountId.toString());
      
      if (account) {
        // Check if account allows transactions
        if (!account.allowTransactions) {
          errors.push({
            field: `entries[${i}].accountId`,
            message: `Account ${account.code} (${account.name}) does not allow transactions`,
            code: 'ACCOUNT_NO_TRANSACTIONS'
          });
        }

        // Check if account is active
        if (!account.isActive) {
          errors.push({
            field: `entries[${i}].accountId`,
            message: `Account ${account.code} (${account.name}) is inactive`,
            code: 'ACCOUNT_INACTIVE'
          });
        }
      } else {
        // Account not found in registry - this might be OK if registry is not fully populated
        // We'll add a warning but not fail validation
        console.warn(`Account ${entry.accountId} not found in registry`);
      }
    }

    return errors;
  }

  /**
   * Post journal entries (mark as posted)
   */
  postJournalEntries(entryIds: number[], postedBy?: string): JournalEntry[] {
    const postedEntries: JournalEntry[] = [];
    const now = new Date();

    for (const id of entryIds) {
      const entry = this.journalEntries.get(id);
      if (entry) {
        const updatedEntry: JournalEntry = {
          ...entry,
          updatedAt: now,
          updatedBy: postedBy
        };
        
        this.journalEntries.set(id, updatedEntry);
        postedEntries.push(updatedEntry);
      }
    }

    return postedEntries;
  }

  /**
   * Get journal entries by transaction ID
   */
  getJournalEntriesByTransaction(transactionId: number): JournalEntry[] {
    return Array.from(this.journalEntries.values())
      .filter(entry => entry.transactionId === transactionId);
  }

  /**
   * Get journal entries by account ID
   */
  getJournalEntriesByAccount(accountId: number): JournalEntry[] {
    return Array.from(this.journalEntries.values())
      .filter(entry => entry.accountId === accountId);
  }

  /**
   * Get journal entry by ID
   */
  getJournalEntry(id: number): JournalEntry | null {
    return this.journalEntries.get(id) || null;
  }

  /**
   * Get all journal entries
   */
  getAllJournalEntries(): JournalEntry[] {
    return Array.from(this.journalEntries.values());
  }

  /**
   * Reconcile journal entry
   */
  reconcileJournalEntry(
    entryId: number, 
    reconciliationId: string, 
    reconciledBy?: string
  ): JournalEntry | null {
    const entry = this.journalEntries.get(entryId);
    if (!entry) return null;

    const reconciledEntry: JournalEntry = {
      ...entry,
      reconciliationId,
      isReconciled: true,
      reconciledAt: new Date(),
      reconciledBy,
      updatedAt: new Date(),
      updatedBy: reconciledBy
    };

    this.journalEntries.set(entryId, reconciledEntry);
    return reconciledEntry;
  }

  /**
   * Unreoncile journal entry
   */
  unreconcileJournalEntry(entryId: number, unreconciledBy?: string): JournalEntry | null {
    const entry = this.journalEntries.get(entryId);
    if (!entry) return null;

    const unreconciledEntry: JournalEntry = {
      ...entry,
      reconciliationId: undefined,
      isReconciled: false,
      reconciledAt: undefined,
      reconciledBy: undefined,
      updatedAt: new Date(),
      updatedBy: unreconciledBy
    };

    this.journalEntries.set(entryId, unreconciledEntry);
    return unreconciledEntry;
  }

  /**
   * Delete journal entries by transaction ID
   */
  deleteJournalEntriesByTransaction(transactionId: number): number {
    const entries = this.getJournalEntriesByTransaction(transactionId);
    let deletedCount = 0;

    for (const entry of entries) {
      if (this.journalEntries.delete(entry.id)) {
        deletedCount++;
      }
    }

    return deletedCount;
  }

  /**
   * Get exchange rate (placeholder implementation)
   */
  private getExchangeRate(fromCurrency: Currency, toCurrency: Currency): number {
    // In a real system, this would fetch from an external service
    // For now, return placeholder rates
    if (fromCurrency === toCurrency) return 1.0;
    
    // Placeholder exchange rates (as of a hypothetical date)
    const rates: { [key: string]: number } = {
      'USD_IDR': 15750,
      'EUR_IDR': 17200,
      'GBP_IDR': 19800,
      'SGD_IDR': 11650,
      'MYR_IDR': 3520,
      'IDR_USD': 1 / 15750,
      'IDR_EUR': 1 / 17200,
      'IDR_GBP': 1 / 19800,
      'IDR_SGD': 1 / 11650,
      'IDR_MYR': 1 / 3520
    };

    const rateKey = `${fromCurrency}_${toCurrency}`;
    return rates[rateKey] || 1.0;
  }

  /**
   * Reset journal entry manager
   */
  reset(): void {
    this.journalEntries.clear();
    this.nextId = 1;
  }

  /**
   * Get journal entry statistics
   */
  getStatistics(): {
    totalEntries: number;
    reconciledEntries: number;
    unreconciledEntries: number;
    entriesByAccount: { [accountId: number]: number };
    entriesByCurrency: { [currency: string]: number };
  } {
    const entries = this.getAllJournalEntries();
    const entriesByAccount: { [accountId: number]: number } = {};
    const entriesByCurrency: { [currency: string]: number } = {};

    let reconciledCount = 0;

    for (const entry of entries) {
      // Count by account
      entriesByAccount[entry.accountId] = (entriesByAccount[entry.accountId] || 0) + 1;
      
      // Count by currency
      entriesByCurrency[entry.currency] = (entriesByCurrency[entry.currency] || 0) + 1;
      
      // Count reconciled
      if (entry.isReconciled) {
        reconciledCount++;
      }
    }

    return {
      totalEntries: entries.length,
      reconciledEntries: reconciledCount,
      unreconciledEntries: entries.length - reconciledCount,
      entriesByAccount,
      entriesByCurrency
    };
  }
} 