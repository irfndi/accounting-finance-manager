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
  const factor = Math.pow(10, places);
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
    this.transactionData.entries!.push({
      accountId,
      debitAmount: roundToDecimalPlaces(amount),
      creditAmount: 0,
      description,
      currency: this.transactionData.currency,
    });
    return this;
  }

  credit(accountId: number, amount: number, description?: string): TransactionBuilder {
    this.transactionData.entries!.push({
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

    const transactionEntries = journalEntries.filter(entry => entry.transactionId === transaction.id);
    
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
      const accountId = entry.accountId;
      const currentBalance = this.accountBalances.get(accountId) || {
        accountId,
        balance: 0,
        currency: entry.amount.currency,
        lastUpdated: new Date(),
        normalBalance: this.getNormalBalanceForAccount(accountId)
      };

      // Update balance based on debit/credit and normal balance
      const balanceChange = entry.type === 'DEBIT' ? entry.amount.amount : -entry.amount.amount;
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