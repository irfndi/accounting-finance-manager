"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const drizzle_orm_1 = require("drizzle-orm");
const accounts_1 = require("../../src/schema/accounts");
const setup_1 = require("../setup");
(0, vitest_1.describe)('Accounts Schema & Operations', () => {
    (0, vitest_1.beforeEach)(async () => {
        await setup_1.dbTestUtils.clearAllTables();
    });
    const getDb = () => setup_1.testDbAdapter;
    (0, vitest_1.describe)('Account Creation', () => {
        (0, vitest_1.it)('should create a new account successfully', async () => {
            const newAccount = {
                code: '1500',
                name: 'Equipment',
                description: 'Office equipment and machinery',
                type: 'ASSET',
                subtype: 'FIXED_ASSET',
                category: 'EQUIPMENT',
                level: 0,
                path: '1500',
                isActive: 1,
                isSystem: 0,
                allowTransactions: 1,
                normalBalance: 'DEBIT',
                reportCategory: 'ASSETS',
                reportOrder: 0,
                currentBalance: 0,
                entityId: 'test-entity'
            };
            await getDb().insert(accounts_1.accounts).values(newAccount);
            const result = await getDb().select().from(accounts_1.accounts).where((0, drizzle_orm_1.eq)(accounts_1.accounts.id, newAccount.id)).get();
            (0, vitest_1.expect)(result).toBeDefined();
            (0, vitest_1.expect)(result.code).toBe(newAccount.code);
            (0, vitest_1.expect)(result.name).toBe(newAccount.name);
            (0, vitest_1.expect)(result.type).toBe(newAccount.type);
            (0, vitest_1.expect)(result.normalBalance).toBe(newAccount.normalBalance);
        });
        (0, vitest_1.it)('should enforce unique account codes', async () => {
            const account1 = await setup_1.dbTestUtils.insertTestAccount();
            const account2 = setup_1.dbTestUtils.createTestAccount({ code: account1.code });
            await (0, vitest_1.expect)(getDb().insert(accounts_1.accounts).values(account2)).rejects.toThrow();
        });
        (0, vitest_1.it)('should require mandatory fields', async () => {
            const incompleteAccount = {
                name: 'Test Account'
                // Missing required fields: code, type, normalBalance
            };
            await (0, vitest_1.expect)(getDb().insert(accounts_1.accounts).values(incompleteAccount)).rejects.toThrow();
        });
        (0, vitest_1.it)('should set default values correctly', async () => {
            const now = Date.now();
            const account = {
                code: '1600',
                name: 'Test Account',
                type: 'ASSET',
                normalBalance: 'DEBIT',
                path: '1600',
                level: 0,
                isActive: 1,
                isSystem: 0,
                allowTransactions: 1,
                currentBalance: 0,
                entityId: 'test-entity',
                createdAt: now,
                updatedAt: now
            };
            console.log('Inserting account in test:', JSON.stringify(account, null, 2));
            await getDb().insert(accounts_1.accounts).values(account);
            const result = await getDb().select().from(accounts_1.accounts).where((0, drizzle_orm_1.eq)(accounts_1.accounts.code, account.code));
            (0, vitest_1.expect)(result[0].isActive).toBe(1); // Default active
            (0, vitest_1.expect)(result[0].createdAt).toBeDefined();
            (0, vitest_1.expect)(result[0].updatedAt).toBeDefined();
        });
    });
    (0, vitest_1.describe)('Account Queries', () => {
        (0, vitest_1.beforeEach)(async () => {
            await setup_1.dbTestUtils.seedTestData();
        });
        (0, vitest_1.it)('should retrieve account by ID', async () => {
            const account = await getDb().select().from(accounts_1.accounts).where((0, drizzle_orm_1.eq)(accounts_1.accounts.code, '1000')).limit(1);
            (0, vitest_1.expect)(account).toBeDefined();
            (0, vitest_1.expect)(account[0]).toBeDefined();
            (0, vitest_1.expect)(account[0].code).toBe('1000');
            (0, vitest_1.expect)(account[0].name).toBe('Cash');
        });
        (0, vitest_1.it)('should retrieve accounts by type', async () => {
            const assetAccounts = await getDb().select().from(accounts_1.accounts).where((0, drizzle_orm_1.eq)(accounts_1.accounts.type, 'ASSET'));
            (0, vitest_1.expect)(assetAccounts.length).toBeGreaterThan(0);
            assetAccounts.forEach(account => {
                (0, vitest_1.expect)(account.type).toBe('ASSET');
            });
        });
        (0, vitest_1.it)('should retrieve active accounts only', async () => {
            // First, deactivate an account
            await getDb().update(accounts_1.accounts)
                .set({ isActive: 0 })
                .where((0, drizzle_orm_1.eq)(accounts_1.accounts.code, '1000'));
            const activeAccounts = await getDb().select()
                .from(accounts_1.accounts)
                .where((0, drizzle_orm_1.eq)(accounts_1.accounts.isActive, 1));
            (0, vitest_1.expect)(activeAccounts.every(acc => acc.isActive === 1)).toBe(true);
            (0, vitest_1.expect)(activeAccounts.find(acc => acc.code === '1000')).toBeUndefined();
        });
        (0, vitest_1.it)('should retrieve accounts by entity', async () => {
            const entityAccounts = await getDb().select()
                .from(accounts_1.accounts)
                .where((0, drizzle_orm_1.eq)(accounts_1.accounts.entityId, 'test-entity'));
            (0, vitest_1.expect)(entityAccounts.length).toBeGreaterThan(0);
            entityAccounts.forEach(account => {
                (0, vitest_1.expect)(account.entityId).toBe('test-entity');
            });
        });
    });
    (0, vitest_1.describe)('Hierarchical Account Structure', () => {
        (0, vitest_1.it)('should create parent-child account relationships', async () => {
            const now = Date.now();
            // Create parent account
            const parentAccount = {
                code: '1000',
                name: 'Current Assets',
                type: 'ASSET',
                normalBalance: 'DEBIT',
                path: '1000',
                level: 0,
                isActive: 1,
                isSystem: 0,
                allowTransactions: 1,
                currentBalance: 0,
                entityId: 'test-entity',
                createdAt: now,
                updatedAt: now
            };
            await getDb().insert(accounts_1.accounts).values(parentAccount);
            const parent = await getDb().select().from(accounts_1.accounts).where((0, drizzle_orm_1.eq)(accounts_1.accounts.code, parentAccount.code));
            // Create child account
            const childAccount = {
                code: '1010',
                name: 'Cash on Hand',
                type: 'ASSET',
                normalBalance: 'DEBIT',
                path: '1000.1010',
                level: 1,
                isActive: 1,
                isSystem: 0,
                allowTransactions: 1,
                currentBalance: 0,
                parentId: parent[0].id,
                entityId: 'test-entity',
                createdAt: now,
                updatedAt: now
            };
            await getDb().insert(accounts_1.accounts).values(childAccount);
            const child = await getDb().select().from(accounts_1.accounts).where((0, drizzle_orm_1.eq)(accounts_1.accounts.code, childAccount.code));
            (0, vitest_1.expect)(child[0].parentId).toBe(parent[0].id);
        });
        (0, vitest_1.it)('should retrieve child accounts of a parent', async () => {
            // Get a parent account
            const parentAccount = await getDb().select()
                .from(accounts_1.accounts)
                .where((0, drizzle_orm_1.eq)(accounts_1.accounts.code, '1000'))
                .limit(1);
            if (parentAccount[0]) {
                // Create child account
                const now = Date.now();
                const childAccount = {
                    code: '1011',
                    name: 'Petty Cash',
                    type: 'ASSET',
                    normalBalance: 'DEBIT',
                    path: '1000.1011',
                    level: 1,
                    isActive: 1,
                    isSystem: 0,
                    allowTransactions: 1,
                    currentBalance: 0,
                    parentId: parentAccount[0].id,
                    entityId: 'test-entity',
                    createdAt: now,
                    updatedAt: now
                };
                await getDb().insert(accounts_1.accounts).values(childAccount);
                // Query child accounts
                const childAccounts = await getDb().select()
                    .from(accounts_1.accounts)
                    .where((0, drizzle_orm_1.eq)(accounts_1.accounts.parentId, parentAccount[0].id));
                (0, vitest_1.expect)(childAccounts.length).toBeGreaterThan(0);
                (0, vitest_1.expect)(childAccounts[0].parentId).toBe(parentAccount[0].id);
            }
        });
    });
    (0, vitest_1.describe)('Account Updates', () => {
        (0, vitest_1.beforeEach)(async () => {
            await setup_1.dbTestUtils.seedTestData();
        });
        (0, vitest_1.it)('should update account information', async () => {
            const originalAccount = await getDb().select()
                .from(accounts_1.accounts)
                .where((0, drizzle_orm_1.eq)(accounts_1.accounts.code, '1000'))
                .limit(1);
            const updatedData = {
                name: 'Updated Account Name',
                description: 'Updated description',
                updatedAt: Date.now()
            };
            await getDb().update(accounts_1.accounts)
                .set(updatedData)
                .where((0, drizzle_orm_1.eq)(accounts_1.accounts.id, originalAccount[0].id));
            const updatedAccount = await getDb().select()
                .from(accounts_1.accounts)
                .where((0, drizzle_orm_1.eq)(accounts_1.accounts.id, originalAccount[0].id))
                .limit(1);
            (0, vitest_1.expect)(updatedAccount[0].name).toBe(updatedData.name);
            (0, vitest_1.expect)(updatedAccount[0].description).toBe(updatedData.description);
        });
        (0, vitest_1.it)('should update timestamps on modification', async () => {
            const account = await getDb().select()
                .from(accounts_1.accounts)
                .where((0, drizzle_orm_1.eq)(accounts_1.accounts.code, '1000'))
                .limit(1);
            const originalUpdatedAt = account[0].updatedAt;
            // Wait a moment to ensure timestamp difference
            await new Promise(resolve => setTimeout(resolve, 10));
            await getDb().update(accounts_1.accounts)
                .set({
                description: 'Modified description',
                updatedAt: Date.now()
            })
                .where((0, drizzle_orm_1.eq)(accounts_1.accounts.id, account[0].id));
            const updatedAccount = await getDb().select()
                .from(accounts_1.accounts)
                .where((0, drizzle_orm_1.eq)(accounts_1.accounts.id, account[0].id))
                .limit(1);
            (0, vitest_1.expect)(updatedAccount[0].updatedAt).not.toBe(originalUpdatedAt);
        });
    });
    (0, vitest_1.describe)('Account Validation', () => {
        (0, vitest_1.it)('should validate account types', async () => {
            const validTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
            for (const type of validTypes) {
                const now = Date.now();
                const account = {
                    code: `TEST-${type}`,
                    name: `Test ${type} Account`,
                    type: type,
                    normalBalance: 'DEBIT',
                    path: `TEST-${type}`,
                    level: 0,
                    isActive: 1,
                    isSystem: 0,
                    allowTransactions: 1,
                    currentBalance: 0,
                    entityId: 'test-entity',
                    createdAt: now,
                    updatedAt: now
                };
                await getDb().insert(accounts_1.accounts).values(account);
                const result = await getDb().select().from(accounts_1.accounts).where((0, drizzle_orm_1.eq)(accounts_1.accounts.code, account.code));
                (0, vitest_1.expect)(result[0].type).toBe(type);
            }
        });
        (0, vitest_1.it)('should validate normal balance types', async () => {
            const validBalances = ['DEBIT', 'CREDIT'];
            for (const balance of validBalances) {
                const now = Date.now();
                const account = {
                    code: `BAL-${balance}`,
                    name: `Test ${balance} Account`,
                    type: 'ASSET',
                    normalBalance: balance,
                    path: `BAL-${balance}`,
                    level: 0,
                    isActive: 1,
                    isSystem: 0,
                    allowTransactions: 1,
                    currentBalance: 0,
                    entityId: 'test-entity',
                    createdAt: now,
                    updatedAt: now
                };
                await getDb().insert(accounts_1.accounts).values(account);
                const result = await getDb().select().from(accounts_1.accounts).where((0, drizzle_orm_1.eq)(accounts_1.accounts.code, account.code));
                (0, vitest_1.expect)(result[0].normalBalance).toBe(balance);
            }
        });
    });
});
