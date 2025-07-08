import type { APIRoute } from 'astro';
import { hashPassword } from '../../../../lib/auth/password.js';
import { users, createDatabase } from '../../../../db/index.js';
import { eq } from 'drizzle-orm';
import { sign } from 'hono/jwt';
import { z } from 'zod';
import { getSecret } from 'astro:env/server';
import type { D1Database } from '@cloudflare/workers-types';
import type { Env } from '../../../../worker/types';

export const prerender = false;

// Validation schema
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

// Simple email validation function
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Enhanced password validation
function validatePasswordDetailed(password: string): { isValid: boolean; errors: string[]; score: number } {
  const errors: string[] = [];
  let score = 0;
  
  if (!password || password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 20;
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 20;
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 20;
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 20;
  }
  
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  } else {
    score += 20;
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    score
  };
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = registerSchema.safeParse(body);
    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: 'Validation failed',
          details: validation.error.errors.map(e => e.message)
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const { email, password, firstName, lastName } = validation.data;
    
    // Additional email validation
    if (!validateEmail(email)) {
      return new Response(
        JSON.stringify({ error: 'Invalid email format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Enhanced password validation
    const passwordValidation = validatePasswordDetailed(password);
    if (!passwordValidation.isValid) {
      return new Response(
        JSON.stringify({
          error: 'Password validation failed',
          details: passwordValidation.errors,
          score: passwordValidation.score
        }),
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
    
    // Check if user already exists
    const existingUser = await database
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser.length > 0) {
      return new Response(
        JSON.stringify({ error: 'User already exists with this email' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Generate UUID for user ID
    const userId = crypto.randomUUID();
    
    // Hash password
    const hashedPassword = await hashPassword(password);
    
    // Create user
    const newUser = await database
      .insert(users)
      .values({
        id: userId,
        email,
        passwordHash: hashedPassword.combined,
        firstName,
        lastName,
        role: 'USER',
        isActive: true,
      })
      .returning();
    
    if (!newUser || newUser.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    const user = newUser[0];
    
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
        message: 'User registered successfully',
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
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};