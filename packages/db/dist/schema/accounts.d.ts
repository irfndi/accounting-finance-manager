import { z } from "zod";
/**
 * Chart of Accounts - Core financial accounts structure
 * Supports hierarchical account structure with parent-child relationships
 */
export declare const accounts: any;
export declare const AccountType: {
    readonly ASSET: "ASSET";
    readonly LIABILITY: "LIABILITY";
    readonly EQUITY: "EQUITY";
    readonly REVENUE: "REVENUE";
    readonly EXPENSE: "EXPENSE";
};
export type AccountType = typeof AccountType[keyof typeof AccountType];
export declare const NormalBalance: {
    readonly DEBIT: "DEBIT";
    readonly CREDIT: "CREDIT";
};
export type NormalBalance = typeof NormalBalance[keyof typeof NormalBalance];
export declare const insertAccountSchema: any;
export declare const selectAccountSchema: any;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type SelectAccount = z.infer<typeof selectAccountSchema>;
//# sourceMappingURL=accounts.d.ts.map