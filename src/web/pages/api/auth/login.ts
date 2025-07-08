import type { APIRoute } from 'astro';
import { verifyPassword } from '../../../../lib/auth/password.js';
import { users, createDatabase } from '../../../../db/index.js';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import { z } from 'zod';
import { getSecret } from 'astro:env/server';
import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '../../../../worker/types';

export const prerender = false;

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Simple email validation function
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = loginSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.errors.map(e => e.message)
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { email, password } = validation.data;
    
    // Additional email validation
    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Try to get D1 database from different possible locations
    let db: D1Database | undefined;
    
    // Check Cloudflare runtime first
    const runtime = (locals as any).runtime as { env: Env };
    if (runtime?.env?.FINANCE_MANAGER_DB) {
      db = runtime.env.FINANCE_MANAGER_DB;
    }
    
    // Check platformProxy (for local development)
    const platformProxy = (locals as any).platformProxy as { env: Env };
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
    
    const database = createDatabase(db);
    
    // Find user by email
    const userResult = await database
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (userResult.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const user = userResult[0];
    
    // Check if user is active
    if (!user.isActive) {
      return new Response(
        JSON.stringify({ error: 'Account is deactivated' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Verify password using combined hash format
    if (!user.passwordHash) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      return new Response(
        JSON.stringify({ error: 'Invalid email or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Update last login
    await database
      .update(users)
      .set({
        lastLoginAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, user.id));
    
    // Generate JWT token
    const jwtSecret = getSecret('JWT_SECRET');
    if (!jwtSecret) {
      return new Response(
        JSON.stringify({ error: 'JWT configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const token = await sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      },
      jwtSecret
    );
    
    // Return success response
    return new Response(
      JSON.stringify({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          createdAt: user.createdAt,
        },
        token,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};