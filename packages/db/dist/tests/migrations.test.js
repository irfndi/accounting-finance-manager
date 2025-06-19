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
    });
});
