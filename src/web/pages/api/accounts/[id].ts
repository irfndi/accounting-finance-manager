import type { APIRoute } from 'astro';
import { DatabaseAdapter, DatabaseAccountRegistry, FINANCIAL_CONSTANTS, getNormalBalance, formatCurrency, AccountingValidationError } from '../../../../lib/index.js';
import type { AccountType } from '../../../../types/index.js';

// Validation schemas
const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

// Enhanced validation using core logic
function validateAccountCode(code: string): string | null {
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

function validateAccountName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return 'Account name is required and must be a string';
  }
  if (name.length < 3 || name.length > 100) {
    return 'Account name must be between 3 and 100 characters';
  }
  return null;
}

function validateAccountType(type: string): string | null {
  if (!type || typeof type !== 'string') {
    return 'Account type is required';
  }
  if (!accountTypes.includes(type)) {
    return `Account type must be one of: ${accountTypes.join(', ')}`;
  }
  return null;
}

// Helper function to create database adapter and account registry
async function createAccountingServices(d1Database: D1Database, entityId = 'default') {
  const dbAdapter = new DatabaseAdapter({
    database: d1Database,
    entityId,
    defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY
  });
  
  const accountRegistry = new DatabaseAccountRegistry(dbAdapter);
  await accountRegistry.loadAccountsFromDatabase();
  return { dbAdapter, accountRegistry };
}

// GET /api/accounts/[id] - Get specific account
export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const runtime = (locals as any).runtime as { env: { FINANCE_MANAGER_DB: D1Database } };
    
    if (!runtime?.env?.FINANCE_MANAGER_DB) {
      return new Response(
        JSON.stringify({ error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const accountId = params.id;
    if (!accountId) {
      return new Response(
        JSON.stringify({ error: 'Account ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { accountRegistry } = await createAccountingServices(runtime.env.FINANCE_MANAGER_DB);
    
    const account = await accountRegistry.getAccountById(Number.parseInt(accountId, 10));
    if (!account) {
      return new Response(
        JSON.stringify({ error: 'Account not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Enhance response with accounting information
    const enhancedAccount = {
      ...account,
      normalBalance: getNormalBalance(account.type),
      formattedBalance: account.currentBalance ? formatCurrency(account.currentBalance, 'USD') : null,
      accountingInfo: {
        canHaveChildren: ['ASSET', 'LIABILITY', 'EQUITY'].includes(account.type),
        expectedNormalBalance: getNormalBalance(account.type),
        isBalanceSheet: ['ASSET', 'LIABILITY', 'EQUITY'].includes(account.type),
        isIncomeStatement: ['REVENUE', 'EXPENSE'].includes(account.type)
      }
    };
    
    return new Response(
      JSON.stringify({ account: enhancedAccount }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error fetching account:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch account',
        message: errorMessage
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// PUT /api/accounts/[id] - Update account
export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    const runtime = (locals as any).runtime as { env: { FINANCE_MANAGER_DB: D1Database } };
    
    if (!runtime?.env?.FINANCE_MANAGER_DB) {
      return new Response(
        JSON.stringify({ error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const accountId = params.id;
    if (!accountId) {
      return new Response(
        JSON.stringify({ error: 'Account ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as {
      code: string;
      name: string;
      type: string;
      subtype?: string;
      category?: string;
      description?: string;
      parentId?: string;
      isActive?: boolean;
      allowTransactions?: boolean;
      reportOrder?: number;
    };
    const { code, name, type, subtype, category, description, parentId, isActive, allowTransactions, reportOrder } = body;
    
    // Validate required fields
    const codeError = validateAccountCode(code);
    if (codeError) {
      return new Response(
        JSON.stringify({ error: codeError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const nameError = validateAccountName(name);
    if (nameError) {
      return new Response(
        JSON.stringify({ error: nameError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const typeError = validateAccountType(type);
    if (typeError) {
      return new Response(
        JSON.stringify({ error: typeError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { accountRegistry } = await createAccountingServices(runtime.env.FINANCE_MANAGER_DB);
    
    const existingAccount = await accountRegistry.getAccountById(Number.parseInt(accountId, 10));
    if (!existingAccount) {
      return new Response(
        JSON.stringify({ error: 'Account not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check for duplicate code (excluding current account)
    const duplicateAccount = accountRegistry.getAccountByCode(code);
    if (duplicateAccount && duplicateAccount.id !== existingAccount.id) {
      return new Response(
        JSON.stringify({ error: `Account with code '${code}' already exists` }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Update account data
    const updateData = {
      code,
      name,
      type: type.toUpperCase() as AccountType,
      subtype: subtype || undefined,
      category: category || undefined,
      description: description || undefined,
      parentId: parentId ? Number.parseInt(parentId, 10) : undefined,
      isActive: isActive !== false,
      allowTransactions: allowTransactions !== false,
      reportOrder: reportOrder || 0,
      normalBalance: getNormalBalance(type.toUpperCase() as AccountType)
    };
    
    // Update account in database
    const updatedAccount = await accountRegistry.updateAccount(existingAccount.id, updateData);
    
    return new Response(
      JSON.stringify({
        account: {
          ...updatedAccount,
          accountingInfo: {
            canHaveChildren: ['ASSET', 'LIABILITY', 'EQUITY'].includes(updatedAccount.type),
            expectedNormalBalance: getNormalBalance(updatedAccount.type),
            isBalanceSheet: ['ASSET', 'LIABILITY', 'EQUITY'].includes(updatedAccount.type),
            isIncomeStatement: ['REVENUE', 'EXPENSE'].includes(updatedAccount.type)
          }
        },
        message: 'Account updated successfully'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (error instanceof AccountingValidationError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
          details: error.details,
          accountingError: true
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.error('Error updating account:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to update account',
        message: errorMessage
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// DELETE /api/accounts/[id] - Delete account
export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    const runtime = (locals as any).runtime as { env: { FINANCE_MANAGER_DB: D1Database } };
    
    if (!runtime?.env?.FINANCE_MANAGER_DB) {
      return new Response(
        JSON.stringify({ error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const accountId = params.id;
    if (!accountId) {
      return new Response(
        JSON.stringify({ error: 'Account ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { accountRegistry } = await createAccountingServices(runtime.env.FINANCE_MANAGER_DB);
    
    const existingAccount = await accountRegistry.getAccountById(Number.parseInt(accountId, 10));
    if (!existingAccount) {
      return new Response(
        JSON.stringify({ error: 'Account not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if account has child accounts
    const allAccounts = await accountRegistry.getAllAccountsFromDatabase();
    const hasChildren = allAccounts.some(account => account.parentId === existingAccount.id);
    if (hasChildren) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete account with child accounts' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Check if account has transactions (this would require transaction checking logic)
    // For now, we'll allow deletion but in production you'd want to check for transactions
    
    // Delete account from database
    await accountRegistry.deleteAccount(existingAccount.id);
    
    return new Response(
      JSON.stringify({ message: 'Account deleted successfully' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    if (error instanceof AccountingValidationError) {
      return new Response(
        JSON.stringify({
          error: error.message,
          code: error.code,
          details: error.details,
          accountingError: true
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    console.error('Error deleting account:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to delete account',
        message: errorMessage
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};