/**
 * Corporate Finance Manager - Cloudflare Worker API
 * Main entry point for the finance management system API
 */

// Cloudflare Worker types
/// <reference types="@cloudflare/workers-types" />

import { createDatabase, accounts, transactions, journalEntries, eq } from "@finance-manager/db";

export interface Env {
  // D1 Database binding
  FINANCE_MANAGER_DB: D1Database;
  
  // KV Storage binding
  FINANCE_MANAGER_CACHE: KVNamespace;
  
  // R2 Storage binding
  FINANCE_MANAGER_DOCUMENTS: R2Bucket;
  
  // Environment variables
  ENVIRONMENT: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname, method } = { pathname: url.pathname, method: request.method };

    // CORS headers for development
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // API Routes
      if (pathname.startsWith('/api/')) {
        return handleApiRequest(request, env, pathname, method);
      }

      // Health check
      if (pathname === '/health') {
        return new Response(JSON.stringify({
          status: 'healthy',
          environment: env.ENVIRONMENT,
          timestamp: new Date().toISOString(),
          worker: 'finance-manager'
        }), {
          headers: { 
            'Content-Type': 'application/json',
            ...corsHeaders 
          }
        });
      }

      // Default response
      return new Response(JSON.stringify({
        message: 'Corporate Finance Manager API',
        environment: env.ENVIRONMENT,
        endpoints: [
          '/health - Health check',
          '/api/accounts - Chart of accounts management',
          '/api/transactions - Financial transactions',
          '/api/reports - Financial reporting'
        ]
      }), {
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });

    } catch (error) {
      console.error('Worker error:', error);
      return new Response(JSON.stringify({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      }), {
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
    }
  },
};

async function handleApiRequest(
  request: Request, 
  env: Env, 
  pathname: string, 
  method: string
): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Parse API route
  const apiPath = pathname.replace('/api/', '');
  const [resource, ...params] = apiPath.split('/');

  switch (resource) {
    case 'accounts':
      return handleAccountsApi(request, env, method, params);
    
    case 'transactions':
      return handleTransactionsApi(request, env, method, params);
    
    case 'reports':
      return handleReportsApi(request, env, method, params);
    
    default:
      return new Response(JSON.stringify({
        error: 'Not found',
        message: `API endpoint /${resource} not found`
      }), {
        status: 404,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        }
      });
  }
}

async function handleAccountsApi(
  request: Request, 
  env: Env, 
  method: string, 
  params: string[]
): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const db = createDatabase(env.FINANCE_MANAGER_DB);

    switch (method) {
      case 'GET': {
        if (params[0]) {
          // Get specific account by ID
          const accountId = Number.parseInt(params[0], 10);
          const account = await db.select().from(accounts).where(eq(accounts.id, accountId));
          return new Response(JSON.stringify({
            account: account[0] || null,
          }), { headers: corsHeaders });
        }
        // Get all accounts
        const allAccounts = await db.select().from(accounts);
        return new Response(JSON.stringify({
          accounts: allAccounts,
          count: allAccounts.length,
        }), { headers: corsHeaders });
      }

      case 'POST': {
        // Create new account
        const body = await request.json() as Record<string, unknown>;
        
        // Calculate hierarchical path and level
        let level = 0;
        let path = body.code as string;
        
        if (body.parentId) {
          const parent = await db.select().from(accounts).where(eq(accounts.id, Number(body.parentId)));
          if (parent[0]) {
            level = parent[0].level + 1;
            path = `${parent[0].path}.${body.code}`;
          }
        }
        
        // Determine normal balance based on account type
        const accountType = body.type as string;
        const normalBalance = body.normalBalance as string || 
          (['ASSET', 'EXPENSE'].includes(accountType) ? 'DEBIT' : 'CREDIT');
        
        const newAccount = await db.insert(accounts).values({
          code: body.code as string,
          name: body.name as string,
          description: body.description as string || null,
          type: body.type as string,
          subtype: body.subtype as string || null,
          category: body.category as string || null,
          parentId: body.parentId ? Number(body.parentId) : null,
          level,
          path,
          isActive: Boolean(body.isActive ?? true),
          isSystem: Boolean(body.isSystem ?? false),
          allowTransactions: Boolean(body.allowTransactions ?? true),
          normalBalance,
          reportCategory: body.reportCategory as string || null,
          reportOrder: body.reportOrder ? Number(body.reportOrder) : 0,
          currentBalance: body.currentBalance ? Number(body.currentBalance) : 0,
          entityId: body.entityId ? Number(body.entityId) : null,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: body.createdBy as string || null,
          updatedBy: body.updatedBy as string || null,
        }).returning();
        
        return new Response(JSON.stringify({
          account: newAccount[0],
          message: 'Account created successfully',
        }), { 
          status: 201,
          headers: corsHeaders,
        });
      }

      default:
        return new Response(JSON.stringify({
          error: 'Method not allowed',
          allowed: ['GET', 'POST']
        }), {
          status: 405,
          headers: corsHeaders,
        });
    }
  } catch (error) {
    console.error('Accounts API Error:', error);
    return new Response(JSON.stringify({
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

async function handleTransactionsApi(
  request: Request, 
  env: Env, 
  method: string, 
  params: string[]
): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  // TODO: Implement with D1 database
  return new Response(JSON.stringify({
    message: 'Transactions API - Coming soon with D1 database integration',
    method,
    params,
    note: 'Will implement double-entry accounting transactions'
  }), { headers: corsHeaders });
}

async function handleReportsApi(
  request: Request, 
  env: Env, 
  method: string, 
  params: string[]
): Promise<Response> {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  // TODO: Implement with D1 database
  return new Response(JSON.stringify({
    message: 'Reports API - Coming soon with D1 database integration',
    method,
    params,
    note: 'Will implement financial reporting and analytics'
  }), { headers: corsHeaders });
} 