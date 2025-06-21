import { Hono } from 'hono';
import { DatabaseAdapter, DatabaseAccountRegistry, TransactionBuilder, formatCurrency, AccountingValidationError, FINANCIAL_CONSTANTS, DatabaseJournalEntryManager, DoubleEntryError, } from '@finance-manager/core';
import { authMiddleware, getCurrentUser } from '../../middleware/auth';
const transactionsRouter = new Hono();
transactionsRouter.use('*', authMiddleware);
// Enhanced validation using core logic
function validateTransactionId(id) {
    const transactionId = Number.parseInt(id, 10);
    if (Number.isNaN(transactionId) || transactionId <= 0) {
        return {
            valid: false,
            error: 'Transaction ID must be a positive integer'
        };
    }
    return { valid: true, id: transactionId };
}
function validateTransactionAmount(amount) {
    if (typeof amount !== 'number' || amount <= 0) {
        return 'Transaction amount must be a positive number';
    }
    if (!Number.isFinite(amount)) {
        return 'Transaction amount must be a finite number';
    }
    if (amount > 999999999.99) {
        return 'Transaction amount exceeds maximum allowed value';
    }
    return null;
}
function validateCurrency(currency) {
    if (!currency || typeof currency !== 'string') {
        return 'Currency is required';
    }
    if (!FINANCIAL_CONSTANTS.SUPPORTED_CURRENCIES.includes(currency)) {
        return `Currency must be one of: ${FINANCIAL_CONSTANTS.SUPPORTED_CURRENCIES.join(', ')}`;
    }
    return null;
}
// GET /transactions - List all transactions with enhanced functionality
transactionsRouter.get('/', async (c) => {
    try {
        const user = getCurrentUser(c);
        if (!user)
            return c.json({ error: 'Unauthorized' }, 401);
        const dbAdapter = new DatabaseAdapter({
            database: c.env.FINANCE_MANAGER_DB,
            entityId: user.id,
            defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
        });
        // Get query parameters for filtering and pagination
        const { limit = '50', offset = '0', entityId = 'default', dateFrom, dateTo, status, currency } = c.req.query();
        // Validate pagination parameters
        const limitNum = Number.parseInt(limit, 10);
        const offsetNum = Number.parseInt(offset, 10);
        if (Number.isNaN(limitNum) || limitNum <= 0 || limitNum > 1000) {
            return c.json({
                error: 'Invalid limit parameter',
                message: 'Limit must be a positive integer between 1 and 1000',
                code: 'INVALID_LIMIT'
            }, 400);
        }
        if (Number.isNaN(offsetNum) || offsetNum < 0) {
            return c.json({
                error: 'Invalid offset parameter',
                message: 'Offset must be a non-negative integer',
                code: 'INVALID_OFFSET'
            }, 400);
        }
        // Validate currency filter if provided
        if (currency) {
            const currencyError = validateCurrency(currency);
            if (currencyError) {
                return c.json({
                    error: currencyError,
                    code: 'INVALID_CURRENCY'
                }, 400);
            }
        }
        // For now, use empty array since we don't have transactions yet
        // In a full implementation, we'd use the database adapter to fetch transactions
        const allTransactions = [];
        const totalCount = [];
        // Enhance transactions with accounting information
        const enhancedTransactions = allTransactions.map(transaction => ({
            ...transaction,
            // Note: Transaction interface doesn't have amount/currency - these come from journal entries
            accountingInfo: {
                isBalanced: true, // Would check journal entries in real implementation
                hasJournalEntries: true, // Would check actual journal entries
                currency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
                supportedCurrencies: FINANCIAL_CONSTANTS.SUPPORTED_CURRENCIES
            }
        }));
        return c.json({
            transactions: enhancedTransactions,
            count: enhancedTransactions.length,
            totalCount: totalCount.length,
            pagination: {
                limit: limitNum,
                offset: offsetNum,
                hasMore: (offsetNum + limitNum) < totalCount.length
            },
            filters: { entityId, dateFrom, dateTo, status, currency },
            metadata: {
                supportedCurrencies: FINANCIAL_CONSTANTS.SUPPORTED_CURRENCIES,
                defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
                supportedStatuses: ['PENDING', 'POSTED', 'CANCELLED', 'REVERSED']
            }
        });
    }
    catch (error) {
        console.error('Error fetching transactions:', error);
        if (error instanceof AccountingValidationError) {
            return c.json({
                error: error.message,
                code: error.code,
                details: error.details,
                accountingError: true
            }, 400);
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return c.json({
            error: 'Failed to fetch transactions',
            message: errorMessage,
            code: 'TRANSACTIONS_FETCH_ERROR'
        }, 500);
    }
});
// GET /transactions/:id - Get transaction by ID with journal entries
transactionsRouter.get('/:id', async (c) => {
    try {
        const idValidation = validateTransactionId(c.req.param('id'));
        if (!idValidation.valid) {
            return c.json({
                error: 'Invalid transaction ID',
                message: idValidation.error,
                code: 'INVALID_TRANSACTION_ID',
            }, 400);
        }
        const user = getCurrentUser(c);
        if (!user)
            return c.json({ error: 'Unauthorized' }, 401);
        const dbAdapter = new DatabaseAdapter({
            database: c.env.FINANCE_MANAGER_DB,
            entityId: user.id,
            defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
        });
        const accountRegistry = new DatabaseAccountRegistry(dbAdapter);
        await accountRegistry.loadAccountsFromDatabase();
        const journalManager = new DatabaseJournalEntryManager(dbAdapter, accountRegistry);
        const transaction = await dbAdapter.getTransaction(idValidation.id);
        if (!transaction) {
            return c.json({
                error: 'Transaction not found',
                message: `No transaction found with ID ${idValidation.id}`,
                code: 'TRANSACTION_NOT_FOUND'
            }, 404);
        }
        // Get associated journal entries
        const journalEntries = await journalManager.getTransactionJournalEntries(transaction.id);
        // Calculate totals from journal entries
        const debitTotal = journalEntries
            .reduce((sum, entry) => sum + entry.debitAmount, 0);
        const creditTotal = journalEntries
            .reduce((sum, entry) => sum + entry.creditAmount, 0);
        // Calculate transaction amount from journal entries
        const transactionAmount = Math.max(debitTotal, creditTotal);
        const transactionCurrency = journalEntries.length > 0 ? journalEntries[0].currency : FINANCIAL_CONSTANTS.DEFAULT_CURRENCY;
        const enhancedTransaction = {
            ...transaction,
            formattedAmount: formatCurrency(transactionAmount, transactionCurrency),
            journalEntries: journalEntries.map(entry => ({
                ...entry,
                formattedAmount: formatCurrency(entry.debitAmount || entry.creditAmount, entry.currency)
            })),
            accountingInfo: {
                isBalanced: Math.abs(debitTotal - creditTotal) < 0.01,
                debitTotal,
                creditTotal,
                formattedDebitTotal: formatCurrency(debitTotal, transactionCurrency),
                formattedCreditTotal: formatCurrency(creditTotal, transactionCurrency),
                journalEntriesCount: journalEntries.length,
                currency: transactionCurrency
            }
        };
        return c.json({
            transaction: enhancedTransaction
        });
    }
    catch (error) {
        console.error('Error fetching transaction:', error);
        if (error instanceof AccountingValidationError) {
            return c.json({
                error: error.message,
                code: error.code,
                details: error.details,
                accountingError: true
            }, 400);
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return c.json({
            error: 'Failed to fetch transaction',
            message: errorMessage,
            code: 'TRANSACTION_FETCH_ERROR'
        }, 500);
    }
});
transactionsRouter.post('/', async (c) => {
    try {
        const body = await c.req.json();
        // Enhanced validation using core logic
        if (!body.description || typeof body.description !== 'string') {
            return c.json({ error: 'Transaction description is required', code: 'VALIDATION_ERROR' }, 400);
        }
        // Validate entries array for double-entry bookkeeping
        if (!body.entries || !Array.isArray(body.entries) || body.entries.length < 2) {
            return c.json({
                error: 'Transaction must have at least 2 journal entries for double-entry bookkeeping',
                code: 'VALIDATION_ERROR',
            }, 400);
        }
        const currency = body.currency || FINANCIAL_CONSTANTS.DEFAULT_CURRENCY;
        const currencyError = validateCurrency(currency);
        if (currencyError) {
            return c.json({ error: currencyError, code: 'VALIDATION_ERROR' }, 400);
        }
        const user = getCurrentUser(c);
        if (!user)
            return c.json({ error: 'Unauthorized' }, 401);
        const dbAdapter = new DatabaseAdapter({
            database: c.env.FINANCE_MANAGER_DB,
            entityId: user.id,
            defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
        });
        const accountRegistry = new DatabaseAccountRegistry(dbAdapter);
        await accountRegistry.loadAccountsFromDatabase();
        const journalManager = new DatabaseJournalEntryManager(dbAdapter, accountRegistry);
        // Build transaction using the transaction builder
        const transactionBuilder = new TransactionBuilder()
            .setDescription(body.description)
            .setReference(body.reference || '')
            .setDate(body.transactionDate ? new Date(body.transactionDate) : new Date())
            .setCurrency(currency);
        // Add entries to the transaction builder
        for (const entry of body.entries) {
            if (!entry.accountId || typeof entry.accountId !== 'number') {
                return c.json({
                    error: 'Each entry must have a valid accountId',
                    code: 'VALIDATION_ERROR'
                }, 400);
            }
            const entryAmount = entry.debitAmount || entry.creditAmount || 0;
            const amountError = validateTransactionAmount(entryAmount);
            if (amountError) {
                return c.json({
                    error: `Entry amount error: ${amountError}`,
                    code: 'VALIDATION_ERROR'
                }, 400);
            }
            // Verify account exists
            const account = await dbAdapter.getAccount(entry.accountId);
            if (!account) {
                return c.json({
                    error: `Account with ID ${entry.accountId} not found`,
                    code: 'ACCOUNT_NOT_FOUND'
                }, 400);
            }
            if (!account.allowTransactions) {
                return c.json({
                    error: `Account '${account.name}' does not allow transactions`,
                    code: 'ACCOUNT_TRANSACTIONS_DISABLED'
                }, 400);
            }
            // Add to transaction builder based on entry amounts
            if (entry.debitAmount && entry.debitAmount > 0) {
                transactionBuilder.debit(entry.accountId, entry.debitAmount, entry.description);
            }
            else if (entry.creditAmount && entry.creditAmount > 0) {
                transactionBuilder.credit(entry.accountId, entry.creditAmount, entry.description);
            }
            else {
                return c.json({
                    error: 'Entry must have either debitAmount or creditAmount greater than 0',
                    code: 'VALIDATION_ERROR'
                }, 400);
            }
        }
        // Validate the transaction
        const validationErrors = transactionBuilder.validate();
        if (validationErrors.length > 0) {
            return c.json({
                error: 'Transaction validation failed',
                code: 'DOUBLE_ENTRY_VALIDATION_ERROR',
                details: validationErrors
            }, 400);
        }
        // Build the transaction data
        const transactionData = transactionBuilder.build();
        // Create and persist the transaction with journal entries
        const result = await journalManager.createAndPersistTransaction(transactionData);
        // Calculate transaction amount and currency from journal entries
        const transactionAmount = result.journalEntries.reduce((sum, entry) => sum + Math.max(entry.debitAmount, entry.creditAmount), 0);
        const transactionCurrency = result.journalEntries.length > 0 ?
            result.journalEntries[0].currency : FINANCIAL_CONSTANTS.DEFAULT_CURRENCY;
        // Format the response
        const enhancedTransaction = {
            ...result.transaction,
            formattedAmount: formatCurrency(transactionAmount, transactionCurrency),
            journalEntries: result.journalEntries.map(entry => ({
                ...entry,
                formattedAmount: formatCurrency(entry.debitAmount || entry.creditAmount, entry.currency)
            })),
            accountingInfo: {
                isBalanced: true,
                journalEntriesCount: result.journalEntries.length,
                currency: transactionCurrency
            }
        };
        return c.json({
            transaction: enhancedTransaction,
            message: 'Transaction created successfully with balanced journal entries'
        }, 201);
    }
    catch (error) {
        console.error('Error creating transaction:', error);
        if (error instanceof DoubleEntryError) {
            return c.json({
                error: error.message,
                code: error.code,
                details: error.details,
                accountingError: true,
                errorType: 'DOUBLE_ENTRY_VIOLATION'
            }, 400);
        }
        if (error instanceof AccountingValidationError) {
            return c.json({
                error: error.message,
                code: error.code,
                details: error.details,
                accountingError: true
            }, 400);
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return c.json({
            error: 'Failed to create transaction',
            message: errorMessage,
            code: 'TRANSACTION_CREATE_ERROR'
        }, 500);
    }
});
export default transactionsRouter;
