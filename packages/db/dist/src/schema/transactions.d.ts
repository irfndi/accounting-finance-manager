import { z } from "zod";
/**
 * Financial Transactions - Header record for double-entry transactions
 * Each transaction contains multiple journal entries that must balance
 */
export declare const transactions: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "transactions";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "transactions";
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
        transactionNumber: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "transaction_number";
            tableName: "transactions";
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
        reference: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "reference";
            tableName: "transactions";
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
        description: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "description";
            tableName: "transactions";
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
        transactionDate: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "transaction_date";
            tableName: "transactions";
            dataType: "date";
            columnType: "SQLiteTimestamp";
            data: Date;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        postingDate: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "posting_date";
            tableName: "transactions";
            dataType: "date";
            columnType: "SQLiteTimestamp";
            data: Date;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        type: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "type";
            tableName: "transactions";
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
        source: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "source";
            tableName: "transactions";
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
        category: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "category";
            tableName: "transactions";
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
        totalAmount: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "total_amount";
            tableName: "transactions";
            dataType: "number";
            columnType: "SQLiteReal";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        status: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "status";
            tableName: "transactions";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: true;
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
        isReversed: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "is_reversed";
            tableName: "transactions";
            dataType: "boolean";
            columnType: "SQLiteBoolean";
            data: boolean;
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
        reversedTransactionId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "reversed_transaction_id";
            tableName: "transactions";
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
        entityId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "entity_id";
            tableName: "transactions";
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
        approvedBy: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "approved_by";
            tableName: "transactions";
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
        approvedAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "approved_at";
            tableName: "transactions";
            dataType: "date";
            columnType: "SQLiteTimestamp";
            data: Date;
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
        documentCount: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "document_count";
            tableName: "transactions";
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
        createdAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "created_at";
            tableName: "transactions";
            dataType: "date";
            columnType: "SQLiteTimestamp";
            data: Date;
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
            tableName: "transactions";
            dataType: "date";
            columnType: "SQLiteTimestamp";
            data: Date;
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
            tableName: "transactions";
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
        updatedBy: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "updated_by";
            tableName: "transactions";
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
        postedAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "posted_at";
            tableName: "transactions";
            dataType: "date";
            columnType: "SQLiteTimestamp";
            data: Date;
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
        postedBy: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "posted_by";
            tableName: "transactions";
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
/**
 * Journal Entries - Individual debit/credit entries for each transaction
 * Implements double-entry accounting where debits must equal credits
 */
export declare const journalEntries: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "journal_entries";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "journal_entries";
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
        transactionId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "transaction_id";
            tableName: "journal_entries";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        lineNumber: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "line_number";
            tableName: "journal_entries";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        accountId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "account_id";
            tableName: "journal_entries";
            dataType: "number";
            columnType: "SQLiteInteger";
            data: number;
            driverParam: number;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: false;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: undefined;
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {}>;
        description: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "description";
            tableName: "journal_entries";
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
        memo: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "memo";
            tableName: "journal_entries";
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
        debitAmount: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "debit_amount";
            tableName: "journal_entries";
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
        creditAmount: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "credit_amount";
            tableName: "journal_entries";
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
        currencyCode: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "currency_code";
            tableName: "journal_entries";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: false;
            hasDefault: true;
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
        exchangeRate: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "exchange_rate";
            tableName: "journal_entries";
            dataType: "number";
            columnType: "SQLiteReal";
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
        isReconciled: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "is_reconciled";
            tableName: "journal_entries";
            dataType: "boolean";
            columnType: "SQLiteBoolean";
            data: boolean;
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
        reconciledAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "reconciled_at";
            tableName: "journal_entries";
            dataType: "date";
            columnType: "SQLiteTimestamp";
            data: Date;
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
        reconciliationReference: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "reconciliation_reference";
            tableName: "journal_entries";
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
        entityId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "entity_id";
            tableName: "journal_entries";
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
        createdAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "created_at";
            tableName: "journal_entries";
            dataType: "date";
            columnType: "SQLiteTimestamp";
            data: Date;
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
            tableName: "journal_entries";
            dataType: "date";
            columnType: "SQLiteTimestamp";
            data: Date;
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
    };
    dialect: "sqlite";
}>;
export declare const TransactionType: {
    readonly JOURNAL: "JOURNAL";
    readonly PAYMENT: "PAYMENT";
    readonly RECEIPT: "RECEIPT";
    readonly ADJUSTMENT: "ADJUSTMENT";
    readonly TRANSFER: "TRANSFER";
    readonly ACCRUAL: "ACCRUAL";
    readonly DEPRECIATION: "DEPRECIATION";
};
export type TransactionType = typeof TransactionType[keyof typeof TransactionType];
export declare const TransactionStatus: {
    readonly DRAFT: "DRAFT";
    readonly POSTED: "POSTED";
    readonly REVERSED: "REVERSED";
    readonly VOID: "VOID";
};
export type TransactionStatus = typeof TransactionStatus[keyof typeof TransactionStatus];
export declare const TransactionSource: {
    readonly MANUAL: "MANUAL";
    readonly IMPORT: "IMPORT";
    readonly API: "API";
    readonly SYSTEM: "SYSTEM";
};
export type TransactionSource = typeof TransactionSource[keyof typeof TransactionSource];
export declare const insertTransactionSchema: z.ZodObject<{
    transactionNumber: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["JOURNAL", "PAYMENT", "RECEIPT", "ADJUSTMENT", "TRANSFER", "ACCRUAL", "DEPRECIATION"]>;
    source: z.ZodEnum<["MANUAL", "IMPORT", "API", "SYSTEM"]>;
    status: z.ZodEnum<["DRAFT", "POSTED", "REVERSED", "VOID"]>;
    totalAmount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    description: string;
    type: "JOURNAL" | "PAYMENT" | "RECEIPT" | "ADJUSTMENT" | "TRANSFER" | "ACCRUAL" | "DEPRECIATION";
    status: "DRAFT" | "POSTED" | "REVERSED" | "VOID";
    transactionNumber: string;
    source: "MANUAL" | "IMPORT" | "API" | "SYSTEM";
    totalAmount: number;
}, {
    description: string;
    type: "JOURNAL" | "PAYMENT" | "RECEIPT" | "ADJUSTMENT" | "TRANSFER" | "ACCRUAL" | "DEPRECIATION";
    status: "DRAFT" | "POSTED" | "REVERSED" | "VOID";
    transactionNumber: string;
    source: "MANUAL" | "IMPORT" | "API" | "SYSTEM";
    totalAmount: number;
}>;
export declare const insertJournalEntrySchema: z.ZodObject<{
    transactionId: z.ZodNumber;
    accountId: z.ZodNumber;
    debitAmount: z.ZodNumber;
    creditAmount: z.ZodNumber;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    transactionId: number;
    accountId: number;
    debitAmount: number;
    creditAmount: number;
    description?: string | undefined;
}, {
    transactionId: number;
    accountId: number;
    debitAmount: number;
    creditAmount: number;
    description?: string | undefined;
}>;
export declare const selectTransactionSchema: z.ZodObject<{
    id: z.ZodNumber;
    transactionNumber: z.ZodString;
    description: z.ZodString;
    type: z.ZodEnum<["JOURNAL", "PAYMENT", "RECEIPT", "ADJUSTMENT", "TRANSFER", "ACCRUAL", "DEPRECIATION"]>;
    status: z.ZodEnum<["DRAFT", "POSTED", "REVERSED", "VOID"]>;
}, "strip", z.ZodTypeAny, {
    id: number;
    description: string;
    type: "JOURNAL" | "PAYMENT" | "RECEIPT" | "ADJUSTMENT" | "TRANSFER" | "ACCRUAL" | "DEPRECIATION";
    status: "DRAFT" | "POSTED" | "REVERSED" | "VOID";
    transactionNumber: string;
}, {
    id: number;
    description: string;
    type: "JOURNAL" | "PAYMENT" | "RECEIPT" | "ADJUSTMENT" | "TRANSFER" | "ACCRUAL" | "DEPRECIATION";
    status: "DRAFT" | "POSTED" | "REVERSED" | "VOID";
    transactionNumber: string;
}>;
export declare const selectJournalEntrySchema: z.ZodObject<{
    id: z.ZodNumber;
    transactionId: z.ZodNumber;
    accountId: z.ZodNumber;
    debitAmount: z.ZodNumber;
    creditAmount: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    id: number;
    transactionId: number;
    accountId: number;
    debitAmount: number;
    creditAmount: number;
}, {
    id: number;
    transactionId: number;
    accountId: number;
    debitAmount: number;
    creditAmount: number;
}>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type SelectTransaction = z.infer<typeof selectTransactionSchema>;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type SelectJournalEntry = z.infer<typeof selectJournalEntrySchema>;
//# sourceMappingURL=transactions.d.ts.map