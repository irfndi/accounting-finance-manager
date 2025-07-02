import type { APIRoute } from 'astro';
import { DatabaseAdapter, DatabaseAccountRegistry, FINANCIAL_CONSTANTS, getNormalBalance, formatCurrency, AccountingValidationError } from '../../../lib/index.ts';
import { validateToken } from '../../../lib/auth/index.ts';
import type { AccountType } from '../../../types/index.ts';
import type { D1Database } from '@cloudflare/workers-types';

// Validation schemas
const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

// Enhanced validation using core logic
export function validateAccountCode(code: string): string | null {
  if (!code || typeof code !== 'string') {
    return 'Account code is required';
  }
  const trimmedCode = code.trim();
  if (!trimmedCode) {
    return 'Account code is required';
  }
  if (trimmedCode.length < 3) {
    return 'Account code must be at least 3 characters';
  }
  if (trimmedCode.length > 20) {
    return 'Account code must be at most 20 characters';
  }
  if (!/^[A-Z0-9.-]+$/i.test(trimmedCode)) {
    return 'Account code can only contain letters, numbers, dots, and hyphens';
  }
  return null;
}

export function validateAccountName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return 'Account name is required';
  }
  const trimmedName = name.trim();
  if (!trimmedName) {
    return 'Account name is required';
  }
  if (trimmedName.length < 2) {
    return 'Account name must be at least 2 characters';
  }
  if (trimmedName.length > 100) {
    return 'Account name must be at most 100 characters';
  }
  return null;
}

export function validateAccountType(type: string): string | null {
  if (!type || typeof type !== 'string') {
    return `Account type must be one of: ${accountTypes.join(', ')}`;
  }
  const trimmedType = type.trim();
  if (!accountTypes.includes(trimmedType)) {
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
    // Validate authentication
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authorization token required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tokenValidation = await validateToken(token);
    if (!tokenValidation.valid) {
      return new Response(
        JSON.stringify({ error: tokenValidation.error || 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('Locals object:', JSON.stringify(locals, null, 2));
    
    // Try to get D1 database from different possible locations
    let db: D1Database | undefined;
    
    // Check Cloudflare runtime first
    const runtime = (locals as any).runtime as { env: { FINANCE_MANAGER_DB: D1Database } };
    if (runtime?.env?.FINANCE_MANAGER_DB) {
      db = runtime.env.FINANCE_MANAGER_DB;
      console.log('Using Cloudflare D1 database from runtime');
    }
    
    // Check platformProxy (for local development)
    const platformProxy = (locals as any).platformProxy;
    if (!db && platformProxy?.env?.FINANCE_MANAGER_DB) {
      db = platformProxy.env.FINANCE_MANAGER_DB;
      console.log('Using D1 database from platformProxy');
    }
    
    // Check direct env access
    if (!db && (locals as any).env?.FINANCE_MANAGER_DB) {
      db = (locals as any).env.FINANCE_MANAGER_DB;
      console.log('Using D1 database from direct env');
    }
    
    console.log('Database found:', !!db);
    console.log('Runtime object:', JSON.stringify(runtime, null, 2));
    console.log('PlatformProxy:', JSON.stringify(platformProxy, null, 2));
    
    // Check for database availability
    if (!db) {
      console.error('Database not available. This API requires Cloudflare D1 database.');
      console.error('Current adapter: Node.js (expected: Cloudflare)');
      console.error('To fix: Switch to Cloudflare adapter or set up local database');
      
      return new Response(
        JSON.stringify({ 
          error: 'Database configuration error',
          message: 'This API requires Cloudflare D1 database but is running in Node.js mode',
          solution: 'Switch to Cloudflare adapter in astro.config.mjs or configure local database',
          debug: {
            adapter: 'node',
            expectedAdapter: 'cloudflare',
            hasRuntime: !!runtime,
            hasEnv: !!(runtime?.env),
            hasDB: !!(runtime?.env?.FINANCE_MANAGER_DB),
            localsKeys: Object.keys(locals || {}),
            runtimeKeys: Object.keys(runtime || {})
          }
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters for filtering
    const url = new URL(request.url);
    const entityId = url.searchParams.get('entityId') || 'default';
    
    const { dbAdapter: _dbAdapter, accountRegistry } = await createAccountingServices(db, entityId);
    
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
    // Validate authentication
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authorization token required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const tokenValidation = await validateToken(token);
    if (!tokenValidation.valid) {
      return new Response(
        JSON.stringify({ error: tokenValidation.error || 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Try to get D1 database from different possible locations
    let db: D1Database | undefined;
    
    // Check Cloudflare runtime first
    const runtime = (locals as any).runtime as { env: { FINANCE_MANAGER_DB: D1Database } };
    if (runtime?.env?.FINANCE_MANAGER_DB) {
      db = runtime.env.FINANCE_MANAGER_DB;
    }
    
    // Check platformProxy (for local development)
    const platformProxy = (locals as any).platformProxy;
    if (!db && platformProxy?.env?.FINANCE_MANAGER_DB) {
      db = platformProxy.env.FINANCE_MANAGER_DB;
    }
    
    // Check direct env access
    if (!db && (locals as any).env?.FINANCE_MANAGER_DB) {
      db = (locals as any).env.FINANCE_MANAGER_DB;
    }
    
    if (!db) {
      return new Response(
        JSON.stringify({ error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse JSON with error handling
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: 'Invalid JSON in request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
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
    
    // Check for duplicate code using direct database query
    const existingAccountQuery = db.prepare('SELECT id FROM accounts WHERE code = ? AND entity_id = ?');
    const existingAccount = await existingAccountQuery.bind(code, entityId).first();
    if (existingAccount) {
      return new Response(
        JSON.stringify({ error: 'Account code already exists' }),
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

    // Create account in database using direct insert
    const insertQuery = db.prepare(`
      INSERT INTO accounts (
        code, name, type, subtype, category, description, parent_id, level, path,
        is_active, is_system, allow_transactions, normal_balance, report_category,
        report_order, current_balance, entity_id, created_by, updated_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = await insertQuery.bind(
      accountData.code,
      accountData.name,
      accountData.type,
      accountData.subtype,
      accountData.category,
      accountData.description,
      accountData.parentId,
      accountData.level,
      accountData.path,
      accountData.isActive ? 1 : 0,
      accountData.isSystem ? 1 : 0,
      accountData.allowTransactions ? 1 : 0,
      accountData.normalBalance,
      accountData.reportCategory,
      accountData.reportOrder,
      accountData.currentBalance,
      accountData.entityId,
      accountData.createdBy,
      accountData.updatedBy
    ).run();
    
    const newAccount = {
      id: result.meta.last_row_id,
      ...accountData
    };
    
    return new Response(
      JSON.stringify({
        ...newAccount,
        accountingInfo: {
          canHaveChildren: ['ASSET', 'LIABILITY', 'EQUITY'].includes(newAccount.type),
          expectedNormalBalance: getNormalBalance(newAccount.type),
          isBalanceSheet: ['ASSET', 'LIABILITY', 'EQUITY'].includes(newAccount.type),
          isIncomeStatement: ['REVENUE', 'EXPENSE'].includes(newAccount.type)
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