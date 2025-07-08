import type { APIRoute } from 'astro';
import { validateToken } from '../../../../lib/auth/index.js';
import { users, createDatabase } from '../../../../db/index.js';
import { eq } from 'drizzle-orm';
import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '../../../../worker/types';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Get authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return new Response(
        JSON.stringify({ error: 'Authorization token required' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate token
    const tokenValidation = await validateToken(token);
    if (!tokenValidation.valid || !tokenValidation.payload) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Try to get D1 database from different possible locations
    let d1Database: D1Database | undefined;
    
    // Check Cloudflare runtime first
    const runtime = (locals as any).runtime as { env: Env };
    if (runtime?.env?.FINANCE_MANAGER_DB) {
      d1Database = runtime.env.FINANCE_MANAGER_DB;
    }
    
    // Check platformProxy (for local development)
    const platformProxy = (locals as any).platformProxy as { env: Env };
    if (!d1Database && platformProxy?.env?.FINANCE_MANAGER_DB) {
      d1Database = platformProxy.env.FINANCE_MANAGER_DB;
    }
    
    // Check direct env access
    if (!d1Database && (locals as any).env?.FINANCE_MANAGER_DB) {
      d1Database = (locals as any).env.FINANCE_MANAGER_DB;
    }
    
    if (!d1Database) {
      return new Response(
        JSON.stringify({ error: 'Database not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get user from database
    const db = createDatabase(d1Database);
    const user = await db
      .select({
        id: users.id,
        email: users.email,
        createdAt: users.createdAt
      })
      .from(users)
      .where(eq(users.id, tokenValidation.payload.userId))
      .get();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        id: user.id,
        email: user.email,
        createdAt: user.createdAt
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Profile fetch error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};