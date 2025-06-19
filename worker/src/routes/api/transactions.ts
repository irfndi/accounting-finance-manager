import { Hono } from 'hono'
import { 
  DatabaseAdapter, 
  DatabaseAccountRegistry,
  TransactionBuilder,
  formatCurrency,
  AccountingValidationError,
  type Currency
} from '@finance-manager/core'
import { authMiddleware } from '../../middleware/auth'

// Environment bindings interface
type Env = {
  FINANCE_MANAGER_DB: D1Database
  FINANCE_MANAGER_CACHE: KVNamespace
  FINANCE_MANAGER_DOCUMENTS: R2Bucket
  ENVIRONMENT?: string
  JWT_SECRET?: string
  AUTH_SESSION_DURATION?: string
}

// Create transactions router
const transactionsRouter = new Hono<{ Bindings: Env }>()

// Apply authentication middleware to all routes
// Use strict authentication for all transaction operations
transactionsRouter.use('*', authMiddleware)

// Enhanced validation using core logic
function validateTransactionId(id: string): { valid: boolean; id?: number; error?: string } {
  const transactionId = Number.parseInt(id, 10)
  
  if (Number.isNaN(transactionId) || transactionId <= 0) {
    return {
      valid: false,
      error: 'Transaction ID must be a positive integer'
    }
  }
  
  return { valid: true, id: transactionId }
}

function validateTransactionAmount(amount: unknown): string | null {
  if (typeof amount !== 'number' || amount <= 0) {
    return 'Transaction amount must be a positive number'
  }
  if (!Number.isFinite(amount)) {
    return 'Transaction amount must be a finite number'
  }
  if (amount > 999999999.99) {
    return 'Transaction amount exceeds maximum allowed value'
  }
  return null
}

function validateCurrency(currency: string): string | null {
  if (!currency || typeof currency !== 'string') {
    return 'Currency is required'
  }
  if (!FINANCIAL_CONSTANTS.SUPPORTED_CURRENCIES.includes(currency as Currency)) {
    return `Currency must be one of: ${FINANCIAL_CONSTANTS.SUPPORTED_CURRENCIES.join(', ')}`
  }
  return null
}

// Helper function to create accounting services
async function createAccountingServices(d1Database: D1Database, entityId = 'default') {
  const dbAdapter = new DatabaseAdapter({
    database: d1Database,
    entityId,
    defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY
  })
  
  const accountRegistry = new DatabaseAccountRegistry(dbAdapter)
  await accountRegistry.loadAccountsFromDatabase()
  
  const journalManager = new DatabaseJournalEntryManager(dbAdapter, accountRegistry)
  
  return { dbAdapter, accountRegistry, journalManager }
}

// GET /transactions - List all transactions with enhanced functionality
transactionsRouter.get('/', async (c) => {
  try {
    const { dbAdapter: _dbAdapter } = await createAccountingServices(c.env.FINANCE_MANAGER_DB)
    
    // Get query parameters for filtering and pagination
    const { 
      limit = '50', 
      offset = '0', 
      entityId = 'default', 
      dateFrom, 
      dateTo,
      status,
      currency
    } = c.req.query()
    
    // Validate pagination parameters
    const limitNum = Number.parseInt(limit, 10)
    const offsetNum = Number.parseInt(offset, 10)
    
    if (Number.isNaN(limitNum) || limitNum <= 0 || limitNum > 1000) {
      return c.json({
        error: 'Invalid limit parameter',
        message: 'Limit must be a positive integer between 1 and 1000',
        code: 'INVALID_LIMIT'
      }, 400)
    }
    
    if (Number.isNaN(offsetNum) || offsetNum < 0) {
      return c.json({
        error: 'Invalid offset parameter',
        message: 'Offset must be a non-negative integer',
        code: 'INVALID_OFFSET'
      }, 400)
    }
    
    // Validate currency filter if provided
    if (currency) {
      const currencyError = validateCurrency(currency)
      if (currencyError) {
        return c.json({
          error: currencyError,
          code: 'INVALID_CURRENCY'
        }, 400)
      }
    }
    
    // For now, use empty array since we don't have transactions yet
    // In a full implementation, we'd use the database adapter to fetch transactions
    const allTransactions: any[] = []
    const totalCount: any[] = []
    
    // Enhance transactions with accounting information
    const enhancedTransactions = allTransactions.map(transaction => ({
      ...transaction,
      formattedAmount: formatCurrency(transaction.amount, transaction.currency as Currency),
      accountingInfo: {
        isBalanced: true, // Would check journal entries in real implementation
        hasJournalEntries: true, // Would check actual journal entries
        currency: transaction.currency,
        supportedCurrencies: FINANCIAL_CONSTANTS.SUPPORTED_CURRENCIES
      }
    }))
    
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
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    
    if (error instanceof AccountingValidationError) {
      return c.json({
        error: error.message,
        code: error.code,
        details: error.details,
        accountingError: true
      }, 400)
    }
    
    return c.json({
      error: 'Failed to fetch transactions',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'TRANSACTIONS_FETCH_ERROR'
    }, 500)
  }
})

// GET /transactions/:id - Get transaction by ID with journal entries
transactionsRouter.get('/:id', async (c) => {
  try {
    const idValidation = validateTransactionId(c.req.param('id'))
    
    if (!idValidation.valid) {
      return c.json({
        error: 'Invalid transaction ID',
        message: idValidation.error,
        code: 'INVALID_TRANSACTION_ID'
      }, 400)
    }

    const { dbAdapter, journalManager } = await createAccountingServices(c.env.FINANCE_MANAGER_DB)
    
    const transaction = await dbAdapter.getTransaction(idValidation.id as number)
    
    if (!transaction) {
      return c.json({
        error: 'Transaction not found',
        message: `No transaction found with ID ${idValidation.id}`,
        code: 'TRANSACTION_NOT_FOUND'
      }, 404)
    }
    
    // Get associated journal entries
    const journalEntries = await journalManager.getTransactionJournalEntries(transaction.id)
    
    // Calculate totals from journal entries
    const debitTotal = journalEntries
      .filter(entry => entry.type === 'DEBIT')
      .reduce((sum, entry) => sum + entry.amount, 0)
    
    const creditTotal = journalEntries
      .filter(entry => entry.type === 'CREDIT')
      .reduce((sum, entry) => sum + entry.amount, 0)
    
    const enhancedTransaction = {
      ...transaction,
      formattedAmount: formatCurrency(transaction.amount, transaction.currency),
      journalEntries: journalEntries.map(entry => ({
        ...entry,
        formattedAmount: formatCurrency(entry.amount, entry.currency)
      })),
      accountingInfo: {
        isBalanced: Math.abs(debitTotal - creditTotal) < 0.01,
        debitTotal,
        creditTotal,
        formattedDebitTotal: formatCurrency(debitTotal, transaction.currency),
        formattedCreditTotal: formatCurrency(creditTotal, transaction.currency),
        journalEntriesCount: journalEntries.length,
        currency: transaction.currency
      }
    }
    
    return c.json({
      transaction: enhancedTransaction
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    
    if (error instanceof AccountingValidationError) {
      return c.json({
        error: error.message,
        code: error.code,
        details: error.details,
        accountingError: true
      }, 400)
    }
    
    return c.json({
      error: 'Failed to fetch transaction',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'TRANSACTION_FETCH_ERROR'
    }, 500)
  }
})

// POST /transactions - Create new transaction with double-entry validation
transactionsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json()
    
    // Enhanced validation using core logic
    if (!body.description || typeof body.description !== 'string') {
      return c.json({
        error: 'Transaction description is required',
        code: 'VALIDATION_ERROR'
      }, 400)
    }
    
    // Validate entries array for double-entry bookkeeping
    if (!body.entries || !Array.isArray(body.entries) || body.entries.length < 2) {
      return c.json({
        error: 'Transaction must have at least 2 journal entries for double-entry bookkeeping',
        code: 'VALIDATION_ERROR'
      }, 400)
    }
    
    const currency = body.currency || FINANCIAL_CONSTANTS.DEFAULT_CURRENCY
    const currencyError = validateCurrency(currency)
    if (currencyError) {
      return c.json({
        error: currencyError,
        code: 'VALIDATION_ERROR'
      }, 400)
    }
    
    const { dbAdapter, accountRegistry: _accountRegistry, journalManager } = await createAccountingServices(c.env.FINANCE_MANAGER_DB)
    
    // Build transaction using the transaction builder
    const transactionBuilder = new TransactionBuilder()
      .setDescription(body.description)
      .setReference(body.reference || '')
      .setDate(body.transactionDate ? new Date(body.transactionDate) : new Date())
      .setCurrency(currency as Currency)
    
    // Add entries to the transaction builder
    for (const entry of body.entries) {
      if (!entry.accountId || typeof entry.accountId !== 'number') {
        return c.json({
          error: 'Each entry must have a valid accountId',
          code: 'VALIDATION_ERROR'
        }, 400)
      }
      
      const amountError = validateTransactionAmount(entry.amount)
      if (amountError) {
        return c.json({
          error: `Entry amount error: ${amountError}`,
          code: 'VALIDATION_ERROR'
        }, 400)
      }
      
      // Verify account exists
      const account = await dbAdapter.getAccount(entry.accountId)
      if (!account) {
        return c.json({
          error: `Account with ID ${entry.accountId} not found`,
          code: 'ACCOUNT_NOT_FOUND'
        }, 400)
      }
      
      if (!account.allowTransactions) {
        return c.json({
          error: `Account '${account.name}' does not allow transactions`,
          code: 'ACCOUNT_TRANSACTIONS_DISABLED'
        }, 400)
      }
      
      // Add to transaction builder based on entry type
      if (entry.type === 'DEBIT') {
        transactionBuilder.debit(entry.accountId, entry.amount, entry.description)
      } else if (entry.type === 'CREDIT') {
        transactionBuilder.credit(entry.accountId, entry.amount, entry.description)
      } else {
        return c.json({
          error: `Invalid entry type '${entry.type}'. Must be 'DEBIT' or 'CREDIT'`,
          code: 'VALIDATION_ERROR'
        }, 400)
      }
    }
    
    // Validate the transaction
    const validationErrors = transactionBuilder.validate()
    if (validationErrors.length > 0) {
      return c.json({
        error: 'Transaction validation failed',
        code: 'DOUBLE_ENTRY_VALIDATION_ERROR',
        details: validationErrors
      }, 400)
    }
    
    // Build the transaction data
    const transactionData = transactionBuilder.build()
    
    // Create and persist the transaction with journal entries
    const result = await journalManager.createAndPersistTransaction(transactionData)
    
    // Format the response
    const enhancedTransaction = {
      ...result.transaction,
      formattedAmount: formatCurrency(result.transaction.amount, result.transaction.currency),
      journalEntries: result.journalEntries.map(entry => ({
        ...entry,
        formattedAmount: formatCurrency(entry.amount, entry.currency)
      })),
      accountingInfo: {
        isBalanced: true,
        journalEntriesCount: result.journalEntries.length,
        currency: result.transaction.currency
      }
    }
    
    return c.json({
      transaction: enhancedTransaction,
      message: 'Transaction created successfully with balanced journal entries'
    }, 201)
  } catch (error) {
    console.error('Error creating transaction:', error)
    
    if (error instanceof DoubleEntryError) {
      return c.json({
        error: error.message,
        code: error.code,
        details: error.details,
        accountingError: true,
        errorType: 'DOUBLE_ENTRY_VIOLATION'
      }, 400)
    }
    
    if (error instanceof AccountingValidationError) {
      return c.json({
        error: error.message,
        code: error.code,
        details: error.details,
        accountingError: true
      }, 400)
    }
    
    return c.json({
      error: 'Failed to create transaction',
      message: error instanceof Error ? error.message : 'Unknown error',
      code: 'TRANSACTION_CREATE_ERROR'
    }, 500)
  }
})

export default transactionsRouter