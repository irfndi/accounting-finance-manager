import type { APIRoute } from 'astro';
import { validateToken } from '../../../lib/auth/index.ts';
import type { D1Database } from '@cloudflare/workers-types';

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
        JSON.stringify({ 
          error: 'Database configuration error',
          message: 'This API requires Cloudflare D1 database but is running in Node.js mode'
        }),
        { status: 503, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get query parameters
    const url = new URL(request.url);
    const entityId = url.searchParams.get('entityId') || 'default';

    // Calculate current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const startDate = startOfMonth.toISOString().split('T')[0];
    const endDate = endOfMonth.toISOString().split('T')[0];

    // Get account statistics
    const accountStatsQuery = `
      SELECT 
        COUNT(*) as total_accounts,
        COUNT(CASE WHEN is_active = 1 THEN 1 END) as active_accounts,
        COUNT(CASE WHEN is_active = 0 THEN 1 END) as inactive_accounts,
        COUNT(CASE WHEN type = 'ASSET' THEN 1 END) as asset_accounts,
        COUNT(CASE WHEN type = 'LIABILITY' THEN 1 END) as liability_accounts,
        COUNT(CASE WHEN type = 'EQUITY' THEN 1 END) as equity_accounts,
        COUNT(CASE WHEN type = 'REVENUE' THEN 1 END) as revenue_accounts,
        COUNT(CASE WHEN type = 'EXPENSE' THEN 1 END) as expense_accounts
      FROM accounts 
      WHERE entity_id = ?
    `;
    
    const accountStats = await db.prepare(accountStatsQuery).bind(entityId).first();

    // Get transaction statistics for current month
    const transactionStatsQuery = `
      SELECT 
        COUNT(*) as monthly_transactions,
        COUNT(DISTINCT DATE(transaction_date)) as active_days,
        SUM(amount) as total_amount,
        AVG(amount) as average_amount,
        MIN(amount) as min_amount,
        MAX(amount) as max_amount
      FROM transactions 
      WHERE entity_id = ? 
        AND transaction_date >= ? 
        AND transaction_date <= ?
    `;
    
    const transactionStats = await db.prepare(transactionStatsQuery)
      .bind(entityId, startDate, endDate)
      .first();

    // Get unbalanced entries (transactions where debits != credits)
    const unbalancedQuery = `
      SELECT COUNT(DISTINCT t.id) as unbalanced_entries
      FROM transactions t
      LEFT JOIN (
        SELECT 
          transaction_id,
          SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as total_debits,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as total_credits
        FROM journal_entries 
        WHERE entity_id = ?
        GROUP BY transaction_id
      ) je ON t.id = je.transaction_id
      WHERE t.entity_id = ?
        AND ABS(COALESCE(je.total_debits, 0) - COALESCE(je.total_credits, 0)) > 0.01
    `;
    
    const unbalancedStats = await db.prepare(unbalancedQuery)
      .bind(entityId, entityId)
      .first();

    // Get journal entry statistics
    const journalStatsQuery = `
      SELECT 
        COUNT(*) as total_journal_entries,
        COUNT(CASE WHEN type = 'debit' THEN 1 END) as debit_entries,
        COUNT(CASE WHEN type = 'credit' THEN 1 END) as credit_entries,
        SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as total_credits
      FROM journal_entries 
      WHERE entity_id = ?
        AND created_at >= ? 
        AND created_at <= ?
    `;
    
    const journalStats = await db.prepare(journalStatsQuery)
      .bind(entityId, startDate + 'T00:00:00Z', endDate + 'T23:59:59Z')
      .first();

    // Compile the response
    const stats = {
      accounts: {
        total: (accountStats as any)?.total_accounts || 0,
        active: (accountStats as any)?.active_accounts || 0,
        inactive: (accountStats as any)?.inactive_accounts || 0,
        byType: {
          assets: (accountStats as any)?.asset_accounts || 0,
          liabilities: (accountStats as any)?.liability_accounts || 0,
          equity: (accountStats as any)?.equity_accounts || 0,
          revenue: (accountStats as any)?.revenue_accounts || 0,
          expenses: (accountStats as any)?.expense_accounts || 0
        }
      },
      transactions: {
        monthlyCount: (transactionStats as any)?.monthly_transactions || 0,
        activeDays: (transactionStats as any)?.active_days || 0,
        totalAmount: (transactionStats as any)?.total_amount || 0,
        averageAmount: (transactionStats as any)?.average_amount || 0,
        minAmount: (transactionStats as any)?.min_amount || 0,
        maxAmount: (transactionStats as any)?.max_amount || 0
      },
      journalEntries: {
        total: (journalStats as any)?.total_journal_entries || 0,
        debits: (journalStats as any)?.debit_entries || 0,
        credits: (journalStats as any)?.credit_entries || 0,
        totalDebits: (journalStats as any)?.total_debits || 0,
        totalCredits: (journalStats as any)?.total_credits || 0
      },
      compliance: {
        unbalancedEntries: (unbalancedStats as any)?.unbalanced_entries || 0,
        balanceIntegrity: ((journalStats as any)?.total_debits || 0) === ((journalStats as any)?.total_credits || 0)
      },
      period: {
        startDate,
        endDate,
        description: `${startOfMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`
      }
    };

    return new Response(
      JSON.stringify({
        success: true,
        stats,
        entityId,
        generatedAt: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching statistics:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch statistics',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};