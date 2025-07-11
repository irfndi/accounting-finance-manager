/**
 * Finance Manager Core Module
 * Corporate Finance & Accounting Core Functionality
 * Professional Double-Entry Bookkeeping Engine
 */
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
    code;
    details;
    constructor(message, code, details) {
        super(message);
        this.name = 'AccountingValidationError';
        this.code = code;
        this.details = details;
    }
}
export class DoubleEntryError extends AccountingValidationError {
    constructor(message, details) {
        super(message, 'DOUBLE_ENTRY_VIOLATION', details);
        this.name = 'DoubleEntryError';
    }
}
// Enhanced Error System - Severity and Categories
export var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["WARNING"] = "WARNING";
    ErrorSeverity["ERROR"] = "ERROR";
    ErrorSeverity["CRITICAL"] = "CRITICAL";
})(ErrorSeverity || (ErrorSeverity = {}));
export var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["VALIDATION"] = "VALIDATION";
    ErrorCategory["BUSINESS_RULE"] = "BUSINESS_RULE";
    ErrorCategory["SYSTEM"] = "SYSTEM";
    ErrorCategory["COMPLIANCE"] = "COMPLIANCE";
})(ErrorCategory || (ErrorCategory = {}));
// Specialized Error Classes
export class BalanceSheetError extends AccountingValidationError {
    constructor(message, details) {
        super(message, 'BALANCE_SHEET_VIOLATION', details);
        this.name = 'BalanceSheetError';
    }
}
export class AccountRegistryError extends AccountingValidationError {
    constructor(message, details) {
        super(message, 'ACCOUNT_REGISTRY_ERROR', details);
        this.name = 'AccountRegistryError';
    }
}
export class CurrencyConversionError extends AccountingValidationError {
    constructor(message, details) {
        super(message, 'CURRENCY_CONVERSION_ERROR', details);
        this.name = 'CurrencyConversionError';
    }
}
export class PeriodClosureError extends AccountingValidationError {
    constructor(message, details) {
        super(message, 'PERIOD_CLOSURE_VIOLATION', details);
        this.name = 'PeriodClosureError';
    }
}
export class FiscalYearError extends AccountingValidationError {
    constructor(message, details) {
        super(message, 'FISCAL_YEAR_VIOLATION', details);
        this.name = 'FiscalYearError';
    }
}
export class ComplianceError extends AccountingValidationError {
    constructor(message, details) {
        super(message, 'COMPLIANCE_VIOLATION', details);
        this.name = 'ComplianceError';
    }
}
// Error Handling Utilities
export class ErrorAggregator {
    errors = [];
    warnings = [];
    addError(error) {
        if (error.severity === ErrorSeverity.WARNING) {
            this.warnings.push(error);
        }
        else {
            this.errors.push(error);
        }
    }
    addErrors(errors) {
        for (const error of errors) {
            this.addError(error);
        }
    }
    hasErrors() {
        return this.errors.length > 0;
    }
    hasWarnings() {
        return this.warnings.length > 0;
    }
    getErrors() {
        return [...this.errors];
    }
    getWarnings() {
        return [...this.warnings];
    }
    getAllIssues() {
        return [...this.errors, ...this.warnings];
    }
    getCriticalErrors() {
        return this.errors.filter(error => error.severity === ErrorSeverity.CRITICAL);
    }
    getErrorsByCategory(category) {
        return this.getAllIssues().filter(error => error.category === category);
    }
    clear() {
        this.errors = [];
        this.warnings = [];
    }
    generateReport() {
        const allIssues = this.getAllIssues();
        const byCategory = Object.fromEntries(Object.values(ErrorCategory).map(cat => [cat, 0]));
        const bySeverity = Object.fromEntries(Object.values(ErrorSeverity).map(sev => [sev, 0]));
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
export var AccountingErrorFactory;
(function (AccountingErrorFactory) {
    function createValidationError(baseError, severity = ErrorSeverity.ERROR, category = ErrorCategory.VALIDATION, suggestions, context) {
        return {
            ...baseError,
            severity,
            category,
            suggestions,
            context
        };
    }
    AccountingErrorFactory.createValidationError = createValidationError;
    function createBusinessRuleError(baseError, suggestions) {
        return createValidationError(baseError, ErrorSeverity.ERROR, ErrorCategory.BUSINESS_RULE, suggestions);
    }
    AccountingErrorFactory.createBusinessRuleError = createBusinessRuleError;
    function createComplianceError(baseError, severity = ErrorSeverity.CRITICAL) {
        return createValidationError(baseError, severity, ErrorCategory.COMPLIANCE);
    }
    AccountingErrorFactory.createComplianceError = createComplianceError;
    function createSystemError(baseError, context) {
        return createValidationError(baseError, ErrorSeverity.CRITICAL, ErrorCategory.SYSTEM, undefined, context);
    }
    AccountingErrorFactory.createSystemError = createSystemError;
})(AccountingErrorFactory || (AccountingErrorFactory = {}));
// Error Recovery Strategies
export var ErrorRecoveryManager;
(function (ErrorRecoveryManager) {
    const RECOVERY_STRATEGIES = {
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
    function getSuggestions(errorCode) {
        return RECOVERY_STRATEGIES[errorCode] || [
            'Review the transaction details',
            'Check accounting policies and procedures',
            'Contact system administrator if issue persists'
        ];
    }
    ErrorRecoveryManager.getSuggestions = getSuggestions;
    function enhanceError(error) {
        const suggestions = getSuggestions(error.code);
        return {
            ...error,
            severity: determineSeverity(error.code),
            category: determineCategory(error.code),
            suggestions,
            timestamp: new Date()
        };
    }
    ErrorRecoveryManager.enhanceError = enhanceError;
    function determineSeverity(errorCode) {
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
            return ErrorSeverity.CRITICAL;
        }
        if (warningCodes.some(code => errorCode.includes(code))) {
            return ErrorSeverity.WARNING;
        }
        return ErrorSeverity.ERROR;
    }
    function determineCategory(errorCode) {
        if (errorCode.includes('COMPLIANCE'))
            return ErrorCategory.COMPLIANCE;
        if (errorCode.includes('SYSTEM'))
            return ErrorCategory.SYSTEM;
        if (errorCode.includes('BUSINESS_RULE'))
            return ErrorCategory.BUSINESS_RULE;
        return ErrorCategory.VALIDATION;
    }
})(ErrorRecoveryManager || (ErrorRecoveryManager = {}));
// Utility functions
export function formatCurrency(amount, currency = FINANCIAL_CONSTANTS.DEFAULT_CURRENCY) {
    const locale = FINANCIAL_CONSTANTS.CURRENCY_LOCALES[currency];
    const symbol = FINANCIAL_CONSTANTS.CURRENCY_SYMBOLS[currency];
    // For IDR, we don't typically use decimal places in everyday formatting
    const options = {
        style: 'decimal',
        minimumFractionDigits: currency === 'IDR' ? 0 : FINANCIAL_CONSTANTS.DECIMAL_PLACES,
        maximumFractionDigits: currency === 'IDR' ? 0 : FINANCIAL_CONSTANTS.DECIMAL_PLACES,
    };
    const formattedAmount = new Intl.NumberFormat(locale, options).format(amount);
    return `${symbol} ${formattedAmount}`;
}
export function roundToDecimalPlaces(amount, places = FINANCIAL_CONSTANTS.DECIMAL_PLACES) {
    const factor = 10 ** places;
    return Math.round(amount * factor) / factor;
}
export function getNormalBalance(accountType) {
    return FINANCIAL_CONSTANTS.NORMAL_BALANCES[accountType];
}
// Transaction Validator Class
export class TransactionValidator {
    /**
     * Validates that the sum of debits equals the sum of credits
     */
    static validateDoubleEntry(entries) {
        const errors = [];
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
    static validateTransactionData(transactionData) {
        const errors = [];
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
    transactionData = {
        entries: [],
        currency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
        transactionDate: new Date(),
    };
    constructor() {
        this.reset();
    }
    reset() {
        this.transactionData = {
            entries: [],
            currency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
            transactionDate: new Date(),
        };
        return this;
    }
    setDescription(description) {
        this.transactionData.description = description;
        return this;
    }
    setReference(reference) {
        this.transactionData.reference = reference;
        return this;
    }
    setDate(date) {
        this.transactionData.transactionDate = date;
        return this;
    }
    setCurrency(currency) {
        this.transactionData.currency = currency;
        return this;
    }
    debit(accountId, amount, description) {
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
    credit(accountId, amount, description) {
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
    validate() {
        return TransactionValidator.validateTransactionData(this.transactionData);
    }
    build() {
        const errors = this.validate();
        if (errors.length > 0) {
            throw new DoubleEntryError('Invalid transaction data', errors);
        }
        return { ...this.transactionData };
    }
}
// Balance Calculator
export class BalanceCalculator {
    /**
     * Calculates the balance for an account based on its normal balance type
     */
    static calculateAccountBalance(accountType, normalBalance, debitTotal, creditTotal) {
        const debits = roundToDecimalPlaces(debitTotal);
        const credits = roundToDecimalPlaces(creditTotal);
        if (normalBalance === 'DEBIT') {
            return debits - credits;
        }
        else {
            return credits - debits;
        }
    }
}
// Core Accounting Engine
export class AccountingEngine {
    /**
     * Creates a new transaction with validation
     */
    static createTransaction(transactionData) {
        const errors = TransactionValidator.validateTransactionData(transactionData);
        if (errors.length > 0) {
            throw new DoubleEntryError('Transaction validation failed', errors);
        }
        return transactionData;
    }
    /**
     * Validates an existing transaction
     */
    static validateTransaction(transaction, journalEntries) {
        const errors = [];
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
        const entries = transactionEntries.map(entry => ({
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
/**
 * Account Balance Manager - Handles balance calculations and account management
 */
export class AccountBalanceManager {
    accountBalances = new Map();
    transactions = [];
    /**
     * Add a transaction to the balance manager
     */
    addTransaction(transaction) {
        this.transactions.push(transaction);
        this.updateBalancesFromTransaction(transaction);
    }
    /**
     * Update account balances based on a transaction
     */
    updateBalancesFromTransaction(transaction) {
        for (const entry of transaction.entries) {
            const accountId = entry.accountId.toString();
            const currentBalance = this.accountBalances.get(accountId) || {
                accountId,
                balance: 0,
                currency: 'IDR',
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
    getAccountBalance(accountId) {
        return this.accountBalances.get(accountId) || null;
    }
    /**
     * Get all account balances
     */
    getAllBalances() {
        return new Map(this.accountBalances);
    }
    /**
     * Calculate account balance for a specific date
     */
    calculateAccountBalance(accountId, accountType, asOfDate) {
        const relevantTransactions = asOfDate
            ? this.transactions.filter(t => new Date(t.date) <= asOfDate)
            : this.transactions;
        let balance = 0;
        for (const transaction of relevantTransactions) {
            for (const entry of transaction.entries) {
                if (entry.accountId.toString() === accountId) {
                    // Use debitAmount and creditAmount directly from TransactionEntry
                    const debitAmount = entry.debitAmount || 0;
                    const creditAmount = entry.creditAmount || 0;
                    // Calculate net effect based on normal balance
                    if (accountType === 'ASSET' || accountType === 'EXPENSE') {
                        balance += (debitAmount - creditAmount);
                    }
                    else {
                        balance += (creditAmount - debitAmount);
                    }
                }
            }
        }
        return roundToDecimalPlaces(balance, FINANCIAL_CONSTANTS.DECIMAL_PLACES);
    }
    /**
     * Generate trial balance
     */
    generateTrialBalance(asOfDate) {
        const accounts = Array.from(this.accountBalances.keys());
        const accountBalances = [];
        let totalDebits = 0;
        let totalCredits = 0;
        for (const accountId of accounts) {
            const accountBalance = this.accountBalances.get(accountId);
            if (!accountBalance)
                continue;
            const balance = this.calculateAccountBalance(accountId, this.getAccountTypeForAccount(accountId), asOfDate);
            const normalBalance = this.getNormalBalanceForAccount(accountId);
            const accountBalanceEntry = {
                accountId,
                balance,
                currency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
                lastUpdated: new Date(),
                normalBalance
            };
            accountBalances.push(accountBalanceEntry);
            if (balance > 0) {
                totalDebits += balance;
            }
            else if (balance < 0) {
                totalCredits += Math.abs(balance);
            }
        }
        return {
            asOfDate: asOfDate || new Date(),
            accounts: accountBalances,
            totalDebits: roundToDecimalPlaces(totalDebits, FINANCIAL_CONSTANTS.DECIMAL_PLACES),
            totalCredits: roundToDecimalPlaces(totalCredits, FINANCIAL_CONSTANTS.DECIMAL_PLACES),
            isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
            currency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY
        };
    }
    /**
     * Generate balance sheet
     */
    generateBalanceSheet(asOfDate) {
        const trialBalance = this.generateTrialBalance(asOfDate);
        const assets = [];
        const liabilities = [];
        const equity = [];
        for (const accountBalance of trialBalance.accounts) {
            const accountType = this.getAccountTypeForAccount(accountBalance.accountId);
            switch (accountType) {
                case 'ASSET':
                    assets.push(accountBalance);
                    break;
                case 'LIABILITY':
                    liabilities.push({
                        ...accountBalance,
                        balance: Math.abs(accountBalance.balance)
                    });
                    break;
                case 'EQUITY':
                    equity.push({
                        ...accountBalance,
                        balance: Math.abs(accountBalance.balance)
                    });
                    break;
            }
        }
        const totalAssets = assets.reduce((sum, account) => sum + account.balance, 0);
        const totalLiabilities = liabilities.reduce((sum, account) => sum + account.balance, 0);
        const totalEquity = equity.reduce((sum, account) => sum + account.balance, 0);
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
    generateIncomeStatement(startDate, endDate) {
        const relevantTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
        });
        const revenues = [];
        const expenses = [];
        const revenueMap = new Map();
        const expenseMap = new Map();
        for (const transaction of relevantTransactions) {
            for (const entry of transaction.entries) {
                const accountType = this.getAccountTypeForAccount(entry.accountId.toString());
                const debitAmount = entry.debitAmount || 0;
                const creditAmount = entry.creditAmount || 0;
                if (accountType === 'REVENUE') {
                    const accountId = entry.accountId.toString();
                    const currentRevenue = revenueMap.get(accountId) || 0;
                    revenueMap.set(accountId, currentRevenue + (creditAmount - debitAmount));
                }
                else if (accountType === 'EXPENSE') {
                    const accountId = entry.accountId.toString();
                    const currentExpense = expenseMap.get(accountId) || 0;
                    expenseMap.set(accountId, currentExpense + (debitAmount - creditAmount));
                }
            }
        }
        // Convert maps to AccountBalance arrays
        revenueMap.forEach((balance, accountId) => {
            revenues.push({
                accountId,
                balance,
                currency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
                lastUpdated: new Date(),
                normalBalance: 'CREDIT'
            });
        });
        expenseMap.forEach((balance, accountId) => {
            expenses.push({
                accountId,
                balance,
                currency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
                lastUpdated: new Date(),
                normalBalance: 'DEBIT'
            });
        });
        const totalRevenues = revenues.reduce((sum, account) => sum + account.balance, 0);
        const totalExpenses = expenses.reduce((sum, account) => sum + account.balance, 0);
        const netIncome = totalRevenues - totalExpenses;
        return {
            fromDate: startDate,
            toDate: endDate,
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
    reset() {
        this.accountBalances.clear();
        this.transactions = [];
    }
    /**
     * Get normal balance for account (helper method)
     */
    getNormalBalanceForAccount(accountId) {
        // This would typically come from a database or account registry
        // For now, we'll use a simple mapping based on account ID patterns
        const accountType = this.getAccountTypeForAccount(accountId);
        return getNormalBalance(accountType);
    }
    /**
     * Get account type for account (helper method)
     */
    getAccountTypeForAccount(accountId) {
        // This would typically come from a database or account registry
        // For now, we'll use a simple mapping based on account ID patterns
        if (accountId.startsWith('1'))
            return 'ASSET';
        if (accountId.startsWith('2'))
            return 'LIABILITY';
        if (accountId.startsWith('3'))
            return 'EQUITY';
        if (accountId.startsWith('4'))
            return 'REVENUE';
        if (accountId.startsWith('5'))
            return 'EXPENSE';
        // Default fallback
        return 'ASSET';
    }
}
/**
 * Account Registry - Manages account definitions and metadata
 */
export class AccountRegistry {
    accounts = new Map();
    /**
     * Register an account
     */
    registerAccount(account) {
        this.accounts.set(account.id.toString(), account);
    }
    /**
     * Get account by ID
     */
    getAccount(accountId) {
        return this.accounts.get(accountId) || null;
    }
    /**
     * Get all accounts of a specific type
     */
    getAccountsByType(accountType) {
        return Array.from(this.accounts.values()).filter(account => account.type === accountType);
    }
    /**
     * Get all accounts
     */
    getAllAccounts() {
        return Array.from(this.accounts.values());
    }
    /**
     * Check if account exists
     */
    hasAccount(accountId) {
        return this.accounts.has(accountId);
    }
    /**
     * Remove account
     */
    removeAccount(accountId) {
        return this.accounts.delete(accountId);
    }
    /**
     * Get account balance type
     */
    getAccountNormalBalance(accountId) {
        const account = this.accounts.get(accountId);
        return account ? getNormalBalance(account.type) : null;
    }
}
/**
 * Journal Entry Manager - Handles journal entry creation, validation, and posting
 */
export class JournalEntryManager {
    journalEntries = new Map();
    nextId = 1;
    accountRegistry;
    constructor(accountRegistry) {
        this.accountRegistry = accountRegistry || new AccountRegistry();
    }
    /**
     * Create journal entries from transaction data
     */
    createJournalEntriesFromTransaction(transactionId, transactionData, createdBy) {
        const entries = [];
        const now = new Date();
        for (const entry of transactionData.entries) {
            // Validate account exists if registry is populated
            if (this.accountRegistry.hasAccount(entry.accountId.toString())) {
                const account = this.accountRegistry.getAccount(entry.accountId.toString());
                if (account && !account.allowTransactions) {
                    throw new DoubleEntryError(`Account ${entry.accountId} does not allow transactions`);
                }
            }
            const journalEntry = {
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
                journalEntry.exchangeRate = this.getExchangeRate(journalEntry.currency, FINANCIAL_CONSTANTS.DEFAULT_CURRENCY);
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
    validateJournalEntries(entries) {
        const errors = [];
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
    validateSingleJournalEntry(entry, index) {
        const errors = [];
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
    validateDoubleEntryBalance(entries) {
        const errors = [];
        // Group by currency for balance validation
        const currencyBalances = {};
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
                    message: `Transaction is not balanced for currency ${currency}. Debits: ${formatCurrency(roundedDebits, currency)}, Credits: ${formatCurrency(roundedCredits, currency)}`,
                    code: 'UNBALANCED_TRANSACTION'
                });
            }
        }
        return errors;
    }
    /**
     * Validate account compatibility with registry
     */
    validateAccountCompatibility(entries) {
        const errors = [];
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
            }
            else {
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
    postJournalEntries(entryIds, postedBy) {
        const postedEntries = [];
        const now = new Date();
        for (const id of entryIds) {
            const entry = this.journalEntries.get(id);
            if (entry) {
                const updatedEntry = {
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
    getJournalEntriesByTransaction(transactionId) {
        return Array.from(this.journalEntries.values())
            .filter(entry => entry.transactionId === transactionId);
    }
    /**
     * Get journal entries by account ID
     */
    getJournalEntriesByAccount(accountId) {
        return Array.from(this.journalEntries.values())
            .filter(entry => entry.accountId === accountId);
    }
    /**
     * Get journal entry by ID
     */
    getJournalEntry(id) {
        return this.journalEntries.get(id) || null;
    }
    /**
     * Get all journal entries
     */
    getAllJournalEntries() {
        return Array.from(this.journalEntries.values());
    }
    /**
     * Reconcile journal entry
     */
    reconcileJournalEntry(entryId, reconciliationId, reconciledBy) {
        const entry = this.journalEntries.get(entryId);
        if (!entry)
            return null;
        const reconciledEntry = {
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
    unreconcileJournalEntry(entryId, unreconciledBy) {
        const entry = this.journalEntries.get(entryId);
        if (!entry)
            return null;
        const unreconciledEntry = {
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
    deleteJournalEntriesByTransaction(transactionId) {
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
    getExchangeRate(fromCurrency, toCurrency) {
        // In a real system, this would fetch from an external service
        // For now, return placeholder rates
        if (fromCurrency === toCurrency)
            return 1.0;
        // Placeholder exchange rates (as of a hypothetical date)
        const rates = {
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
    reset() {
        this.journalEntries.clear();
        this.nextId = 1;
    }
    /**
     * Get journal entry statistics
     */
    getStatistics() {
        const allEntries = this.getAllJournalEntries();
        const reconciledEntries = allEntries.filter(entry => entry.isReconciled);
        const unreconciledEntries = allEntries.filter(entry => !entry.isReconciled);
        const entriesByAccount = {};
        const entriesByCurrency = {};
        for (const entry of allEntries) {
            entriesByAccount[entry.accountId] = (entriesByAccount[entry.accountId] || 0) + 1;
            entriesByCurrency[entry.currency] = (entriesByCurrency[entry.currency] || 0) + 1;
        }
        return {
            totalEntries: allEntries.length,
            reconciledEntries: reconciledEntries.length,
            unreconciledEntries: unreconciledEntries.length,
            entriesByAccount,
            entriesByCurrency,
        };
    }
}
// D1 Database Adapter
export class DatabaseAdapter {
    db;
    entityId;
    defaultCurrency;
    constructor(config) {
        this.db = config.database;
        this.entityId = config.entityId || 'default';
        this.defaultCurrency = config.defaultCurrency || FINANCIAL_CONSTANTS.DEFAULT_CURRENCY;
    }
    // Account Operations
    async createAccount(account) {
        const now = new Date();
        const query = `
      INSERT INTO accounts (
        code, name, description, type, subtype, category,
        parent_id, level, path, is_active, is_system, allow_transactions,
        normal_balance, report_category, report_order, current_balance,
        entity_id, created_at, updated_at, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
        const result = await this.db.prepare(query).bind(account.code, account.name, account.description || null, account.type, account.subtype || null, account.category || null, account.parentId || null, account.level || 0, account.path || account.code, account.isActive ? 1 : 0, account.isSystem ? 1 : 0, account.allowTransactions ? 1 : 0, account.normalBalance, account.reportCategory || null, account.reportOrder || 0, account.currentBalance || 0, this.entityId, now.getTime(), now.getTime(), account.createdBy || null, account.updatedBy || null).first();
        return this.mapDbAccountToAccount(result);
    }
    async getAccount(accountId) {
        const query = 'SELECT * FROM accounts WHERE id = ? AND entity_id = ?';
        const result = await this.db.prepare(query).bind(accountId, this.entityId).first();
        return result ? this.mapDbAccountToAccount(result) : null;
    }
    async getAllAccounts() {
        const query = 'SELECT * FROM accounts WHERE entity_id = ? ORDER BY code';
        const result = await this.db.prepare(query).bind(this.entityId).all();
        return result.results.map(row => this.mapDbAccountToAccount(row));
    }
    async getAccountsByType(accountType) {
        const query = 'SELECT * FROM accounts WHERE type = ? AND entity_id = ? ORDER BY code';
        const result = await this.db.prepare(query).bind(accountType, this.entityId).all();
        return result.results.map(row => this.mapDbAccountToAccount(row));
    }
    async updateAccount(accountId, updates) {
        const fields = Object.keys(updates).filter(key => key !== 'id' && key !== 'createdAt' && key !== 'updatedAt' && updates[key] !== undefined);
        if (fields.length === 0) {
            return this.getAccount(accountId);
        }
        const now = new Date();
        const setClause = fields.map(key => `${this.toSnakeCase(key)} = ?`).join(', ');
        const values = fields.map(key => updates[key]);
        const query = `
      UPDATE accounts
      SET ${setClause}, updated_at = ?
      WHERE id = ? AND entity_id = ?
      RETURNING *
    `;
        const result = await this.db.prepare(query).bind(...values, now.getTime(), accountId, this.entityId).first();
        return result ? this.mapDbAccountToAccount(result) : null;
    }
    // Transaction Operations
    async createTransaction(transactionData) {
        const now = new Date();
        const transactionNumber = await this.generateTransactionNumber();
        const query = `
      INSERT INTO transactions (
        transaction_number, reference, description, transaction_date, posting_date,
        type, source, category, total_amount, status, entity_id,
        created_at, updated_at, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING *
    `;
        const totalAmount = transactionData.entries.reduce((sum, entry) => sum + (entry.debitAmount || 0) + (entry.creditAmount || 0), 0) / 2; // Divide by 2 since each amount is counted twice (debit and credit)
        const result = await this.db.prepare(query).bind(transactionNumber, transactionData.reference || null, transactionData.description, transactionData.transactionDate.getTime(), transactionData.transactionDate.getTime(), 'JOURNAL', 'MANUAL', null, totalAmount, 'DRAFT', this.entityId, now.getTime(), now.getTime(), 'system' // TransactionData doesn't have createdBy property
        ).first();
        return this.mapDbTransactionToTransaction(result);
    }
    async getTransaction(transactionId) {
        const query = 'SELECT * FROM transactions WHERE id = ? AND entity_id = ?';
        const result = await this.db.prepare(query).bind(transactionId, this.entityId).first();
        return result ? this.mapDbTransactionToTransaction(result) : null;
    }
    async updateTransactionStatus(transactionId, status, updatedBy) {
        const query = `
      UPDATE transactions 
      SET status = ?, updated_at = ?, updated_by = ?
      WHERE id = ? AND entity_id = ?
    `;
        await this.db.prepare(query).bind(status, new Date().getTime(), updatedBy || null, transactionId, this.entityId).run();
    }
    // Journal Entry Operations
    async createJournalEntries(entries) {
        const createdEntries = [];
        for (const entry of entries) {
            const query = `
        INSERT INTO journal_entries (
          transaction_id, line_number, account_id, description, memo,
          debit_amount, credit_amount, currency_code, exchange_rate,
          is_reconciled, entity_id, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        RETURNING *
      `;
            const result = await this.db.prepare(query).bind(entry.transactionId, 0, // line_number - not in JournalEntry interface
            entry.accountId, entry.description || null, null, // memo - not in JournalEntry interface
            entry.debitAmount || 0, entry.creditAmount || 0, entry.currency, entry.exchangeRate || 1.0, entry.isReconciled ? 1 : 0, this.entityId, entry.createdAt.getTime(), entry.updatedAt.getTime()).first();
            createdEntries.push(this.mapDbJournalEntryToJournalEntry(result));
        }
        return createdEntries;
    }
    async getJournalEntriesByTransaction(transactionId) {
        const query = `
      SELECT * FROM journal_entries 
      WHERE transaction_id = ? AND entity_id = ?
      ORDER BY line_number
    `;
        const result = await this.db.prepare(query).bind(transactionId, this.entityId).all();
        return result.results.map(row => this.mapDbJournalEntryToJournalEntry(row));
    }
    async getJournalEntriesByAccount(accountId) {
        const query = `
      SELECT * FROM journal_entries 
      WHERE account_id = ? AND entity_id = ?
      ORDER BY created_at DESC
    `;
        const result = await this.db.prepare(query).bind(accountId, this.entityId).all();
        return result.results.map(row => this.mapDbJournalEntryToJournalEntry(row));
    }
    async updateAccountBalance(accountId, newBalance) {
        const query = `
      UPDATE accounts 
      SET current_balance = ?, updated_at = ?
      WHERE id = ? AND entity_id = ?
    `;
        await this.db.prepare(query).bind(newBalance, new Date().getTime(), accountId, this.entityId).run();
    }
    // Helper Methods
    async generateTransactionNumber() {
        const year = new Date().getFullYear();
        const query = `
      SELECT COUNT(*) as count 
      FROM transactions 
      WHERE entity_id = ? AND transaction_number LIKE ?
    `;
        const result = await this.db.prepare(query).bind(this.entityId, `${year}-%`).first();
        const nextNumber = (result?.count || 0) + 1;
        return `${year}-${nextNumber.toString().padStart(6, '0')}`;
    }
    mapDbAccountToAccount(row) {
        return {
            id: row.id, // Account.id is number, not string
            code: row.code,
            name: row.name,
            description: row.description,
            type: row.type,
            subtype: row.subtype,
            category: row.category,
            parentId: row.parent_id, // parentId is number, not string
            level: row.level,
            path: row.path,
            isActive: Boolean(row.is_active),
            isSystem: Boolean(row.is_system),
            allowTransactions: Boolean(row.allow_transactions),
            normalBalance: row.normal_balance,
            reportCategory: row.report_category,
            reportOrder: row.report_order,
            currentBalance: row.current_balance,
            entityId: row.entity_id,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            createdBy: row.created_by,
            updatedBy: row.updated_by
        };
    }
    mapDbTransactionToTransaction(row) {
        return {
            id: row.id.toString(), // Convert number to string to match Transaction interface
            date: new Date(row.transaction_date).toISOString(), // Convert to ISO string
            description: row.description,
            reference: row.reference,
            status: row.status,
            entries: [], // Entries will be loaded separately
            createdAt: new Date(row.created_at).toISOString(), // Convert to ISO string
            updatedAt: new Date(row.updated_at).toISOString() // Convert to ISO string
        };
    }
    toSnakeCase(str) {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }
    mapDbJournalEntryToJournalEntry(row) {
        return {
            id: row.id,
            transactionId: row.transaction_id,
            accountId: row.account_id,
            description: row.description,
            debitAmount: row.debit_amount,
            creditAmount: row.credit_amount,
            currency: row.currency_code,
            exchangeRate: row.exchange_rate,
            baseCurrency: row.base_currency_code,
            baseDebitAmount: row.base_debit_amount,
            baseCreditAmount: row.base_credit_amount,
            entityId: row.entity_id,
            departmentId: row.department_id,
            projectId: row.project_id,
            reconciliationId: row.reconciliation_id,
            isReconciled: Boolean(row.is_reconciled),
            reconciledAt: row.reconciled_at ? new Date(row.reconciled_at) : undefined,
            reconciledBy: row.reconciled_by,
            createdAt: new Date(row.created_at),
            updatedAt: new Date(row.updated_at),
            createdBy: row.created_by,
            updatedBy: row.updated_by
        };
    }
}
// Database-Backed Account Registry
export class DatabaseAccountRegistry extends AccountRegistry {
    dbAdapter;
    constructor(dbAdapter) {
        super();
        this.dbAdapter = dbAdapter;
    }
    async loadAccountsFromDatabase() {
        const accounts = await this.dbAdapter.getAllAccounts();
        for (const account of accounts) {
            super.registerAccount(account);
        }
    }
    async registerAccount(account) {
        const createdAccount = await this.dbAdapter.createAccount(account);
        super.registerAccount(createdAccount);
        return createdAccount;
    }
    async getAccountFromDatabase(accountId) {
        return await this.dbAdapter.getAccount(Number.parseInt(accountId));
    }
    async getAccountsByTypeFromDatabase(accountType) {
        return await this.dbAdapter.getAccountsByType(accountType);
    }
}
// Database-Backed Journal Entry Manager
export class DatabaseJournalEntryManager extends JournalEntryManager {
    dbAdapter;
    constructor(dbAdapter, accountRegistry) {
        super(accountRegistry);
        this.dbAdapter = dbAdapter;
    }
    async createAndPersistTransaction(transactionData) {
        // Validate transaction data
        const validationErrors = TransactionValidator.validateTransactionData(transactionData);
        if (validationErrors.length > 0) {
            throw new AccountingValidationError('Transaction validation failed', 'INVALID_TRANSACTION_DATA', validationErrors);
        }
        // Create transaction header
        const transaction = await this.dbAdapter.createTransaction(transactionData);
        // Create journal entries
        const journalEntries = this.createJournalEntriesFromTransaction(parseInt(transaction.id), transactionData, 'system');
        // Validate journal entries
        const entryValidationErrors = this.validateJournalEntries(journalEntries);
        if (entryValidationErrors.length > 0) {
            throw new AccountingValidationError('Journal entry validation failed', 'INVALID_JOURNAL_ENTRIES', entryValidationErrors);
        }
        // Persist journal entries
        const persistedEntries = await this.dbAdapter.createJournalEntries(journalEntries);
        return {
            transaction,
            journalEntries: persistedEntries
        };
    }
    async postTransaction(transactionId, postedBy) {
        // Update transaction status to POSTED
        await this.dbAdapter.updateTransactionStatus(transactionId, 'POSTED', postedBy);
        // Update account balances
        const journalEntries = await this.dbAdapter.getJournalEntriesByTransaction(transactionId);
        for (const entry of journalEntries) {
            await this.updateAccountBalanceFromEntry(entry.accountId, entry);
        }
    }
    async getTransactionJournalEntries(transactionId) {
        return await this.dbAdapter.getJournalEntriesByTransaction(transactionId);
    }
    async getAccountJournalEntries(accountId) {
        return await this.dbAdapter.getJournalEntriesByAccount(accountId);
    }
    async updateAccountBalanceFromEntry(accountId, entry) {
        const account = await this.dbAdapter.getAccount(accountId);
        if (!account)
            return;
        const currentBalance = account.currentBalance || 0;
        const balanceChange = entry.debitAmount - entry.creditAmount;
        // Adjust for normal balance
        const adjustedChange = account.normalBalance === 'DEBIT' ? balanceChange : -balanceChange;
        const newBalance = currentBalance + adjustedChange;
        await this.dbAdapter.updateAccountBalance(accountId, newBalance);
    }
}
// Re-export auth functionality
export * from './auth/index';
// Re-export financial reports functionality
export * from './financial-reports';
