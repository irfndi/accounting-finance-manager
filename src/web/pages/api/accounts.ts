import type { APIRoute } from 'astro';
import { DatabaseAdapter, DatabaseAccountRegistry, FINANCIAL_CONSTANTS, getNormalBalance, formatCurrency, AccountingValidationError } from '../../../lib/index.js';
import type { AccountType } from '../../../types/index.js';
import type { D1Database } from '@cloudflare/workers-types';

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

// GET /api/accounts - List all accounts
export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime as { env: { FINANCE_MANAGER_DB: D1Database } };
    
    if (!runtime?.env?.FINANCE_MANAGER_DB) {
      return new Response(
        JSON.stringify({ error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters for filtering
    const url = new URL(request.url);
    const entityId = url.searchParams.get('entityId') || 'default';
    
    const { dbAdapter: _dbAdapter, accountRegistry } = await createAccountingServices(runtime.env.FINANCE_MANAGER_DB, entityId);
    
    const type = url.searchParams.get('type');
    const active = url.searchParams.get('active');
    const parent = url.searchParams.get('parent');
    
    let allAccounts;
    if (type) {
      allAccounts = await accountRegistry.getAccountsByTypeFromDatabase(type.toUpperCase() as AccountType);
    } else {
      allAccounts = await accountRegistry.getAllAccountsFromDatabase();
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
    
    return new Response(
      JSON.stringify({
        accounts: enhancedAccounts,
        count: enhancedAccounts.length,
        filters: { type, active, parent, entityId },
        metadata: {
          supportedTypes: accountTypes,
          defaultCurrency: FINANCIAL_CONSTANTS.DEFAULT_CURRENCY,
          supportedCurrencies: FINANCIAL_CONSTANTS.SUPPORTED_CURRENCIES
        }
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
    
    console.error('Error fetching accounts:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch accounts',
        message: errorMessage
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// POST /api/accounts - Create new account
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const runtime = (locals as any).runtime as { env: { FINANCE_MANAGER_DB: D1Database } };
    
    if (!runtime?.env?.FINANCE_MANAGER_DB) {
      return new Response(
        JSON.stringify({ error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json() as any;
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
    
    // Extract entityId from request body or default to 'default'
    const entityId = body.entityId || 'default';
    
    const { dbAdapter: _dbAdapter, accountRegistry } = await createAccountingServices(runtime.env.FINANCE_MANAGER_DB, entityId);
    
    // Check for duplicate code
    const allAccounts = accountRegistry.getAllAccounts();
    const existingAccount = allAccounts.find(account => account.code === code);
    if (existingAccount) {
      return new Response(
        JSON.stringify({ error: `Account with code '${code}' already exists` }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Create account data
    const accountData = {
      code: code as string,
      name: name as string,
      type: type.toUpperCase() as AccountType,
      subtype: subtype || undefined,
      category: category || undefined,
      description: description || undefined,
      parentId: parentId ? Number.parseInt(parentId, 10) : undefined,
      level: 0,
      path: code as string,
      isActive: isActive !== false,
      isSystem: false,
      allowTransactions: allowTransactions !== false,
      normalBalance: getNormalBalance(type.toUpperCase() as AccountType),
      reportCategory: undefined,
      reportOrder: reportOrder || 0,
      currentBalance: 0,
      entityId: entityId,
      createdBy: undefined,
      updatedBy: undefined
    };

    // Create account in database
    const newAccount = await accountRegistry.registerAccount(accountData);
    
    return new Response(
      JSON.stringify({
        account: {
          ...newAccount,
          accountingInfo: {
            canHaveChildren: ['ASSET', 'LIABILITY', 'EQUITY'].includes(newAccount.type),
            expectedNormalBalance: getNormalBalance(newAccount.type),
            isBalanceSheet: ['ASSET', 'LIABILITY', 'EQUITY'].includes(newAccount.type),
            isIncomeStatement: ['REVENUE', 'EXPENSE'].includes(newAccount.type)
          }
        },
        message: 'Account created successfully'
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
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
    
    console.error('Error creating account:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to create account',
        message: errorMessage
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};