/**
 * Finance Manager Core Module
 * Corporate Finance & Accounting Core Functionality
 */
export declare const FINANCIAL_CONSTANTS: {
    readonly DECIMAL_PLACES: 2;
    readonly DEFAULT_CURRENCY: "USD";
    readonly ACCOUNT_TYPES: {
        readonly ASSET: "asset";
        readonly LIABILITY: "liability";
        readonly EQUITY: "equity";
        readonly REVENUE: "revenue";
        readonly EXPENSE: "expense";
    };
};
export declare function formatCurrency(amount: number, currency?: "USD", locale?: string): string;
export declare function validateAccountNumber(accountNumber: string): boolean;
export type AccountType = typeof FINANCIAL_CONSTANTS.ACCOUNT_TYPES[keyof typeof FINANCIAL_CONSTANTS.ACCOUNT_TYPES];
export interface FinancialAccount {
    id: string;
    name: string;
    type: AccountType;
    number: string;
    balance: number;
    currency: string;
}
export declare class FinanceManager {
    private accounts;
    addAccount(account: FinancialAccount): void;
    getAccount(id: string): FinancialAccount | undefined;
    getTotalBalance(): number;
}
//# sourceMappingURL=index.d.ts.map