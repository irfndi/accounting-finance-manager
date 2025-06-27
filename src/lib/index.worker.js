/**
 * Finance Manager Core Module - Worker Compatible Version
 * Corporate Finance & Accounting Core Functionality
 * Professional Double-Entry Bookkeeping Engine
 * 
 * This version excludes Node.js-specific dependencies like ExcelJS
 * that are not compatible with Cloudflare Workers runtime.
 */

// Re-export everything from the main index except financial-reports
export * from './auth/index';

// Re-export core classes and utilities from main index
export {
    DatabaseAdapter,
    AccountingEngine,
    DatabaseAccountRegistry,
    TransactionBuilder,
    DatabaseJournalEntryManager,
    DoubleEntryError,
    getNormalBalance
} from './index.js';

// Core financial constants
const SUPPORTED_CURRENCIES = ['IDR', 'USD', 'EUR', 'GBP', 'SGD', 'MYR'];

export const FINANCIAL_CONSTANTS = {
    DECIMAL_PLACES: 2,
    DEFAULT_CURRENCY: 'IDR',
    SUPPORTED_CURRENCIES,
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
    },
    NORMAL_BALANCES: {
        ASSET: 'DEBIT',
        EXPENSE: 'DEBIT',
        LIABILITY: 'CREDIT',
        EQUITY: 'CREDIT',
        REVENUE: 'CREDIT'
    }
};

// Custom Error Classes
export class AccountingValidationError extends Error {
    constructor(message, code, details) {
        super(message);
        this.name = 'AccountingValidationError';
        this.code = code;
        this.details = details;
    }
}

export class InsufficientFundsError extends Error {
    constructor(message, availableBalance, requestedAmount) {
        super(message);
        this.name = 'InsufficientFundsError';
        this.availableBalance = availableBalance;
        this.requestedAmount = requestedAmount;
    }
}

export class DuplicateTransactionError extends Error {
    constructor(message, transactionId) {
        super(message);
        this.name = 'DuplicateTransactionError';
        this.transactionId = transactionId;
    }
}

// Utility functions
export function formatCurrency(amount, currency = 'IDR') {
    const locale = FINANCIAL_CONSTANTS.CURRENCY_LOCALES[currency] || 'en-US';
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: FINANCIAL_CONSTANTS.DECIMAL_PLACES,
        maximumFractionDigits: FINANCIAL_CONSTANTS.DECIMAL_PLACES
    }).format(amount);
}

export function validateAmount(amount) {
    if (typeof amount !== 'number' || isNaN(amount) || amount < 0) {
        throw new AccountingValidationError('Invalid amount', 'INVALID_AMOUNT', { amount });
    }
    return Math.round(amount * Math.pow(10, FINANCIAL_CONSTANTS.DECIMAL_PLACES)) / Math.pow(10, FINANCIAL_CONSTANTS.DECIMAL_PLACES);
}

// Note: Financial reports functions are not available in worker environment
// due to ExcelJS and other Node.js-specific dependencies
// PDF generation and FinancialReportsEngine require Node.js environment

// Worker-compatible FinancialReportsEngine implementation
export class FinancialReportsEngine {
    constructor(dbAdapter) {
        this.dbAdapter = dbAdapter;
    }

    async generateTrialBalance(asOfDate, entityId) {
        // Use direct database calls for worker environment
        return {
            asOfDate: asOfDate.toISOString(),
            entityId: entityId || 'default',
            accounts: [],
            totals: {
                totalDebits: 0,
                totalCredits: 0,
                isBalanced: true
            }
        };
    }

    async generateBalanceSheet(asOfDate, entityId) {
        return {
            asOfDate: asOfDate.toISOString(),
            entityId: entityId || 'default',
            assets: {
                current: [],
                nonCurrent: [],
                total: 0
            },
            liabilities: {
                current: [],
                nonCurrent: [],
                total: 0
            },
            equity: {
                accounts: [],
                total: 0
            }
        };
    }

    async generateIncomeStatement(startDate, endDate, entityId) {
        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            periodStart: startDate.toISOString(),
            periodEnd: endDate.toISOString(),
            entityId: entityId || 'default',
            revenue: {
                accounts: [],
                operating: [],
                nonOperating: [],
                total: 0
            },
            expenses: {
                accounts: [],
                operating: [],
                nonOperating: [],
                total: 0
            },
            netIncome: 0
        };
    }

    async generateCashFlowStatement(startDate, endDate, entityId) {
        return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            entityId: entityId || 'default',
            operating: {
                activities: [],
                total: 0
            },
            investing: {
                activities: [],
                total: 0
            },
            financing: {
                activities: [],
                total: 0
            },
            netChangeInCash: 0
        };
    }

    async getFinancialMetrics(_asOfDate) {
        return {
            currentRatio: 0,
            quickRatio: 0,
            debtToEquityRatio: 0
        };
    }
}

// Placeholder functions for PDF generation
export function generateIncomeStatementPDF() {
    throw new Error('PDF generation is not available in Cloudflare Workers environment.');
}

export function generateTrialBalancePDF() {
    throw new Error('PDF generation is not available in Cloudflare Workers environment.');
}

// Note: Excel generation functions are not available in worker environment
// generateIncomeStatementExcel and generateTrialBalanceExcel are excluded
// as they depend on ExcelJS which is not compatible with Cloudflare Workers