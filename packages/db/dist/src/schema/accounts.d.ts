import { z } from "zod";
/**
 * Chart of Accounts - Core financial accounts structure
 * Supports hierarchical account structure with parent-child relationships
 */
export declare const accounts: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "accounts";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "accounts";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        code: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "code";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        name: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "name";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        description: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "description";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        type: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "type";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        subtype: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "subtype";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        category: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "category";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        parentId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "parent_id";
            tableName: "accounts";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        level: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "level";
            tableName: "accounts";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        path: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "path";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        isActive: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "is_active";
            tableName: "accounts";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        isSystem: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "is_system";
            tableName: "accounts";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        allowTransactions: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "allow_transactions";
            tableName: "accounts";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        normalBalance: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "normal_balance";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        reportCategory: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "report_category";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        reportOrder: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "report_order";
            tableName: "accounts";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: false;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        currentBalance: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "current_balance";
            tableName: "accounts";
            dataType: "number";
            columnType: "SQLiteReal";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        entityId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "entity_id";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        createdAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "created_at";
            tableName: "accounts";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: true;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        updatedAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "updated_at";
            tableName: "accounts";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: true;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: true;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        createdBy: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "created_by";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        updatedBy: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "updated_by";
            tableName: "accounts";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
    };
    dialect: "sqlite";
}>;
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
export declare const insertAccountSchema: z.ZodObject<{
    code: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]>;
    normalBalance: z.ZodEnum<["DEBIT", "CREDIT"]>;
}, "strip", z.ZodTypeAny, {
    code: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
    normalBalance: "DEBIT" | "CREDIT";
}, {
    code: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
    normalBalance: "DEBIT" | "CREDIT";
}>;
export declare const selectAccountSchema: z.ZodObject<{
    id: z.ZodNumber;
    code: z.ZodString;
    name: z.ZodString;
    type: z.ZodEnum<["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"]>;
    normalBalance: z.ZodEnum<["DEBIT", "CREDIT"]>;
}, "strip", z.ZodTypeAny, {
    id: number;
    code: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
    normalBalance: "DEBIT" | "CREDIT";
}, {
    id: number;
    code: string;
    name: string;
    type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE";
    normalBalance: "DEBIT" | "CREDIT";
}>;
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type SelectAccount = z.infer<typeof selectAccountSchema>;
//# sourceMappingURL=accounts.d.ts.map