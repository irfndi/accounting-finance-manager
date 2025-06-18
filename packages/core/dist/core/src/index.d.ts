/**
 * Finance Manager Core Module
 * Corporate Finance & Accounting Core Functionality
 * Professional Double-Entry Bookkeeping Engine
 */
import type { Currency, AccountType, NormalBalance, Transaction, JournalEntry, TransactionEntry, TransactionData, ValidationError, AccountingError } from '@finance-manager/types';
export declare const FINANCIAL_CONSTANTS: {
    readonly DECIMAL_PLACES: 2;
    readonly DEFAULT_CURRENCY: Currency;
    readonly ACCOUNT_TYPES: {
        readonly ASSET: "ASSET";
        readonly LIABILITY: "LIABILITY";
        readonly EQUITY: "EQUITY";
        readonly REVENUE: "REVENUE";
        readonly EXPENSE: "EXPENSE";
    };
    readonly NORMAL_BALANCES: {
        readonly ASSET: "DEBIT";
        readonly EXPENSE: "DEBIT";
        readonly LIABILITY: "CREDIT";
        readonly EQUITY: "CREDIT";
        readonly REVENUE: "CREDIT";
    };
};
export declare class AccountingValidationError extends Error implements AccountingError {
    readonly code: string;
    readonly details?: ValidationError[];
    constructor(message: string, code: string, details?: ValidationError[]);
}
export declare class DoubleEntryError extends AccountingValidationError {
    constructor(message: string, details?: ValidationError[]);
}
export declare function formatCurrency(amount: number, currency?: Currency, locale?: string): string;
export declare function roundToDecimalPlaces(amount: number, places?: number): number;
export declare function getNormalBalance(accountType: AccountType): NormalBalance;
export declare class TransactionValidator {
    /**
     * Validates that the sum of debits equals the sum of credits
     */
    static validateDoubleEntry(entries: TransactionEntry[]): ValidationError[];
    /**
     * Validates transaction data structure
     */
    static validateTransactionData(transactionData: TransactionData): ValidationError[];
}
export declare class TransactionBuilder {
    private transactionData;
    constructor();
    reset(): TransactionBuilder;
    setDescription(description: string): TransactionBuilder;
    setReference(reference: string): TransactionBuilder;
    setDate(date: Date): TransactionBuilder;
    setCurrency(currency: Currency): TransactionBuilder;
    debit(accountId: number, amount: number, description?: string): TransactionBuilder;
    credit(accountId: number, amount: number, description?: string): TransactionBuilder;
    validate(): ValidationError[];
    build(): TransactionData;
}
export declare class BalanceCalculator {
    /**
     * Calculates the balance for an account based on its normal balance type
     */
    static calculateAccountBalance(accountType: AccountType, normalBalance: NormalBalance, debitTotal: number, creditTotal: number): number;
}
export declare class AccountingEngine {
    /**
     * Creates a new transaction with validation
     */
    static createTransaction(transactionData: TransactionData): TransactionData;
    /**
     * Validates an existing transaction
     */
    static validateTransaction(transaction: Transaction, journalEntries: JournalEntry[]): ValidationError[];
}
export * from '@finance-manager/types';
//# sourceMappingURL=index.d.ts.map