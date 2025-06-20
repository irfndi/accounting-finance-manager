import { describe, it, expect } from 'vitest';
import type {
  Money,
  AccountType,
  NormalBalance,
  TransactionStatus,
  Account,
  Transaction,
  JournalEntry,
  TransactionEntry,
  ValidationError,
  AccountingError,
  TrialBalance,
  BalanceSheet,
  IncomeStatement,
  Currency
} from '../src/index';

describe('Finance Manager Types', () => {
  describe('Basic Types', () => {
    it('should validate AccountType enum values', () => {
      const validAccountTypes: AccountType[] = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
      
      validAccountTypes.forEach(type => {
        expect(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']).toContain(type);
      });
    });

    it('should validate NormalBalance enum values', () => {
      const validNormalBalances: NormalBalance[] = ['DEBIT', 'CREDIT'];
      
      validNormalBalances.forEach(balance => {
        expect(['DEBIT', 'CREDIT']).toContain(balance);
      });
    });

    it('should validate TransactionStatus enum values', () => {
      const validStatuses: TransactionStatus[] = [
        'DRAFT', 'PENDING', 'APPROVED', 'POSTED', 'CANCELLED', 'REVERSED'
      ];
      
      validStatuses.forEach(status => {
        expect(['DRAFT', 'PENDING', 'APPROVED', 'POSTED', 'CANCELLED', 'REVERSED']).toContain(status);
      });
    });
  });

  describe('Money Interface', () => {
    it('should create valid Money objects', () => {
      const money: Money = {
        amount: 100.50,
        currency: 'USD' as Currency
      };

      expect(money.amount).toBe(100.50);
      expect(money.currency).toBe('USD');
      expect(typeof money.amount).toBe('number');
      expect(typeof money.currency).toBe('string');
    });

    it('should handle different currencies', () => {
      const currencies = ['USD', 'EUR', 'GBP', 'JPY'] as Currency[];
      
      currencies.forEach(currency => {
        const money: Money = {
          amount: 1000,
          currency
        };
        
        expect(money.currency).toBe(currency);
      });
    });
  });

  describe('Account Interface', () => {
    it('should create valid Account objects', () => {
      const account: Account = {
        id: 1,
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        level: 1,
        path: '/1000',
        isActive: true,
        isSystem: false,
        allowTransactions: true,
        normalBalance: 'DEBIT',
        reportOrder: 1,
        currentBalance: 5000.00,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(account.id).toBe(1);
      expect(account.code).toBe('1000');
      expect(account.name).toBe('Cash');
      expect(account.type).toBe('ASSET');
      expect(account.normalBalance).toBe('DEBIT');
      expect(typeof account.isActive).toBe('boolean');
      expect(typeof account.currentBalance).toBe('number');
      expect(account.createdAt).toBeInstanceOf(Date);
    });

    it('should handle optional fields', () => {
      const minimalAccount: Account = {
        id: 2,
        code: '2000',
        name: 'Accounts Payable',
        type: 'LIABILITY',
        level: 1,
        path: '/2000',
        isActive: true,
        isSystem: false,
        allowTransactions: true,
        normalBalance: 'CREDIT',
        reportOrder: 1,
        currentBalance: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(minimalAccount.description).toBeUndefined();
      expect(minimalAccount.parentId).toBeUndefined();
      expect(minimalAccount.entityId).toBeUndefined();
    });
  });

  describe('Transaction Interface', () => {
    it('should create valid Transaction objects', () => {
      const transaction: Transaction = {
        id: 'txn-001',
        date: '2024-01-15',
        description: 'Office supplies purchase',
        status: 'POSTED',
        entries: [
          {
            accountId: 1,
            debitAmount: 100,
            creditAmount: 0
          },
          {
            accountId: 2,
            debitAmount: 0,
            creditAmount: 100
          }
        ],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      };

      expect(transaction.id).toBe('txn-001');
      expect(transaction.status).toBe('POSTED');
      expect(Array.isArray(transaction.entries)).toBe(true);
      expect(transaction.entries).toHaveLength(2);
    });

    it('should validate balanced entries', () => {
      const transaction: Transaction = {
        id: 'txn-002',
        date: '2024-01-15',
        description: 'Test transaction',
        status: 'DRAFT',
        entries: [
          { accountId: 1, debitAmount: 500, creditAmount: 0 },
          { accountId: 2, debitAmount: 0, creditAmount: 500 }
        ],
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      };

      const totalDebits = transaction.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
      const totalCredits = transaction.entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);

      expect(totalDebits).toBe(totalCredits);
    });
  });

  describe('JournalEntry Interface', () => {
    it('should create valid JournalEntry objects', () => {
      const journalEntry: JournalEntry = {
        id: 1,
        transactionId: 1,
        accountId: 1000,
        debitAmount: 250.00,
        creditAmount: 0,
        currency: 'USD' as Currency,
        isReconciled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(journalEntry.id).toBe(1);
      expect(journalEntry.debitAmount).toBe(250.00);
      expect(journalEntry.creditAmount).toBe(0);
      expect(journalEntry.currency).toBe('USD');
      expect(journalEntry.isReconciled).toBe(false);
    });

    it('should handle multi-currency entries', () => {
      const journalEntry: JournalEntry = {
        id: 2,
        transactionId: 2,
        accountId: 1001,
        debitAmount: 100.00,
        creditAmount: 0,
        currency: 'EUR' as Currency,
        exchangeRate: 1.1,
        baseCurrency: 'USD' as Currency,
        baseDebitAmount: 110.00,
        baseCreditAmount: 0,
        isReconciled: false,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      expect(journalEntry.currency).toBe('EUR');
      expect(journalEntry.baseCurrency).toBe('USD');
      expect(journalEntry.exchangeRate).toBe(1.1);
      expect(journalEntry.baseDebitAmount).toBe(110.00);
    });
  });

  describe('Validation and Error Types', () => {
    it('should create ValidationError objects', () => {
      const validationError: ValidationError = {
        field: 'amount',
        message: 'Amount must be greater than zero',
        code: 'INVALID_AMOUNT'
      };

      expect(validationError.field).toBe('amount');
      expect(validationError.message).toBe('Amount must be greater than zero');
      expect(validationError.code).toBe('INVALID_AMOUNT');
    });

    it('should create AccountingError objects', () => {
      const accountingError: AccountingError = {
        name: 'AccountingError',
        message: 'Transaction is not balanced',
        code: 'UNBALANCED_TRANSACTION',
        details: [
          {
            field: 'entries',
            message: 'Total debits must equal total credits',
            code: 'BALANCE_MISMATCH'
          }
        ]
      };

      expect(accountingError.code).toBe('UNBALANCED_TRANSACTION');
      expect(accountingError.details).toHaveLength(1);
      expect(accountingError.details?.[0].field).toBe('entries');
    });
  });

  describe('Reporting Types', () => {
    it('should create TrialBalance objects', () => {
      const trialBalance: TrialBalance = {
        accounts: [
          {
            accountId: '1000',
            balance: 5000,
            currency: 'USD' as Currency,
            lastUpdated: new Date(),
            normalBalance: 'DEBIT'
          },
          {
            accountId: '2000',
            balance: 3000,
            currency: 'USD' as Currency,
            lastUpdated: new Date(),
            normalBalance: 'CREDIT'
          }
        ],
        totalDebits: 5000,
        totalCredits: 3000,
        isBalanced: false,
        asOfDate: new Date(),
        currency: 'USD' as Currency
      };

      expect(trialBalance.accounts).toHaveLength(2);
      expect(trialBalance.totalDebits).toBe(5000);
      expect(trialBalance.totalCredits).toBe(3000);
      expect(trialBalance.isBalanced).toBe(false);
    });

    it('should create BalanceSheet objects', () => {
      const balanceSheet: BalanceSheet = {
        assets: [
          {
            accountId: '1000',
            balance: 10000,
            currency: 'USD' as Currency,
            lastUpdated: new Date(),
            normalBalance: 'DEBIT'
          }
        ],
        liabilities: [
          {
            accountId: '2000',
            balance: 5000,
            currency: 'USD' as Currency,
            lastUpdated: new Date(),
            normalBalance: 'CREDIT'
          }
        ],
        equity: [
          {
            accountId: '3000',
            balance: 5000,
            currency: 'USD' as Currency,
            lastUpdated: new Date(),
            normalBalance: 'CREDIT'
          }
        ],
        totalAssets: 10000,
        totalLiabilities: 5000,
        totalEquity: 5000,
        isBalanced: true,
        asOfDate: new Date(),
        currency: 'USD' as Currency
      };

      expect(balanceSheet.totalAssets).toBe(balanceSheet.totalLiabilities + balanceSheet.totalEquity);
      expect(balanceSheet.isBalanced).toBe(true);
    });

    it('should create IncomeStatement objects', () => {
      const incomeStatement: IncomeStatement = {
        revenues: [
          {
            accountId: '4000',
            balance: 15000,
            currency: 'USD' as Currency,
            lastUpdated: new Date(),
            normalBalance: 'CREDIT'
          }
        ],
        expenses: [
          {
            accountId: '5000',
            balance: 8000,
            currency: 'USD' as Currency,
            lastUpdated: new Date(),
            normalBalance: 'DEBIT'
          }
        ],
        totalRevenues: 15000,
        totalExpenses: 8000,
        netIncome: 7000,
        fromDate: new Date('2024-01-01'),
        toDate: new Date('2024-12-31'),
        currency: 'USD' as Currency
      };

      expect(incomeStatement.netIncome).toBe(incomeStatement.totalRevenues - incomeStatement.totalExpenses);
      expect(incomeStatement.totalRevenues).toBe(15000);
      expect(incomeStatement.totalExpenses).toBe(8000);
    });
  });

  describe('Type Guards and Validation', () => {
    it('should validate account type consistency', () => {
      const assetAccount: Account = {
        id: 1,
        code: '1000',
        name: 'Cash',
        type: 'ASSET',
        level: 1,
        path: '/1000',
        isActive: true,
        isSystem: false,
        allowTransactions: true,
        normalBalance: 'DEBIT', // Assets should have DEBIT normal balance
        reportOrder: 1,
        currentBalance: 5000,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Validate that asset accounts have debit normal balance
      if (assetAccount.type === 'ASSET') {
        expect(assetAccount.normalBalance).toBe('DEBIT');
      }
    });

    it('should validate transaction entry balance', () => {
      const entries: TransactionEntry[] = [
        { accountId: 1, debitAmount: 100, creditAmount: 0 },
        { accountId: 2, debitAmount: 0, creditAmount: 100 }
      ];

      const totalDebits = entries.reduce((sum, entry) => sum + (entry.debitAmount || 0), 0);
      const totalCredits = entries.reduce((sum, entry) => sum + (entry.creditAmount || 0), 0);

      expect(totalDebits).toBe(totalCredits);
    });

    it('should validate currency consistency', () => {
      const money1: Money = { amount: 100, currency: 'USD' as Currency };
      const money2: Money = { amount: 200, currency: 'USD' as Currency };

      // When working with same currency, operations should be straightforward
      expect(money1.currency).toBe(money2.currency);
      
      const total = money1.amount + money2.amount;
      expect(total).toBe(300);
    });
  });
});