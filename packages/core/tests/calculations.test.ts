import { describe, it, expect } from 'vitest';
import type { Money, Account, Transaction, TrialBalance, BalanceSheet, IncomeStatement } from '@finance-manager/types';

describe('Financial Calculations', () => {
  describe('Money Operations', () => {
    it('should add money amounts correctly', () => {
      const addMoney = (a: Money, b: Money): Money => {
        if (a.currency !== b.currency) {
          throw new Error('Cannot add different currencies');
        }
        return {
          amount: a.amount + b.amount,
          currency: a.currency
        };
      };

      const amount1: Money = { amount: 100.50, currency: 'USD' };
      const amount2: Money = { amount: 250.75, currency: 'USD' };
      
      const result = addMoney(amount1, amount2);
      
      expect(result.amount).toBe(351.25);
      expect(result.currency).toBe('USD');
    });

    it('should subtract money amounts correctly', () => {
      const subtractMoney = (a: Money, b: Money): Money => {
        if (a.currency !== b.currency) {
          throw new Error('Cannot subtract different currencies');
        }
        return {
          amount: a.amount - b.amount,
          currency: a.currency
        };
      };

      const amount1: Money = { amount: 500.00, currency: 'USD' };
      const amount2: Money = { amount: 150.25, currency: 'USD' };
      
      const result = subtractMoney(amount1, amount2);
      
      expect(result.amount).toBe(349.75);
      expect(result.currency).toBe('USD');
    });

    it('should multiply money by a factor', () => {
      const multiplyMoney = (money: Money, factor: number): Money => {
        return {
          amount: Math.round(money.amount * factor * 100) / 100, // Round to 2 decimal places
          currency: money.currency
        };
      };

      const amount: Money = { amount: 100.00, currency: 'USD' };
      const result = multiplyMoney(amount, 1.08); // 8% tax
      
      expect(result.amount).toBe(108.00);
      expect(result.currency).toBe('USD');
    });

    it('should handle currency conversion', () => {
      const convertCurrency = (money: Money, targetCurrency: string, exchangeRate: number): Money => {
        return {
          amount: Math.round(money.amount * exchangeRate * 100) / 100,
          currency: targetCurrency
        };
      };

      const usdAmount: Money = { amount: 100.00, currency: 'USD' };
      const eurAmount = convertCurrency(usdAmount, 'EUR', 0.85);
      
      expect(eurAmount.amount).toBe(85.00);
      expect(eurAmount.currency).toBe('EUR');
    });

    it('should throw error for different currency operations', () => {
      const addMoney = (a: Money, b: Money): Money => {
        if (a.currency !== b.currency) {
          throw new Error('Cannot add different currencies');
        }
        return {
          amount: a.amount + b.amount,
          currency: a.currency
        };
      };

      const usdAmount: Money = { amount: 100.00, currency: 'USD' };
      const eurAmount: Money = { amount: 85.00, currency: 'EUR' };
      
      expect(() => addMoney(usdAmount, eurAmount)).toThrow('Cannot add different currencies');
    });
  });

  describe('Account Balance Calculations', () => {
    const sampleAccounts: Account[] = [
      {
        id: '1',
        name: 'Cash',
        type: 'asset',
        normalBalance: 'debit',
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        name: 'Accounts Receivable',
        type: 'asset',
        normalBalance: 'debit',
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '3',
        name: 'Accounts Payable',
        type: 'liability',
        normalBalance: 'credit',
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '4',
        name: 'Revenue',
        type: 'revenue',
        normalBalance: 'credit',
        parentId: null,
        isActive: true,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      }
    ];

    const sampleTransactions: Transaction[] = [
      {
        id: '1',
        description: 'Initial cash deposit',
        date: new Date('2024-01-01'),
        status: 'posted',
        entries: [
          {
            accountId: '1',
            debit: { amount: 10000, currency: 'USD' },
            credit: null,
            description: 'Cash deposit'
          },
          {
            accountId: '4',
            debit: null,
            credit: { amount: 10000, currency: 'USD' },
            description: 'Initial capital'
          }
        ],
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        description: 'Office supplies purchase',
        date: new Date('2024-01-02'),
        status: 'posted',
        entries: [
          {
            accountId: '2',
            debit: { amount: 500, currency: 'USD' },
            credit: null,
            description: 'Office supplies expense'
          },
          {
            accountId: '1',
            debit: null,
            credit: { amount: 500, currency: 'USD' },
            description: 'Cash payment'
          }
        ],
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      }
    ];

    it('should calculate account balances correctly', () => {
      const calculateAccountBalance = (accountId: string, transactions: Transaction[]): Money => {
        let balance = 0;
        
        for (const transaction of transactions) {
          if (transaction.status !== 'posted') continue;
          
          for (const entry of transaction.entries) {
            if (entry.accountId === accountId) {
              if (entry.debit) {
                balance += entry.debit.amount;
              }
              if (entry.credit) {
                balance -= entry.credit.amount;
              }
            }
          }
        }
        
        return { amount: balance, currency: 'USD' };
      };

      const cashBalance = calculateAccountBalance('1', sampleTransactions);
      const revenueBalance = calculateAccountBalance('4', sampleTransactions);
      
      expect(cashBalance.amount).toBe(9500); // 10000 - 500
      expect(revenueBalance.amount).toBe(-10000); // Credit balance
    });

    it('should calculate trial balance', () => {
      const calculateTrialBalance = (accounts: Account[], transactions: Transaction[]): TrialBalance => {
        let totalDebits = 0;
        let totalCredits = 0;
        
        const balances = accounts.map(account => {
          let accountDebitTotal = 0;
          let accountCreditTotal = 0;
          
          for (const transaction of transactions) {
            if (transaction.status !== 'posted') continue;
            
            for (const entry of transaction.entries) {
              if (entry.accountId === account.id) {
                if (entry.debit) {
                  accountDebitTotal += entry.debit.amount;
                  totalDebits += entry.debit.amount;
                }
                if (entry.credit) {
                  accountCreditTotal += entry.credit.amount;
                  totalCredits += entry.credit.amount;
                }
              }
            }
          }
          
          return {
            accountId: account.id,
            accountName: account.name,
            debit: accountDebitTotal > accountCreditTotal ? { amount: accountDebitTotal - accountCreditTotal, currency: 'USD' } : null,
            credit: accountCreditTotal > accountDebitTotal ? { amount: accountCreditTotal - accountDebitTotal, currency: 'USD' } : null
          };
        });
        
        return {
          date: new Date(),
          balances,
          totalDebits: { amount: totalDebits, currency: 'USD' },
          totalCredits: { amount: totalCredits, currency: 'USD' },
          isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
        };
      };

      const trialBalance = calculateTrialBalance(sampleAccounts, sampleTransactions);
      
      expect(trialBalance.isBalanced).toBe(true);
      expect(trialBalance.totalDebits.amount).toBe(trialBalance.totalCredits.amount);
    });
  });

  describe('Financial Statement Generation', () => {
    it('should generate balance sheet', () => {
      const generateBalanceSheet = (accounts: Account[], transactions: Transaction[], date: Date): BalanceSheet => {
        const calculateBalance = (accountId: string): number => {
          let balance = 0;
          for (const transaction of transactions) {
            if (transaction.status !== 'posted' || transaction.date > date) continue;
            for (const entry of transaction.entries) {
              if (entry.accountId === accountId) {
                if (entry.debit) balance += entry.debit.amount;
                if (entry.credit) balance -= entry.credit.amount;
              }
            }
          }
          return balance;
        };

        const assets = accounts
          .filter(acc => acc.type === 'asset')
          .map(acc => ({
            accountId: acc.id,
            accountName: acc.name,
            amount: { amount: Math.abs(calculateBalance(acc.id)), currency: 'USD' as const }
          }));

        const liabilities = accounts
          .filter(acc => acc.type === 'liability')
          .map(acc => ({
            accountId: acc.id,
            accountName: acc.name,
            amount: { amount: Math.abs(calculateBalance(acc.id)), currency: 'USD' as const }
          }));

        const equity = accounts
          .filter(acc => acc.type === 'equity')
          .map(acc => ({
            accountId: acc.id,
            accountName: acc.name,
            amount: { amount: Math.abs(calculateBalance(acc.id)), currency: 'USD' as const }
          }));

        const totalAssets = assets.reduce((sum, asset) => sum + asset.amount.amount, 0);
        const totalLiabilities = liabilities.reduce((sum, liability) => sum + liability.amount.amount, 0);
        const totalEquity = equity.reduce((sum, eq) => sum + eq.amount.amount, 0);

        return {
          date,
          assets,
          liabilities,
          equity,
          totalAssets: { amount: totalAssets, currency: 'USD' },
          totalLiabilities: { amount: totalLiabilities, currency: 'USD' },
          totalEquity: { amount: totalEquity, currency: 'USD' },
          isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
        };
      };

      const sampleAccounts: Account[] = [
        {
          id: '1',
          name: 'Cash',
          type: 'asset',
          normalBalance: 'debit',
          parentId: null,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: '2',
          name: 'Accounts Payable',
          type: 'liability',
          normalBalance: 'credit',
          parentId: null,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];

      const sampleTransactions: Transaction[] = [
        {
          id: '1',
          description: 'Initial setup',
          date: new Date('2024-01-01'),
          status: 'posted',
          entries: [
            {
              accountId: '1',
              debit: { amount: 1000, currency: 'USD' },
              credit: null,
              description: 'Cash'
            },
            {
              accountId: '2',
              debit: null,
              credit: { amount: 1000, currency: 'USD' },
              description: 'Liability'
            }
          ],
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];

      const balanceSheet = generateBalanceSheet(sampleAccounts, sampleTransactions, new Date('2024-01-31'));
      
      expect(balanceSheet.totalAssets.amount).toBe(1000);
      expect(balanceSheet.totalLiabilities.amount).toBe(1000);
      expect(balanceSheet.isBalanced).toBe(true);
    });

    it('should generate income statement', () => {
      const generateIncomeStatement = (
        accounts: Account[], 
        transactions: Transaction[], 
        startDate: Date, 
        endDate: Date
      ): IncomeStatement => {
        const calculateBalance = (accountId: string): number => {
          let balance = 0;
          for (const transaction of transactions) {
            if (transaction.status !== 'posted' || 
                transaction.date < startDate || 
                transaction.date > endDate) continue;
            for (const entry of transaction.entries) {
              if (entry.accountId === accountId) {
                if (entry.debit) balance += entry.debit.amount;
                if (entry.credit) balance -= entry.credit.amount;
              }
            }
          }
          return balance;
        };

        const revenues = accounts
          .filter(acc => acc.type === 'revenue')
          .map(acc => ({
            accountId: acc.id,
            accountName: acc.name,
            amount: { amount: Math.abs(calculateBalance(acc.id)), currency: 'USD' as const }
          }));

        const expenses = accounts
          .filter(acc => acc.type === 'expense')
          .map(acc => ({
            accountId: acc.id,
            accountName: acc.name,
            amount: { amount: Math.abs(calculateBalance(acc.id)), currency: 'USD' as const }
          }));

        const totalRevenue = revenues.reduce((sum, rev) => sum + rev.amount.amount, 0);
        const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount.amount, 0);
        const netIncome = totalRevenue - totalExpenses;

        return {
          startDate,
          endDate,
          revenues,
          expenses,
          totalRevenue: { amount: totalRevenue, currency: 'USD' },
          totalExpenses: { amount: totalExpenses, currency: 'USD' },
          netIncome: { amount: netIncome, currency: 'USD' }
        };
      };

      const accounts: Account[] = [
        {
          id: '1',
          name: 'Service Revenue',
          type: 'revenue',
          normalBalance: 'credit',
          parentId: null,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        },
        {
          id: '2',
          name: 'Office Expenses',
          type: 'expense',
          normalBalance: 'debit',
          parentId: null,
          isActive: true,
          createdAt: new Date('2024-01-01'),
          updatedAt: new Date('2024-01-01')
        }
      ];

      const transactions: Transaction[] = [
        {
          id: '1',
          description: 'Service provided',
          date: new Date('2024-01-15'),
          status: 'posted',
          entries: [
            {
              accountId: '1',
              debit: null,
              credit: { amount: 5000, currency: 'USD' },
              description: 'Revenue'
            }
          ],
          createdAt: new Date('2024-01-15'),
          updatedAt: new Date('2024-01-15')
        },
        {
          id: '2',
          description: 'Office rent',
          date: new Date('2024-01-20'),
          status: 'posted',
          entries: [
            {
              accountId: '2',
              debit: { amount: 1000, currency: 'USD' },
              credit: null,
              description: 'Rent expense'
            }
          ],
          createdAt: new Date('2024-01-20'),
          updatedAt: new Date('2024-01-20')
        }
      ];

      const incomeStatement = generateIncomeStatement(
        accounts,
        transactions,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      expect(incomeStatement.totalRevenue.amount).toBe(5000);
      expect(incomeStatement.totalExpenses.amount).toBe(1000);
      expect(incomeStatement.netIncome.amount).toBe(4000);
    });
  });

  describe('Tax Calculations', () => {
    it('should calculate sales tax', () => {
      const calculateSalesTax = (amount: Money, taxRate: number): Money => {
        return {
          amount: Math.round(amount.amount * taxRate * 100) / 100,
          currency: amount.currency
        };
      };

      const subtotal: Money = { amount: 100.00, currency: 'USD' };
      const tax = calculateSalesTax(subtotal, 0.08); // 8% tax rate
      
      expect(tax.amount).toBe(8.00);
      expect(tax.currency).toBe('USD');
    });

    it('should calculate total with tax', () => {
      const calculateTotalWithTax = (subtotal: Money, taxRate: number): Money => {
        const tax = Math.round(subtotal.amount * taxRate * 100) / 100;
        return {
          amount: subtotal.amount + tax,
          currency: subtotal.currency
        };
      };

      const subtotal: Money = { amount: 100.00, currency: 'USD' };
      const total = calculateTotalWithTax(subtotal, 0.08);
      
      expect(total.amount).toBe(108.00);
      expect(total.currency).toBe('USD');
    });

    it('should handle multiple tax rates', () => {
      const calculateMultipleTaxes = (amount: Money, taxRates: { name: string; rate: number }[]) => {
        return taxRates.map(tax => ({
          name: tax.name,
          amount: {
            amount: Math.round(amount.amount * tax.rate * 100) / 100,
            currency: amount.currency
          }
        }));
      };

      const subtotal: Money = { amount: 100.00, currency: 'USD' };
      const taxes = calculateMultipleTaxes(subtotal, [
        { name: 'State Tax', rate: 0.06 },
        { name: 'City Tax', rate: 0.02 }
      ]);
      
      expect(taxes).toHaveLength(2);
      expect(taxes[0].amount.amount).toBe(6.00);
      expect(taxes[1].amount.amount).toBe(2.00);
    });
  });

  describe('Depreciation Calculations', () => {
    it('should calculate straight-line depreciation', () => {
      const calculateStraightLineDepreciation = (
        cost: Money,
        salvageValue: Money,
        usefulLife: number
      ): Money => {
        const depreciableAmount = cost.amount - salvageValue.amount;
        const annualDepreciation = depreciableAmount / usefulLife;
        
        return {
          amount: Math.round(annualDepreciation * 100) / 100,
          currency: cost.currency
        };
      };

      const assetCost: Money = { amount: 10000, currency: 'USD' };
      const salvageValue: Money = { amount: 1000, currency: 'USD' };
      const usefulLife = 5; // years
      
      const annualDepreciation = calculateStraightLineDepreciation(assetCost, salvageValue, usefulLife);
      
      expect(annualDepreciation.amount).toBe(1800); // (10000 - 1000) / 5
      expect(annualDepreciation.currency).toBe('USD');
    });

    it('should calculate declining balance depreciation', () => {
      const calculateDecliningBalanceDepreciation = (
        bookValue: Money,
        depreciationRate: number
      ): Money => {
        const depreciation = bookValue.amount * depreciationRate;
        
        return {
          amount: Math.round(depreciation * 100) / 100,
          currency: bookValue.currency
        };
      };

      const bookValue: Money = { amount: 10000, currency: 'USD' };
      const depreciationRate = 0.20; // 20% declining balance
      
      const depreciation = calculateDecliningBalanceDepreciation(bookValue, depreciationRate);
      
      expect(depreciation.amount).toBe(2000); // 10000 * 0.20
      expect(depreciation.currency).toBe('USD');
    });
  });
});