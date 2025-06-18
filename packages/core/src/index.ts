/**
 * Finance Manager Core Module
 * Corporate Finance & Accounting Core Functionality
 */

// Core financial constants
export const FINANCIAL_CONSTANTS = {
  DECIMAL_PLACES: 2,
  DEFAULT_CURRENCY: 'USD',
  ACCOUNT_TYPES: {
    ASSET: 'asset',
    LIABILITY: 'liability',
    EQUITY: 'equity',
    REVENUE: 'revenue',
    EXPENSE: 'expense',
  } as const,
} as const;

// Utility functions
export function formatCurrency(
  amount: number, 
  currency = FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
  locale = 'en-US'
) {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: FINANCIAL_CONSTANTS.DECIMAL_PLACES,
    maximumFractionDigits: FINANCIAL_CONSTANTS.DECIMAL_PLACES,
  }).format(amount);
}

export function validateAccountNumber(accountNumber: string): boolean {
  // Basic account number validation
  return /^[0-9]{4,10}$/.test(accountNumber);
}

// Export types
export type AccountType = typeof FINANCIAL_CONSTANTS.ACCOUNT_TYPES[keyof typeof FINANCIAL_CONSTANTS.ACCOUNT_TYPES];

export interface FinancialAccount {
  id: string;
  name: string;
  type: AccountType;
  number: string;
  balance: number;
  currency: string;
}

// Core business logic placeholder
export class FinanceManager {
  private accounts: FinancialAccount[] = [];

  addAccount(account: FinancialAccount): void {
    this.accounts.push(account);
  }

  getAccount(id: string): FinancialAccount | undefined {
    return this.accounts.find(account => account.id === id);
  }

  getTotalBalance(): number {
    return this.accounts.reduce((total, account) => total + account.balance, 0);
  }
} 