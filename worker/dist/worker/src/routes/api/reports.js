import { Hono } from 'hono';
import { DatabaseAdapter, FinancialReportsEngine, formatCurrency } from '@finance-manager/core';
import { authMiddleware } from '../../middleware/auth';
// Create reports router
const reportsRouter = new Hono();
// Apply authentication middleware to all reports routes
reportsRouter.use('*', authMiddleware);
// Helper to create database adapter
const getDbAdapter = (env) => {
    return new DatabaseAdapter({
        database: env.FINANCE_MANAGER_DB,
        entityId: 'default', // TODO: Get from authenticated user context
        defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY
    });
};
// Helper to parse date parameters
const parseDate = (dateStr, defaultDate) => {
    if (!dateStr)
        return defaultDate;
    const parsed = new Date(dateStr);
    return isNaN(parsed.getTime()) ? defaultDate : parsed;
};
/**
 * GET /api/reports/trial-balance
 * Generate trial balance report
 */
reportsRouter.get('/trial-balance', async (c) => {
    try {
        const dbAdapter = getDbAdapter(c.env);
        const reportsEngine = new FinancialReportsEngine(dbAdapter);
        // Parse query parameters
        const asOfDateStr = c.req.query('asOfDate');
        const entityId = c.req.query('entityId');
        const asOfDate = parseDate(asOfDateStr, new Date());
        // Generate trial balance
        const trialBalance = await reportsEngine.generateTrialBalance(asOfDate, entityId);
        return c.json({
            success: true,
            data: {
                ...trialBalance,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    generatedBy: c.get('user')?.id || 'system',
                    reportType: 'trial-balance',
                    parameters: { asOfDate: asOfDate.toISOString(), entityId }
                }
            }
        });
    }
    catch (error) {
        console.error('Trial balance generation error:', error);
        return c.json({
            success: false,
            error: 'Failed to generate trial balance',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
/**
 * GET /api/reports/balance-sheet
 * Generate balance sheet report
 */
reportsRouter.get('/balance-sheet', async (c) => {
    try {
        const dbAdapter = getDbAdapter(c.env);
        const reportsEngine = new FinancialReportsEngine(dbAdapter);
        // Parse query parameters
        const asOfDateStr = c.req.query('asOfDate');
        const entityId = c.req.query('entityId');
        const format = c.req.query('format'); // 'detailed', 'summary', 'comparative'
        const asOfDate = parseDate(asOfDateStr, new Date());
        // Generate balance sheet
        const balanceSheet = await reportsEngine.generateBalanceSheet(asOfDate, entityId);
        // Calculate additional metrics
        const metrics = await reportsEngine.getFinancialMetrics(asOfDate, entityId);
        return c.json({
            success: true,
            data: {
                ...balanceSheet,
                metrics: {
                    currentRatio: metrics.currentRatio,
                    quickRatio: metrics.quickRatio,
                    debtToEquityRatio: metrics.debtToEquityRatio,
                    totalAssets: balanceSheet.assets.total,
                    totalLiabilitiesAndEquity: balanceSheet.liabilities.total + balanceSheet.equity.total,
                    workingCapital: balanceSheet.assets.current.reduce((sum, acc) => sum + acc.currentBalance, 0) -
                        balanceSheet.liabilities.current.reduce((sum, acc) => sum + acc.currentBalance, 0)
                },
                metadata: {
                    generatedAt: new Date().toISOString(),
                    generatedBy: c.get('user')?.id || 'system',
                    reportType: 'balance-sheet',
                    format: format || 'detailed',
                    parameters: { asOfDate: asOfDate.toISOString(), entityId }
                }
            }
        });
    }
    catch (error) {
        console.error('Balance sheet generation error:', error);
        return c.json({
            success: false,
            error: 'Failed to generate balance sheet',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
/**
 * GET /api/reports/income-statement
 * Generate income statement (P&L) report
 */
reportsRouter.get('/income-statement', async (c) => {
    try {
        const dbAdapter = getDbAdapter(c.env);
        const reportsEngine = new FinancialReportsEngine(dbAdapter);
        // Parse query parameters
        const startDateStr = c.req.query('startDate');
        const endDateStr = c.req.query('endDate');
        const entityId = c.req.query('entityId');
        const period = c.req.query('period'); // 'monthly', 'quarterly', 'yearly'
        // Default to current month if no dates provided
        const now = new Date();
        const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const startDate = parseDate(startDateStr, defaultStartDate);
        const endDate = parseDate(endDateStr, defaultEndDate);
        // Generate income statement
        const incomeStatement = await reportsEngine.generateIncomeStatement(startDate, endDate, entityId);
        // Calculate additional metrics
        const grossRevenue = incomeStatement.revenue.total;
        const totalExpenses = incomeStatement.expenses.total;
        const netIncomeMargin = grossRevenue > 0 ? (incomeStatement.netIncome / grossRevenue) * 100 : 0;
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
                    generatedBy: c.get('user')?.id || 'system',
                    reportType: 'income-statement',
                    period: period || 'custom',
                    parameters: {
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                        entityId
                    }
                }
            }
        });
    }
    catch (error) {
        console.error('Income statement generation error:', error);
        return c.json({
            success: false,
            error: 'Failed to generate income statement',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
/**
 * GET /api/reports/cash-flow
 * Generate cash flow statement
 */
reportsRouter.get('/cash-flow', async (c) => {
    try {
        const dbAdapter = getDbAdapter(c.env);
        const reportsEngine = new FinancialReportsEngine(dbAdapter);
        // Parse query parameters
        const startDateStr = c.req.query('startDate');
        const endDateStr = c.req.query('endDate');
        const entityId = c.req.query('entityId');
        const method = c.req.query('method'); // 'direct', 'indirect'
        // Default to current month if no dates provided
        const now = new Date();
        const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const startDate = parseDate(startDateStr, defaultStartDate);
        const endDate = parseDate(endDateStr, defaultEndDate);
        // Generate cash flow statement
        const cashFlow = await reportsEngine.generateCashFlowStatement(startDate, endDate, entityId);
        return c.json({
            success: true,
            data: {
                ...cashFlow,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    generatedBy: c.get('user')?.id || 'system',
                    reportType: 'cash-flow',
                    method: method || 'indirect',
                    parameters: {
                        startDate: startDate.toISOString(),
                        endDate: endDate.toISOString(),
                        entityId
                    }
                }
            }
        });
    }
    catch (error) {
        console.error('Cash flow statement generation error:', error);
        return c.json({
            success: false,
            error: 'Failed to generate cash flow statement',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
/**
 * GET /api/reports/financial-metrics
 * Get comprehensive financial health metrics
 */
reportsRouter.get('/financial-metrics', async (c) => {
    try {
        const dbAdapter = getDbAdapter(c.env);
        const reportsEngine = new FinancialReportsEngine(dbAdapter);
        // Parse query parameters
        const asOfDateStr = c.req.query('asOfDate');
        const entityId = c.req.query('entityId');
        const asOfDate = parseDate(asOfDateStr, new Date());
        // Generate comprehensive metrics
        const metrics = await reportsEngine.getFinancialMetrics(asOfDate, entityId);
        const balanceSheet = await reportsEngine.generateBalanceSheet(asOfDate, entityId);
        // Calculate additional derived metrics
        const totalAssets = balanceSheet.assets.total;
        const totalLiabilities = balanceSheet.liabilities.total;
        const totalEquity = balanceSheet.equity.total;
        const currentAssets = balanceSheet.assets.current.reduce((sum, acc) => sum + acc.currentBalance, 0);
        const currentLiabilities = balanceSheet.liabilities.current.reduce((sum, acc) => sum + acc.currentBalance, 0);
        return c.json({
            success: true,
            data: {
                asOfDate: asOfDate.toISOString(),
                liquidity: {
                    currentRatio: metrics.currentRatio,
                    quickRatio: metrics.quickRatio,
                    workingCapital: currentAssets - currentLiabilities,
                    cashRatio: 0 // TODO: Calculate from cash accounts
                },
                leverage: {
                    debtToEquityRatio: metrics.debtToEquityRatio,
                    debtToAssetsRatio: totalAssets > 0 ? totalLiabilities / totalAssets : 0,
                    equityRatio: totalAssets > 0 ? totalEquity / totalAssets : 0,
                    timesInterestEarned: 0 // TODO: Calculate from income statement
                },
                profitability: {
                    returnOnAssets: metrics.returnOnAssets,
                    returnOnEquity: metrics.returnOnEquity,
                    grossProfitMargin: 0, // TODO: Calculate from income statement
                    netProfitMargin: 0 // TODO: Calculate from income statement
                },
                activity: {
                    assetTurnover: 0, // TODO: Calculate revenue / average total assets
                    inventoryTurnover: 0, // TODO: Calculate if inventory accounts exist
                    receivablesTurnover: 0 // TODO: Calculate if A/R accounts exist
                },
                balance: {
                    totalAssets,
                    totalLiabilities,
                    totalEquity,
                    isBalanced: balanceSheet.isBalanced
                },
                metadata: {
                    generatedAt: new Date().toISOString(),
                    generatedBy: c.get('user')?.id || 'system',
                    reportType: 'financial-metrics',
                    parameters: { asOfDate: asOfDate.toISOString(), entityId }
                }
            }
        });
    }
    catch (error) {
        console.error('Financial metrics generation error:', error);
        return c.json({
            success: false,
            error: 'Failed to generate financial metrics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
/**
 * GET /api/reports/account-balance/:accountId
 * Get balance for a specific account
 */
reportsRouter.get('/account-balance/:accountId', async (c) => {
    try {
        const dbAdapter = getDbAdapter(c.env);
        const reportsEngine = new FinancialReportsEngine(dbAdapter);
        const accountId = parseInt(c.req.param('accountId'));
        const asOfDateStr = c.req.query('asOfDate');
        const entityId = c.req.query('entityId');
        const asOfDate = parseDate(asOfDateStr, new Date());
        if (isNaN(accountId)) {
            return c.json({
                success: false,
                error: 'Invalid account ID provided'
            }, 400);
        }
        // Get account balance
        const balance = await reportsEngine.getAccountBalance(accountId, asOfDate, entityId);
        return c.json({
            success: true,
            data: {
                accountId,
                balance,
                asOfDate: asOfDate.toISOString(),
                formattedBalance: formatCurrency(balance),
                metadata: {
                    generatedAt: new Date().toISOString(),
                    generatedBy: c.get('user')?.id || 'system',
                    reportType: 'account-balance',
                    parameters: { accountId, asOfDate: asOfDate.toISOString(), entityId }
                }
            }
        });
    }
    catch (error) {
        console.error('Account balance query error:', error);
        return c.json({
            success: false,
            error: 'Failed to get account balance',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
/**
 * GET /api/reports/summary
 * Get high-level financial summary dashboard
 */
reportsRouter.get('/summary', async (c) => {
    try {
        const dbAdapter = getDbAdapter(c.env);
        const reportsEngine = new FinancialReportsEngine(dbAdapter);
        const entityId = c.req.query('entityId');
        const today = new Date();
        // Get current month data
        const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const currentMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        // Get previous month data for comparison
        const previousMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const previousMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
        // Generate reports in parallel
        const [balanceSheet, currentIncome, previousIncome, metrics] = await Promise.all([
            reportsEngine.generateBalanceSheet(today, entityId),
            reportsEngine.generateIncomeStatement(currentMonthStart, currentMonthEnd, entityId),
            reportsEngine.generateIncomeStatement(previousMonthStart, previousMonthEnd, entityId),
            reportsEngine.getFinancialMetrics(today, entityId)
        ]);
        // Calculate month-over-month changes
        const revenueChange = currentIncome.revenue.total - previousIncome.revenue.total;
        const expenseChange = currentIncome.expenses.total - previousIncome.expenses.total;
        const netIncomeChange = currentIncome.netIncome - previousIncome.netIncome;
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
                    monthlyNetIncome: currentIncome.netIncome,
                    isBalanced: balanceSheet.isBalanced
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
                    generatedBy: c.get('user')?.id || 'system',
                    reportType: 'financial-summary',
                    parameters: { entityId }
                }
            }
        });
    }
    catch (error) {
        console.error('Financial summary generation error:', error);
        return c.json({
            success: false,
            error: 'Failed to generate financial summary',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
// =============================================
// EXPORT ENDPOINTS
// =============================================
/**
 * GET /api/reports/export/balance-sheet
 * Export balance sheet in various formats (CSV, PDF, Excel)
 */
reportsRouter.get('/export/balance-sheet', async (c) => {
    try {
        const dbAdapter = getDbAdapter(c.env);
        const reportsEngine = new FinancialReportsEngine(dbAdapter);
        // Parse query parameters
        const asOfDateStr = c.req.query('asOfDate');
        const entityId = c.req.query('entityId');
        const format = c.req.query('format') || 'csv'; // csv, pdf, excel
        const asOfDate = parseDate(asOfDateStr, new Date());
        // Generate balance sheet data
        const balanceSheet = await reportsEngine.generateBalanceSheet(asOfDate, entityId);
        const metrics = await reportsEngine.getFinancialMetrics(asOfDate, entityId);
        const formatDate = (date) => date.toISOString().split('T')[0];
        const user = c.get('user');
        switch (format.toLowerCase()) {
            case 'csv': {
                // Generate CSV content
                const csvLines = [
                    'Balance Sheet',
                    `As of: ${formatDate(asOfDate)}`,
                    `Generated: ${formatDate(new Date())}`,
                    `Generated by: ${user?.name || user?.email || 'System'}`,
                    '',
                    'ASSETS',
                    'Account Code,Account Name,Balance',
                    ...balanceSheet.assets.current.map(acc => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
                    ...balanceSheet.assets.fixed.map(acc => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
                    ...balanceSheet.assets.other.map(acc => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
                    `TOTAL ASSETS,,${balanceSheet.assets.total}`,
                    '',
                    'LIABILITIES',
                    'Account Code,Account Name,Balance',
                    ...balanceSheet.liabilities.current.map(acc => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
                    ...balanceSheet.liabilities.longTerm.map(acc => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
                    `TOTAL LIABILITIES,,${balanceSheet.liabilities.total}`,
                    '',
                    'EQUITY',
                    'Account Code,Account Name,Balance',
                    ...balanceSheet.equity.accounts.map(acc => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
                    `TOTAL EQUITY,,${balanceSheet.equity.total}`,
                    '',
                    'FINANCIAL RATIOS',
                    'Metric,Value',
                    `Current Ratio,${metrics.currentRatio.toFixed(2)}`,
                    `Quick Ratio,${metrics.quickRatio.toFixed(2)}`,
                    `Debt-to-Equity Ratio,${metrics.debtToEquityRatio.toFixed(2)}`,
                    `Working Capital,${(balanceSheet.assets.current.reduce((sum, acc) => sum + acc.currentBalance, 0) - balanceSheet.liabilities.current.reduce((sum, acc) => sum + acc.currentBalance, 0)).toFixed(2)}`
                ];
                const csvContent = csvLines.join('\n');
                return new Response(csvContent, {
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="balance-sheet-${formatDate(asOfDate)}.csv"`
                    }
                });
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
        <p>Generated: ${formatDate(new Date())} by ${user?.name || user?.email || 'System'}</p>
    </div>
    
    <div class="section">
        <h3>ASSETS</h3>
        <table>
            <tr><th>Account Code</th><th>Account Name</th><th>Balance</th></tr>
            ${balanceSheet.assets.current.map(acc => `<tr><td>${acc.accountCode}</td><td>${acc.accountName}</td><td class="amount">${formatCurrency(acc.currentBalance)}</td></tr>`).join('')}
            ${balanceSheet.assets.fixed.map(acc => `<tr><td>${acc.accountCode}</td><td>${acc.accountName}</td><td class="amount">${formatCurrency(acc.currentBalance)}</td></tr>`).join('')}
            ${balanceSheet.assets.other.map(acc => `<tr><td>${acc.accountCode}</td><td>${acc.accountName}</td><td class="amount">${formatCurrency(acc.currentBalance)}</td></tr>`).join('')}
            <tr class="total"><td colspan="2">TOTAL ASSETS</td><td class="amount">${formatCurrency(balanceSheet.assets.total)}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h3>LIABILITIES</h3>
        <table>
            <tr><th>Account Code</th><th>Account Name</th><th>Balance</th></tr>
            ${balanceSheet.liabilities.current.map(acc => `<tr><td>${acc.accountCode}</td><td>${acc.accountName}</td><td class="amount">${formatCurrency(acc.currentBalance)}</td></tr>`).join('')}
            ${balanceSheet.liabilities.longTerm.map(acc => `<tr><td>${acc.accountCode}</td><td>${acc.accountName}</td><td class="amount">${formatCurrency(acc.currentBalance)}</td></tr>`).join('')}
            <tr class="total"><td colspan="2">TOTAL LIABILITIES</td><td class="amount">${formatCurrency(balanceSheet.liabilities.total)}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h3>EQUITY</h3>
        <table>
            <tr><th>Account Code</th><th>Account Name</th><th>Balance</th></tr>
            ${balanceSheet.equity.accounts.map(acc => `<tr><td>${acc.accountCode}</td><td>${acc.accountName}</td><td class="amount">${formatCurrency(acc.currentBalance)}</td></tr>`).join('')}
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
</html>`;
                return new Response(htmlContent, {
                    headers: {
                        'Content-Type': 'text/html',
                        'Content-Disposition': `inline; filename="balance-sheet-${formatDate(asOfDate)}.html"`
                    }
                });
            }
            case 'excel':
            case 'xlsx': {
                // For Excel generation, we'd typically use a library like ExcelJS
                // For now, return TSV (Tab-separated values) which Excel can open
                const tsvLines = [
                    'Balance Sheet',
                    `As of:\t${formatDate(asOfDate)}`,
                    `Generated:\t${formatDate(new Date())}`,
                    `Generated by:\t${user?.name || user?.email || 'System'}`,
                    '',
                    'ASSETS',
                    'Account Code\tAccount Name\tBalance',
                    ...balanceSheet.assets.current.map(acc => `${acc.accountCode}\t${acc.accountName}\t${acc.currentBalance}`),
                    ...balanceSheet.assets.fixed.map(acc => `${acc.accountCode}\t${acc.accountName}\t${acc.currentBalance}`),
                    ...balanceSheet.assets.other.map(acc => `${acc.accountCode}\t${acc.accountName}\t${acc.currentBalance}`),
                    `TOTAL ASSETS\t\t${balanceSheet.assets.total}`,
                    '',
                    'LIABILITIES',
                    'Account Code\tAccount Name\tBalance',
                    ...balanceSheet.liabilities.current.map(acc => `${acc.accountCode}\t${acc.accountName}\t${acc.currentBalance}`),
                    ...balanceSheet.liabilities.longTerm.map(acc => `${acc.accountCode}\t${acc.accountName}\t${acc.currentBalance}`),
                    `TOTAL LIABILITIES\t\t${balanceSheet.liabilities.total}`,
                    '',
                    'EQUITY',
                    'Account Code\tAccount Name\tBalance',
                    ...balanceSheet.equity.accounts.map(acc => `${acc.accountCode}\t${acc.accountName}\t${acc.currentBalance}`),
                    `TOTAL EQUITY\t\t${balanceSheet.equity.total}`,
                    '',
                    'FINANCIAL RATIOS',
                    'Metric\tValue',
                    `Current Ratio\t${metrics.currentRatio.toFixed(2)}`,
                    `Quick Ratio\t${metrics.quickRatio.toFixed(2)}`,
                    `Debt-to-Equity Ratio\t${metrics.debtToEquityRatio.toFixed(2)}`
                ];
                const tsvContent = tsvLines.join('\n');
                return new Response(tsvContent, {
                    headers: {
                        'Content-Type': 'application/vnd.ms-excel',
                        'Content-Disposition': `attachment; filename="balance-sheet-${formatDate(asOfDate)}.xls"`
                    }
                });
            }
            default:
                return c.json({
                    success: false,
                    error: 'Unsupported export format',
                    supportedFormats: ['csv', 'pdf', 'excel', 'xlsx']
                }, 400);
        }
    }
    catch (error) {
        console.error('Balance sheet export error:', error);
        return c.json({
            success: false,
            error: 'Failed to export balance sheet',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
/**
 * GET /api/reports/export/income-statement
 * Export income statement in various formats
 */
reportsRouter.get('/export/income-statement', async (c) => {
    try {
        const dbAdapter = getDbAdapter(c.env);
        const reportsEngine = new FinancialReportsEngine(dbAdapter);
        // Parse query parameters
        const startDateStr = c.req.query('startDate');
        const endDateStr = c.req.query('endDate');
        const entityId = c.req.query('entityId');
        const format = c.req.query('format') || 'csv';
        // Default to current month if no dates provided
        const now = new Date();
        const defaultStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const defaultEndDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        const startDate = parseDate(startDateStr, defaultStartDate);
        const endDate = parseDate(endDateStr, defaultEndDate);
        // Generate income statement
        const incomeStatement = await reportsEngine.generateIncomeStatement(startDate, endDate, entityId);
        const formatDate = (date) => date.toISOString().split('T')[0];
        const user = c.get('user');
        switch (format.toLowerCase()) {
            case 'csv': {
                const csvLines = [
                    'Income Statement',
                    `Period: ${formatDate(startDate)} to ${formatDate(endDate)}`,
                    `Generated: ${formatDate(new Date())}`,
                    `Generated by: ${user?.name || user?.email || 'System'}`,
                    '',
                    'REVENUE',
                    'Account Code,Account Name,Amount',
                    ...incomeStatement.revenue.accounts.map(acc => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
                    `TOTAL REVENUE,,${incomeStatement.revenue.total}`,
                    '',
                    'EXPENSES',
                    'Account Code,Account Name,Amount',
                    ...incomeStatement.expenses.accounts.map(acc => `${acc.accountCode},${acc.accountName},${acc.currentBalance}`),
                    `TOTAL EXPENSES,,${incomeStatement.expenses.total}`,
                    '',
                    `NET INCOME,,${incomeStatement.netIncome}`,
                    '',
                    'FINANCIAL METRICS',
                    'Metric,Value',
                    `Revenue Total,${incomeStatement.revenue.total}`,
                    `Expense Total,${incomeStatement.expenses.total}`,
                    `Net Income Margin,${incomeStatement.revenue.total > 0 ? ((incomeStatement.netIncome / incomeStatement.revenue.total) * 100).toFixed(2) : 0}%`
                ];
                const csvContent = csvLines.join('\n');
                return new Response(csvContent, {
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="income-statement-${formatDate(startDate)}-to-${formatDate(endDate)}.csv"`
                    }
                });
            }
            default:
                return c.json({
                    success: false,
                    error: 'Format not implemented for income statement',
                    supportedFormats: ['csv'],
                    note: 'Additional formats can be implemented following the balance sheet pattern'
                }, 400);
        }
    }
    catch (error) {
        console.error('Income statement export error:', error);
        return c.json({
            success: false,
            error: 'Failed to export income statement',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
/**
 * GET /api/reports/export/trial-balance
 * Export trial balance in various formats
 */
reportsRouter.get('/export/trial-balance', async (c) => {
    try {
        const dbAdapter = getDbAdapter(c.env);
        const reportsEngine = new FinancialReportsEngine(dbAdapter);
        // Parse query parameters
        const asOfDateStr = c.req.query('asOfDate');
        const entityId = c.req.query('entityId');
        const format = c.req.query('format') || 'csv';
        const asOfDate = parseDate(asOfDateStr, new Date());
        // Generate trial balance
        const trialBalance = await reportsEngine.generateTrialBalance(asOfDate, entityId);
        const formatDate = (date) => date.toISOString().split('T')[0];
        const user = c.get('user');
        switch (format.toLowerCase()) {
            case 'csv': {
                const csvLines = [
                    'Trial Balance',
                    `As of: ${formatDate(asOfDate)}`,
                    `Generated: ${formatDate(new Date())}`,
                    `Generated by: ${user?.name || user?.email || 'System'}`,
                    '',
                    'Account Code,Account Name,Account Type,Debit,Credit,Balance',
                    ...trialBalance.accounts.map(acc => {
                        const debit = acc.currentBalance > 0 && (acc.accountType === 'ASSET' || acc.accountType === 'EXPENSE') ? acc.currentBalance : 0;
                        const credit = acc.currentBalance > 0 && (acc.accountType === 'LIABILITY' || acc.accountType === 'EQUITY' || acc.accountType === 'REVENUE') ? acc.currentBalance : 0;
                        return `${acc.accountCode},${acc.accountName},${acc.accountType},${debit},${credit},${acc.currentBalance}`;
                    }),
                    '',
                    `TOTALS,,,,${trialBalance.totalDebits},${trialBalance.totalCredits}`,
                    `BALANCED,,,,,${trialBalance.isBalanced ? 'YES' : 'NO'}`
                ];
                const csvContent = csvLines.join('\n');
                return new Response(csvContent, {
                    headers: {
                        'Content-Type': 'text/csv',
                        'Content-Disposition': `attachment; filename="trial-balance-${formatDate(asOfDate)}.csv"`
                    }
                });
            }
            default:
                return c.json({
                    success: false,
                    error: 'Format not implemented for trial balance',
                    supportedFormats: ['csv'],
                    note: 'Additional formats can be implemented following the balance sheet pattern'
                }, 400);
        }
    }
    catch (error) {
        console.error('Trial balance export error:', error);
        return c.json({
            success: false,
            error: 'Failed to export trial balance',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, 500);
    }
});
export default reportsRouter;
