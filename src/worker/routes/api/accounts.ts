import { Hono } from 'hono'
import type { D1Database } from '@cloudflare/workers-types'

import { 
  DatabaseAdapter, 
  DatabaseAccountRegistry,
  FINANCIAL_CONSTANTS,
  getNormalBalance,
  formatCurrency,
  AccountingValidationError
} from '../../../lib/index.worker'

// Helper function to handle error responses
function handleAccountingError(error: unknown) {
  if (error instanceof AccountingValidationError) {
    const validationError = error as AccountingValidationError;
    return {
      error: validationError.message,
      code: validationError.code,
      details: validationError.details,
      accountingError: true
    };
  }
  return null;
}
import type { AccountType, NormalBalance, Account as CoreAccount } from '../../../types/index.js'
import { authMiddleware } from '../../middleware/auth'
import type { AppContext } from '../../types'



// Create accounts router
const accounts = new Hono<AppContext>()

accounts.use('/*', authMiddleware)

// Apply authentication middleware to all routes
// Use strict authentication for all account operations
accounts.use('*', authMiddleware)

// Validation schemas
const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'] as const
interface CreateAccountRequest {
  code: string
  name: string
  description?: string
  type: typeof accountTypes[number]
  subtype?: string
  category?: string
  parentId?: number
  isActive?: boolean
  isSystem?: boolean
  allowTransactions?: boolean
  normalBalance?: NormalBalance
  reportCategory?: string
  reportOrder?: number
}

// Enhanced validation using core logic
function validateAccountCode(code: string): string | null {
  if (!code || typeof code !== 'string') {
    return 'Account code is required and must be a string'
  }
  if (code.length < 2 || code.length > 20) {
    return 'Account code must be between 2 and 20 characters'
  }
  if (!/^[A-Z0-9.-]+$/i.test(code)) {
    return 'Account code can only contain letters, numbers, dots, and hyphens'
  }
  return null
}

function validateAccountName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return 'Account name is required and must be a string'
  }
  if (name.length < 3 || name.length > 100) {
    return 'Account name must be between 3 and 100 characters'
  }
  return null
}

function validateAccountType(type: string): string | null {
  if (!type || typeof type !== 'string') {
    return 'Account type is required'
  }
  if (!accountTypes.includes(type as typeof accountTypes[number])) {
    return `Account type must be one of: ${accountTypes.join(', ')}`
  }
  return null
}

function validateNormalBalance(normalBalance: string | undefined, accountType: string): string | null {
  if (normalBalance && !['DEBIT', 'CREDIT'].includes(normalBalance)) {
    return `Normal balance must be one of: DEBIT, CREDIT`
  }
  // Validate against accounting rules
  const expectedNormalBalance = getNormalBalance(accountType as AccountType)
  if (normalBalance && normalBalance !== expectedNormalBalance) {
    return `Account type ${accountType} should have normal balance ${expectedNormalBalance}, but ${normalBalance} was provided`
  }
  return null
}

// Helper function to create database adapter and account registry
async function createAccountingServices(d1Database: D1Database, entityId: string = 'default'): Promise<{
  dbAdapter: DatabaseAdapter
  accountRegistry: DatabaseAccountRegistry
}> {
  const dbAdapter = new DatabaseAdapter({
    database: d1Database,
    entityId,
    defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY
  })
  
  const accountRegistry = new DatabaseAccountRegistry(dbAdapter)
  await accountRegistry.loadAccountsFromDatabase()
  
  return { dbAdapter, accountRegistry }
}

// GET /accounts - List all accounts with enhanced functionality
accounts.get('/', async (c) => {
  try {
    // Get query parameters for filtering
    const { type, active, parent, entityId = 'default' } = c.req.query()
    
    const { accountRegistry } = await createAccountingServices(c.env.FINANCE_MANAGER_DB, entityId)
    
    let allAccounts
    
    if (type) {
      allAccounts = await accountRegistry.getAccountsByTypeFromDatabase(type.toUpperCase() as AccountType)
    } else {
      allAccounts = accountRegistry.getAllAccounts()
    }
    
    // Apply additional filters
    if (active !== undefined) {
      const isActive = active === 'true'
      allAccounts = allAccounts.filter((account: CoreAccount) => account.isActive === isActive)
    }
    
    if (parent) {
      const parentId = Number.parseInt(parent, 10)
      if (!Number.isNaN(parentId)) {
        allAccounts = allAccounts.filter((account: CoreAccount) => account.parentId === parentId)
      }
    }
    
    // Enhance response with accounting information
    const enhancedAccounts = allAccounts.map((account: CoreAccount) => ({
      ...account,
      normalBalance: getNormalBalance(account.type),
      formattedBalance: account.currentBalance ? formatCurrency(account.currentBalance, 'USD') : null,
      accountingInfo: {
        canHaveChildren: ['ASSET', 'LIABILITY', 'EQUITY'].includes(account.type),
        expectedNormalBalance: getNormalBalance(account.type),
        isBalanceSheet: ['ASSET', 'LIABILITY', 'EQUITY'].includes(account.type),
        isIncomeStatement: ['REVENUE', 'EXPENSE'].includes(account.type)
      }
    }))
    
    return c.json({
      accounts: enhancedAccounts,
      count: enhancedAccounts.length,
      filters: { type, active, parent, entityId },
      metadata: {
        supportedTypes: accountTypes,
        defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
        supportedCurrencies: FINANCIAL_CONSTANTS.SUPPORTED_CURRENCIES
      }
    })
  } catch (error: unknown) {
    console.error('Error fetching accounts:', error instanceof Error ? error.message : String(error));
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Error fetching accounts
    
    const accountingError = handleAccountingError(error);
    if (accountingError) {
      return c.json(accountingError, 400);
    }
    
    return c.json({
      error: 'Failed to fetch accounts',
      message: errorMessage,
      code: 'ACCOUNTS_FETCH_ERROR'
    }, 500)
  }
})

// GET /accounts/:id - Get account by ID with enhanced information
accounts.get('/:id', async (c) => {
  try {
    const accountId = Number.parseInt(c.req.param('id'), 10)
    const { entityId = 'default' } = c.req.query()
    
    if (Number.isNaN(accountId) || accountId <= 0) {
      return c.json({ 
        error: 'Invalid account ID',
        message: 'Account ID must be a positive integer',
        code: 'INVALID_ACCOUNT_ID'
      }, 400)
    }

    const { dbAdapter, accountRegistry } = await createAccountingServices(c.env.FINANCE_MANAGER_DB, entityId)
    
    const account = await dbAdapter.getAccount(accountId)
    
    if (!account) {
      return c.json({
        error: 'Account not found',
        message: `No account found with ID ${accountId}`,
        code: 'ACCOUNT_NOT_FOUND'
      }, 404)
    }
    
    // Get children accounts if this is a parent
    const childAccounts = accountRegistry.getAllAccounts().filter((acc: CoreAccount) => acc.parentId === accountId)
    
    // Enhanced account information
    const enhancedAccount = {
      ...account,
      normalBalance: getNormalBalance(account.type),
      formattedBalance: account.currentBalance ? formatCurrency(account.currentBalance, 'USD') : null,
      children: childAccounts.map((child: CoreAccount) => ({
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
    }
    
    return c.json({
      account: enhancedAccount
    })
  } catch (error: unknown) {
    console.error('Error fetching account:', error instanceof Error ? error.message : String(error));
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Error fetching account
    
    const accountingError = handleAccountingError(error);
    if (accountingError) {
      return c.json(accountingError, 400);
    }
    
    return c.json({
      error: 'Failed to fetch account',
      message: errorMessage,
      code: 'ACCOUNT_FETCH_ERROR'
    }, 500)
  }
})

// POST /accounts - Create new account with enhanced validation
accounts.post('/', async (c) => {
  try {
    const body: CreateAccountRequest & { entityId?: string } = await c.req.json()
    const entityId = body.entityId || 'default'
    
    // Enhanced validation using core logic
    const codeError = validateAccountCode(body.code)
    if (codeError) {
      return c.json({ error: codeError, code: 'VALIDATION_ERROR' }, 400)
    }
    
    const nameError = validateAccountName(body.name)
    if (nameError) {
      return c.json({ error: nameError, code: 'VALIDATION_ERROR' }, 400)
    }
    
    const typeError = validateAccountType(body.type)
    if (typeError) {
      return c.json({ error: typeError, code: 'VALIDATION_ERROR' }, 400)
    }
    
    const normalBalanceError = validateNormalBalance(body.normalBalance, body.type)
    if (normalBalanceError) {
      return c.json({ error: normalBalanceError, code: 'VALIDATION_ERROR' }, 400)
    }
    
    const { dbAdapter, accountRegistry } = await createAccountingServices(c.env.FINANCE_MANAGER_DB, entityId)
    
    // Check if account code already exists using account registry
    const existingAccounts = accountRegistry.getAllAccounts()
    const duplicateAccount = existingAccounts.find((acc: CoreAccount) => acc.code === body.code)
    if (duplicateAccount) {
      return c.json({
        error: 'Account code already exists',
        message: `An account with code '${body.code}' already exists`,
        code: 'DUPLICATE_ACCOUNT_CODE'
      }, 409)
    }
    
    // Validate parent account if provided
    if (body.parentId) {
      const parentAccount = await dbAdapter.getAccount(body.parentId)
      if (!parentAccount) {
        return c.json({
          error: 'Parent account not found',
          message: `Parent account with ID ${body.parentId} does not exist`,
          code: 'PARENT_ACCOUNT_NOT_FOUND'
        }, 400)
      }
      
      // Validate parent account type compatibility
      if (!['ASSET', 'LIABILITY', 'EQUITY'].includes(parentAccount.type)) {
        return c.json({
          error: 'Invalid parent account type',
          message: `Parent account must be ASSET, LIABILITY, or EQUITY, but found ${parentAccount.type}`,
          code: 'INVALID_PARENT_TYPE'
        }, 400)
      }
    }
    
    // Create account using core logic
    const accountData: Omit<CoreAccount, 'id' | 'createdAt' | 'updatedAt'> = {
      code: body.code,
      name: body.name,
      description: body.description || '',
      type: body.type as AccountType,
      subtype: body.subtype || '',
      category: body.category || '',
      parentId: body.parentId || undefined,
      level: 0, // Will be calculated by database adapter
      path: body.code, // Will be calculated by database adapter
      isActive: body.isActive !== false,
      isSystem: body.isSystem || false,
      allowTransactions: body.allowTransactions !== false,
      normalBalance: (body.normalBalance as NormalBalance) || getNormalBalance(body.type as AccountType),
      currentBalance: 0,
      reportCategory: body.reportCategory || body.type,
      reportOrder: body.reportOrder || 0,
      entityId: entityId
    }
    
    const newAccount = await dbAdapter.createAccount(accountData)
    
    // Register the new account in the registry
    accountRegistry.registerAccount(newAccount)
    
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
    }, 201)
  } catch (error: unknown) {
    console.error('Error creating account:', error instanceof Error ? error.message : String(error));
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    // Error creating account
    
    const accountingError = handleAccountingError(error);
    if (accountingError) {
      return c.json(accountingError, 400);
    }
    
    return c.json({
      error: 'Failed to create account',
      message: errorMessage,
      code: 'ACCOUNT_CREATE_ERROR'
    }, 500)
  }
})

// PUT /accounts/:id - Update an existing account
accounts.put('/:id', async (c) => {
  try {
    const accountId = Number.parseInt(c.req.param('id'), 10);
    if (Number.isNaN(accountId) || accountId <= 0) {
      return c.json(
        {
          error: 'Invalid account ID',
          message: 'Account ID must be a positive integer',
          code: 'INVALID_ACCOUNT_ID',
        },
        400
      );
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
      return c.json(
        {
          error: 'Account not found',
          message: `Account with ID ${accountId} not found`,
          code: 'ACCOUNT_NOT_FOUND',
        },
        404
      );
    }

    // Prepare update data
    const updateData: Partial<CoreAccount> = {
      name: body.name,
      description: body.description,
      type: body.type as AccountType,
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
  } catch (error: unknown) {
    console.error('Error updating account:', error instanceof Error ? error.message : String(error));
    const accountingError = handleAccountingError(error);
    if (accountingError) {
      return c.json(accountingError, 400);
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return c.json(
      {
        error: 'Failed to update account',
        message: errorMessage,
        code: 'ACCOUNT_UPDATE_ERROR',
      },
      500
    );
  }
});

// DELETE /accounts/:id - Delete an account

export default accounts