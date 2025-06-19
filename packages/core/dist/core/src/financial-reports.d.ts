/**
 * Financial Reports Engine
 * Provides comprehensive financial reporting functionality
 */
export declare class FinancialReportsEngine {
    private dbAdapter;
    constructor(dbAdapter: any);
    generateTrialBalance(asOfDate: Date, entityId?: string): Promise<{
        asOfDate: string;
        entityId: string;
        accounts: never[];
        totals: {
            totalDebits: number;
            totalCredits: number;
            isBalanced: boolean;
        };
    }>;
    generateBalanceSheet(asOfDate: Date, entityId?: string): Promise<{
        asOfDate: string;
        entityId: string;
        assets: {
            current: never[];
            nonCurrent: never[];
            total: number;
        };
        liabilities: {
            current: never[];
            nonCurrent: never[];
            total: number;
        };
        equity: {
            accounts: never[];
            total: number;
        };
    }>;
    generateIncomeStatement(startDate: Date, endDate: Date, entityId?: string): Promise<{
        periodStart: string;
        periodEnd: string;
        entityId: string;
        revenue: {
            accounts: never[];
            total: number;
        };
        expenses: {
            accounts: never[];
            total: number;
        };
        netIncome: number;
    }>;
    getFinancialMetrics(asOfDate: Date, entityId?: string): Promise<{
        currentRatio: number;
        quickRatio: number;
        debtToEquityRatio: number;
    }>;
}
//# sourceMappingURL=financial-reports.d.ts.map