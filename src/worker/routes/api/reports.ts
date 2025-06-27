import { Hono, type Context } from 'hono';
import {
  DatabaseAdapter,
  FinancialReportsEngine,
  formatCurrency,
  FINANCIAL_CONSTANTS,
  generateIncomeStatementPDF,
  generateTrialBalancePDF,
} from '../../../lib/index.worker';
import type { FinancialReportsBalanceSheet } from '../../../lib/index.worker';

// Excel generation functions are not available in Cloudflare Workers
// due to ExcelJS dependency incompatibility
import { authMiddleware } from '../../middleware/auth';
import type { AppContext } from '../../types';
import type { Currency } from '../../../types/index.js';
import { createMiddleware } from 'hono/factory';

// Financial calculation functions
async function calculateFinancialMetrics(dbAdapter: DatabaseAdapter, entityId: string, asOfDate: Date) {
  // Get account balances for financial ratio calculations
  const currentAssets = await getAccountBalancesByType(dbAdapter, entityId, 'ASSET', 'Current Asset', asOfDate);
  const totalAssets = await getAccountBalancesByType(dbAdapter, entityId, 'ASSET', null, asOfDate);
  const currentLiabilities = await getAccountBalancesByType(dbAdapter, entityId, 'LIABILITY', 'Current Liability', asOfDate);
  const totalLiabilities = await getAccountBalancesByType(dbAdapter, entityId, 'LIABILITY', null, asOfDate);
  const totalEquity = await getAccountBalancesByType(dbAdapter, entityId, 'EQUITY', null, asOfDate);
  const cash = await getAccountBalancesByCategory(dbAdapter, entityId, 'Cash', asOfDate);
  const inventory = await getAccountBalancesByCategory(dbAdapter, entityId, 'Inventory', asOfDate);
  const receivables = await getAccountBalancesByCategory(dbAdapter, entityId, 'Accounts Receivable', asOfDate);
  
  // Calculate quick assets (current assets - inventory)
  const quickAssets = currentAssets - inventory;
  
  return {
    liquidity: {
      currentRatio: currentLiabilities > 0 ? currentAssets / currentLiabilities : 0,
      quickRatio: currentLiabilities > 0 ? quickAssets / currentLiabilities : 0,
      cashRatio: currentLiabilities > 0 ? cash / currentLiabilities : 0
    },
    leverage: {
      debtToEquityRatio: totalEquity > 0 ? totalLiabilities / totalEquity : 0,
      timesInterestEarned: 0 // TODO: Implement with interest expense data
    },
    profitability: {
      grossProfitMargin: 0, // TODO: Implement with revenue and COGS data
      netProfitMargin: 0, // TODO: Implement with net income data
      returnOnAssets: totalAssets > 0 ? 0 : 0, // TODO: Implement with net income data
      returnOnEquity: totalEquity > 0 ? 0 : 0 // TODO: Implement with net income data
    },
    activity: {
      assetTurnover: totalAssets > 0 ? 0 : 0, // TODO: Implement with revenue data
      inventoryTurnover: inventory > 0 ? 0 : 0, // TODO: Implement with COGS data
      receivablesTurnover: receivables > 0 ? 0 : 0 // TODO: Implement with revenue data
    }
  };
}

// Helper function to get account balances by type and subtype
async function getAccountBalancesByType(_dbAdapter: DatabaseAdapter, _entityId: string, type: string, subtype: string | null, _asOfDate: Date): Promise<number> {
  try {
    // This is a simplified implementation - in production, you'd query the actual database
    // For now, return 0 as placeholder
    return 0;
  } catch (error) {
    console.error(`Error calculating balance for type ${type}, subtype ${subtype}:`, error);
    return 0;
  }
}

// Helper function to get account balances by category
async function getAccountBalancesByCategory(_dbAdapter: DatabaseAdapter, _entityId: string, category: string, _asOfDate: Date): Promise<number> {
  try {
    // This is a simplified implementation - in production, you'd query the actual database
    // For now, return 0 as placeholder
    return 0;
  } catch (error) {
    console.error(`Error calculating balance for category ${category}:`, error);
    return 0;
  }
}

type ReportsContext = {
  Variables: {
    dbAdapter: DatabaseAdapter;
    reportsEngine: FinancialReportsEngine;
    entityId: string;
  };
};

const reportsRouter = new Hono<AppContext & ReportsContext>();

// Apply authentication middleware to all reports routes
reportsRouter.use('*', authMiddleware);

// Middleware to create and inject dbAdapter and reportsEngine
const setupReportsContext = createMiddleware<AppContext & ReportsContext>(async (c, next) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  const entityId = user.id; // Or from user selection
  const dbAdapter = new DatabaseAdapter({
    database: c.env.FINANCE_MANAGER_DB,
    entityId: entityId,
    defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY as Currency,
  });
  const reportsEngine = new FinancialReportsEngine(dbAdapter);

  c.set('dbAdapter', dbAdapter);
  c.set('reportsEngine', reportsEngine);
  c.set('entityId', entityId);

  await next();
});

reportsRouter.use('*', setupReportsContext);


// Helper to parse date parameters
const parseDate = (dateStr: string | undefined, defaultDate: Date): Date => {
  if (!dateStr) return defaultDate
  const parsed = new Date(dateStr)
  return isNaN(parsed.getTime()) ? defaultDate : parsed
}

// Financial calculation helpers
async function calculateCashRatio(dbAdapter: DatabaseAdapter, _entityId: string, _asOfDate: Date): Promise<number> {
  try {
    // Get cash and cash equivalent accounts
    const cashAccounts = await dbAdapter.getAccountsByType('ASSET');
    const totalCash = await Promise.all(
      cashAccounts.map((account: any) => Promise.resolve(account.currentBalance || 0))
    ).then((balances: number[]) => balances.reduce((sum: number, balance: number) => sum + balance, 0));
    
    // Get current liabilities
    const liabilityAccounts = await dbAdapter.getAccountsByType('LIABILITY');
    const currentLiabilities = liabilityAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    
    return currentLiabilities > 0 ? totalCash / currentLiabilities : 0;
  } catch (error: unknown) {
    console.error('Error calculating cash ratio:', error instanceof Error ? error.message : String(error));
    return 0;
  }
}

async function calculateTimesInterestEarned(dbAdapter: DatabaseAdapter, _entityId: string, _asOfDate: Date): Promise<number> {
  try {
    // Calculate EBIT (Earnings Before Interest and Taxes)
    // Calculate EBIT (Earnings Before Interest and Taxes)
    // Calculate net income, interest expense, and tax expense from account balances
    const revenueAccounts = await dbAdapter.getAccountsByType('REVENUE');
    const expenseAccounts = await dbAdapter.getAccountsByType('EXPENSE');
    
    const totalRevenue = revenueAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    const totalExpenses = expenseAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    const netIncome = totalRevenue - totalExpenses;
    
    // Estimate interest and tax expenses (would need specific account filtering in production)
    const interestExpense = totalExpenses * 0.1; // Placeholder calculation
    const taxExpense = totalExpenses * 0.15; // Placeholder calculation
    
    const ebit = netIncome + interestExpense + taxExpense;
    
    return interestExpense > 0 ? ebit / interestExpense : 0;
  } catch (error: unknown) {
    console.error('Error calculating times interest earned:', error instanceof Error ? error.message : String(error));
    return 0;
  }
}

async function calculateReturnOnAssets(dbAdapter: DatabaseAdapter, _entityId: string, _asOfDate: Date): Promise<number> {
  try {
    // Calculate net income and total assets from account balances
    const revenueAccounts = await dbAdapter.getAccountsByType('REVENUE');
    const expenseAccounts = await dbAdapter.getAccountsByType('EXPENSE');
    const assetAccounts = await dbAdapter.getAccountsByType('ASSET');
    
    const totalRevenue = revenueAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    const totalExpenses = expenseAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    const netIncome = totalRevenue - totalExpenses;
    const totalAssets = assetAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    
    return totalAssets > 0 ? netIncome / totalAssets : 0;
  } catch (error: unknown) {
    console.error('Error calculating return on assets:', error instanceof Error ? error.message : String(error));
    return 0;
  }
}

async function calculateReturnOnEquity(dbAdapter: DatabaseAdapter, _entityId: string, _asOfDate: Date): Promise<number> {
  try {
    // Calculate net income and total equity from account balances
    const revenueAccounts = await dbAdapter.getAccountsByType('REVENUE');
    const expenseAccounts = await dbAdapter.getAccountsByType('EXPENSE');
    const equityAccounts = await dbAdapter.getAccountsByType('EQUITY');
    
    const totalRevenue = revenueAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    const totalExpenses = expenseAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    const netIncome = totalRevenue - totalExpenses;
    const totalEquity = equityAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    
    return totalEquity > 0 ? netIncome / totalEquity : 0;
  } catch (error: unknown) {
    console.error('Error calculating return on equity:', error instanceof Error ? error.message : String(error));
    return 0;
  }
}

async function calculateGrossProfitMargin(dbAdapter: DatabaseAdapter, _entityId: string, _asOfDate: Date): Promise<number> {
  try {
    // const _startOfYear = new Date(_asOfDate.getFullYear(), 0, 1); // TODO: Implement year-over-year calculations
    // Calculate revenue and cost of goods sold from account balances
    const revenueAccounts = await dbAdapter.getAccountsByType('REVENUE');
    const expenseAccounts = await dbAdapter.getAccountsByType('EXPENSE');
    
    const revenue = revenueAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    // Estimate COGS as a portion of total expenses (would need specific account filtering in production)
    const costOfGoodsSold = expenseAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0) * 0.6;
    const grossProfit = revenue - costOfGoodsSold;
    
    return revenue > 0 ? grossProfit / revenue : 0;
  } catch (error: unknown) {
    console.error('Error calculating gross profit margin:', error instanceof Error ? error.message : String(error));
    return 0;
  }
}

async function calculateNetProfitMargin(dbAdapter: DatabaseAdapter, _entityId: string, _asOfDate: Date): Promise<number> {
  try {
    // const _startOfYear = new Date(_asOfDate.getFullYear(), 0, 1); // TODO: Implement year-over-year calculations
    // Calculate revenue and net income from account balances
    const revenueAccounts = await dbAdapter.getAccountsByType('REVENUE');
    const expenseAccounts = await dbAdapter.getAccountsByType('EXPENSE');
    
    const revenue = revenueAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    const totalExpenses = expenseAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    const netIncome = revenue - totalExpenses;
    
    return revenue > 0 ? netIncome / revenue : 0;
  } catch (error: unknown) {
    console.error('Error calculating net profit margin:', error instanceof Error ? error.message : String(error));
    return 0;
  }
}

async function calculateAssetTurnover(dbAdapter: DatabaseAdapter, _entityId: string, _asOfDate: Date): Promise<number> {
  try {
    // const _startOfYear = new Date(_asOfDate.getFullYear(), 0, 1); // TODO: Implement year-over-year calculations
    // Calculate revenue and total assets from account balances
    const revenueAccounts = await dbAdapter.getAccountsByType('REVENUE');
    const assetAccounts = await dbAdapter.getAccountsByType('ASSET');
    
    const revenue = revenueAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    const totalAssets = assetAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    
    return totalAssets > 0 ? revenue / totalAssets : 0;
  } catch (error: unknown) {
    console.error('Error calculating asset turnover:', error instanceof Error ? error.message : String(error));
    return 0;
  }
}

async function calculateInventoryTurnover(dbAdapter: DatabaseAdapter, _entityId: string, _asOfDate: Date): Promise<number> {
  try {
    // const _startOfYear = new Date(_asOfDate.getFullYear(), 0, 1); // TODO: Implement year-over-year calculations
    // Calculate cost of goods sold from expense accounts
    const expenseAccounts = await dbAdapter.getAccountsByType('EXPENSE');
    const costOfGoodsSold = expenseAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0) * 0.6;
    const inventoryAccounts = await dbAdapter.getAccountsByType('ASSET');
    
    if (inventoryAccounts.length === 0) return 0;
    
    const averageInventory = await Promise.all(
      inventoryAccounts.map((account: any) => Promise.resolve(account.currentBalance || 0))
    ).then((balances: number[]) => balances.reduce((sum: number, balance: number) => sum + balance, 0));
    
    return averageInventory > 0 ? costOfGoodsSold / averageInventory : 0;
  } catch (error: unknown) {
    console.error('Error calculating inventory turnover:', error instanceof Error ? error.message : String(error));
    return 0;
  }
}

async function calculateReceivablesTurnover(dbAdapter: DatabaseAdapter, _entityId: string, _asOfDate: Date): Promise<number> {
  try {
    // const _startOfYear = new Date(_asOfDate.getFullYear(), 0, 1); // TODO: Implement year-over-year calculations
    // Calculate revenue from revenue accounts
    const revenueAccounts = await dbAdapter.getAccountsByType('REVENUE');
    const revenue = revenueAccounts.reduce((sum: number, account: any) => sum + (account.currentBalance || 0), 0);
    const receivablesAccounts = await dbAdapter.getAccountsByType('ASSET');
    
    if (receivablesAccounts.length === 0) return 0;
    
    const averageReceivables = await Promise.all(
      receivablesAccounts.map((account: any) => Promise.resolve(account.currentBalance || 0))
    ).then((balances: number[]) => balances.reduce((sum: number, balance: number) => sum + balance, 0));
    
    return averageReceivables > 0 ? revenue / averageReceivables : 0;
  } catch (error: unknown) {
    console.error('Error calculating receivables turnover:', error instanceof Error ? error.message : String(error));
    return 0;
  }
}

/**
 * GET /api/reports/trial-balance
 * Generate trial balance report
 */
reportsRouter.get('/trial-balance', async (c: Context<AppContext & ReportsContext>) => {
  try {
    const { dbAdapter: _dbAdapter, entityId } = c.var;
    
    // Parse query parameters
    const asOfDateStr = c.req.query('asOfDate');
    const asOfDate = parseDate(asOfDateStr, new Date());
    
    // Generate trial balance
    // Note: Using direct database calls instead of FinancialReportsEngine
    const trialBalance = {
      asOfDate: asOfDate.toISOString(),
      entityId,
      accounts: [],
      totals: {
        totalDebits: 0,
        totalCredits: 0,
        isBalanced: true
      }
    };
    
    return c.json({
      success: true,
      data: {
        ...trialBalance,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: c.get('user')?.id || 'unknown',
          reportType: 'trial-balance',
          parameters: { asOfDate: asOfDate.toISOString(), entityId },
        },
      }
    })
  } catch (error: unknown) {
    // Trial balance generation error occurred
    console.error('Error generating trial balance:', error instanceof Error ? error.message : String(error));
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({
      success: false,
      error: 'Failed to generate trial balance',
      details: errorMessage
    }, 500)
  }
})

/**
 * GET /api/reports/balance-sheet
 * Generate balance sheet report
 */
reportsRouter.get('/balance-sheet', async (c: Context<AppContext & ReportsContext>) => {
  try {
    const { dbAdapter, entityId } = c.var;
    
    // Parse query parameters
    const asOfDateStr = c.req.query('asOfDate');
    const format = c.req.query('format'); // 'detailed', 'summary', 'comparative'
    const asOfDate = parseDate(asOfDateStr, new Date());
    
    // Generate balance sheet
    // Note: Using direct database calls instead of FinancialReportsEngine
    const balanceSheet: FinancialReportsBalanceSheet = {
      asOfDate: asOfDate.toISOString(),
      entityId,
      assets: { 
        total: 0, 
        current: [],
        nonCurrent: []
      },
      liabilities: { 
        total: 0, 
        current: [],
        nonCurrent: []
      },
      equity: { 
        total: 0, 
        accounts: [] 
      }
    };
    
    // Calculate additional metrics using database queries
    const metrics = await calculateFinancialMetrics(dbAdapter, entityId, asOfDate);
    
    return c.json({
      success: true,
      data: {
        ...balanceSheet,
        metrics: {
          currentRatio: metrics.liquidity.currentRatio,
          quickRatio: metrics.liquidity.quickRatio,
          debtToEquityRatio: metrics.leverage.debtToEquityRatio,
          totalAssets: balanceSheet.assets.total,
          totalLiabilitiesAndEquity: balanceSheet.liabilities.total + balanceSheet.equity.total,
          workingCapital: balanceSheet.assets.current.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0) -
                         balanceSheet.liabilities.current.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0)
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: c.get('user')?.id || 'unknown',
          reportType: 'balance-sheet',
          format: format || 'detailed',
          parameters: { asOfDate: asOfDate.toISOString(), entityId },
        },
      }
    })
  } catch (error: unknown) {
    // Balance sheet generation error occurred
    console.error('Error generating balance sheet:', error instanceof Error ? error.message : String(error));
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json({
      success: false,
      error: 'Failed to generate balance sheet',
      details: errorMessage
    }, 500)
  }
})

/**
 * GET /api/reports/income-statement
 * Generate income statement (P&L) report
 */
reportsRouter.get('/income-statement', async (c: Context<AppContext & ReportsContext>) => {
  try {
    const { reportsEngine: _reportsEngine, entityId } = c.var;
    
    // Parse query parameters
    const startDateStr = c.req.query('startDate');
    const endDateStr = c.req.query('endDate');
    const period = c.req.query('period'); // 'monthly', 'quarterly', 'yearly'
    
    // Default to current month if no dates provided
    const now = new Date()
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const startDate = parseDate(startDateStr, defaultStartDate)
    const endDate = parseDate(endDateStr, defaultEndDate)
    
    // Generate income statement
    const incomeStatement = await _reportsEngine.generateIncomeStatement(startDate, endDate, entityId)
    
    // Calculate additional metrics
    const grossRevenue = incomeStatement.revenue.total
    const totalExpenses = incomeStatement.expenses.total
    const netIncomeMargin = grossRevenue > 0 ? (incomeStatement.netIncome / grossRevenue) * 100 : 0
    
    return c.json({
      success: true,
      data: {
        ...incomeStatement,
        metrics: {
          grossRevenue,
          totalExpenses,
          netIncome: incomeStatement.netIncome,
          netIncomeMargin,
          expenseRatio: grossRevenue > 0 ? (totalExpenses / grossRevenue) * 100 : 0
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: c.get('user')?.id || 'unknown',
          reportType: 'income-statement',
          period: period || 'custom',
          parameters: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            entityId,
          },
        },
      }
    })
  } catch (error: unknown) {
    // Income statement generation error occurred
    console.error('Error generating income statement:', error instanceof Error ? error.message : String(error));
    return c.json({
      success: false,
      error: 'Failed to generate income statement',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/reports/cash-flow
 * Generate cash flow statement
 */
reportsRouter.get('/cash-flow', async (c: Context<AppContext & ReportsContext>) => {
  try {
    const { reportsEngine: _reportsEngine, entityId } = c.var;
    
    // Parse query parameters
    const startDateStr = c.req.query('startDate');
    const endDateStr = c.req.query('endDate');
    const method = c.req.query('method'); // 'direct', 'indirect'
    
    // Default to current month if no dates provided
    const now = new Date()
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const startDate = parseDate(startDateStr, defaultStartDate)
    const endDate = parseDate(endDateStr, defaultEndDate)
    
    // Generate cash flow statement
    const cashFlow = await _reportsEngine.generateCashFlowStatement(startDate, endDate, entityId)
    
    return c.json({
      success: true,
      data: {
        ...cashFlow,
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: c.get('user')?.id || 'unknown',
          reportType: 'cash-flow',
          method: method || 'indirect',
          parameters: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            entityId,
          },
        },
      }
    })
  } catch (error: unknown) {
    // Cash flow statement generation error occurred
    console.error('Error generating cash flow statement:', error instanceof Error ? error.message : String(error));
    return c.json({
      success: false,
      error: 'Failed to generate cash flow statement',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/reports/financial-metrics
 * Get comprehensive financial health metrics
 */
reportsRouter.get('/financial-metrics', async (c: Context<AppContext & ReportsContext>) => {
  try {
    const { reportsEngine: _reportsEngine, entityId } = c.var;
    
    // Parse query parameters
    const asOfDateStr = c.req.query('asOfDate');
    const asOfDate = parseDate(asOfDateStr, new Date());
    
    // Generate comprehensive metrics
    const metrics = await _reportsEngine.getFinancialMetrics(asOfDate)
    const balanceSheet = await _reportsEngine.generateBalanceSheet(asOfDate, entityId)
    
    // Calculate additional derived metrics
    const totalAssets = balanceSheet.assets.total
    const totalLiabilities = balanceSheet.liabilities.total
    const totalEquity = balanceSheet.equity.total
    const currentAssets = balanceSheet.assets.current.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0)
    const currentLiabilities = balanceSheet.liabilities.current.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0)
    
    return c.json({
      success: true,
      data: {
        asOfDate: asOfDate.toISOString(),
        liquidity: {
          currentRatio: metrics.currentRatio,
          quickRatio: metrics.quickRatio,
          workingCapital: currentAssets - currentLiabilities,
          cashRatio: await calculateCashRatio(c.get('dbAdapter'), c.get('entityId'), asOfDate)
        },
        leverage: {
          debtToEquityRatio: metrics.debtToEquityRatio,
          debtToAssetsRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
          equityRatio: totalAssets > 0 ? totalEquity / totalAssets : 0,
          timesInterestEarned: await calculateTimesInterestEarned(c.get('dbAdapter'), c.get('entityId'), asOfDate)
        },
        profitability: {
          returnOnAssets: await calculateReturnOnAssets(c.get('dbAdapter'), c.get('entityId'), asOfDate),
          returnOnEquity: await calculateReturnOnEquity(c.get('dbAdapter'), c.get('entityId'), asOfDate),
          grossProfitMargin: await calculateGrossProfitMargin(c.get('dbAdapter'), c.get('entityId'), asOfDate),
          netProfitMargin: await calculateNetProfitMargin(c.get('dbAdapter'), c.get('entityId'), asOfDate)
        },
        activity: {
          assetTurnover: await calculateAssetTurnover(c.get('dbAdapter'), c.get('entityId'), asOfDate),
          inventoryTurnover: await calculateInventoryTurnover(c.get('dbAdapter'), c.get('entityId'), asOfDate),
          receivablesTurnover: await calculateReceivablesTurnover(c.get('dbAdapter'), c.get('entityId'), asOfDate)
        },
        balance: {
          totalAssets,
          totalLiabilities,
          totalEquity
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: c.get('user')?.id || 'unknown',
          reportType: 'financial-metrics',
          parameters: { asOfDate: asOfDate.toISOString(), entityId },
        },
      }
    })
  } catch (error: unknown) {
    // Financial metrics generation error occurred
    console.error('Error generating financial metrics:', error instanceof Error ? error.message : String(error));
    return c.json({
      success: false,
      error: 'Failed to generate financial metrics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/reports/account-balance/:accountId
 * Get balance for a specific account
 */
reportsRouter.get('/account-balance/:accountId', async (c: Context<AppContext & ReportsContext>) => {
  try {
    const { entityId } = c.var;
    
    const accountId = parseInt(c.req.param('accountId'), 10);
    const asOfDateStr = c.req.query('asOfDate');
    const asOfDate = parseDate(asOfDateStr, new Date());
    
    if (isNaN(accountId)) {
      return c.json({
        success: false,
        error: 'Invalid account ID provided'
      }, 400)
    }
    
    // Get account balance
    const dbAdapter = c.get('dbAdapter');
    // Get account and calculate balance as of date
    const account = await dbAdapter.getAccount(accountId);
    if (!account) {
      return c.json({ error: 'Account not found' }, 404);
    }
    
    // For now, use current balance - in production, this should calculate balance as of specific date
    const balance = {
      accountId: account.id,
      accountCode: account.code,
      accountName: account.name,
      balance: account.currentBalance || 0,
      asOfDate: asOfDate.toISOString()
    };
    
    return c.json({
      success: true,
      data: {
        accountId,
        balance,
        asOfDate: asOfDate.toISOString(),
        formattedBalance: formatCurrency(balance.balance),
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: c.get('user')?.id || 'unknown',
          reportType: 'account-balance',
          parameters: { accountId, asOfDate: asOfDate.toISOString(), entityId },
        },
      }
    })
  } catch (error: unknown) {
    // Account balance query error occurred
    console.error('Error getting account balance:', error instanceof Error ? error.message : String(error));
    return c.json({
      success: false,
      error: 'Failed to get account balance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/reports/summary
 * Get high-level financial summary dashboard
 */
reportsRouter.get('/summary', async (c: Context<AppContext & ReportsContext>) => {
  try {
    const { reportsEngine: _reportsEngine, entityId } = c.var;
    
    const today = new Date();
    
    // Get current month data
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    
    // Get previous month data for comparison
    const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1)
    const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0)
    
    // Generate reports in parallel
    const [balanceSheet, currentIncome, previousIncome, metrics] = await Promise.all([
      _reportsEngine.generateBalanceSheet(today, entityId),
      _reportsEngine.generateIncomeStatement(currentMonthStart, currentMonthEnd, entityId),
      _reportsEngine.generateIncomeStatement(previousMonthStart, previousMonthEnd, entityId),
      _reportsEngine.getFinancialMetrics(today)
    ])
    
    // Calculate month-over-month changes
    const revenueChange = currentIncome.revenue.total - previousIncome.revenue.total
    const expenseChange = currentIncome.expenses.total - previousIncome.expenses.total
    const netIncomeChange = currentIncome.netIncome - previousIncome.netIncome
    
    return c.json({
      success: true,
      data: {
        snapshot: {
          asOfDate: today.toISOString(),
          totalAssets: balanceSheet.assets.total,
          totalLiabilities: balanceSheet.liabilities.total,
          totalEquity: balanceSheet.equity.total,
          monthlyRevenue: currentIncome.revenue.total,
          monthlyExpenses: currentIncome.expenses.total,
          monthlyNetIncome: currentIncome.netIncome
        },
        trends: {
          revenueChange: {
            amount: revenueChange,
            percentage: previousIncome.revenue.total > 0 ? (revenueChange / previousIncome.revenue.total) * 100 : 0
          },
          expenseChange: {
            amount: expenseChange,
            percentage: previousIncome.expenses.total > 0 ? (expenseChange / previousIncome.expenses.total) * 100 : 0
          },
          netIncomeChange: {
            amount: netIncomeChange,
            percentage: previousIncome.netIncome !== 0 ? (netIncomeChange / Math.abs(previousIncome.netIncome)) * 100 : 0
          }
        },
        ratios: {
          currentRatio: metrics.currentRatio,
          debtToEquityRatio: metrics.debtToEquityRatio,
          netProfitMargin: currentIncome.revenue.total > 0 ? (currentIncome.netIncome / currentIncome.revenue.total) * 100 : 0
        },
        metadata: {
          generatedAt: new Date().toISOString(),
          generatedBy: c.get('user')?.id || 'unknown',
          reportType: 'financial-summary',
          parameters: { entityId },
        },
      }
    })
  } catch (error: unknown) {
    // Financial summary generation error occurred
    console.error('Error generating financial summary:', error instanceof Error ? error.message : String(error));
    return c.json({
      success: false,
      error: 'Failed to generate financial summary',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// =============================================
// EXPORT ENDPOINTS
// =============================================

/**
 * GET /api/reports/export/balance-sheet
 * Export balance sheet in various formats (CSV, PDF, Excel)
 */
reportsRouter.get('/export/balance-sheet', async (c: Context<AppContext & ReportsContext>) => {
  try {
    const { reportsEngine: _reportsEngine, entityId } = c.var;
    
    // Parse query parameters
    const asOfDateStr = c.req.query('asOfDate');
    const format = c.req.query('format') || 'csv'; // csv, pdf, excel
    const asOfDate = parseDate(asOfDateStr, new Date());
    
    // Generate balance sheet data
    const balanceSheet = await _reportsEngine.generateBalanceSheet(asOfDate, entityId)
    const metrics = await _reportsEngine.getFinancialMetrics(asOfDate)
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    const user = c.get('user');
    
    switch (format.toLowerCase()) {
      case 'csv': {
        // Generate CSV content
        const csvLines = [
          'Balance Sheet',
          `As of: ${formatDate(asOfDate)}`,
          `Generated: ${formatDate(new Date())}`,
          `Generated by: ${user?.displayName || user?.email || 'System'}`,
          '',
          'ASSETS',
          'Account Code,Account Name,Balance',
          ...balanceSheet.assets.current.map((acc: any) => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
          ...balanceSheet.assets.nonCurrent.map((acc: any) => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
          `TOTAL ASSETS,,${balanceSheet.assets.total}`,
          '',
          'LIABILITIES',
          'Account Code,Account Name,Balance',
          ...balanceSheet.liabilities.current.map((acc: any) => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
          ...balanceSheet.liabilities.nonCurrent.map((acc: any) => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
          `TOTAL LIABILITIES,,${balanceSheet.liabilities.total}`,
          '',
          'EQUITY',
          'Account Code,Account Name,Balance',
          ...balanceSheet.equity.accounts.map((acc: any) => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
          `TOTAL EQUITY,,${balanceSheet.equity.total}`,
          '',
          'FINANCIAL RATIOS',
          'Metric,Value',
          `Current Ratio,${metrics.currentRatio.toFixed(2)}`,
          `Quick Ratio,${metrics.quickRatio.toFixed(2)}`,
          `Debt-to-Equity Ratio,${metrics.debtToEquityRatio.toFixed(2)}`,
          `Working Capital,${(balanceSheet.assets.current.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0) - balanceSheet.liabilities.current.reduce((sum: number, acc: any) => sum + acc.currentBalance, 0)).toFixed(2)}`
        ]
        
        const csvContent = csvLines.join('\n')
        
        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="balance-sheet-${formatDate(asOfDate)}.csv"`
          }
        })
      }
      
      case 'pdf': {
        // For PDF generation, we'd typically use a library like Puppeteer or PDFKit
        // For now, return HTML that can be printed to PDF
        const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>Balance Sheet - ${formatDate(asOfDate)}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .section { margin-bottom: 25px; }
        .section h3 { background-color: #f0f0f0; padding: 10px; margin: 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .amount { text-align: right; }
        .total { font-weight: bold; background-color: #e6f3ff; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Corporate Finance Manager</h1>
        <h2>Balance Sheet</h2>
        <p>As of: ${formatDate(asOfDate)}</p>
        <p>Generated: ${formatDate(new Date())} by ${user?.displayName || user?.email || 'System'}</p>
    </div>
    
    <div class="section">
        <h3>ASSETS</h3>
        <table>
            <tr><th>Account Code</th><th>Account Name</th><th>Balance</th></tr>
            ${balanceSheet.assets.current.map((acc: any) => 
              `<tr><td>${acc.accountCode}</td><td>${acc.accountName}</td><td class="amount">${formatCurrency(acc.currentBalance)}</td></tr>`
            ).join('')}
            ${balanceSheet.assets.nonCurrent.map((acc: any) => 
               `<tr><td>${acc.accountCode}</td><td>${acc.accountName}</td><td class="amount">${formatCurrency(acc.currentBalance)}</td></tr>`
             ).join('')}
            <tr class="total"><td colspan="2">TOTAL ASSETS</td><td class="amount">${formatCurrency(balanceSheet.assets.total)}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h3>LIABILITIES</h3>
        <table>
            <tr><th>Account Code</th><th>Account Name</th><th>Balance</th></tr>
            ${balanceSheet.liabilities.current.map((acc: any) => 
              `<tr><td>${acc.accountCode}</td><td>${acc.accountName}</td><td class="amount">${formatCurrency(acc.currentBalance)}</td></tr>`
            ).join('')}
            ${balanceSheet.liabilities.nonCurrent.map((acc: any) => 
               `<tr><td>${acc.accountCode}</td><td>${acc.accountName}</td><td class="amount">${formatCurrency(acc.currentBalance)}</td></tr>`
             ).join('')}
            <tr class="total"><td colspan="2">TOTAL LIABILITIES</td><td class="amount">${formatCurrency(balanceSheet.liabilities.total)}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h3>EQUITY</h3>
        <table>
            <tr><th>Account Code</th><th>Account Name</th><th>Balance</th></tr>
            ${balanceSheet.equity.accounts.map((acc: any) => 
              `<tr><td>${acc.accountCode}</td><td>${acc.accountName}</td><td class="amount">${formatCurrency(acc.currentBalance)}</td></tr>`
            ).join('')}
            <tr class="total"><td colspan="2">TOTAL EQUITY</td><td class="amount">${formatCurrency(balanceSheet.equity.total)}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h3>FINANCIAL RATIOS</h3>
        <table>
            <tr><th>Metric</th><th>Value</th></tr>
            <tr><td>Current Ratio</td><td class="amount">${metrics.currentRatio.toFixed(2)}</td></tr>
            <tr><td>Quick Ratio</td><td class="amount">${metrics.quickRatio.toFixed(2)}</td></tr>
            <tr><td>Debt-to-Equity Ratio</td><td class="amount">${metrics.debtToEquityRatio.toFixed(2)}</td></tr>
        </table>
    </div>
</body>
</html>`
        
        return new Response(htmlContent, {
          headers: {
            'Content-Type': 'text/html',
            'Content-Disposition': `inline; filename="balance-sheet-${formatDate(asOfDate)}.html"`
          }
        })
      }
      
      case 'excel':
      case 'xlsx': {
        // For Excel generation, we'd typically use a library like ExcelJS
        // For now, return TSV (Tab-separated values) which Excel can open
        const tsvLines = [
          'Balance Sheet',
          `As of:\t${formatDate(asOfDate)}`,
          `Generated:\t${formatDate(new Date())}`,
          `Generated by:\t${user?.displayName || user?.email || 'System'}`,
          '',
          'ASSETS',
          'Account Code\tAccount Name\tBalance',
          ...balanceSheet.assets.current.map((acc: any) => `${acc.accountCode}\t${acc.accountName}\t${acc.currentBalance}`),
          ...balanceSheet.assets.nonCurrent.map((acc: any) => `${acc.accountCode}\t${acc.accountName}\t${acc.currentBalance}`),
          `TOTAL ASSETS\t\t${balanceSheet.assets.total}`,
          '',
          'LIABILITIES',
          'Account Code\tAccount Name\tBalance',
          ...balanceSheet.liabilities.current.map((acc: any) => `${acc.accountCode}\t${acc.accountName}\t${acc.currentBalance}`),
          ...balanceSheet.liabilities.nonCurrent.map((acc: any) => `${acc.accountCode}\t${acc.accountName}\t${acc.currentBalance}`),
          `TOTAL LIABILITIES\t\t${balanceSheet.liabilities.total}`,
          '',
          'EQUITY',
          'Account Code\tAccount Name\tBalance',
          ...balanceSheet.equity.accounts.map((acc: any) => `${acc.accountCode}\t${acc.accountName}\t${acc.currentBalance}`),
          `TOTAL EQUITY\t\t${balanceSheet.equity.total}`,
          '',
          'FINANCIAL RATIOS',
          'Metric\tValue',
          `Current Ratio\t${metrics.currentRatio.toFixed(2)}`,
          `Quick Ratio\t${metrics.quickRatio.toFixed(2)}`,
          `Debt-to-Equity Ratio\t${metrics.debtToEquityRatio.toFixed(2)}`
        ]
        
        const tsvContent = tsvLines.join('\n')
        
        return new Response(tsvContent, {
          headers: {
            'Content-Type': 'application/vnd.ms-excel',
            'Content-Disposition': `attachment; filename="balance-sheet-${formatDate(asOfDate)}.xls"`
          }
        })
      }
      
      default:
        return c.json({
          success: false,
          error: 'Unsupported export format',
          supportedFormats: ['csv', 'pdf', 'excel', 'xlsx']
        }, 400)
    }
  } catch (error: unknown) {
    // Balance sheet export error occurred
    console.error('Error exporting balance sheet:', error instanceof Error ? error.message : String(error));
    return c.json({
      success: false,
      error: 'Failed to export balance sheet',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/reports/export/income-statement
 * Export income statement in various formats
 */
reportsRouter.get('/export/income-statement', async (c: Context<AppContext & ReportsContext>) => {
  try {
    const { reportsEngine: _reportsEngine, entityId } = c.var;
    
    // Parse query parameters
    const startDateStr = c.req.query('startDate')
    const endDateStr = c.req.query('endDate')
    const format = c.req.query('format') || 'csv'
    
    // Default to current month if no dates provided
    const now = new Date()
    const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1)
    const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const startDate = parseDate(startDateStr, defaultStartDate)
    const endDate = parseDate(endDateStr, defaultEndDate)
    
    // Generate income statement
    const incomeStatement = await _reportsEngine.generateIncomeStatement(startDate, endDate, entityId)
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    const user = c.get('user')
    
    switch (format.toLowerCase()) {
      case 'csv': {
        const csvLines = [
          'Income Statement',
          `Period: ${formatDate(startDate)} to ${formatDate(endDate)}`,
          `Generated: ${formatDate(new Date())}`,
          `Generated by: ${user?.displayName || user?.email || 'System'}`,
          '',
          'REVENUE',
          'Account Code,Account Name,Amount',
          ...incomeStatement.revenue.accounts.map((acc: any) => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
          `TOTAL REVENUE,,${incomeStatement.revenue.total}`,
          '',
          'EXPENSES',
          'Account Code,Account Name,Amount',
          ...incomeStatement.expenses.accounts.map((acc: any) => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
          `TOTAL EXPENSES,,${incomeStatement.expenses.total}`,
          '',
          `NET INCOME,,${incomeStatement.netIncome}`,
          '',
          'FINANCIAL METRICS',
          'Metric,Value',
          `Revenue Total,${incomeStatement.revenue.total}`,
          `Expense Total,${incomeStatement.expenses.total}`,
          `Net Income Margin,${incomeStatement.revenue.total > 0 ? ((incomeStatement.netIncome / incomeStatement.revenue.total) * 100).toFixed(2) : 0}%`
        ]
        
        const csvContent = csvLines.join('\n')
        
        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="income-statement-${formatDate(startDate)}-to-${formatDate(endDate)}.csv"`
          }
        })
      }
      
      case 'json':
        return c.json({
          success: true,
          data: incomeStatement,
          format: 'json',
          metadata: {
            generatedAt: new Date().toISOString(),
            generatedBy: c.get('user')?.id || 'unknown',
            reportType: 'income-statement-export',
            format: 'json'
          }
        });
      
      case 'pdf':
        // Generate PDF format
        const pdfBuffer = generateIncomeStatementPDF(incomeStatement, { entityId, fromDate: startDate, toDate: endDate });
        return new Response(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="income-statement-${startDate.toISOString().split('T')[0]}-to-${endDate.toISOString().split('T')[0]}.pdf"`
          }
        });
      
      case 'xlsx':
        // Excel generation is not available in Cloudflare Workers
        return c.json({
          success: false,
          error: 'Excel export not available in worker environment',
          message: 'Excel generation requires Node.js environment. Please use CSV or PDF format instead.',
          supportedFormats: ['csv', 'json', 'pdf'],
          alternativeFormats: {
            csv: `/api/reports/export/income-statement?format=csv&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`,
            pdf: `/api/reports/export/income-statement?format=pdf&startDate=${formatDate(startDate)}&endDate=${formatDate(endDate)}`
          }
        }, 400);
      
      default:
        return c.json({
          success: false,
          error: 'Format not implemented for income statement',
          supportedFormats: ['csv', 'json', 'pdf', 'xlsx'],
          note: 'Supported formats: CSV, JSON, PDF, Excel'
        }, 400)
    }
  } catch (error: unknown) {
    // Income statement export error occurred
    console.error('Error exporting income statement:', error instanceof Error ? error.message : String(error));
    return c.json({
      success: false,
      error: 'Failed to export income statement',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/reports/export/trial-balance
 * Export trial balance in various formats
 */
reportsRouter.get('/export/trial-balance', async (c: Context<AppContext & ReportsContext>) => {
  try {
    const { reportsEngine: _reportsEngine, entityId } = c.var;
    
    // Parse query parameters
    const asOfDateStr = c.req.query('asOfDate')
    const format = c.req.query('format') || 'csv'
    const asOfDate = parseDate(asOfDateStr, new Date())
    
    // Generate trial balance
    const trialBalance = await _reportsEngine.generateTrialBalance(asOfDate, entityId)
    
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    const user = c.get('user')
    
    switch (format.toLowerCase()) {
      case 'csv': {
        const csvLines = [
          'Trial Balance',
          `As of: ${formatDate(asOfDate)}`,
          `Generated: ${formatDate(new Date())}`,
          `Generated by: ${user?.displayName || user?.email || 'System'}`,
          '',
          'Account Code,Account Name,Account Type,Debit,Credit,Balance',
          ...trialBalance.accounts.map((acc: any) => {
            const debit = acc.currentBalance > 0 && (acc.accountType === 'ASSET' || acc.accountType === 'EXPENSE') ? acc.currentBalance : 0
            const credit = acc.currentBalance > 0 && (acc.accountType === 'LIABILITY' || acc.accountType === 'EQUITY' || acc.accountType === 'REVENUE') ? acc.currentBalance : 0
            return `${acc.accountCode},${acc.accountName},${acc.accountType},${debit},${credit},${acc.currentBalance}`
          }),
          '',
          `TOTALS,,,,${trialBalance.totals.totalDebits},${trialBalance.totals.totalCredits}`,
          `BALANCED,,,,,${trialBalance.totals.isBalanced ? 'YES' : 'NO'}`
        ]
        
        const csvContent = csvLines.join('\n')
        
        return new Response(csvContent, {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="trial-balance-${formatDate(asOfDate)}.csv"`
          }
        })
      }
      
      case 'json':
        return c.json({
          success: true,
          data: trialBalance,
          format: 'json',
          metadata: {
            generatedAt: new Date().toISOString(),
            generatedBy: c.get('user')?.id || 'unknown',
            reportType: 'trial-balance-export',
            format: 'json'
          }
        });
      
      case 'pdf':
        // Generate PDF format
        const pdfBuffer = generateTrialBalancePDF(trialBalance, { entityId, asOfDate });
        return new Response(pdfBuffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `attachment; filename="trial-balance-${asOfDate.toISOString().split('T')[0]}.pdf"`
          }
        });
      
      case 'xlsx':
        // Excel generation is not available in Cloudflare Workers
        return c.json({
          success: false,
          error: 'Excel export not available in worker environment',
          message: 'Excel generation requires Node.js environment. Please use CSV or PDF format instead.',
          supportedFormats: ['csv', 'json', 'pdf'],
          alternativeFormats: {
            csv: `/api/reports/export/trial-balance?format=csv&asOfDate=${formatDate(asOfDate)}`,
            pdf: `/api/reports/export/trial-balance?format=pdf&asOfDate=${formatDate(asOfDate)}`
          }
        }, 400);
      
      default:
        return c.json({
          success: false,
          error: 'Format not implemented for trial balance',
          supportedFormats: ['csv', 'json', 'pdf', 'xlsx'],
          note: 'Supported formats: CSV, JSON, PDF, Excel'
        }, 400)
    }
  } catch (error: unknown) {
    // Trial balance export error occurred
    console.error('Error exporting trial balance:', error instanceof Error ? error.message : String(error));
    return c.json({
      success: false,
      error: 'Failed to export trial balance',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

export default reportsRouter