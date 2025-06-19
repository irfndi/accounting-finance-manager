/**
 * Test Database Setup
 * Production-ready test configuration using better-sqlite3 with Drizzle ORM
 */
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from '../src/schema';
import Database from 'better-sqlite3';
declare const mockD1: {
    prepare: () => {};
    batch: () => Promise<never[]>;
    exec: () => Promise<{}>;
    dump: () => Promise<{}>;
};
type TestDbAdapter = ReturnType<typeof drizzle<typeof schema>>;
interface TestUtils {
    createTestUser: (email: string, name: string, role?: string, entityId?: string) => Promise<any>;
    createTestAccount: (overrides?: any) => any;
    insertTestAccount: (overrides?: any) => Promise<any>;
    createTestTransaction: (data: any) => Promise<any>;
    seedTestData: () => Promise<void>;
    clearAllTables: () => Promise<void>;
}
declare global {
    var testDbAdapter: TestDbAdapter;
    var sqliteDb: Database.Database;
    var dbTestUtils: TestUtils;
}
export declare function createTestDatabase(): {
    sqliteDb: any;
    drizzleDb: any;
};
declare const sqliteDb: any;
declare const testDbAdapter: import("drizzle-orm/better-sqlite3").BetterSQLite3Database<typeof schema> & {
    $client: Database.Database;
};
declare const dbTestUtils: {
    createTestUser(email: string, name: string, role?: string, entityId?: string): Promise<{
        id: string;
        email: string;
        emailVerified: boolean;
        passwordHash: string | null;
        firstName: string | null;
        lastName: string | null;
        displayName: string | null;
        timezone: string | null;
        locale: string | null;
        isActive: boolean;
        isVerified: boolean;
        role: string;
        permissions: string | null;
        entityId: string | null;
        entityAccess: string | null;
        lastLoginAt: Date | null;
        lastLoginIp: string | null;
        failedLoginAttempts: number;
        lockedUntil: Date | null;
        twoFactorEnabled: boolean;
        twoFactorSecret: string | null;
        backupCodes: string | null;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string | null;
        updatedBy: string | null;
    } | undefined>;
    createTestAccount(overrides?: any): any;
    insertTestAccount(overrides?: any): Promise<{
        id: number;
        code: string;
        name: string;
        description: string | null;
        type: string;
        subtype: string | null;
        category: string | null;
        parentId: number | null;
        level: number;
        path: string;
        isActive: number;
        isSystem: number;
        allowTransactions: number;
        normalBalance: string;
        reportCategory: string | null;
        reportOrder: number | null;
        currentBalance: number;
        entityId: string;
        createdAt: number;
        updatedAt: number;
        createdBy: string | null;
        updatedBy: string | null;
    } | undefined>;
    createTestTransaction(data: any): Promise<{
        id: number;
        transactionNumber: string;
        reference: string | null;
        description: string;
        transactionDate: Date;
        postingDate: Date;
        type: string;
        source: string;
        category: string | null;
        totalAmount: number;
        status: string;
        isReversed: boolean;
        reversedTransactionId: number | null;
        entityId: string | null;
        approvedBy: string | null;
        approvedAt: Date | null;
        documentCount: number;
        createdAt: Date;
        updatedAt: Date;
        createdBy: string;
        updatedBy: string | null;
        postedAt: Date | null;
        postedBy: string | null;
    } | undefined>;
    seedTestData(): Promise<void>;
    clearAllTables(): Promise<void>;
};
export { testDbAdapter, sqliteDb, dbTestUtils, mockD1 };
//# sourceMappingURL=setup.d.ts.map