import { Hono } from 'hono';
import { DatabaseAdapter, DatabaseAccountRegistry, TransactionBuilder, formatCurrency, AccountingValidationError, FINANCIAL_CONSTANTS, DatabaseJournalEntryManager, DoubleEntryError, } from '../../../lib/index.worker.js';
import { authMiddleware } from '../../middleware/auth';
import { FinancialAIService, createAIService } from '../../../ai/index.js';
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
        const user = c.get('user');
        if (!user)
            return c.json({ error: 'Unauthorized' }, 401);
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
        const totalCount = 0;
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
            totalCount,
            pagination: {
                limit: limitNum,
                offset: offsetNum,
                hasMore: (offsetNum + limitNum) < totalCount
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
        // Error fetching transactions
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
        const user = c.get('user');
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
        const journalEntries = await journalManager.getTransactionJournalEntries(parseInt(transaction.id));
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
        // Error fetching transaction
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
        const user = c.get('user');
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
        const transactionAmount = result.journalEntries.reduce((sum, entry) => sum + (entry.debitAmount || entry.creditAmount || 0), 0) / 2; // Each transaction is double-entry, so we divide by 2
        const transactionCurrency = result.journalEntries.length > 0 ?
            result.journalEntries[0].currency : FINANCIAL_CONSTANTS.DEFAULT_CURRENCY;
        // Auto-categorize the transaction if it's an expense
        let categorizationSuggestion = null;
        try {
            // Check if this is an expense transaction (has debit entries to expense accounts)
            const expenseEntry = result.journalEntries.find((entry) => {
                const account = accountRegistry.getAccount(entry.accountId);
                return account && account.type === 'EXPENSE' && entry.debitAmount > 0;
            });
            if (expenseEntry && body.description) {
                // Initialize AI services for categorization
                const aiService = createAIService();
                const financialAI = new FinancialAIService(aiService);
                const suggestion = await financialAI.categorizeExpense(body.description, transactionAmount);
                // Find matching account for the suggested category
                let suggestedAccountId;
                try {
                    const accounts = await dbAdapter.getAllAccounts();
                    const matchingAccount = accounts.find(account => account.category?.toLowerCase().includes(suggestion.category.toLowerCase()) ||
                        account.name.toLowerCase().includes(suggestion.category.toLowerCase()));
                    if (matchingAccount) {
                        suggestedAccountId = matchingAccount.id?.toString();
                    }
                }
                catch (error) {
                    console.warn('Failed to find matching account:', error);
                }
                // Generate unique suggestion ID
                const suggestionId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
                // Create suggestion object for KV storage
                const kvSuggestion = {
                    id: suggestionId,
                    transactionId: result.transaction.id?.toString(),
                    userId: user.id,
                    timestamp: Date.now(),
                    status: 'pending',
                    suggestedCategory: suggestion.category,
                    suggestedSubcategory: suggestion.subcategory,
                    suggestedAccountId,
                    originalAccountId: expenseEntry.accountId,
                    confidence: suggestion.confidence,
                    originalDescription: body.description,
                    amount: transactionAmount,
                    currency: transactionCurrency
                };
                // Store suggestion in KV for user approval (7 days expiration)
                const kvKey = `categorization:${user.id}:${suggestionId}`;
                await c.env.FINANCE_MANAGER_CACHE.put(kvKey, JSON.stringify(kvSuggestion), { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
                );
                // Create response suggestion object
                categorizationSuggestion = {
                    suggestionId,
                    category: suggestion.category,
                    subcategory: suggestion.subcategory,
                    accountId: suggestedAccountId,
                    confidence: suggestion.confidence,
                    requiresApproval: suggestion.confidence < 0.8
                };
            }
        }
        catch (categorizationError) {
            console.warn('Failed to generate categorization suggestion:', categorizationError);
            // Continue with transaction creation even if categorization fails
        }
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
        const response = {
            transaction: enhancedTransaction,
            message: 'Transaction created successfully with balanced journal entries'
        };
        // Include categorization suggestion if available
        if (categorizationSuggestion) {
            response.categorization = categorizationSuggestion;
            response.message += ' with AI categorization suggestion';
        }
        return c.json(response, 201);
    }
    catch (error) {
        // Error creating transaction
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
// GET /transactions/categorization-suggestions - Get all pending categorization suggestions
transactionsRouter.get('/categorization-suggestions', async (c) => {
    try {
        const user = c.get('user');
        if (!user)
            return c.json({ error: 'Unauthorized' }, 401);
        const kvStore = c.env.FINANCE_MANAGER_CACHE;
        const suggestionKeys = await kvStore.list({ prefix: `categorization:${user.id}:` });
        const suggestions = await Promise.all(suggestionKeys.keys.map(async (key) => {
            const data = await kvStore.get(key.name);
            return data ? JSON.parse(data) : null;
        }));
        const validSuggestions = suggestions.filter(s => s !== null);
        return c.json({
            suggestions: validSuggestions,
            count: validSuggestions.length,
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return c.json({
            error: 'Failed to fetch categorization suggestions',
            message: errorMessage,
            code: 'SUGGESTIONS_FETCH_ERROR',
        }, 500);
    }
});
// POST /transactions/categorization-suggestions/:suggestionId/apply - Apply a suggestion
transactionsRouter.post('/categorization-suggestions/:suggestionId/apply', async (c) => {
    try {
        const user = c.get('user');
        if (!user)
            return c.json({ error: 'Unauthorized' }, 401);
        const suggestionId = c.req.param('suggestionId');
        const kvKey = `categorization:${user.id}:${suggestionId}`;
        // 1. Get suggestion
        const suggestionJSON = await c.env.FINANCE_MANAGER_CACHE.get(kvKey);
        if (!suggestionJSON) {
            return c.json({ error: 'Suggestion not found or expired' }, 404);
        }
        const suggestion = JSON.parse(suggestionJSON);
        // 2. Validate suggestion
        if (!suggestion.suggestedAccountId || !suggestion.originalAccountId || !suggestion.amount) {
            return c.json({ error: 'Invalid suggestion data for application' }, 400);
        }
        // 3. Create a re-classification transaction
        const dbAdapter = new DatabaseAdapter({
            database: c.env.FINANCE_MANAGER_DB,
            entityId: user.id,
            defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
        });
        const accountRegistry = new DatabaseAccountRegistry(dbAdapter);
        await accountRegistry.loadAccountsFromDatabase();
        const journalManager = new DatabaseJournalEntryManager(dbAdapter, accountRegistry);
        const transactionBuilder = new TransactionBuilder()
            .setDescription(`Re-classify expense from transaction ${suggestion.transactionId} based on suggestion ${suggestionId}`)
            .setReference(`SUGGESTION_APPLY_${suggestionId}`)
            .setDate(new Date())
            .setCurrency(suggestion.currency);
        // Credit the original account, debit the new one
        transactionBuilder.credit(suggestion.originalAccountId, suggestion.amount);
        transactionBuilder.debit(suggestion.suggestedAccountId, suggestion.amount);
        // 4. Validate and persist
        const validationErrors = transactionBuilder.validate();
        if (validationErrors.length > 0) {
            return c.json({
                error: 'Failed to create re-classification transaction',
                code: 'DOUBLE_ENTRY_VALIDATION_ERROR',
                details: validationErrors
            }, 400);
        }
        const transactionData = transactionBuilder.build();
        const result = await journalManager.createAndPersistTransaction(transactionData);
        // 5. Delete the suggestion from KV
        await c.env.FINANCE_MANAGER_CACHE.delete(kvKey);
        return c.json({
            message: 'Suggestion applied successfully. A new re-classification transaction has been created.',
            transaction: result.transaction,
        });
    }
    catch (error) {
        if (error instanceof DoubleEntryError) {
            return c.json({
                error: error.message,
                code: error.code,
                details: error.details,
                accountingError: true,
                errorType: 'DOUBLE_ENTRY_VIOLATION'
            }, 400);
        }
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return c.json({
            error: 'Failed to apply suggestion',
            message: errorMessage,
            code: 'SUGGESTION_APPLY_ERROR',
        }, 500);
    }
});
// DELETE /transactions/categorization-suggestions/:suggestionId - Reject a suggestion
transactionsRouter.delete('/categorization-suggestions/:suggestionId', async (c) => {
    try {
        const user = c.get('user');
        if (!user)
            return c.json({ error: 'Unauthorized' }, 401);
        const suggestionId = c.req.param('suggestionId');
        const kvKey = `categorization:${user.id}:${suggestionId}`;
        await c.env.FINANCE_MANAGER_CACHE.delete(kvKey);
        return c.json({ message: 'Suggestion rejected successfully' });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return c.json({
            error: 'Failed to reject suggestion',
            message: errorMessage,
            code: 'SUGGESTION_REJECT_ERROR',
        }, 500);
    }
});
export default transactionsRouter;
