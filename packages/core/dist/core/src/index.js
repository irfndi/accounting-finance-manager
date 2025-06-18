/**
 * Finance Manager Core Module
 * Corporate Finance & Accounting Core Functionality
 * Professional Double-Entry Bookkeeping Engine
 */
// Core financial constants
export const FINANCIAL_CONSTANTS = {
    DECIMAL_PLACES: 2,
    DEFAULT_CURRENCY: 'USD',
    ACCOUNT_TYPES: {
        ASSET: 'ASSET',
        LIABILITY: 'LIABILITY',
        EQUITY: 'EQUITY',
        REVENUE: 'REVENUE',
        EXPENSE: 'EXPENSE',
    },
    NORMAL_BALANCES: {
        ASSET: 'DEBIT',
        EXPENSE: 'DEBIT',
        LIABILITY: 'CREDIT',
        EQUITY: 'CREDIT',
        REVENUE: 'CREDIT',
    },
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
// Utility functions
export function formatCurrency(amount, currency = FINANCIAL_CONSTANTS.DEFAULT_CURRENCY, locale = 'en-US') {
    return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        minimumFractionDigits: FINANCIAL_CONSTANTS.DECIMAL_PLACES,
        maximumFractionDigits: FINANCIAL_CONSTANTS.DECIMAL_PLACES,
    }).format(amount);
}
export function roundToDecimalPlaces(amount, places = FINANCIAL_CONSTANTS.DECIMAL_PLACES) {
    const factor = Math.pow(10, places);
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
export * from '@finance-manager/types';
