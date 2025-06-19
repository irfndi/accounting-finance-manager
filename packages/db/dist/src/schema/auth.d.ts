import { z } from "zod";
/**
 * Users - Core user management for authentication
 * Supports email-based authentication with magic links and optional password
 */
export declare const users: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "users";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "users";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        email: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "email";
            tableName: "users";
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
        emailVerified: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "email_verified";
            tableName: "users";
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
        passwordHash: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "password_hash";
            tableName: "users";
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
        firstName: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "first_name";
            tableName: "users";
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
        lastName: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "last_name";
            tableName: "users";
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
        displayName: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "display_name";
            tableName: "users";
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
        timezone: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "timezone";
            tableName: "users";
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
        locale: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "locale";
            tableName: "users";
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
        isActive: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "is_active";
            tableName: "users";
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
        isVerified: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "is_verified";
            tableName: "users";
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
        role: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "role";
            tableName: "users";
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
        permissions: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "permissions";
            tableName: "users";
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
            tableName: "users";
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
        entityAccess: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "entity_access";
            tableName: "users";
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
        lastLoginAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "last_login_at";
            tableName: "users";
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
        lastLoginIp: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "last_login_ip";
            tableName: "users";
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
        failedLoginAttempts: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "failed_login_attempts";
            tableName: "users";
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
        lockedUntil: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "locked_until";
            tableName: "users";
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
        twoFactorEnabled: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "two_factor_enabled";
            tableName: "users";
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
        twoFactorSecret: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "two_factor_secret";
            tableName: "users";
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
        backupCodes: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "backup_codes";
            tableName: "users";
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
            tableName: "users";
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
            tableName: "users";
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
            tableName: "users";
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
            tableName: "users";
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
 * Sessions - JWT session management with KV storage references
 * Links to Cloudflare KV for session data storage
 */
export declare const sessions: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "sessions";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "sessions";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        userId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "user_id";
            tableName: "sessions";
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
        deviceInfo: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "device_info";
            tableName: "sessions";
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
        ipAddress: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "ip_address";
            tableName: "sessions";
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
        location: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "location";
            tableName: "sessions";
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
        issuedAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "issued_at";
            tableName: "sessions";
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
        expiresAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "expires_at";
            tableName: "sessions";
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
        lastActiveAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "last_active_at";
            tableName: "sessions";
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
        isActive: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "is_active";
            tableName: "sessions";
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
        revokedAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "revoked_at";
            tableName: "sessions";
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
        revokedBy: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "revoked_by";
            tableName: "sessions";
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
        revokedReason: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "revoked_reason";
            tableName: "sessions";
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
        kvKey: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "kv_key";
            tableName: "sessions";
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
            tableName: "sessions";
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
            tableName: "sessions";
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
/**
 * Magic Links - Email-based authentication tokens
 * Temporary tokens for passwordless login and email verification
 */
export declare const magicLinks: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "magic_links";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "magic_links";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        userId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "user_id";
            tableName: "magic_links";
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
        email: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "email";
            tableName: "magic_links";
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
        token: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "token";
            tableName: "magic_links";
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
        tokenHash: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "token_hash";
            tableName: "magic_links";
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
        purpose: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "purpose";
            tableName: "magic_links";
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
        metadata: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "metadata";
            tableName: "magic_links";
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
        expiresAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "expires_at";
            tableName: "magic_links";
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
        usedAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "used_at";
            tableName: "magic_links";
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
        clickCount: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "click_count";
            tableName: "magic_links";
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
        lastClickAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "last_click_at";
            tableName: "magic_links";
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
        lastClickIp: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "last_click_ip";
            tableName: "magic_links";
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
        isActive: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "is_active";
            tableName: "magic_links";
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
        createdAt: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "created_at";
            tableName: "magic_links";
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
            tableName: "magic_links";
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
            tableName: "magic_links";
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
 * Audit Log - Security and activity tracking
 * Comprehensive logging for authentication and authorization events
 */
export declare const auditLog: import("drizzle-orm/sqlite-core").SQLiteTableWithColumns<{
    name: "audit_log";
    schema: undefined;
    columns: {
        id: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "id";
            tableName: "audit_log";
            dataType: "string";
            columnType: "SQLiteText";
            data: string;
            driverParam: string;
            notNull: true;
            hasDefault: false;
            isPrimaryKey: true;
            isAutoincrement: false;
            hasRuntimeDefault: false;
            enumValues: [string, ...string[]];
            baseColumn: never;
            identity: undefined;
            generated: undefined;
        }, {}, {
            length: number | undefined;
        }>;
        userId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "user_id";
            tableName: "audit_log";
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
        sessionId: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "session_id";
            tableName: "audit_log";
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
        eventType: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "event_type";
            tableName: "audit_log";
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
        eventCategory: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "event_category";
            tableName: "audit_log";
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
            tableName: "audit_log";
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
        ipAddress: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "ip_address";
            tableName: "audit_log";
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
        userAgent: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "user_agent";
            tableName: "audit_log";
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
        location: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "location";
            tableName: "audit_log";
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
        metadata: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "metadata";
            tableName: "audit_log";
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
        success: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "success";
            tableName: "audit_log";
            dataType: "boolean";
            columnType: "SQLiteBoolean";
            data: boolean;
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
        errorCode: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "error_code";
            tableName: "audit_log";
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
        errorMessage: import("drizzle-orm/sqlite-core").SQLiteColumn<{
            name: "error_message";
            tableName: "audit_log";
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
            tableName: "audit_log";
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
            tableName: "audit_log";
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
export declare const UserRole: {
    readonly USER: "USER";
    readonly ACCOUNTANT: "ACCOUNTANT";
    readonly ADMIN: "ADMIN";
    readonly VIEWER: "VIEWER";
    readonly SUPER_ADMIN: "SUPER_ADMIN";
};
export type UserRole = typeof UserRole[keyof typeof UserRole];
export declare const MagicLinkPurpose: {
    readonly LOGIN: "LOGIN";
    readonly REGISTER: "REGISTER";
    readonly VERIFY_EMAIL: "VERIFY_EMAIL";
    readonly RESET_PASSWORD: "RESET_PASSWORD";
    readonly CHANGE_EMAIL: "CHANGE_EMAIL";
};
export type MagicLinkPurpose = typeof MagicLinkPurpose[keyof typeof MagicLinkPurpose];
export declare const AuditEventType: {
    readonly LOGIN_SUCCESS: "LOGIN_SUCCESS";
    readonly LOGIN_FAILED: "LOGIN_FAILED";
    readonly LOGOUT: "LOGOUT";
    readonly REGISTER: "REGISTER";
    readonly VERIFY_EMAIL: "VERIFY_EMAIL";
    readonly PASSWORD_RESET: "PASSWORD_RESET";
    readonly SESSION_CREATED: "SESSION_CREATED";
    readonly SESSION_RENEWED: "SESSION_RENEWED";
    readonly SESSION_EXPIRED: "SESSION_EXPIRED";
    readonly SESSION_REVOKED: "SESSION_REVOKED";
    readonly ACCOUNT_LOCKED: "ACCOUNT_LOCKED";
    readonly ACCOUNT_UNLOCKED: "ACCOUNT_UNLOCKED";
    readonly PROFILE_UPDATED: "PROFILE_UPDATED";
    readonly ROLE_CHANGED: "ROLE_CHANGED";
    readonly SUSPICIOUS_ACTIVITY: "SUSPICIOUS_ACTIVITY";
    readonly TWO_FACTOR_ENABLED: "TWO_FACTOR_ENABLED";
    readonly TWO_FACTOR_DISABLED: "TWO_FACTOR_DISABLED";
};
export type AuditEventType = typeof AuditEventType[keyof typeof AuditEventType];
export declare const insertUserSchema: z.ZodObject<{
    email: z.ZodString;
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    role: z.ZodEnum<["USER", "ACCOUNTANT", "ADMIN", "VIEWER", "SUPER_ADMIN"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    role: "USER" | "ACCOUNTANT" | "ADMIN" | "VIEWER" | "SUPER_ADMIN";
    firstName?: string | undefined;
    lastName?: string | undefined;
}, {
    email: string;
    role: "USER" | "ACCOUNTANT" | "ADMIN" | "VIEWER" | "SUPER_ADMIN";
    firstName?: string | undefined;
    lastName?: string | undefined;
}>;
export declare const selectUserSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    firstName: z.ZodNullable<z.ZodString>;
    lastName: z.ZodNullable<z.ZodString>;
    role: z.ZodEnum<["USER", "ACCOUNTANT", "ADMIN", "VIEWER", "SUPER_ADMIN"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: "USER" | "ACCOUNTANT" | "ADMIN" | "VIEWER" | "SUPER_ADMIN";
}, {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    role: "USER" | "ACCOUNTANT" | "ADMIN" | "VIEWER" | "SUPER_ADMIN";
}>;
export declare const insertSessionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
}, {
    id: string;
    userId: string;
}>;
export declare const selectSessionSchema: z.ZodObject<{
    id: z.ZodString;
    userId: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    userId: string;
}, {
    id: string;
    userId: string;
}>;
export declare const insertMagicLinkSchema: z.ZodObject<{
    email: z.ZodString;
    purpose: z.ZodEnum<["LOGIN", "REGISTER", "VERIFY_EMAIL", "RESET_PASSWORD", "CHANGE_EMAIL"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    purpose: "LOGIN" | "REGISTER" | "VERIFY_EMAIL" | "RESET_PASSWORD" | "CHANGE_EMAIL";
}, {
    email: string;
    purpose: "LOGIN" | "REGISTER" | "VERIFY_EMAIL" | "RESET_PASSWORD" | "CHANGE_EMAIL";
}>;
export declare const selectMagicLinkSchema: z.ZodObject<{
    id: z.ZodString;
    email: z.ZodString;
    purpose: z.ZodEnum<["LOGIN", "REGISTER", "VERIFY_EMAIL", "RESET_PASSWORD", "CHANGE_EMAIL"]>;
}, "strip", z.ZodTypeAny, {
    id: string;
    email: string;
    purpose: "LOGIN" | "REGISTER" | "VERIFY_EMAIL" | "RESET_PASSWORD" | "CHANGE_EMAIL";
}, {
    id: string;
    email: string;
    purpose: "LOGIN" | "REGISTER" | "VERIFY_EMAIL" | "RESET_PASSWORD" | "CHANGE_EMAIL";
}>;
export declare const insertAuditLogSchema: z.ZodObject<{
    eventType: z.ZodString;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    description: string;
    eventType: string;
}, {
    description: string;
    eventType: string;
}>;
export declare const selectAuditLogSchema: z.ZodObject<{
    id: z.ZodString;
    eventType: z.ZodString;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    id: string;
    description: string;
    eventType: string;
}, {
    id: string;
    description: string;
    eventType: string;
}>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type SelectUser = z.infer<typeof selectUserSchema>;
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type SelectSession = z.infer<typeof selectSessionSchema>;
export type InsertMagicLink = z.infer<typeof insertMagicLinkSchema>;
export type SelectMagicLink = z.infer<typeof selectMagicLinkSchema>;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;
export type SelectAuditLog = z.infer<typeof selectAuditLogSchema>;
//# sourceMappingURL=auth.d.ts.map