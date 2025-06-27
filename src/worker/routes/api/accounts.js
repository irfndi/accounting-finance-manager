import { Hono } from 'hono';
import { DatabaseAdapter, DatabaseAccountRegistry, FINANCIAL_CONSTANTS, getNormalBalance, formatCurrency, AccountingValidationError } from '../../../lib/index.worker.js';
import { authMiddleware } from '../../middleware/auth';
// Create accounts router
const accounts = new Hono();
accounts.use('/*', authMiddleware);
// Apply authentication middleware to all routes
// Use strict authentication for all account operations
accounts.use('*', authMiddleware);
// Validation schemas
const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];
// Enhanced validation using core logic
function validateAccountCode(code) {
    if (!code || typeof code !== 'string') {
        return 'Account code is required and must be a string';
    }
    if (code.length < 2 || code.length > 20) {
        return 'Account code must be between 2 and 20 characters';
    }
    if (!/^[A-Z0-9.-]+$/i.test(code)) {
        return 'Account code can only contain letters, numbers, dots, and hyphens';
    }
    return null;
}
function validateAccountName(name) {
    if (!name || typeof name !== 'string') {
        return 'Account name is required and must be a string';
    }
    if (name.length < 3 || name.length > 100) {
        return 'Account name must be between 3 and 100 characters';
    }
    return null;
}
function validateAccountType(type) {
    if (!type || typeof type !== 'string') {
        return 'Account type is required';
    }
    if (!accountTypes.includes(type)) {
        return `Account type must be one of: ${accountTypes.join(', ')}`;
    }
    return null;
}
function validateNormalBalance(normalBalance, accountType) {
    if (normalBalance && !['DEBIT', 'CREDIT'].includes(normalBalance)) {
        return `Normal balance must be one of: DEBIT, CREDIT`;
    }
    // Validate against accounting rules
    const expectedNormalBalance = getNormalBalance(accountType);
    if (normalBalance && normalBalance !== expectedNormalBalance) {
        return `Account type ${accountType} should have normal balance ${expectedNormalBalance}, but ${normalBalance} was provided`;
    }
    return null;
}
// Helper function to create database adapter and account registry
async function createAccountingServices(d1Database, entityId = 'default') {
    const dbAdapter = new DatabaseAdapter({
        database: d1Database,
        entityId,
        defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY
    });
    const accountRegistry = new DatabaseAccountRegistry(dbAdapter);
    await accountRegistry.loadAccountsFromDatabase();
    return { dbAdapter, accountRegistry };
}
// GET /accounts - List all accounts with enhanced functionality
accounts.get('/', async (c) => {
    try {
        const { accountRegistry } = await createAccountingServices(c.env.FINANCE_MANAGER_DB);
        // Get query parameters for filtering
        const { type, active, parent, entityId = 'default' } = c.req.query();
        let allAccounts;
        if (type) {
            allAccounts = await accountRegistry.getAccountsByTypeFromDatabase(type.toUpperCase());
        }
        else {
            allAccounts = accountRegistry.getAllAccounts();
        }
        // Apply additional filters
        if (active !== undefined) {
            const isActive = active === 'true';
            allAccounts = allAccounts.filter(account => account.isActive === isActive);
        }
        if (parent) {
            const parentId = Number.parseInt(parent, 10);
            if (!Number.isNaN(parentId)) {
                allAccounts = allAccounts.filter(account => account.parentId === parentId);
            }
        }
        // Enhance response with accounting information
        const enhancedAccounts = allAccounts.map(account => ({
            ...account,
            normalBalance: getNormalBalance(account.type),
            formattedBalance: account.currentBalance ? formatCurrency(account.currentBalance, 'USD') : null,
            accountingInfo: {
                canHaveChildren: ['ASSET', 'LIABILITY', 'EQUITY'].includes(account.type),
                expectedNormalBalance: getNormalBalance(account.type),
                isBalanceSheet: ['ASSET', 'LIABILITY', 'EQUITY'].includes(account.type),
                isIncomeStatement: ['REVENUE', 'EXPENSE'].includes(account.type)
            }
        }));
        return c.json({
            accounts: enhancedAccounts,
            count: enhancedAccounts.length,
            filters: { type, active, parent, entityId },
            metadata: {
                supportedTypes: accountTypes,
                defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
                supportedCurrencies: FINANCIAL_CONSTANTS.SUPPORTED_CURRENCIES
            }
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Error fetching accounts
        if (error instanceof AccountingValidationError) {
            return c.json({
                error: error.message,
                code: error.code,
                details: error.details,
                accountingError: true
            }, 400);
        }
        return c.json({
            error: 'Failed to fetch accounts',
            message: errorMessage,
            code: 'ACCOUNTS_FETCH_ERROR'
        }, 500);
    }
});
// GET /accounts/:id - Get account by ID with enhanced information
accounts.get('/:id', async (c) => {
    try {
        const accountId = Number.parseInt(c.req.param('id'), 10);
        if (Number.isNaN(accountId) || accountId <= 0) {
            return c.json({
                error: 'Invalid account ID',
                message: 'Account ID must be a positive integer',
                code: 'INVALID_ACCOUNT_ID'
            }, 400);
        }
        const { dbAdapter, accountRegistry } = await createAccountingServices(c.env.FINANCE_MANAGER_DB);
        const account = await dbAdapter.getAccount(accountId);
        if (!account) {
            return c.json({
                error: 'Account not found',
                message: `No account found with ID ${accountId}`,
                code: 'ACCOUNT_NOT_FOUND'
            }, 404);
        }
        // Get children accounts if this is a parent
        const childAccounts = accountRegistry.getAllAccounts().filter(acc => acc.parentId === accountId);
        // Enhanced account information
        const enhancedAccount = {
            ...account,
            normalBalance: getNormalBalance(account.type),
            formattedBalance: account.currentBalance ? formatCurrency(account.currentBalance, 'USD') : null,
            children: childAccounts.map(child => ({
                id: child.id,
                code: child.code,
                name: child.name,
                type: child.type,
                balance: child.currentBalance,
                formattedBalance: child.currentBalance ? formatCurrency(child.currentBalance, 'USD') : null
            })),
            accountingInfo: {
                canHaveChildren: ['ASSET', 'LIABILITY', 'EQUITY'].includes(account.type),
                expectedNormalBalance: getNormalBalance(account.type),
                isBalanceSheet: ['ASSET', 'LIABILITY', 'EQUITY'].includes(account.type),
                isIncomeStatement: ['REVENUE', 'EXPENSE'].includes(account.type),
                hasChildren: childAccounts.length > 0,
                childrenCount: childAccounts.length
            }
        };
        return c.json({
            account: enhancedAccount
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Error fetching account
        if (error instanceof AccountingValidationError) {
            return c.json({
                error: error.message,
                code: error.code,
                details: error.details,
                accountingError: true
            }, 400);
        }
        return c.json({
            error: 'Failed to fetch account',
            message: errorMessage,
            code: 'ACCOUNT_FETCH_ERROR'
        }, 500);
    }
});
// POST /accounts - Create new account with enhanced validation
accounts.post('/', async (c) => {
    try {
        const body = await c.req.json();
        // Enhanced validation using core logic
        const codeError = validateAccountCode(body.code);
        if (codeError) {
            return c.json({ error: codeError, code: 'VALIDATION_ERROR' }, 400);
        }
        const nameError = validateAccountName(body.name);
        if (nameError) {
            return c.json({ error: nameError, code: 'VALIDATION_ERROR' }, 400);
        }
        const typeError = validateAccountType(body.type);
        if (typeError) {
            return c.json({ error: typeError, code: 'VALIDATION_ERROR' }, 400);
        }
        const normalBalanceError = validateNormalBalance(body.normalBalance, body.type);
        if (normalBalanceError) {
            return c.json({ error: normalBalanceError, code: 'VALIDATION_ERROR' }, 400);
        }
        const { dbAdapter, accountRegistry } = await createAccountingServices(c.env.FINANCE_MANAGER_DB);
        // Check if account code already exists using account registry
        const existingAccounts = accountRegistry.getAllAccounts();
        const duplicateAccount = existingAccounts.find(acc => acc.code === body.code);
        if (duplicateAccount) {
            return c.json({
                error: 'Account code already exists',
                message: `An account with code '${body.code}' already exists`,
                code: 'DUPLICATE_ACCOUNT_CODE'
            }, 409);
        }
        // Validate parent account if provided
        if (body.parentId) {
            const parentAccount = await dbAdapter.getAccount(body.parentId);
            if (!parentAccount) {
                return c.json({
                    error: 'Parent account not found',
                    message: `Parent account with ID ${body.parentId} does not exist`,
                    code: 'PARENT_ACCOUNT_NOT_FOUND'
                }, 400);
            }
            // Validate parent account type compatibility
            if (!['ASSET', 'LIABILITY', 'EQUITY'].includes(parentAccount.type)) {
                return c.json({
                    error: 'Invalid parent account type',
                    message: `Parent account must be ASSET, LIABILITY, or EQUITY, but found ${parentAccount.type}`,
                    code: 'INVALID_PARENT_TYPE'
                }, 400);
            }
        }
        // Create account using core logic
        const accountData = {
            code: body.code,
            name: body.name,
            description: body.description || '',
            type: body.type,
            subtype: body.subtype || '',
            category: body.category || '',
            parentId: body.parentId || undefined,
            level: 0, // Will be calculated by database adapter
            path: body.code, // Will be calculated by database adapter
            isActive: body.isActive !== false,
            isSystem: body.isSystem || false,
            allowTransactions: body.allowTransactions !== false,
            normalBalance: body.normalBalance || getNormalBalance(body.type),
            currentBalance: 0,
            reportCategory: body.reportCategory || body.type,
            reportOrder: body.reportOrder || 0,
            entityId: 'default'
        };
        const newAccount = await dbAdapter.createAccount(accountData);
        // Register the new account in the registry
        accountRegistry.registerAccount(newAccount);
        return c.json({
            account: {
                ...newAccount,
                normalBalance: getNormalBalance(newAccount.type),
                formattedBalance: formatCurrency(newAccount.currentBalance, 'USD'),
                accountingInfo: {
                    canHaveChildren: ['ASSET', 'LIABILITY', 'EQUITY'].includes(newAccount.type),
                    expectedNormalBalance: getNormalBalance(newAccount.type),
                    isBalanceSheet: ['ASSET', 'LIABILITY', 'EQUITY'].includes(newAccount.type),
                    isIncomeStatement: ['REVENUE', 'EXPENSE'].includes(newAccount.type)
                }
            },
            message: 'Account created successfully'
        }, 201);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        // Error creating account
        if (error instanceof AccountingValidationError) {
            return c.json({
                error: error.message,
                code: error.code,
                details: error.details,
                accountingError: true
            }, 400);
        }
        return c.json({
            error: 'Failed to create account',
            message: errorMessage,
            code: 'ACCOUNT_CREATE_ERROR'
        }, 500);
    }
});
// PUT /accounts/:id - Update an existing account
accounts.put('/:id', async (c) => {
    try {
        const accountId = Number.parseInt(c.req.param('id'), 10);
        if (Number.isNaN(accountId) || accountId <= 0) {
            return c.json({
                error: 'Invalid account ID',
                message: 'Account ID must be a positive integer',
                code: 'INVALID_ACCOUNT_ID',
            }, 400);
        }
        const body = await c.req.json();
        const { dbAdapter } = await createAccountingServices(c.env.FINANCE_MANAGER_DB);
        // Validate input
        const nameError = validateAccountName(body.name);
        if (nameError) {
            return c.json({ error: nameError, code: 'VALIDATION_ERROR' }, 400);
        }
        const typeError = validateAccountType(body.type);
        if (typeError) {
            return c.json({ error: typeError, code: 'VALIDATION_ERROR' }, 400);
        }
        // Check if account exists
        const existingAccount = await dbAdapter.getAccount(accountId);
        if (!existingAccount) {
            return c.json({
                error: 'Account not found',
                message: `Account with ID ${accountId} not found`,
                code: 'ACCOUNT_NOT_FOUND',
            }, 404);
        }
        // Prepare update data
        const updateData = {
            name: body.name,
            description: body.description,
            type: body.type,
            subtype: body.subtype,
            category: body.category,
            parentId: body.parentId,
            isActive: body.isActive,
            allowTransactions: body.allowTransactions,
            reportCategory: body.reportCategory,
            reportOrder: body.reportOrder,
        };
        // Prevent changing system accounts' critical fields
        if (existingAccount.isSystem) {
            // For example, don't allow changing type or code of a system account
            delete updateData.type;
        }
        const updatedAccount = await dbAdapter.updateAccount(accountId, updateData);
        return c.json({
            message: 'Account updated successfully',
            account: updatedAccount,
        });
    }
    catch (error) {
        if (error instanceof AccountingValidationError) {
            return c.json({
                error: error.message,
                code: error.code,
                details: error.details,
                accountingError: true,
            }, 400);
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return c.json({
            error: 'Failed to update account',
            message: errorMessage,
            code: 'ACCOUNT_UPDATE_ERROR',
        }, 500);
    }
});
// DELETE /accounts/:id - Delete an account
export default accounts;
