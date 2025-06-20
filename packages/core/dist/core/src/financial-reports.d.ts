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
        startDate: string;
        endDate: string;
        periodStart: string;
        periodEnd: string;
        entityId: string;
        revenue: {
            accounts: never[];
            operating: never[];
            nonOperating: never[];
            total: number;
        };
        expenses: {
            accounts: never[];
            operating: never[];
            nonOperating: never[];
            total: number;
        };
        netIncome: number;
    }>;
    generateCashFlowStatement(startDate: Date, endDate: Date, entityId?: string): Promise<{
        startDate: string;
        endDate: string;
        entityId: string;
        operating: {
            activities: never[];
            total: number;
        };
        investing: {
            activities: never[];
            total: number;
        };
        financing: {
            activities: never[];
            total: number;
        };
        netChangeInCash: number;
    }>;
    getFinancialMetrics(_asOfDate: Date, entityId?: string): Promise<{
        currentRatio: number;
        quickRatio: number;
        debtToEquityRatio: number;
    }>;
}
//# sourceMappingURL=financial-reports.d.ts.map