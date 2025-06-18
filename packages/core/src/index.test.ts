/**
 * Finance Manager Core Module Tests
 * Unit tests for double-entry accounting engine
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  TransactionValidator,
  TransactionBuilder,
  BalanceCalculator,
  AccountingEngine,
  AccountBalanceManager,
  AccountRegistry,
  DoubleEntryError,
  formatCurrency,
  roundToDecimalPlaces,
  getNormalBalance,
  FINANCIAL_CONSTANTS,
} from './index';
import type {
  TransactionEntry,
  TransactionData,
  ValidationError,
  AccountType,
  NormalBalance,
  Account,
  Transaction,
} from '@finance-manager/types';

describe('Financial Constants', () => {
  it('should have correct decimal places', () => {
    expect(FINANCIAL_CONSTANTS.DECIMAL_PLACES).toBe(2);
  });

  it('should have correct default currency', () => {
    expect(FINANCIAL_CONSTANTS.DEFAULT_CURRENCY).toBe('IDR');
  });

  it('should have correct normal balances for account types', () => {
    expect(FINANCIAL_CONSTANTS.NORMAL_BALANCES.ASSET).toBe('DEBIT');
    expect(FINANCIAL_CONSTANTS.NORMAL_BALANCES.EXPENSE).toBe('DEBIT');
    expect(FINANCIAL_CONSTANTS.NORMAL_BALANCES.LIABILITY).toBe('CREDIT');
    expect(FINANCIAL_CONSTANTS.NORMAL_BALANCES.EQUITY).toBe('CREDIT');
    expect(FINANCIAL_CONSTANTS.NORMAL_BALANCES.REVENUE).toBe('CREDIT');
  });
});

describe('Utility Functions', () => {
  describe('formatCurrency', () => {
    it('should format currency correctly', () => {
      expect(formatCurrency(1234.56)).toBe('Rp 1.235');
      expect(formatCurrency(0)).toBe('Rp 0');
      expect(formatCurrency(-500.25)).toBe('Rp -500');
    });

    it('should format different currencies', () => {
      const result = formatCurrency(1000, 'EUR');
      expect(result).toContain('1.000,00');
      expect(result).toContain('€');
    });
  });

  describe('roundToDecimalPlaces', () => {
    it('should round to correct decimal places', () => {
      expect(roundToDecimalPlaces(1.234567)).toBe(1.23);
      expect(roundToDecimalPlaces(1.235)).toBe(1.24);
      expect(roundToDecimalPlaces(1.999)).toBe(2.00);
    });

    it('should handle different decimal places', () => {
      expect(roundToDecimalPlaces(1.23456, 3)).toBe(1.235);
      expect(roundToDecimalPlaces(1.23456, 0)).toBe(1);
    });
  });

  describe('getNormalBalance', () => {
    it('should return correct normal balance for each account type', () => {
      expect(getNormalBalance('ASSET')).toBe('DEBIT');
      expect(getNormalBalance('EXPENSE')).toBe('DEBIT');
      expect(getNormalBalance('LIABILITY')).toBe('CREDIT');
      expect(getNormalBalance('EQUITY')).toBe('CREDIT');
      expect(getNormalBalance('REVENUE')).toBe('CREDIT');
    });
  });
});

describe('TransactionValidator', () => {
  describe('validateDoubleEntry', () => {
    it('should validate balanced transaction entries', () => {
      const entries: TransactionEntry[] = [
        { accountId: 1, debitAmount: 100, creditAmount: 0 },
        { accountId: 2, debitAmount: 0, creditAmount: 100 },
      ];

      const errors = TransactionValidator.validateDoubleEntry(entries);
      expect(errors).toHaveLength(0);
    });

    it('should reject unbalanced transaction entries', () => {
      const entries: TransactionEntry[] = [
        { accountId: 1, debitAmount: 100, creditAmount: 0 },
        { accountId: 2, debitAmount: 0, creditAmount: 50 },
      ];

      const errors = TransactionValidator.validateDoubleEntry(entries);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('UNBALANCED_TRANSACTION');
      expect(errors[0].message).toContain('Total debits (100) must equal total credits (50)');
    });

    it('should reject empty entries', () => {
      const errors = TransactionValidator.validateDoubleEntry([]);
      expect(errors).toHaveLength(1);
      expect(errors[0].code).toBe('NO_ENTRIES');
    });

    it('should reject single entry transactions', () => {
      const entries: TransactionEntry[] = [
        { accountId: 1, debitAmount: 100, creditAmount: 0 },
      ];

      const errors = TransactionValidator.validateDoubleEntry(entries);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.code === 'INSUFFICIENT_ENTRIES')).toBe(true);
      expect(errors.some(e => e.code === 'UNBALANCED_TRANSACTION')).toBe(true);
    });

    it('should reject entries with both debit and credit', () => {
      const entries: TransactionEntry[] = [
        { accountId: 1, debitAmount: 100, creditAmount: 50 },
        { accountId: 2, debitAmount: 0, creditAmount: 100 },
      ];

      const errors = TransactionValidator.validateDoubleEntry(entries);
      expect(errors.some(e => e.code === 'BOTH_DEBIT_AND_CREDIT')).toBe(true);
    });

    it('should reject entries with no amount', () => {
      const entries: TransactionEntry[] = [
        { accountId: 1, debitAmount: 0, creditAmount: 0 },
        { accountId: 2, debitAmount: 0, creditAmount: 100 },
      ];

      const errors = TransactionValidator.validateDoubleEntry(entries);
      expect(errors.some(e => e.code === 'NO_AMOUNT')).toBe(true);
    });

    it('should reject negative amounts', () => {
      const entries: TransactionEntry[] = [
        { accountId: 1, debitAmount: -100, creditAmount: 0 },
        { accountId: 2, debitAmount: 0, creditAmount: 100 },
      ];

      const errors = TransactionValidator.validateDoubleEntry(entries);
      expect(errors.some(e => e.code === 'NEGATIVE_DEBIT')).toBe(true);
    });

    it('should reject entries without account ID', () => {
      const entries: TransactionEntry[] = [
        { accountId: 0, debitAmount: 100, creditAmount: 0 },
        { accountId: 2, debitAmount: 0, creditAmount: 100 },
      ];

      const errors = TransactionValidator.validateDoubleEntry(entries);
      expect(errors.some(e => e.code === 'MISSING_ACCOUNT_ID')).toBe(true);
    });

    it('should handle complex multi-entry transactions', () => {
      const entries: TransactionEntry[] = [
        { accountId: 1, debitAmount: 1000, creditAmount: 0 }, // Cash
        { accountId: 2, debitAmount: 500, creditAmount: 0 },  // Equipment
        { accountId: 3, debitAmount: 0, creditAmount: 800 },  // Accounts Payable
        { accountId: 4, debitAmount: 0, creditAmount: 700 },  // Owner's Equity
      ];

      const errors = TransactionValidator.validateDoubleEntry(entries);
      expect(errors).toHaveLength(0);
    });
  });

  describe('validateTransactionData', () => {
    let validTransactionData: TransactionData;

    beforeEach(() => {
      validTransactionData = {
        description: 'Test transaction',
        transactionDate: new Date(),
        currency: 'USD',
        entries: [
          { accountId: 1, debitAmount: 100, creditAmount: 0 },
          { accountId: 2, debitAmount: 0, creditAmount: 100 },
        ],
      };
    });

    it('should validate complete transaction data', () => {
      const errors = TransactionValidator.validateTransactionData(validTransactionData);
      expect(errors).toHaveLength(0);
    });

    it('should reject transaction without description', () => {
      validTransactionData.description = '';
      const errors = TransactionValidator.validateTransactionData(validTransactionData);
      expect(errors.some(e => e.code === 'MISSING_DESCRIPTION')).toBe(true);
    });

    it('should reject transaction without date', () => {
      const invalidData: Partial<TransactionData> = {
        description: 'Test transaction',
        currency: 'USD',
        entries: [
          { accountId: 1, debitAmount: 100, creditAmount: 0 },
          { accountId: 2, debitAmount: 0, creditAmount: 100 },
        ],
      };
      const errors = TransactionValidator.validateTransactionData(invalidData as TransactionData);
      expect(errors.some(e => e.code === 'MISSING_TRANSACTION_DATE')).toBe(true);
    });

    it('should reject transaction without currency', () => {
      const invalidData: Partial<TransactionData> = {
        description: 'Test transaction',
        transactionDate: new Date(),
        entries: [
          { accountId: 1, debitAmount: 100, creditAmount: 0 },
          { accountId: 2, debitAmount: 0, creditAmount: 100 },
        ],
      };
      const errors = TransactionValidator.validateTransactionData(invalidData as TransactionData);
      expect(errors.some(e => e.code === 'MISSING_CURRENCY')).toBe(true);
    });
  });
});

describe('TransactionBuilder', () => {
  let builder: TransactionBuilder;

  beforeEach(() => {
    builder = new TransactionBuilder();
  });

  it('should build a simple balanced transaction', () => {
    const transaction = builder
      .setDescription('Cash sale')
      .setDate(new Date('2024-01-01'))
      .debit(1, 100, 'Cash received')
      .credit(2, 100, 'Sales revenue')
      .build();

    expect(transaction.description).toBe('Cash sale');
    expect(transaction.entries).toHaveLength(2);
    expect(transaction.entries[0].debitAmount).toBe(100);
    expect(transaction.entries[1].creditAmount).toBe(100);
  });

  it('should build complex multi-entry transaction', () => {
    const transaction = builder
      .setDescription('Purchase equipment with cash and loan')
      .setReference('PO-2024-001')
      .debit(1, 5000, 'Equipment purchase')    // Equipment
      .credit(2, 2000, 'Cash payment')         // Cash
      .credit(3, 3000, 'Bank loan')            // Notes Payable
      .build();

    expect(transaction.entries).toHaveLength(3);
    expect(transaction.reference).toBe('PO-2024-001');
    
    const totalDebits = transaction.entries.reduce((sum, e) => sum + (e.debitAmount || 0), 0);
    const totalCredits = transaction.entries.reduce((sum, e) => sum + (e.creditAmount || 0), 0);
    expect(totalDebits).toBe(totalCredits);
  });

  it('should throw error for unbalanced transaction', () => {
    expect(() => {
      builder
        .setDescription('Unbalanced transaction')
        .debit(1, 100)
        .credit(2, 50)
        .build();
    }).toThrow(DoubleEntryError);
  });

  it('should validate before building', () => {
    builder
      .setDescription('Test transaction')
      .debit(1, 100)
      .credit(2, 50); // Unbalanced

    const errors = builder.validate();
    expect(errors).toHaveLength(1);
    expect(errors[0].code).toBe('UNBALANCED_TRANSACTION');
  });

  it('should reset builder state', () => {
    builder
      .setDescription('First transaction')
      .debit(1, 100)
      .credit(2, 100);

    builder.reset();

    const transaction = builder
      .setDescription('Second transaction')
      .debit(3, 200)
      .credit(4, 200)
      .build();

    expect(transaction.description).toBe('Second transaction');
    expect(transaction.entries).toHaveLength(2);
    expect(transaction.entries[0].accountId).toBe(3);
  });

  it('should handle decimal rounding', () => {
    const transaction = builder
      .setDescription('Decimal test')
      .debit(1, 33.333)
      .credit(2, 33.33)
      .build();

    expect(transaction.entries[0].debitAmount).toBe(33.33);
    expect(transaction.entries[1].creditAmount).toBe(33.33);
  });
});

describe('BalanceCalculator', () => {
  describe('calculateAccountBalance', () => {
    it('should calculate debit account balance correctly', () => {
      const balance = BalanceCalculator.calculateAccountBalance(
        'ASSET',
        'DEBIT',
        1000,
        300
      );
      expect(balance).toBe(700);
    });

    it('should calculate credit account balance correctly', () => {
      const balance = BalanceCalculator.calculateAccountBalance(
        'LIABILITY',
        'CREDIT',
        200,
        1000
      );
      expect(balance).toBe(800);
    });

    it('should handle zero balances', () => {
      const balance = BalanceCalculator.calculateAccountBalance(
        'ASSET',
        'DEBIT',
        500,
        500
      );
      expect(balance).toBe(0);
    });

    it('should handle negative balances for debit accounts', () => {
      const balance = BalanceCalculator.calculateAccountBalance(
        'ASSET',
        'DEBIT',
        300,
        1000
      );
      expect(balance).toBe(-700);
    });

    it('should handle negative balances for credit accounts', () => {
      const balance = BalanceCalculator.calculateAccountBalance(
        'LIABILITY',
        'CREDIT',
        1000,
        300
      );
      expect(balance).toBe(-700);
    });
  });
});

describe('AccountingEngine', () => {
  describe('createTransaction', () => {
    it('should create valid transaction', () => {
      const transactionData: TransactionData = {
        description: 'Test transaction',
        transactionDate: new Date(),
        currency: 'USD',
        entries: [
          { accountId: 1, debitAmount: 100, creditAmount: 0 },
          { accountId: 2, debitAmount: 0, creditAmount: 100 },
        ],
      };

      const result = AccountingEngine.createTransaction(transactionData);
      expect(result).toEqual(transactionData);
    });

    it('should throw error for invalid transaction', () => {
      const transactionData: TransactionData = {
        description: 'Invalid transaction',
        transactionDate: new Date(),
        currency: 'USD',
        entries: [
          { accountId: 1, debitAmount: 100, creditAmount: 0 },
          { accountId: 2, debitAmount: 0, creditAmount: 50 }, // Unbalanced
        ],
      };

      expect(() => {
        AccountingEngine.createTransaction(transactionData);
      }).toThrow(DoubleEntryError);
    });
  });
});

describe('Error Classes', () => {
  it('should create DoubleEntryError with details', () => {
    const details: ValidationError[] = [
      { field: 'entries', message: 'Test error', code: 'TEST_ERROR' }
    ];
    
    const error = new DoubleEntryError('Test message', details);
    
    expect(error.name).toBe('DoubleEntryError');
    expect(error.code).toBe('DOUBLE_ENTRY_VIOLATION');
    expect(error.details).toEqual(details);
    expect(error.message).toBe('Test message');
  });
});

describe('Real-world Accounting Scenarios', () => {
  it('should handle cash sale transaction', () => {
    const transaction = new TransactionBuilder()
      .setDescription('Cash sale of merchandise')
      .setReference('SALE-001')
      .debit(1001, 500, 'Cash received')      // Cash account
      .credit(4001, 500, 'Sales revenue')     // Sales Revenue account
      .build();

    expect(transaction.entries).toHaveLength(2);
    expect(TransactionValidator.validateTransactionData(transaction)).toHaveLength(0);
  });

  it('should handle credit sale with sales tax', () => {
    const transaction = new TransactionBuilder()
      .setDescription('Credit sale with sales tax')
      .setReference('SALE-002')
      .debit(1200, 1080, 'Accounts receivable')    // A/R
      .credit(4001, 1000, 'Sales revenue')         // Sales
      .credit(2300, 80, 'Sales tax payable')       // Sales Tax Payable
      .build();

    expect(transaction.entries).toHaveLength(3);
    expect(TransactionValidator.validateTransactionData(transaction)).toHaveLength(0);
  });

  it('should handle purchase of inventory on credit', () => {
    const transaction = new TransactionBuilder()
      .setDescription('Purchase inventory on credit')
      .setReference('PO-001')
      .debit(1300, 2500, 'Inventory purchase')     // Inventory
      .credit(2001, 2500, 'Accounts payable')      // A/P
      .build();

    expect(transaction.entries).toHaveLength(2);
    expect(TransactionValidator.validateTransactionData(transaction)).toHaveLength(0);
  });

  it('should handle payroll transaction', () => {
    const transaction = new TransactionBuilder()
      .setDescription('Monthly payroll')
      .setReference('PAYROLL-2024-01')
      .debit(5001, 10000, 'Gross wages')           // Wage Expense
      .debit(5002, 765, 'Employer FICA')           // Payroll Tax Expense
      .credit(1001, 8500, 'Net pay')               // Cash
      .credit(2401, 765, 'FICA payable')           // FICA Payable
      .credit(2402, 1500, 'Federal tax payable')   // Federal Tax Payable
      .build();

    expect(transaction.entries).toHaveLength(5);
    expect(TransactionValidator.validateTransactionData(transaction)).toHaveLength(0);
  });

  it('should handle depreciation expense', () => {
    const transaction = new TransactionBuilder()
      .setDescription('Monthly depreciation expense')
      .setReference('DEP-2024-01')
      .debit(6001, 500, 'Depreciation expense')              // Depreciation Expense
      .credit(1501, 500, 'Accumulated depreciation')         // Accumulated Depreciation
      .build();

    expect(transaction.entries).toHaveLength(2);
    expect(TransactionValidator.validateTransactionData(transaction)).toHaveLength(0);
  });
});

// TODO: Add AccountBalanceManager tests once Transaction interface is finalized

describe('AccountRegistry', () => {
  let registry: AccountRegistry;

  beforeEach(() => {
    registry = new AccountRegistry();
  });

  describe('Account Management', () => {
    it('should register and retrieve accounts', () => {
      const account: Account = {
        id: 1001,
        code: '1001',
        name: 'Cash',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        parentId: undefined,
        level: 1,
        path: '1001',
        isActive: true,
        isSystem: false,
        allowTransactions: true,
        reportOrder: 1,
        currentBalance: 0,
        description: 'Cash account',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      registry.registerAccount(account);

      const retrieved = registry.getAccount('1001');
      expect(retrieved).toEqual(account);
      expect(registry.hasAccount('1001')).toBe(true);
    });

    it('should get accounts by type', () => {
      const assetAccount: Account = {
        id: 1001,
        code: '1001',
        name: 'Cash',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        parentId: undefined,
        level: 1,
        path: '1001',
        isActive: true,
        isSystem: false,
        allowTransactions: true,
        reportOrder: 1,
        currentBalance: 0,
        description: 'Cash account',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const liabilityAccount: Account = {
        id: 2001,
        code: '2001',
        name: 'Accounts Payable',
        type: 'LIABILITY',
        normalBalance: 'CREDIT',
        parentId: undefined,
        level: 1,
        path: '2001',
        isActive: true,
        isSystem: false,
        allowTransactions: true,
        reportOrder: 2,
        currentBalance: 0,
        description: 'Accounts payable',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      registry.registerAccount(assetAccount);
      registry.registerAccount(liabilityAccount);

      const assets = registry.getAccountsByType('ASSET');
      const liabilities = registry.getAccountsByType('LIABILITY');

      expect(assets).toHaveLength(1);
      expect(liabilities).toHaveLength(1);
      expect(assets[0].name).toBe('Cash');
      expect(liabilities[0].name).toBe('Accounts Payable');
    });

    it('should get account normal balance', () => {
      const account: Account = {
        id: 1001,
        code: '1001',
        name: 'Cash',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        parentId: undefined,
        level: 1,
        path: '1001',
        isActive: true,
        isSystem: false,
        allowTransactions: true,
        reportOrder: 1,
        currentBalance: 0,
        description: 'Cash account',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      registry.registerAccount(account);

      const normalBalance = registry.getAccountNormalBalance('1001');
      expect(normalBalance).toBe('DEBIT');
    });

    it('should remove accounts', () => {
      const account: Account = {
        id: 1001,
        code: '1001',
        name: 'Cash',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        parentId: undefined,
        level: 1,
        path: '1001',
        isActive: true,
        isSystem: false,
        allowTransactions: true,
        reportOrder: 1,
        currentBalance: 0,
        description: 'Cash account',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      registry.registerAccount(account);
      expect(registry.hasAccount('1001')).toBe(true);

      const removed = registry.removeAccount('1001');
      expect(removed).toBe(true);
      expect(registry.hasAccount('1001')).toBe(false);
    });
  });
});

describe('IDR Currency Formatting', () => {
  it('should format IDR currency without decimal places', () => {
    const formatted = formatCurrency(1000000, 'IDR');
    expect(formatted).toBe('Rp 1.000.000');
  });

  it('should format USD currency with decimal places', () => {
    const formatted = formatCurrency(1000.50, 'USD');
    expect(formatted).toBe('$ 1,000.50');
  });

  it('should use IDR as default currency', () => {
    const formatted = formatCurrency(500000);
    expect(formatted).toBe('Rp 500.000');
  });

  it('should format other supported currencies', () => {
    expect(formatCurrency(100000, 'SGD')).toBe('S$ 100,000.00');
    expect(formatCurrency(100000, 'MYR')).toBe('RM 100,000.00');
  });
}); 