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
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build the query
    let query = `
      SELECT 
        t.id,
        t.description,
        t.amount,
        t.currency,
        t.transaction_date,
        t.reference_number,
        t.created_at,
        t.updated_at,
        COUNT(je.id) as entry_count,
        SUM(CASE WHEN je.type = 'debit' THEN je.amount ELSE 0 END) as total_debits,
        SUM(CASE WHEN je.type = 'credit' THEN je.amount ELSE 0 END) as total_credits
      FROM transactions t
      LEFT JOIN journal_entries je ON t.id = je.transaction_id
      WHERE t.entity_id = ?
    `;
    
    const params: any[] = [entityId];
    
    // Add date filters if provided
    if (startDate) {
      query += ' AND t.transaction_date >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      query += ' AND t.transaction_date <= ?';
      params.push(endDate);
    }
    
    query += `
      GROUP BY t.id, t.description, t.amount, t.currency, t.transaction_date, t.reference_number, t.created_at, t.updated_at
      ORDER BY t.transaction_date DESC, t.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    params.push(limit, offset);

    // Execute the query
    const result = await db.prepare(query).bind(...params).all();
    
    // Get total count for pagination
    let countQuery = `
      SELECT COUNT(*) as total
      FROM transactions t
      WHERE t.entity_id = ?
    `;
    
    const countParams: any[] = [entityId];
    
    if (startDate) {
      countQuery += ' AND t.transaction_date >= ?';
      countParams.push(startDate);
    }
    
    if (endDate) {
      countQuery += ' AND t.transaction_date <= ?';
      countParams.push(endDate);
    }
    
    const countResult = await db.prepare(countQuery).bind(...countParams).first();
    const totalCount = (countResult as any)?.total || 0;

    // Transform the results
    const transactions = result.results.map((row: any) => ({
      id: row.id,
      description: row.description,
      amount: row.amount,
      currency: row.currency,
      transactionDate: row.transaction_date,
      referenceNumber: row.reference_number,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      entryCount: row.entry_count,
      totalDebits: row.total_debits,
      totalCredits: row.total_credits,
      isBalanced: Math.abs((row.total_debits || 0) - (row.total_credits || 0)) < 0.01
    }));

    return new Response(
      JSON.stringify({
        transactions,
        pagination: {
          total: totalCount,
          limit,
          offset,
          hasMore: offset + limit < totalCount
        },
        filters: {
          entityId,
          startDate,
          endDate
        }
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error fetching transactions:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch transactions',
        message: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};