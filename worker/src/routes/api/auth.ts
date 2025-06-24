import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { users, createDatabase } from '@finance-manager/db';
import type { InferInsertModel } from 'drizzle-orm';
import { AppContext } from '../../types';
import { authMiddleware } from '../../middleware/auth';

// Simple email validation function
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Simple password validation function
function validatePassword(password: string): boolean {
  return Boolean(password && password.length >= 8);
}

// Helper functions for password hashing using Web Crypto API
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const hashedInput = await hashPassword(password);
  return hashedInput === hash;
}

const authRouter = new Hono<AppContext>();

// Helper to get session duration from environment (default 7 days)
const getSessionDuration = (env: AppContext['Bindings']): string => {
  return env.AUTH_SESSION_DURATION || '7d';
};

// Registration endpoint
authRouter.post('/register', async (c) => {
  // Registration endpoint started
  
  const db = createDatabase(c.env.FINANCE_MANAGER_DB);
  const jwtSecret = c.env.JWT_SECRET;

  if (!jwtSecret) {
    // JWT_SECRET is missing
    return c.json({ error: 'Server configuration error', message: 'Authentication not properly configured' }, 500);
  }

  try {
    // Registration attempt started
    const { email, password, name } = await c.req.json();
    // Request data parsed

    if (!email || !password) {
      return c.json({ error: 'Missing required fields', message: 'Email and password are required' }, 400);
    }

    // Validating email
    if (!validateEmail(email)) {
      return c.json({ error: 'Invalid email format', message: 'Please provide a valid email address' }, 400);
    }

    // Validating password
    if (!validatePassword(password)) {
      return c.json({ error: 'Password must be at least 8 characters long', message: 'Password does not meet security requirements' }, 400);
    }

    // Checking for existing user
    const existingUserResult = await db.select().from(users).where(eq(users.email, email));
    const existingUser = existingUserResult[0];
    if (existingUser) {
      return c.json({ error: 'User already exists', message: 'A user with this email already exists' }, 409);
    }

    // Hashing password
    const hashedPassword = await hashPassword(password);

    // Inserting user into database
    const userData: InferInsertModel<typeof users> = {
      id: crypto.randomUUID(),
      email,
      passwordHash: hashedPassword,
      displayName: name || null,
      emailVerified: false,
    };
    const [user] = await db.insert(users).values(userData).returning();
    // User inserted successfully

    const sessionDuration = getSessionDuration(c.env);
    const token = await sign({ id: user.id, email: user.email, role: 'USER' }, jwtSecret);

    const sessionKey = `session:${user.id}`;
    await c.env.FINANCE_MANAGER_CACHE.put(sessionKey, JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.displayName,
      createdAt: new Date().toISOString(),
    }), { expirationTtl: 7 * 24 * 60 * 60 });

    return c.json({
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, name: user.displayName, emailVerified: user.emailVerified, createdAt: user.createdAt },
      token,
      expiresIn: sessionDuration,
    }, 201);
  } catch (error) {
    // Registration error occurred
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // Registration error occurred
    return c.json({ error: 'Registration failed', message: errorMessage }, 500);
  }
});

// Login endpoint
authRouter.post('/login', async (c) => {
  const db = createDatabase(c.env.FINANCE_MANAGER_DB);
  const jwtSecret = c.env.JWT_SECRET;

  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ error: 'Missing credentials', message: 'Email and password are required' }, 400);
    }

    const userResult = await db.select().from(users).where(eq(users.email, email));
    const user = userResult[0];
    if (!user) {
      return c.json({ error: 'Invalid credentials', message: 'Email or password is incorrect' }, 401);
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash as string);
    if (!isValidPassword) {
      return c.json({ error: 'Invalid credentials', message: 'Email or password is incorrect' }, 401);
    }

    const sessionDuration = getSessionDuration(c.env);
    const token = await sign({ id: user.id, email: user.email, role: 'USER' }, jwtSecret);

    const sessionKey = `session:${user.id}`;
    await c.env.FINANCE_MANAGER_CACHE.put(sessionKey, JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.displayName,
      createdAt: new Date().toISOString(),
    }), { expirationTtl: 7 * 24 * 60 * 60 });

    await db.update(users).set({ 
      lastLoginAt: new Date(),
      updatedAt: new Date()
    }).where(eq(users.id, user.id));

    return c.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.displayName, emailVerified: user.emailVerified, lastLoginAt: new Date() },
      token,
      expiresIn: sessionDuration,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // Login error occurred
    return c.json({ error: 'Login failed', message: errorMessage }, 500);
  }
});

// Logout endpoint
authRouter.post('/logout', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'User not authenticated' }, 401);
    }
    const sessionKey = `session:${user.id}`;
    await c.env.FINANCE_MANAGER_CACHE.delete(sessionKey);
    return c.json({ message: 'Logout successful' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    // Logout error occurred
    return c.json({ error: 'Logout failed', message: errorMessage }, 500);
  }
});

// Get current user profile
authRouter.get('/profile', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'User not authenticated' }, 401);
  }
  return c.json({ user });
});

// Update user profile
authRouter.put('/profile', authMiddleware, async (c) => {
  const db = createDatabase(c.env.FINANCE_MANAGER_DB);
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'User not authenticated' }, 401);
  }

  try {
    const { name } = await c.req.json();
    const [updatedUser] = await db.update(users).set({ displayName: name, updatedAt: new Date() }).where(eq(users.id, user.id)).returning();

    return c.json({
      message: 'Profile updated successfully',
      user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.displayName, emailVerified: updatedUser.emailVerified, updatedAt: updatedUser.updatedAt },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // Profile update error occurred
    return c.json({ error: 'Profile update failed', message: errorMessage }, 500);
  }
});

// Change password endpoint
authRouter.put('/password', authMiddleware, async (c) => {
  // Password change attempt started
  const db = createDatabase(c.env.FINANCE_MANAGER_DB);
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'User not authenticated' }, 401);
  }
  // User from middleware

  try {
    const { currentPassword, newPassword } = await c.req.json();
    // Password change data received

    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Missing required fields', message: 'Current password and new password are required' }, 400);
    }

    const dbUserResult = await db.select().from(users).where(eq(users.id, user.id));
    const dbUser = dbUserResult[0];
    // Database user lookup
    if (!dbUser) {
      return c.json({ error: 'User not found' }, 404); // Should not happen if authMiddleware works
    }

    // Verifying current password
    const isValidPassword = await verifyPassword(currentPassword, dbUser.passwordHash as string);
    // Password verification completed
    if (!isValidPassword) {
      return c.json({ error: 'Invalid current password', message: 'Current password is incorrect' }, 401);
    }

    // Hashing new password
    const hashedNewPassword = await hashPassword(newPassword);
    // Updating password in database
    await db.update(users).set({ passwordHash: hashedNewPassword, updatedAt: new Date() }).where(eq(users.id, user.id));

    // Password change successful
    return c.json({ message: 'Password updated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // Password change error occurred
    return c.json({ error: 'Password change failed', message: errorMessage }, 500);
  }
});

// Validate session endpoint
authRouter.get('/validate', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ error: 'Unauthorized', message: 'Invalid session' }, 401);
  }
  return c.json({ valid: true, user });
});

export default authRouter