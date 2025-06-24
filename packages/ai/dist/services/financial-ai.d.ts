/**
 * Financial AI Service
 * Specialized AI service for financial operations and analysis
 */
import type { FinancialAnalysisResponse, OCRResult, DocumentClassification } from '../types.js';
import type { AIService } from './ai-service.js';
interface Transaction {
    id: string;
    amount: number;
    description: string;
    category?: string;
    date: string;
    accountId: string;
}
interface TransactionEntry {
    id: string;
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    accountId: number;
    debitAmount?: number;
    creditAmount?: number;
}
interface Account {
    id: string;
    name: string;
    type: string;
    balance: number;
    code: string;
}
export declare class FinancialAIService {
    private aiService;
    constructor(aiService: AIService);
    /**
     * Analyze a financial transaction for accuracy and compliance
     */
    analyzeTransaction(transaction: Transaction): Promise<FinancialAnalysisResponse>;
    /**
     * Categorize expenses automatically
     */
    categorizeExpense(description: string, amount: number, merchant?: string, existingCategories?: string[]): Promise<{
        category: string;
        subcategory?: string;
        confidence: number;
    }>;
    /**
     * Generate financial insights and recommendations
     */
    generateInsights(data: {
        transactions?: Transaction[];
        accounts?: Account[];
        timeframe?: string;
        context?: string;
    }): Promise<FinancialAnalysisResponse>;
    /**
     * Check financial data for compliance issues
     */
    checkCompliance(data: any, regulations?: string[]): Promise<FinancialAnalysisResponse>;
    /**
     * Generate a financial report summary
     */
    generateReportSummary(reportData: any, reportType: 'balance_sheet' | 'income_statement' | 'cash_flow' | 'trial_balance'): Promise<string>;
    /**
     * Extract structured data from financial documents
     */
    extractDocumentData(ocrResult: OCRResult, documentType?: 'receipt' | 'invoice' | 'bank_statement'): Promise<any>;
    /**
     * Classify financial documents
     */
    classifyDocument(ocrResult: OCRResult): Promise<DocumentClassification>;
    /**
     * Generate transaction entries from natural language description
     */
    generateTransactionEntries(description: string, amount: number, availableAccounts: Account[]): Promise<TransactionEntry[]>;
    /**
     * Get the health status of the underlying AI service
     */
    getHealthStatus(): Promise<Record<string, {
        available: boolean;
        error?: string;
    }>>;
}
export {};
//# sourceMappingURL=financial-ai.d.ts.map