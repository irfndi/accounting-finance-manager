/**
 * Finance Manager Core Module
 * Corporate Finance & Accounting Core Functionality
 * Professional Double-Entry Bookkeeping Engine
 */
import type { Currency, AccountType, NormalBalance, TransactionStatus, Account, Transaction, JournalEntry, TransactionEntry, TransactionData, ValidationError as BaseValidationError, AccountingError, AccountBalance, TrialBalance, BalanceSheet, IncomeStatement } from '@finance-manager/types';
export declare const FINANCIAL_CONSTANTS: {
    DECIMAL_PLACES: number;
    DEFAULT_CURRENCY: Currency;
    SUPPORTED_CURRENCIES: readonly Currency[];
    CURRENCY_SYMBOLS: {
        [key in Currency]: string;
    };
    CURRENCY_LOCALES: {
        [key in Currency]: string;
    };
    ACCOUNT_TYPES: {
        [key: string]: AccountType;
    };
    NORMAL_BALANCES: {
        [key in AccountType]: NormalBalance;
    };
};
export declare class AccountingValidationError extends Error implements AccountingError {
    readonly code: string;
    readonly details?: BaseValidationError[];
    constructor(message: string, code: string, details?: BaseValidationError[]);
}
export declare class DoubleEntryError extends AccountingValidationError {
    constructor(message: string, details?: BaseValidationError[]);
}
export declare enum ErrorSeverity {
    WARNING = "WARNING",
    ERROR = "ERROR",
    CRITICAL = "CRITICAL"
}
export declare enum ErrorCategory {
    VALIDATION = "VALIDATION",
    BUSINESS_RULE = "BUSINESS_RULE",
    SYSTEM = "SYSTEM",
    COMPLIANCE = "COMPLIANCE"
}
export interface EnhancedValidationError extends BaseValidationError {
    severity: ErrorSeverity;
    category: ErrorCategory;
    suggestions?: string[];
    context?: Record<string, unknown>;
    timestamp?: Date;
}
export declare class BalanceSheetError extends AccountingValidationError {
    constructor(message: string, details?: BaseValidationError[]);
}
export declare class AccountRegistryError extends AccountingValidationError {
    constructor(message: string, details?: BaseValidationError[]);
}
export declare class CurrencyConversionError extends AccountingValidationError {
    constructor(message: string, details?: BaseValidationError[]);
}
export declare class PeriodClosureError extends AccountingValidationError {
    constructor(message: string, details?: BaseValidationError[]);
}
export declare class FiscalYearError extends AccountingValidationError {
    constructor(message: string, details?: BaseValidationError[]);
}
export declare class ComplianceError extends AccountingValidationError {
    constructor(message: string, details?: BaseValidationError[]);
}
export declare class ErrorAggregator {
    private errors;
    private warnings;
    addError(error: EnhancedValidationError): void;
    addErrors(errors: EnhancedValidationError[]): void;
    hasErrors(): boolean;
    hasWarnings(): boolean;
    getErrors(): EnhancedValidationError[];
    getWarnings(): EnhancedValidationError[];
    getAllIssues(): EnhancedValidationError[];
    getCriticalErrors(): EnhancedValidationError[];
    getErrorsByCategory(category: ErrorCategory): EnhancedValidationError[];
    clear(): void;
    generateReport(): {
        summary: {
            totalErrors: number;
            totalWarnings: number;
            criticalErrors: number;
            byCategory: Record<ErrorCategory, number>;
            bySeverity: Record<ErrorSeverity, number>;
        };
        issues: EnhancedValidationError[];
    };
}
export declare namespace AccountingErrorFactory {
    function createValidationError(field: string, message: string, code: string, severity?: ErrorSeverity, category?: ErrorCategory, suggestions?: string[], context?: Record<string, unknown>): EnhancedValidationError;
    function createBusinessRuleError(field: string, message: string, code: string, suggestions?: string[]): EnhancedValidationError;
    function createComplianceError(field: string, message: string, code: string, severity?: ErrorSeverity): EnhancedValidationError;
    function createSystemError(field: string, message: string, code: string, context?: Record<string, unknown>): EnhancedValidationError;
}
export declare namespace ErrorRecoveryManager {
    function getSuggestions(errorCode: string): string[];
    function enhanceError(error: BaseValidationError): EnhancedValidationError;
}
export declare function formatCurrency(amount: number, currency?: Currency): string;
export declare function roundToDecimalPlaces(amount: number, places?: number): number;
export declare function getNormalBalance(accountType: AccountType): NormalBalance;
export declare class TransactionValidator {
    /**
     * Validates that the sum of debits equals the sum of credits
     */
    static validateDoubleEntry(entries: TransactionEntry[]): BaseValidationError[];
    /**
     * Validates transaction data structure
     */
    static validateTransactionData(transactionData: TransactionData): BaseValidationError[];
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
    validate(): BaseValidationError[];
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
    static validateTransaction(transaction: Transaction, journalEntries: JournalEntry[]): BaseValidationError[];
}
/**
 * Account Balance Manager - Handles balance calculations and account management
 */
export declare class AccountBalanceManager {
    private accountBalances;
    private transactions;
    /**
     * Add a transaction to the balance manager
     */
    addTransaction(transaction: Transaction): void;
    /**
     * Update account balances based on a transaction
     */
    private updateBalancesFromTransaction;
    /**
     * Get balance for a specific account
     */
    getAccountBalance(accountId: string): AccountBalance | null;
    /**
     * Get all account balances
     */
    getAllBalances(): Map<string, AccountBalance>;
    /**
     * Calculate account balance for a specific date
     */
    calculateAccountBalance(accountId: string, accountType: AccountType, asOfDate?: Date): number;
    /**
     * Generate trial balance
     */
    generateTrialBalance(asOfDate?: Date): TrialBalance;
    /**
     * Generate balance sheet
     */
    generateBalanceSheet(asOfDate?: Date): BalanceSheet;
    /**
     * Generate income statement
     */
    generateIncomeStatement(startDate: Date, endDate: Date): IncomeStatement;
    /**
     * Reset all balances and transactions
     */
    reset(): void;
    /**
     * Get normal balance for account (helper method)
     */
    private getNormalBalanceForAccount;
    /**
     * Get account type for account (helper method)
     */
    private getAccountTypeForAccount;
}
/**
 * Account Registry - Manages account definitions and metadata
 */
export declare class AccountRegistry {
    private accounts;
    /**
     * Register an account
     */
    registerAccount(account: Account): void;
    /**
     * Get account by ID
     */
    getAccount(accountId: string): Account | null;
    /**
     * Get all accounts of a specific type
     */
    getAccountsByType(accountType: AccountType): Account[];
    /**
     * Get all accounts
     */
    getAllAccounts(): Account[];
    /**
     * Check if account exists
     */
    hasAccount(accountId: string): boolean;
    /**
     * Remove account
     */
    removeAccount(accountId: string): boolean;
    /**
     * Get account balance type
     */
    getAccountNormalBalance(accountId: string): NormalBalance | null;
}
/**
 * Journal Entry Manager - Handles journal entry creation, validation, and posting
 */
export declare class JournalEntryManager {
    private journalEntries;
    private nextId;
    private accountRegistry;
    constructor(accountRegistry?: AccountRegistry);
    /**
     * Create journal entries from transaction data
     */
    createJournalEntriesFromTransaction(transactionId: number, transactionData: TransactionData, createdBy?: string): JournalEntry[];
    /**
     * Validate journal entries for a transaction
     */
    validateJournalEntries(entries: JournalEntry[]): BaseValidationError[];
    /**
     * Validate a single journal entry
     */
    private validateSingleJournalEntry;
    /**
     * Validate double-entry balance
     */
    private validateDoubleEntryBalance;
    /**
     * Validate account compatibility with registry
     */
    private validateAccountCompatibility;
    /**
     * Post journal entries (mark as posted)
     */
    postJournalEntries(entryIds: number[], postedBy?: string): JournalEntry[];
    /**
     * Get journal entries by transaction ID
     */
    getJournalEntriesByTransaction(transactionId: number): JournalEntry[];
    /**
     * Get journal entries by account ID
     */
    getJournalEntriesByAccount(accountId: number): JournalEntry[];
    /**
     * Get journal entry by ID
     */
    getJournalEntry(id: number): JournalEntry | null;
    /**
     * Get all journal entries
     */
    getAllJournalEntries(): JournalEntry[];
    /**
     * Reconcile journal entry
     */
    reconcileJournalEntry(entryId: number, reconciliationId: string, reconciledBy?: string): JournalEntry | null;
    /**
     * Unreoncile journal entry
     */
    unreconcileJournalEntry(entryId: number, unreconciledBy?: string): JournalEntry | null;
    /**
     * Delete journal entries by transaction ID
     */
    deleteJournalEntriesByTransaction(transactionId: number): number;
    /**
     * Get exchange rate (placeholder implementation)
     */
    private getExchangeRate;
    /**
     * Reset journal entry manager
     */
    reset(): void;
    /**
     * Get journal entry statistics
     */
    getStatistics(): {
        totalEntries: number;
        reconciledEntries: number;
        unreconciledEntries: number;
        entriesByAccount: {
            [accountId: number]: number;
        };
        entriesByCurrency: {
            [currency: string]: number;
        };
    };
}
export interface D1Database {
    prepare(query: string): {
        bind(...values: unknown[]): {
            all(): Promise<{
                results: unknown[];
            }>;
            first(): Promise<unknown>;
            run(): Promise<{
                success: boolean;
                meta: {
                    changes: number;
                    last_row_id: number;
                };
            }>;
        };
    };
}
export interface DatabaseConfig {
    database: D1Database;
    entityId?: string;
    defaultCurrency?: Currency;
}
export declare class DatabaseAdapter {
    private db;
    private entityId;
    private defaultCurrency;
    constructor(config: DatabaseConfig);
    createAccount(account: Omit<Account, 'id' | 'createdAt' | 'updatedAt'>): Promise<Account>;
    getAccount(accountId: number): Promise<Account | null>;
    getAllAccounts(): Promise<Account[]>;
    getAccountsByType(accountType: AccountType): Promise<Account[]>;
    createTransaction(transactionData: TransactionData): Promise<Transaction>;
    getTransaction(transactionId: number): Promise<Transaction | null>;
    updateTransactionStatus(transactionId: number, status: TransactionStatus, updatedBy?: string): Promise<void>;
    createJournalEntries(entries: JournalEntry[]): Promise<JournalEntry[]>;
    getJournalEntriesByTransaction(transactionId: number): Promise<JournalEntry[]>;
    getJournalEntriesByAccount(accountId: number): Promise<JournalEntry[]>;
    updateAccountBalance(accountId: number, newBalance: number): Promise<void>;
    private generateTransactionNumber;
    private mapDbAccountToAccount;
    private mapDbTransactionToTransaction;
    private mapDbJournalEntryToJournalEntry;
}
export declare class DatabaseAccountRegistry extends AccountRegistry {
    private dbAdapter;
    constructor(dbAdapter: DatabaseAdapter);
    loadAccountsFromDatabase(): Promise<void>;
    registerAccount(account: Account): Promise<Account>;
    getAccountFromDatabase(accountId: string): Promise<Account | null>;
    getAccountsByTypeFromDatabase(accountType: AccountType): Promise<Account[]>;
}
export declare class DatabaseJournalEntryManager extends JournalEntryManager {
    private dbAdapter;
    constructor(dbAdapter: DatabaseAdapter, accountRegistry?: AccountRegistry);
    createAndPersistTransaction(transactionData: TransactionData): Promise<{
        transaction: Transaction;
        journalEntries: JournalEntry[];
    }>;
    postTransaction(transactionId: number, postedBy?: string): Promise<void>;
    getTransactionJournalEntries(transactionId: number): Promise<JournalEntry[]>;
    getAccountJournalEntries(accountId: number): Promise<JournalEntry[]>;
    private updateAccountBalanceFromEntry;
}
export { createAuthService } from './auth/index';
export { AuthUser, JWTPayload, SessionData, MagicLinkData, AuthContext, LoginRequest, RegistrationRequest, MagicLinkVerificationRequest, PasswordResetRequest, PasswordChangeRequest, AuthResponse, SessionValidation, UserRole, MagicLinkPurpose, AuditEventType, RateLimitConfig, JWTConfig, EmailConfig, AuthConfig, AuthError, UnauthorizedError, ForbiddenError, NotFoundError, RateLimitError, ValidationError as AuthValidationError, AUTH_ERROR_CODES, AuthErrorCode } from './auth/types';
export * from './financial-reports';
//# sourceMappingURL=index.d.ts.map