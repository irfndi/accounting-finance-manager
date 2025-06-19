"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Mock database connection
const mockDb = {
    query: vitest_1.vi.fn(),
    execute: vitest_1.vi.fn(),
    transaction: vitest_1.vi.fn(),
    close: vitest_1.vi.fn()
};
(0, vitest_1.describe)('Database Migrations', () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.clearAllMocks();
        // Setup default mock responses
        mockDb.query.mockResolvedValue([]);
        mockDb.execute.mockResolvedValue({ affectedRows: 1, insertId: 1 });
        mockDb.transaction.mockImplementation(async (callback) => {
            return await callback(mockDb);
        });
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.resetAllMocks();
    });
    (0, vitest_1.describe)('Migration System', () => {
        (0, vitest_1.it)('should create migrations table if not exists', async () => {
            const createMigrationsTable = async (db) => {
                const sql = `
          CREATE TABLE IF NOT EXISTS migrations (
            id VARCHAR(255) PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `;
                await db.execute(sql);
            };
            await createMigrationsTable(mockDb);
            (0, vitest_1.expect)(mockDb.execute).toHaveBeenCalledWith(vitest_1.expect.stringContaining('CREATE TABLE IF NOT EXISTS migrations'));
        });
        (0, vitest_1.it)('should track executed migrations', async () => {
            const getExecutedMigrations = async (db) => {
                const result = await db.query('SELECT id FROM migrations ORDER BY executed_at');
                return result.map((row) => row.id);
            };
            mockDb.query.mockResolvedValueOnce([
                { id: '001_create_accounts' },
                { id: '002_create_transactions' },
                { id: '003_create_journal_entries' }
            ]);
            const executedMigrations = await getExecutedMigrations(mockDb);
            (0, vitest_1.expect)(executedMigrations).toEqual([
                '001_create_accounts',
                '002_create_transactions',
                '003_create_journal_entries'
            ]);
        });
        (0, vitest_1.it)('should execute pending migrations in order', async () => {
            const migrations = [
                {
                    id: '001_create_accounts',
                    name: 'Create accounts table',
                    timestamp: new Date('2024-01-01'),
                    up: async (db) => {
                        await db.execute(`
              CREATE TABLE accounts (
                id VARCHAR(36) PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
                normal_balance ENUM('debit', 'credit') NOT NULL,
                parent_id VARCHAR(36),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (parent_id) REFERENCES accounts(id)
              )
            `);
                    },
                    down: async (db) => {
                        await db.execute('DROP TABLE accounts');
                    }
                },
                {
                    id: '002_create_transactions',
                    name: 'Create transactions table',
                    timestamp: new Date('2024-01-02'),
                    up: async (db) => {
                        await db.execute(`
              CREATE TABLE transactions (
                id VARCHAR(36) PRIMARY KEY,
                description TEXT NOT NULL,
                date DATE NOT NULL,
                status ENUM('draft', 'posted', 'cancelled') DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
              )
            `);
                    },
                    down: async (db) => {
                        await db.execute('DROP TABLE transactions');
                    }
                }
            ];
            const runMigrations = async (db, migrations) => {
                // Get executed migrations
                db.query.mockResolvedValueOnce([]);
                const executed = await db.query('SELECT id FROM migrations');
                const executedIds = executed.map((row) => row.id);
                // Find pending migrations
                const pending = migrations.filter(m => !executedIds.includes(m.id));
                // Execute pending migrations
                for (const migration of pending) {
                    await db.transaction(async (trx) => {
                        await migration.up(trx);
                        await trx.execute('INSERT INTO migrations (id, name) VALUES (?, ?)', [migration.id, migration.name]);
                    });
                }
            };
            await runMigrations(mockDb, migrations);
            (0, vitest_1.expect)(mockDb.transaction).toHaveBeenCalledTimes(2);
            (0, vitest_1.expect)(mockDb.execute).toHaveBeenCalledWith(vitest_1.expect.stringContaining('CREATE TABLE accounts'));
            (0, vitest_1.expect)(mockDb.execute).toHaveBeenCalledWith(vitest_1.expect.stringContaining('CREATE TABLE transactions'));
        });
        (0, vitest_1.it)('should rollback migrations', async () => {
            const rollbackMigration = async (db, migrationId, migration) => {
                await db.transaction(async (trx) => {
                    await migration.down(trx);
                    await trx.execute('DELETE FROM migrations WHERE id = ?', [migrationId]);
                });
            };
            const migration = {
                id: '001_create_accounts',
                name: 'Create accounts table',
                timestamp: new Date('2024-01-01'),
                up: async () => { },
                down: async (db) => {
                    await db.execute('DROP TABLE accounts');
                }
            };
            await rollbackMigration(mockDb, migration.id, migration);
            (0, vitest_1.expect)(mockDb.transaction).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(mockDb.execute).toHaveBeenCalledWith('DROP TABLE accounts');
            (0, vitest_1.expect)(mockDb.execute).toHaveBeenCalledWith('DELETE FROM migrations WHERE id = ?', ['001_create_accounts']);
        });
    });
    (0, vitest_1.describe)('Schema Validation', () => {
        (0, vitest_1.it)('should validate account schema', () => {
            const validateAccount = (account) => {
                const requiredFields = ['id', 'name', 'type', 'normalBalance'];
                const validTypes = ['asset', 'liability', 'equity', 'revenue', 'expense'];
                const validBalances = ['debit', 'credit'];
                // Check required fields
                for (const field of requiredFields) {
                    if (!account[field])
                        return false;
                }
                // Validate type
                if (!validTypes.includes(account.type))
                    return false;
                // Validate normal balance
                if (!validBalances.includes(account.normalBalance))
                    return false;
                return true;
            };
            const validAccount = {
                id: '1',
                name: 'Cash',
                type: 'asset',
                normalBalance: 'debit',
                parentId: null,
                isActive: true
            };
            const invalidAccount = {
                id: '2',
                name: 'Invalid Account',
                type: 'invalid_type',
                normalBalance: 'invalid_balance'
            };
            (0, vitest_1.expect)(validateAccount(validAccount)).toBe(true);
            (0, vitest_1.expect)(validateAccount(invalidAccount)).toBe(false);
        });
        (0, vitest_1.it)('should validate transaction schema', () => {
            const validateTransaction = (transaction) => {
                const requiredFields = ['id', 'description', 'date', 'entries'];
                const validStatuses = ['draft', 'posted', 'cancelled'];
                // Check required fields
                for (const field of requiredFields) {
                    if (!transaction[field])
                        return false;
                }
                // Validate status if provided
                if (transaction.status && !validStatuses.includes(transaction.status)) {
                    return false;
                }
                // Validate entries
                if (!Array.isArray(transaction.entries) || transaction.entries.length === 0) {
                    return false;
                }
                // Validate each entry
                for (const entry of transaction.entries) {
                    if (!entry.accountId || (!entry.debit && !entry.credit)) {
                        return false;
                    }
                    if (entry.debit && entry.credit) {
                        return false; // Entry cannot have both debit and credit
                    }
                }
                return true;
            };
            const validTransaction = {
                id: '1',
                description: 'Test transaction',
                date: new Date(),
                status: 'draft',
                entries: [
                    {
                        accountId: '1',
                        debit: { amount: 100, currency: 'USD' },
                        credit: null,
                        description: 'Debit entry'
                    },
                    {
                        accountId: '2',
                        debit: null,
                        credit: { amount: 100, currency: 'USD' },
                        description: 'Credit entry'
                    }
                ]
            };
            const invalidTransaction = {
                id: '2',
                description: 'Invalid transaction',
                date: new Date(),
                entries: [] // Empty entries
            };
            (0, vitest_1.expect)(validateTransaction(validTransaction)).toBe(true);
            (0, vitest_1.expect)(validateTransaction(invalidTransaction)).toBe(false);
        });
        (0, vitest_1.it)('should validate double-entry bookkeeping rules', () => {
            const validateDoubleEntry = (entries) => {
                let totalDebits = 0;
                let totalCredits = 0;
                for (const entry of entries) {
                    if (entry.debit) {
                        totalDebits += entry.debit.amount;
                    }
                    if (entry.credit) {
                        totalCredits += entry.credit.amount;
                    }
                }
                // Debits must equal credits (within rounding tolerance)
                return Math.abs(totalDebits - totalCredits) < 0.01;
            };
            const balancedEntries = [
                {
                    accountId: '1',
                    debit: { amount: 100, currency: 'USD' },
                    credit: null
                },
                {
                    accountId: '2',
                    debit: null,
                    credit: { amount: 100, currency: 'USD' }
                }
            ];
            const unbalancedEntries = [
                {
                    accountId: '1',
                    debit: { amount: 100, currency: 'USD' },
                    credit: null
                },
                {
                    accountId: '2',
                    debit: null,
                    credit: { amount: 50, currency: 'USD' }
                }
            ];
            (0, vitest_1.expect)(validateDoubleEntry(balancedEntries)).toBe(true);
            (0, vitest_1.expect)(validateDoubleEntry(unbalancedEntries)).toBe(false);
        });
    });
    (0, vitest_1.describe)('Database Operations', () => {
        (0, vitest_1.it)('should insert account with proper validation', async () => {
            const insertAccount = async (db, account) => {
                const sql = `
          INSERT INTO accounts (id, name, type, normal_balance, parent_id, is_active)
          VALUES (?, ?, ?, ?, ?, ?)
        `;
                const params = [
                    account.id,
                    account.name,
                    account.type,
                    account.normalBalance,
                    account.parentId,
                    account.isActive ?? true
                ];
                return await db.execute(sql, params);
            };
            const account = {
                id: '1',
                name: 'Cash',
                type: 'asset',
                normalBalance: 'debit',
                parentId: null,
                isActive: true
            };
            const result = await insertAccount(mockDb, account);
            (0, vitest_1.expect)(mockDb.execute).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO accounts'), ['1', 'Cash', 'asset', 'debit', null, true]);
            (0, vitest_1.expect)(result.affectedRows).toBe(1);
        });
        (0, vitest_1.it)('should insert transaction with entries atomically', async () => {
            const insertTransaction = async (db, transaction) => {
                return await db.transaction(async (trx) => {
                    // Insert transaction
                    const transactionSql = `
            INSERT INTO transactions (id, description, date, status)
            VALUES (?, ?, ?, ?)
          `;
                    await trx.execute(transactionSql, [
                        transaction.id,
                        transaction.description,
                        transaction.date,
                        transaction.status || 'draft'
                    ]);
                    // Insert entries
                    const entrySql = `
            INSERT INTO transaction_entries (transaction_id, account_id, debit_amount, credit_amount, description)
            VALUES (?, ?, ?, ?, ?)
          `;
                    for (const entry of transaction.entries) {
                        await trx.execute(entrySql, [
                            transaction.id,
                            entry.accountId,
                            entry.debit?.amount || null,
                            entry.credit?.amount || null,
                            entry.description
                        ]);
                    }
                });
            };
            const transaction = {
                id: '1',
                description: 'Test transaction',
                date: new Date('2024-01-01'),
                status: 'draft',
                entries: [
                    {
                        accountId: '1',
                        debit: { amount: 100, currency: 'USD' },
                        credit: null,
                        description: 'Cash debit'
                    },
                    {
                        accountId: '2',
                        debit: null,
                        credit: { amount: 100, currency: 'USD' },
                        description: 'Revenue credit'
                    }
                ]
            };
            await insertTransaction(mockDb, transaction);
            (0, vitest_1.expect)(mockDb.transaction).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(mockDb.execute).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO transactions'), vitest_1.expect.any(Array));
            (0, vitest_1.expect)(mockDb.execute).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO transaction_entries'), vitest_1.expect.any(Array));
        });
        (0, vitest_1.it)('should query account balances efficiently', async () => {
            const getAccountBalances = async (db, accountIds) => {
                let sql = `
          SELECT 
            a.id,
            a.name,
            a.type,
            a.normal_balance,
            COALESCE(SUM(te.debit_amount), 0) - COALESCE(SUM(te.credit_amount), 0) as balance
          FROM accounts a
          LEFT JOIN transaction_entries te ON a.id = te.account_id
          LEFT JOIN transactions t ON te.transaction_id = t.id
          WHERE t.status = 'posted' OR t.status IS NULL
        `;
                const params = [];
                if (accountIds && accountIds.length > 0) {
                    sql += ` AND a.id IN (${accountIds.map(() => '?').join(', ')})`;
                    params.push(...accountIds);
                }
                sql += ' GROUP BY a.id, a.name, a.type, a.normal_balance';
                return await db.query(sql, params);
            };
            mockDb.query.mockResolvedValueOnce([
                {
                    id: '1',
                    name: 'Cash',
                    type: 'asset',
                    normal_balance: 'debit',
                    balance: 1000
                },
                {
                    id: '2',
                    name: 'Revenue',
                    type: 'revenue',
                    normal_balance: 'credit',
                    balance: -1000
                }
            ]);
            const balances = await getAccountBalances(mockDb, ['1', '2']);
            (0, vitest_1.expect)(mockDb.query).toHaveBeenCalledWith(vitest_1.expect.stringContaining('SELECT'), ['1', '2']);
            (0, vitest_1.expect)(balances).toHaveLength(2);
            (0, vitest_1.expect)(balances[0].balance).toBe(1000);
            (0, vitest_1.expect)(balances[1].balance).toBe(-1000);
        });
    });
    (0, vitest_1.describe)('Data Integrity', () => {
        (0, vitest_1.it)('should enforce foreign key constraints', async () => {
            const insertTransactionEntry = async (db, entry) => {
                // This should fail if account doesn't exist
                const sql = `
          INSERT INTO transaction_entries (transaction_id, account_id, debit_amount, description)
          VALUES (?, ?, ?, ?)
        `;
                return await db.execute(sql, [
                    entry.transactionId,
                    entry.accountId,
                    entry.debitAmount,
                    entry.description
                ]);
            };
            // Mock foreign key constraint error
            mockDb.execute.mockRejectedValueOnce(new Error('Foreign key constraint fails'));
            const invalidEntry = {
                transactionId: '1',
                accountId: 'non-existent-account',
                debitAmount: 100,
                description: 'Invalid entry'
            };
            await (0, vitest_1.expect)(insertTransactionEntry(mockDb, invalidEntry))
                .rejects.toThrow('Foreign key constraint fails');
        });
        (0, vitest_1.it)('should prevent deletion of accounts with transactions', async () => {
            const deleteAccount = async (db, accountId) => {
                // Check if account has transactions
                const transactionCount = await db.query('SELECT COUNT(*) as count FROM transaction_entries WHERE account_id = ?', [accountId]);
                if (transactionCount[0].count > 0) {
                    throw new Error('Cannot delete account with existing transactions');
                }
                return await db.execute('DELETE FROM accounts WHERE id = ?', [accountId]);
            };
            mockDb.query.mockResolvedValueOnce([{ count: 5 }]);
            await (0, vitest_1.expect)(deleteAccount(mockDb, '1'))
                .rejects.toThrow('Cannot delete account with existing transactions');
        });
        (0, vitest_1.it)('should maintain audit trail', async () => {
            const updateTransaction = async (db, transactionId, updates) => {
                return await db.transaction(async (trx) => {
                    // Create audit record
                    await trx.execute(`
            INSERT INTO audit_log (table_name, record_id, action, old_values, new_values, user_id, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
                        'transactions',
                        transactionId,
                        'UPDATE',
                        JSON.stringify({}), // old values would be fetched first
                        JSON.stringify(updates),
                        'system',
                        new Date()
                    ]);
                    // Update transaction
                    const setClauses = Object.keys(updates).map(key => `${key} = ?`).join(', ');
                    const values = Object.values(updates);
                    await trx.execute(`UPDATE transactions SET ${setClauses}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, [...values, transactionId]);
                });
            };
            const updates = { description: 'Updated description', status: 'posted' };
            await updateTransaction(mockDb, '1', updates);
            (0, vitest_1.expect)(mockDb.transaction).toHaveBeenCalledTimes(1);
            (0, vitest_1.expect)(mockDb.execute).toHaveBeenCalledWith(vitest_1.expect.stringContaining('INSERT INTO audit_log'), vitest_1.expect.any(Array));
            (0, vitest_1.expect)(mockDb.execute).toHaveBeenCalledWith(vitest_1.expect.stringContaining('UPDATE transactions'), vitest_1.expect.any(Array));
        });
    });
});
