/**
 * Finance Manager Core Module Tests
 * Unit tests for double-entry accounting engine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FINANCIAL_CONSTANTS,
  formatCurrency,
  roundToDecimalPlaces,
  getNormalBalance,
  TransactionValidator,
  TransactionBuilder,
  BalanceCalculator,
  AccountingEngine,
  AccountBalanceManager,
  AccountRegistry,
  DoubleEntryError,
  AccountingValidationError,
  JournalEntryManager,
  BalanceSheetError,
  AccountRegistryError,
  CurrencyConversionError,
  PeriodClosureError,
  FiscalYearError,
  ComplianceError,
  ErrorAggregator,
  AccountingErrorFactory,
  ErrorRecoveryManager,
  DatabaseAdapter,
  DatabaseAccountRegistry,
  DatabaseJournalEntryManager,
} from './index.js';
import type {
  TransactionEntry,
  TransactionData,
  ValidationError,
  Account,
  AccountType,
  JournalEntry,
  Currency,
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

describe('JournalEntryManager', () => {
  let journalManager: JournalEntryManager;
  let accountRegistry: AccountRegistry;
  
  beforeEach(() => {
    accountRegistry = new AccountRegistry();
    journalManager = new JournalEntryManager(accountRegistry);
    
    // Register some test accounts
    const cashAccount: Account = {
      id: 1001,
      code: '1001',
      name: 'Cash',
      type: 'ASSET',
      normalBalance: 'DEBIT',
      level: 1,
      path: '1001',
      isActive: true,
      isSystem: false,
      allowTransactions: true,
      reportOrder: 1,
      currentBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const revenueAccount: Account = {
      id: 4001,
      code: '4001',
      name: 'Sales Revenue',
      type: 'REVENUE',
      normalBalance: 'CREDIT',
      level: 1,
      path: '4001',
      isActive: true,
      isSystem: false,
      allowTransactions: true,
      reportOrder: 1,
      currentBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    accountRegistry.registerAccount(cashAccount);
    accountRegistry.registerAccount(revenueAccount);
  });

  describe('Journal Entry Creation', () => {
    it('should create journal entries from transaction data', () => {
      const transactionData: TransactionData = {
        description: 'Cash Sale',
        transactionDate: new Date(),
        currency: 'IDR',
        entries: [
          { accountId: 1001, debitAmount: 100000, description: 'Cash received' },
          { accountId: 4001, creditAmount: 100000, description: 'Sales revenue' }
        ]
      };

      const entries = journalManager.createJournalEntriesFromTransaction(1, transactionData, 'testUser');

      expect(entries).toHaveLength(2);
      expect(entries[0].accountId).toBe(1001);
      expect(entries[0].debitAmount).toBe(100000);
      expect(entries[0].creditAmount).toBe(0);
      expect(entries[0].currency).toBe('IDR');
      expect(entries[0].createdBy).toBe('testUser');
      
      expect(entries[1].accountId).toBe(4001);
      expect(entries[1].debitAmount).toBe(0);
      expect(entries[1].creditAmount).toBe(100000);
    });

    it('should handle currency conversion for non-IDR currencies', () => {
      const transactionData: TransactionData = {
        description: 'USD Sale',
        transactionDate: new Date(),
        currency: 'USD',
        entries: [
          { accountId: 1001, debitAmount: 100, currency: 'USD' },
          { accountId: 4001, creditAmount: 100, currency: 'USD' }
        ]
      };

      const entries = journalManager.createJournalEntriesFromTransaction(1, transactionData);

      expect(entries[0].currency).toBe('USD');
      expect(entries[0].baseCurrency).toBe('IDR');
      expect(entries[0].exchangeRate).toBeGreaterThan(1); // USD to IDR should be > 1
      expect(entries[0].baseDebitAmount).toBeGreaterThan(entries[0].debitAmount);
    });

    it('should throw error for accounts that do not allow transactions', () => {
      // Create account that doesn't allow transactions
      const restrictedAccount: Account = {
        id: 9999,
        code: '9999',
        name: 'Restricted Account',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        level: 1,
        path: '9999',
        isActive: true,
        isSystem: true,
        allowTransactions: false,
        reportOrder: 1,
        currentBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      accountRegistry.registerAccount(restrictedAccount);

      const transactionData: TransactionData = {
        description: 'Test Transaction',
        transactionDate: new Date(),
        currency: 'IDR',
        entries: [
          { accountId: 9999, debitAmount: 100000 },
          { accountId: 4001, creditAmount: 100000 }
        ]
      };

      expect(() => {
        journalManager.createJournalEntriesFromTransaction(1, transactionData);
      }).toThrow('Account 9999 does not allow transactions');
    });
  });

  describe('Journal Entry Validation', () => {
    it('should validate balanced journal entries', () => {
      const entries: JournalEntry[] = [
        {
          id: 1,
          transactionId: 1,
          accountId: 1001,
          description: 'Cash received',
          debitAmount: 100000,
          creditAmount: 0,
          currency: 'IDR',
          exchangeRate: 1,
          baseCurrency: 'IDR',
          baseDebitAmount: 100000,
          baseCreditAmount: 0,
          isReconciled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          transactionId: 1,
          accountId: 4001,
          description: 'Sales revenue',
          debitAmount: 0,
          creditAmount: 100000,
          currency: 'IDR',
          exchangeRate: 1,
          baseCurrency: 'IDR',
          baseDebitAmount: 0,
          baseCreditAmount: 100000,
          isReconciled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const errors = journalManager.validateJournalEntries(entries);
      expect(errors).toHaveLength(0);
    });

    it('should reject unbalanced journal entries', () => {
      const entries: JournalEntry[] = [
        {
          id: 1,
          transactionId: 1,
          accountId: 1001,
          description: 'Cash received',
          debitAmount: 150000,
          creditAmount: 0,
          currency: 'IDR',
          exchangeRate: 1,
          baseCurrency: 'IDR',
          baseDebitAmount: 150000,
          baseCreditAmount: 0,
          isReconciled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          transactionId: 1,
          accountId: 4001,
          description: 'Sales revenue',
          debitAmount: 0,
          creditAmount: 100000,
          currency: 'IDR',
          exchangeRate: 1,
          baseCurrency: 'IDR',
          baseDebitAmount: 0,
          baseCreditAmount: 100000,
          isReconciled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const errors = journalManager.validateJournalEntries(entries);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(e => e.code === 'UNBALANCED_TRANSACTION')).toBe(true);
    });

    it('should reject entries with both debit and credit amounts', () => {
      const entries: JournalEntry[] = [
        {
          id: 1,
          transactionId: 1,
          accountId: 1001,
          description: 'Invalid entry',
          debitAmount: 50000,
          creditAmount: 50000,
          currency: 'IDR',
          exchangeRate: 1,
          baseCurrency: 'IDR',
          baseDebitAmount: 50000,
          baseCreditAmount: 50000,
          isReconciled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const errors = journalManager.validateJournalEntries(entries);
      expect(errors.some(e => e.code === 'BOTH_DEBIT_CREDIT')).toBe(true);
    });

    it('should reject entries with zero amounts', () => {
      const entries: JournalEntry[] = [
        {
          id: 1,
          transactionId: 1,
          accountId: 1001,
          description: 'Zero amount entry',
          debitAmount: 0,
          creditAmount: 0,
          currency: 'IDR',
          exchangeRate: 1,
          baseCurrency: 'IDR',
          baseDebitAmount: 0,
          baseCreditAmount: 0,
          isReconciled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const errors = journalManager.validateJournalEntries(entries);
      expect(errors.some(e => e.code === 'ZERO_AMOUNT')).toBe(true);
    });

    it('should reject single entry transactions', () => {
      const entries: JournalEntry[] = [
        {
          id: 1,
          transactionId: 1,
          accountId: 1001,
          description: 'Single entry',
          debitAmount: 100000,
          creditAmount: 0,
          currency: 'IDR',
          exchangeRate: 1,
          baseCurrency: 'IDR',
          baseDebitAmount: 100000,
          baseCreditAmount: 0,
          isReconciled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const errors = journalManager.validateJournalEntries(entries);
      expect(errors.some(e => e.code === 'SINGLE_ENTRY')).toBe(true);
    });

    it('should validate inactive accounts', () => {
      // Create inactive account
      const inactiveAccount: Account = {
        id: 8888,
        code: '8888',
        name: 'Inactive Account',
        type: 'ASSET',
        normalBalance: 'DEBIT',
        level: 1,
        path: '8888',
        isActive: false,
        isSystem: false,
        allowTransactions: true,
        reportOrder: 1,
        currentBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      accountRegistry.registerAccount(inactiveAccount);

      const entries: JournalEntry[] = [
        {
          id: 1,
          transactionId: 1,
          accountId: 8888,
          description: 'Using inactive account',
          debitAmount: 100000,
          creditAmount: 0,
          currency: 'IDR',
          exchangeRate: 1,
          baseCurrency: 'IDR',
          baseDebitAmount: 100000,
          baseCreditAmount: 0,
          isReconciled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 2,
          transactionId: 1,
          accountId: 4001,
          description: 'Revenue',
          debitAmount: 0,
          creditAmount: 100000,
          currency: 'IDR',
          exchangeRate: 1,
          baseCurrency: 'IDR',
          baseDebitAmount: 0,
          baseCreditAmount: 100000,
          isReconciled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      const errors = journalManager.validateJournalEntries(entries);
      expect(errors.some(e => e.code === 'ACCOUNT_INACTIVE')).toBe(true);
    });
  });

  describe('Journal Entry Management', () => {
    it('should retrieve journal entries by transaction ID', () => {
      const transactionData: TransactionData = {
        description: 'Test Transaction',
        transactionDate: new Date(),
        currency: 'IDR',
        entries: [
          { accountId: 1001, debitAmount: 100000 },
          { accountId: 4001, creditAmount: 100000 }
        ]
      };

      journalManager.createJournalEntriesFromTransaction(1, transactionData);
      const entries = journalManager.getJournalEntriesByTransaction(1);

      expect(entries).toHaveLength(2);
      expect(entries.every(e => e.transactionId === 1)).toBe(true);
    });

    it('should retrieve journal entries by account ID', () => {
      const transactionData: TransactionData = {
        description: 'Test Transaction',
        transactionDate: new Date(),
        currency: 'IDR',
        entries: [
          { accountId: 1001, debitAmount: 100000 },
          { accountId: 4001, creditAmount: 100000 }
        ]
      };

      journalManager.createJournalEntriesFromTransaction(1, transactionData);
      const cashEntries = journalManager.getJournalEntriesByAccount(1001);

      expect(cashEntries).toHaveLength(1);
      expect(cashEntries[0].accountId).toBe(1001);
      expect(cashEntries[0].debitAmount).toBe(100000);
    });

    it('should post journal entries', () => {
      const transactionData: TransactionData = {
        description: 'Test Transaction',
        transactionDate: new Date(),
        currency: 'IDR',
        entries: [
          { accountId: 1001, debitAmount: 100000 },
          { accountId: 4001, creditAmount: 100000 }
        ]
      };

      const entries = journalManager.createJournalEntriesFromTransaction(1, transactionData);
      const entryIds = entries.map(e => e.id);
      const postedEntries = journalManager.postJournalEntries(entryIds, 'postUser');

      expect(postedEntries).toHaveLength(2);
      expect(postedEntries.every(e => e.updatedBy === 'postUser')).toBe(true);
    });

    it('should reconcile and unreconcile journal entries', () => {
      const transactionData: TransactionData = {
        description: 'Test Transaction',
        transactionDate: new Date(),
        currency: 'IDR',
        entries: [
          { accountId: 1001, debitAmount: 100000 }
        ]
      };

      const entries = journalManager.createJournalEntriesFromTransaction(1, transactionData);
      const entryId = entries[0].id;

      // Reconcile
      const reconciledEntry = journalManager.reconcileJournalEntry(entryId, 'REC-001', 'reconcileUser');
      expect(reconciledEntry?.isReconciled).toBe(true);
      expect(reconciledEntry?.reconciliationId).toBe('REC-001');
      expect(reconciledEntry?.reconciledBy).toBe('reconcileUser');

      // Unreconcile
      const unreconciledEntry = journalManager.unreconcileJournalEntry(entryId, 'unreconcileUser');
      expect(unreconciledEntry?.isReconciled).toBe(false);
      expect(unreconciledEntry?.reconciliationId).toBeUndefined();
    });

    it('should delete journal entries by transaction ID', () => {
      const transactionData: TransactionData = {
        description: 'Test Transaction',
        transactionDate: new Date(),
        currency: 'IDR',
        entries: [
          { accountId: 1001, debitAmount: 100000 },
          { accountId: 4001, creditAmount: 100000 }
        ]
      };

      journalManager.createJournalEntriesFromTransaction(1, transactionData);
      
      expect(journalManager.getJournalEntriesByTransaction(1)).toHaveLength(2);
      
      const deletedCount = journalManager.deleteJournalEntriesByTransaction(1);
      expect(deletedCount).toBe(2);
      expect(journalManager.getJournalEntriesByTransaction(1)).toHaveLength(0);
    });
  });

  describe('Journal Entry Statistics', () => {
    it('should provide comprehensive statistics', () => {
      // Create multiple transactions
      const transaction1: TransactionData = {
        description: 'Cash Sale',
        transactionDate: new Date(),
        currency: 'IDR',
        entries: [
          { accountId: 1001, debitAmount: 100000 },
          { accountId: 4001, creditAmount: 100000 }
        ]
      };

      const transaction2: TransactionData = {
        description: 'USD Sale',
        transactionDate: new Date(),
        currency: 'USD',
        entries: [
          { accountId: 1001, debitAmount: 50, currency: 'USD' },
          { accountId: 4001, creditAmount: 50, currency: 'USD' }
        ]
      };

      const entries1 = journalManager.createJournalEntriesFromTransaction(1, transaction1);
      const entries2 = journalManager.createJournalEntriesFromTransaction(2, transaction2);

      // Reconcile one entry
      journalManager.reconcileJournalEntry(entries1[0].id, 'REC-001');

      const stats = journalManager.getStatistics();

      expect(stats.totalEntries).toBe(4);
      expect(stats.reconciledEntries).toBe(1);
      expect(stats.unreconciledEntries).toBe(3);
      expect(stats.entriesByAccount[1001]).toBe(2);
      expect(stats.entriesByAccount[4001]).toBe(2);
             expect(stats.entriesByCurrency.IDR).toBe(2);
       expect(stats.entriesByCurrency.USD).toBe(2);
    });
  });

  describe('Exchange Rate Handling', () => {
    it('should handle exchange rates correctly', () => {
      const transactionData: TransactionData = {
        description: 'Multi-currency Transaction',
        transactionDate: new Date(),
        currency: 'USD',
        entries: [
          { accountId: 1001, debitAmount: 100, currency: 'USD' },
          { accountId: 4001, creditAmount: 100, currency: 'USD' }
        ]
      };

      const entries = journalManager.createJournalEntriesFromTransaction(1, transactionData);

      expect(entries[0].exchangeRate).toBeGreaterThan(1); // USD to IDR
      expect(entries[0].baseDebitAmount).toBeGreaterThan(entries[0].debitAmount);
      expect(entries[1].baseCreditAmount).toBeGreaterThan(entries[1].creditAmount);
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent journal entry operations gracefully', () => {
      expect(journalManager.getJournalEntry(999)).toBeNull();
      expect(journalManager.reconcileJournalEntry(999, 'REC-001')).toBeNull();
      expect(journalManager.unreconcileJournalEntry(999)).toBeNull();
    });

    it('should reset manager state', () => {
      journalManager.reset();
      
      expect(journalManager.getAllJournalEntries()).toHaveLength(0);
      expect(journalManager.getStatistics().totalEntries).toBe(0);
    });
  });
});

// Enhanced Error Handling System Tests
describe('Enhanced Error Handling System', () => {
  describe('Specialized Error Classes', () => {
    it('should create BalanceSheetError', () => {
      const error = new BalanceSheetError('Balance sheet violation');
      expect(error.name).toBe('BalanceSheetError');
      expect(error.code).toBe('BALANCE_SHEET_VIOLATION');
      expect(error.message).toBe('Balance sheet violation');
    });

    it('should create AccountRegistryError', () => {
      const error = new AccountRegistryError('Account registry error');
      expect(error.name).toBe('AccountRegistryError');
      expect(error.code).toBe('ACCOUNT_REGISTRY_ERROR');
    });

    it('should create CurrencyConversionError', () => {
      const error = new CurrencyConversionError('Currency conversion failed');
      expect(error.name).toBe('CurrencyConversionError');
      expect(error.code).toBe('CURRENCY_CONVERSION_ERROR');
    });

    it('should create PeriodClosureError', () => {
      const error = new PeriodClosureError('Period is closed');
      expect(error.name).toBe('PeriodClosureError');
      expect(error.code).toBe('PERIOD_CLOSURE_VIOLATION');
    });

    it('should create FiscalYearError', () => {
      const error = new FiscalYearError('Fiscal year violation');
      expect(error.name).toBe('FiscalYearError');
      expect(error.code).toBe('FISCAL_YEAR_VIOLATION');
    });

    it('should create ComplianceError', () => {
      const error = new ComplianceError('Compliance violation');
      expect(error.name).toBe('ComplianceError');
      expect(error.code).toBe('COMPLIANCE_VIOLATION');
    });
  });

  describe('ErrorAggregator', () => {
    let aggregator: ErrorAggregator;

    beforeEach(() => {
      aggregator = new ErrorAggregator();
    });

    it('should add and categorize errors by severity', () => {
      const warning = AccountingErrorFactory.createValidationError(
        'test', 'Warning message', 'WARNING_CODE', 'WARNING'
      );
      const error = AccountingErrorFactory.createValidationError(
        'test', 'Error message', 'ERROR_CODE', 'ERROR'
      );
      const critical = AccountingErrorFactory.createValidationError(
        'test', 'Critical message', 'CRITICAL_CODE', 'CRITICAL'
      );

      aggregator.addError(warning);
      aggregator.addError(error);
      aggregator.addError(critical);

      expect(aggregator.hasWarnings()).toBe(true);
      expect(aggregator.hasErrors()).toBe(true);
      expect(aggregator.getWarnings()).toHaveLength(1);
      expect(aggregator.getErrors()).toHaveLength(2); // ERROR and CRITICAL
      expect(aggregator.getCriticalErrors()).toHaveLength(1);
    });

    it('should add multiple errors at once', () => {
      const errors = [
        AccountingErrorFactory.createValidationError('test1', 'Error 1', 'ERROR_1'),
        AccountingErrorFactory.createValidationError('test2', 'Error 2', 'ERROR_2')
      ];

      aggregator.addErrors(errors);
      expect(aggregator.getAllIssues()).toHaveLength(2);
    });

    it('should filter errors by category', () => {
      const validationError = AccountingErrorFactory.createValidationError(
        'test', 'Validation error', 'VALIDATION_ERROR', 'ERROR', 'VALIDATION'
      );
      const businessError = AccountingErrorFactory.createBusinessRuleError(
        'test', 'Business rule error', 'BUSINESS_ERROR'
      );

      aggregator.addError(validationError);
      aggregator.addError(businessError);

      const validationErrors = aggregator.getErrorsByCategory('VALIDATION');
      const businessErrors = aggregator.getErrorsByCategory('BUSINESS_RULE');

      expect(validationErrors).toHaveLength(1);
      expect(businessErrors).toHaveLength(1);
    });

    it('should generate comprehensive error report', () => {
      const errors = [
        AccountingErrorFactory.createValidationError('test1', 'Error 1', 'ERROR_1', 'WARNING'),
        AccountingErrorFactory.createValidationError('test2', 'Error 2', 'ERROR_2', 'ERROR'),
        AccountingErrorFactory.createValidationError('test3', 'Error 3', 'ERROR_3', 'CRITICAL'),
        AccountingErrorFactory.createBusinessRuleError('test4', 'Business Error', 'BUSINESS_ERROR')
      ];

      aggregator.addErrors(errors);
      const report = aggregator.generateReport();

      expect(report.summary.totalErrors).toBe(3); // ERROR, CRITICAL, and BUSINESS_RULE
      expect(report.summary.totalWarnings).toBe(1);
      expect(report.summary.criticalErrors).toBe(1);
      expect(report.summary.byCategory.VALIDATION).toBe(3);
      expect(report.summary.byCategory.BUSINESS_RULE).toBe(1);
      expect(report.summary.bySeverity.WARNING).toBe(1);
      expect(report.summary.bySeverity.ERROR).toBe(2);
      expect(report.summary.bySeverity.CRITICAL).toBe(1);
      expect(report.issues).toHaveLength(4);
    });

    it('should clear all errors', () => {
      aggregator.addError(AccountingErrorFactory.createValidationError(
        'test', 'Error', 'ERROR_CODE'
      ));
      
      expect(aggregator.hasErrors()).toBe(true);
      
      aggregator.clear();
      
      expect(aggregator.hasErrors()).toBe(false);
      expect(aggregator.hasWarnings()).toBe(false);
      expect(aggregator.getAllIssues()).toHaveLength(0);
    });
  });

  describe('AccountingErrorFactory', () => {
    it('should create validation error with default values', () => {
      const error = AccountingErrorFactory.createValidationError(
        'testField', 'Test message', 'TEST_CODE'
      );

      expect(error.field).toBe('testField');
      expect(error.message).toBe('Test message');
      expect(error.code).toBe('TEST_CODE');
      expect(error.severity).toBe('ERROR');
      expect(error.category).toBe('VALIDATION');
      expect(error.timestamp).toBeInstanceOf(Date);
    });

    it('should create validation error with custom values', () => {
      const suggestions = ['Fix this', 'Try that'];
      const context = { transactionId: 123 };
      
      const error = AccountingErrorFactory.createValidationError(
        'testField', 
        'Test message', 
        'TEST_CODE',
        'CRITICAL',
        'SYSTEM',
        suggestions,
        context
      );

      expect(error.severity).toBe('CRITICAL');
      expect(error.category).toBe('SYSTEM');
      expect(error.suggestions).toEqual(suggestions);
      expect(error.context).toEqual(context);
    });

    it('should create business rule error', () => {
      const suggestions = ['Check business rules'];
      const error = AccountingErrorFactory.createBusinessRuleError(
        'businessField', 'Business rule violated', 'BUSINESS_VIOLATION', suggestions
      );

      expect(error.category).toBe('BUSINESS_RULE');
      expect(error.severity).toBe('ERROR');
      expect(error.suggestions).toEqual(suggestions);
    });

    it('should create compliance error', () => {
      const error = AccountingErrorFactory.createComplianceError(
        'complianceField', 'Compliance violated', 'COMPLIANCE_VIOLATION'
      );

      expect(error.category).toBe('COMPLIANCE');
      expect(error.severity).toBe('CRITICAL');
    });

    it('should create system error', () => {
      const context = { systemId: 'SYS001' };
      const error = AccountingErrorFactory.createSystemError(
        'systemField', 'System error', 'SYSTEM_ERROR', context
      );

      expect(error.category).toBe('SYSTEM');
      expect(error.severity).toBe('CRITICAL');
      expect(error.context).toEqual(context);
    });
  });

  describe('ErrorRecoveryManager', () => {
    it('should provide suggestions for known error codes', () => {
      const suggestions = ErrorRecoveryManager.getSuggestions('UNBALANCED_TRANSACTION');
      
      expect(suggestions).toContain('Check if all journal entries have been recorded');
      expect(suggestions).toContain('Verify debit and credit amounts are correct');
      expect(suggestions).toContain('Ensure rounding differences are accounted for');
    });

    it('should provide default suggestions for unknown error codes', () => {
      const suggestions = ErrorRecoveryManager.getSuggestions('UNKNOWN_ERROR_CODE');
      
      expect(suggestions).toContain('Review the transaction details');
      expect(suggestions).toContain('Check accounting policies and procedures');
      expect(suggestions).toContain('Contact system administrator if issue persists');
    });

    it('should enhance basic validation error with suggestions and metadata', () => {
      const basicError: ValidationError = {
        field: 'entries',
        message: 'Transaction is unbalanced',
        code: 'UNBALANCED_TRANSACTION'
      };

      const enhancedError = ErrorRecoveryManager.enhanceError(basicError);

      expect(enhancedError.field).toBe(basicError.field);
      expect(enhancedError.message).toBe(basicError.message);
      expect(enhancedError.code).toBe(basicError.code);
      expect(enhancedError.severity).toBe('ERROR');
      expect(enhancedError.category).toBe('VALIDATION');
      expect(enhancedError.suggestions).toContain('Check if all journal entries have been recorded');
      expect(enhancedError.timestamp).toBeInstanceOf(Date);
    });

    it('should determine critical severity for balance sheet violations', () => {
      const error: ValidationError = {
        field: 'balance',
        message: 'Balance sheet violation',
        code: 'BALANCE_SHEET_VIOLATION'
      };

      const enhanced = ErrorRecoveryManager.enhanceError(error);
      expect(enhanced.severity).toBe('CRITICAL');
    });

    it('should determine warning severity for rounding differences', () => {
      const error: ValidationError = {
        field: 'amount',
        message: 'Rounding difference detected',
        code: 'ROUNDING_DIFFERENCE'
      };

      const enhanced = ErrorRecoveryManager.enhanceError(error);
      expect(enhanced.severity).toBe('WARNING');
    });

    it('should categorize compliance errors correctly', () => {
      const error: ValidationError = {
        field: 'compliance',
        message: 'Compliance violation',
        code: 'COMPLIANCE_VIOLATION'
      };

      const enhanced = ErrorRecoveryManager.enhanceError(error);
      expect(enhanced.category).toBe('COMPLIANCE');
    });

    it('should categorize system errors correctly', () => {
      const error: ValidationError = {
        field: 'system',
        message: 'System error',
        code: 'SYSTEM_ERROR'
      };

      const enhanced = ErrorRecoveryManager.enhanceError(error);
      expect(enhanced.category).toBe('SYSTEM');
    });

    it('should categorize business rule errors correctly', () => {
      const error: ValidationError = {
        field: 'business',
        message: 'Business rule violation',
        code: 'BUSINESS_RULE_VIOLATION'
      };

      const enhanced = ErrorRecoveryManager.enhanceError(error);
      expect(enhanced.category).toBe('BUSINESS_RULE');
    });
  });

  describe('Error Integration Tests', () => {
    it('should handle complex error scenarios with aggregation', () => {
      const aggregator = new ErrorAggregator();
      
      // Create various types of errors
      const errors = [
        new BalanceSheetError('Assets must have debit balances'),
        new CurrencyConversionError('Exchange rate not available'),
        new PeriodClosureError('Period is closed for transactions')
      ];

      // Convert to enhanced errors and add to aggregator
      for (const error of errors) {
        const basicError: ValidationError = {
          field: 'transaction',
          message: error.message,
          code: error.code
        };
        const enhanced = ErrorRecoveryManager.enhanceError(basicError);
        aggregator.addError(enhanced);
      }

      const report = aggregator.generateReport();
      
      expect(report.summary.totalErrors).toBe(3);
      expect(report.summary.criticalErrors).toBe(1); // Period closure is critical
      expect(report.issues.every(issue => issue.suggestions && issue.suggestions.length > 0)).toBe(true);
    });

    it('should provide contextual error handling for transaction validation', () => {
      const transactionData: TransactionData = {
        description: 'Test transaction',
        transactionDate: new Date(),
        currency: 'IDR',
        entries: [
          { accountId: 1001, debitAmount: 100 },
          { accountId: 1002, creditAmount: 50 } // Unbalanced
        ]
      };

      const errors = TransactionValidator.validateTransactionData(transactionData);
      const aggregator = new ErrorAggregator();

      for (const error of errors) {
        const enhanced = ErrorRecoveryManager.enhanceError(error);
        aggregator.addError(enhanced);
      }

      expect(aggregator.hasErrors()).toBe(true);
      const report = aggregator.generateReport();
      const unbalancedError = report.issues.find(issue => issue.code === 'UNBALANCED_TRANSACTION');
      
      expect(unbalancedError).toBeDefined();
      expect(unbalancedError?.suggestions).toContain('Check if all journal entries have been recorded');
    });
  });

  it('should generate report with detailed error information', () => {
    const aggregator = new ErrorAggregator();
    
    const error1 = AccountingErrorFactory.createValidationError(
      'amount',
      'Invalid amount',
      'INVALID_AMOUNT',
      'ERROR',
      'VALIDATION',
      ['Check amount format']
    );
    
    const error2 = AccountingErrorFactory.createBusinessRuleError(
      'account',
      'Account not found',
      'ACCOUNT_NOT_FOUND',
      ['Verify account exists']
    );

    aggregator.addError(error1);
    aggregator.addError(error2);

    const report = aggregator.generateReport();
    
    expect(report.summary.totalErrors).toBe(2);
    expect(report.summary.totalWarnings).toBe(0);
    expect(report.summary.byCategory.VALIDATION).toBe(1);
    expect(report.summary.byCategory.BUSINESS_RULE).toBe(1);
    expect(report.issues).toHaveLength(2);
  });
});

// D1 Database Integration Tests
describe('D1 Database Integration', () => {
  // Mock D1 Database
  const createMockD1Database = () => {
    const mockResults = new Map<string, unknown[]>();
    
    return {
      prepare: (query: string) => ({
        bind: (...values: unknown[]) => ({
          all: async () => ({
            results: mockResults.get(query) || []
          }),
          first: async () => {
            const results = mockResults.get(query) || [];
            return results[0] || null;
          },
          run: async () => ({
            success: true,
            meta: { changes: 1, last_row_id: 1 }
          })
        })
      }),
      setMockResults: (query: string, results: unknown[]) => {
        mockResults.set(query, results);
      }
    } as any;
  };

  describe('DatabaseAdapter', () => {
    let dbAdapter: any;
    let mockDb: any;

    beforeEach(() => {
      mockDb = createMockD1Database();
      dbAdapter = new DatabaseAdapter({
        database: mockDb,
        entityId: 'test-entity',
        defaultCurrency: 'IDR'
      });
    });

    it('should create account in database', async () => {
      const mockAccount = {
        id: 1,
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        normal_balance: 'DEBIT',
        is_active: 1,
        is_system: 0,
        allow_transactions: 1,
        level: 0,
        path: '1000',
        current_balance: 0,
        created_at: Date.now(),
        updated_at: Date.now()
      };

      // Set up mock to return the account data when the createAccount method calls first()
      const insertQuery = `
      INSERT INTO accounts (
        code, name, description, type, subtype, category,
        parent_id, level, path, is_active, is_system, allow_transactions,
        normal_balance, report_category, report_order, current_balance,
        entity_id, created_at, updated_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
      mockDb.setMockResults(insertQuery.trim(), [mockAccount]);

      const accountData = {
        code: '1000',
        name: 'Cash',
        type: 'ASSET' as const,
        normalBalance: 'DEBIT' as const,
        isActive: true,
        isSystem: false,
        allowTransactions: true
      };

      const result = await dbAdapter.createAccount(accountData);
      
      expect(result.code).toBe('1000');
      expect(result.name).toBe('Cash');
      expect(result.type).toBe('ASSET');
    });

    it('should get account from database', async () => {
      const mockAccount = {
        id: 1,
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        normal_balance: 'DEBIT',
        is_active: 1,
        is_system: 0,
        allow_transactions: 1,
        level: 0,
        path: '1000',
        current_balance: 0,
        created_at: Date.now(),
        updated_at: Date.now()
      };

      mockDb.setMockResults('SELECT * FROM accounts WHERE id = ? AND entity_id = ?', [mockAccount]);

      const result = await dbAdapter.getAccount(1);
      
      expect(result).not.toBeNull();
      expect(result?.code).toBe('1000');
      expect(result?.name).toBe('Cash');
    });

    it('should return null for non-existent account', async () => {
      mockDb.setMockResults('SELECT * FROM accounts WHERE id = ? AND entity_id = ?', []);

      const result = await dbAdapter.getAccount(999);
      
      expect(result).toBeNull();
    });

    it('should create transaction in database', async () => {
      const mockTransaction = {
        id: 1,
        transaction_number: '2025-000001',
        description: 'Test transaction',
        transaction_date: Date.now(),
        posting_date: Date.now(),
        type: 'JOURNAL',
        source: 'MANUAL',
        total_amount: 1000,
        status: 'DRAFT',
        entity_id: 'test-entity',
        created_at: Date.now(),
        updated_at: Date.now(),
        created_by: 'test-user'
      };

      mockDb.setMockResults('INSERT INTO transactions', [mockTransaction]);
      mockDb.setMockResults('SELECT COUNT(*) as count', [{ count: 0 }]);

      const transactionData = {
        description: 'Test transaction',
        date: new Date(),
        entries: [
          { accountId: 1, debitAmount: 1000, creditAmount: 0, currency: 'IDR' as const },
          { accountId: 2, debitAmount: 0, creditAmount: 1000, currency: 'IDR' as const }
        ],
        createdBy: 'test-user'
      };

      const result = await dbAdapter.createTransaction(transactionData);
      
      expect(result.description).toBe('Test transaction');
      expect(result.status).toBe('DRAFT');
    });

    it('should create journal entries in database', async () => {
      const mockEntry = {
        id: 1,
        transaction_id: 1,
        line_number: 1,
        account_id: 1000,
        debit_amount: 1000,
        credit_amount: 0,
        currency_code: 'IDR',
        exchange_rate: 1.0,
        is_reconciled: 0,
        created_at: Date.now(),
        updated_at: Date.now()
      };

      mockDb.setMockResults('INSERT INTO journal_entries', [mockEntry]);

      const journalEntries = [{
        id: 1,
        transactionId: 1,
        lineNumber: 1,
        accountId: 1000,
        debitAmount: 1000,
        creditAmount: 0,
        currency: 'IDR' as const,
        exchangeRate: 1.0,
        isReconciled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }];

      const result = await dbAdapter.createJournalEntries(journalEntries);
      
      expect(result).toHaveLength(1);
      expect(result[0].accountId).toBe(1000);
      expect(result[0].debitAmount).toBe(1000);
    });
  });

  describe('DatabaseAccountRegistry', () => {
    let registry: any;
    let mockDbAdapter: any;

    beforeEach(() => {
      mockDbAdapter = {
        getAllAccounts: vi.fn(),
        createAccount: vi.fn(),
        getAccount: vi.fn(),
        getAccountsByType: vi.fn()
      };

                    registry = new DatabaseAccountRegistry(mockDbAdapter);
    });

    it('should load accounts from database', async () => {
      const mockAccounts = [
        {
          id: '1',
          code: '1000',
          name: 'Cash',
          type: 'ASSET',
          normalBalance: 'DEBIT',
          isActive: true,
          isSystem: false,
          allowTransactions: true,
          level: 0,
          path: '1000',
          currentBalance: 0,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockDbAdapter.getAllAccounts.mockResolvedValue(mockAccounts);

      await registry.loadAccountsFromDatabase();

      expect(mockDbAdapter.getAllAccounts).toHaveBeenCalled();
      expect(registry.hasAccount('1')).toBe(true);
    });

    it('should register account in database', async () => {
      const account = {
        code: '2000',
        name: 'Accounts Payable',
        type: 'LIABILITY' as const,
        normalBalance: 'CREDIT' as const,
        isActive: true,
        isSystem: false,
        allowTransactions: true
      };

      const createdAccount = {
        ...account,
        id: '2',
        level: 0,
        path: '2000',
        currentBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDbAdapter.createAccount.mockResolvedValue(createdAccount);

      const result = await registry.registerAccount(account);

      expect(mockDbAdapter.createAccount).toHaveBeenCalledWith(account);
      expect(result.id).toBe('2');
      expect(registry.hasAccount('2')).toBe(true);
    });
  });

  describe('DatabaseJournalEntryManager', () => {
    let manager: any;
    let mockDbAdapter: any;
    let mockAccountRegistry: any;

    beforeEach(() => {
      mockDbAdapter = {
        createTransaction: vi.fn(),
        createJournalEntries: vi.fn(),
        updateTransactionStatus: vi.fn(),
        getJournalEntriesByTransaction: vi.fn(),
        getAccount: vi.fn()
      };

      mockAccountRegistry = {
        getAccount: vi.fn()
      };

      manager = new DatabaseJournalEntryManager(mockDbAdapter, mockAccountRegistry);
    });

    it('should create and persist transaction with journal entries', async () => {
      const mockTransaction = {
        id: 1,
        transactionNumber: '2025-000001',
        description: 'Test transaction',
        date: new Date(),
        status: 'DRAFT' as const,
        createdBy: 'test-user'
      };

      const mockJournalEntries = [
        {
          id: 1,
          transactionId: 1,
          lineNumber: 1,
          accountId: 1000,
          debitAmount: 1000,
          creditAmount: 0,
          currency: 'IDR' as const,
          isReconciled: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockDbAdapter.createTransaction.mockResolvedValue(mockTransaction);
      mockDbAdapter.createJournalEntries.mockResolvedValue(mockJournalEntries);

      const transactionData = {
        description: 'Test transaction',
        date: new Date(),
        entries: [
          { accountId: 1000, debitAmount: 1000, creditAmount: 0, currency: 'IDR' as const },
          { accountId: 2000, debitAmount: 0, creditAmount: 1000, currency: 'IDR' as const }
        ],
        createdBy: 'test-user'
      };

      const result = await manager.createAndPersistTransaction(transactionData);

      expect(mockDbAdapter.createTransaction).toHaveBeenCalledWith(transactionData);
      expect(mockDbAdapter.createJournalEntries).toHaveBeenCalled();
      expect(result.transaction.id).toBe(1);
      expect(result.journalEntries).toHaveLength(1);
    });

    it('should post transaction and update status', async () => {
      const mockJournalEntries = [
        {
          id: 1,
          transactionId: 1,
          accountId: 1000,
          debitAmount: 1000,
          creditAmount: 0,
          currency: 'IDR' as const
        }
      ];

      const mockAccount = {
        id: '1000',
        normalBalance: 'DEBIT' as const,
        currentBalance: 5000
      };

      mockDbAdapter.getJournalEntriesByTransaction.mockResolvedValue(mockJournalEntries);
      mockDbAdapter.getAccount.mockResolvedValue(mockAccount);

      await manager.postTransaction(1, 'test-user');

      expect(mockDbAdapter.updateTransactionStatus).toHaveBeenCalledWith(1, 'POSTED', 'test-user');
      expect(mockDbAdapter.getJournalEntriesByTransaction).toHaveBeenCalledWith(1);
    });

    it('should get transaction journal entries', async () => {
      const mockEntries = [
        {
          id: 1,
          transactionId: 1,
          accountId: 1000,
          debitAmount: 1000,
          creditAmount: 0
        }
      ];

      mockDbAdapter.getJournalEntriesByTransaction.mockResolvedValue(mockEntries);

      const result = await manager.getTransactionJournalEntries(1);

      expect(mockDbAdapter.getJournalEntriesByTransaction).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockEntries);
    });

    it('should throw validation error for invalid transaction data', async () => {
      const invalidTransactionData = {
        description: '',
        date: new Date(),
        entries: [], // Empty entries should cause validation error
        createdBy: 'test-user'
      };

      await expect(manager.createAndPersistTransaction(invalidTransactionData))
        .rejects
        .toThrow('Transaction validation failed');
    });
  });
}); 