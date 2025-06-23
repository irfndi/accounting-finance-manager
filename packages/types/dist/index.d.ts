export type Currency = 'IDR' | 'USD' | 'EUR' | 'GBP' | 'SGD' | 'MYR';
export interface Money {
    amount: number;
    currency: Currency;
}
export type AccountType = 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
export type NormalBalance = 'DEBIT' | 'CREDIT';
export type TransactionStatus = 'DRAFT' | 'PENDING' | 'APPROVED' | 'POSTED' | 'CANCELLED' | 'REVERSED';
export interface Account {
    id: number;
    code: string;
    name: string;
    description?: string;
    type: AccountType;
    subtype?: string;
    category?: string;
    parentId?: number;
    level: number;
    path: string;
    isActive: boolean;
    isSystem: boolean;
    allowTransactions: boolean;
    normalBalance: NormalBalance;
    reportCategory?: string;
    reportOrder: number;
    currentBalance: number;
    entityId?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
}
export interface Transaction {
    id: string;
    date: string;
    description: string;
    reference?: string;
    status: TransactionStatus;
    entries: TransactionEntry[];
    createdAt: string;
    updatedAt: string;
}
export interface JournalEntry {
    id: number;
    transactionId: number;
    accountId: number;
    description?: string;
    debitAmount: number;
    creditAmount: number;
    currency: Currency;
    exchangeRate?: number;
    baseCurrency?: Currency;
    baseDebitAmount?: number;
    baseCreditAmount?: number;
    entityId?: string;
    departmentId?: string;
    projectId?: string;
    reconciliationId?: string;
    isReconciled: boolean;
    reconciledAt?: Date;
    reconciledBy?: string;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string;
    updatedBy?: string;
}
export interface TransactionEntry {
    accountId: number;
    accountCode?: string;
    description?: string;
    debitAmount?: number;
    creditAmount?: number;
    currency?: Currency;
    entityId?: string;
    departmentId?: string;
    projectId?: string;
}
export interface TransactionData {
    reference?: string;
    description: string;
    transactionDate: Date;
    currency: Currency;
    entityId?: string;
    departmentId?: string;
    projectId?: string;
    tags?: string[];
    notes?: string;
    entries: TransactionEntry[];
}
export interface ValidationError {
    field: string;
    message: string;
    code: string;
}
export interface AccountingError extends Error {
    code: string;
    details?: ValidationError[];
}
export interface AccountBalance {
    accountId: string;
    balance: number;
    currency: Currency;
    lastUpdated: Date;
    normalBalance: NormalBalance;
}
export interface TrialBalance {
    accounts: AccountBalance[];
    totalDebits: number;
    totalCredits: number;
    isBalanced: boolean;
    asOfDate: Date;
    currency: Currency;
}
export type DocumentStatus = 'PENDING' | 'UPLOADED' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
export type DocumentType = 'INVOICE' | 'RECEIPT' | 'BANK_STATEMENT' | 'OTHER';
export interface RawDocument {
    id: number;
    fileId: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    r2Key: string;
    r2Bucket: string;
    extractedText?: string | null;
    textLength: number;
    ocrConfidence?: number | null;
    ocrProcessingTime?: number | null;
    ocrStatus: string;
    ocrErrorMessage?: string | null;
    ocrProcessedAt?: Date | null;
    documentType?: string | null;
    category?: string | null;
    tags?: string | null;
    structuredData?: string | null;
    llmConfidence?: number | null;
    llmProcessedAt?: Date | null;
    uploadedBy: string;
    description?: string | null;
    searchableText?: string | null;
    entityId?: string | null;
    createdAt: Date;
    updatedAt: Date;
    createdBy?: string | null;
    updatedBy?: string | null;
}
export interface BalanceSheet {
    assets: AccountBalance[];
    liabilities: AccountBalance[];
    equity: AccountBalance[];
    totalAssets: number;
    totalLiabilities: number;
    totalEquity: number;
    isBalanced: boolean;
    asOfDate: Date;
    currency: Currency;
}
export interface IncomeStatement {
    revenues: AccountBalance[];
    expenses: AccountBalance[];
    totalRevenues: number;
    totalExpenses: number;
    netIncome: number;
    fromDate: Date;
    toDate: Date;
    currency: Currency;
}
//# sourceMappingURL=index.d.ts.map