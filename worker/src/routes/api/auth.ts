import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { users, createDatabase } from '@finance-manager/db';
import { AppContext, Env, AuthVariables } from '../../types';
import { authMiddleware, getCurrentUser } from '../../middleware/auth';

// Simple email validation function
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Simple password validation function
function validatePassword(password: string): boolean {
  return password && password.length >= 8;
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
const getSessionDuration = (env: Env): string => {
  return env.AUTH_SESSION_DURATION || '7d';
};

// Registration endpoint
authRouter.post('/register', async (c) => {
  const db = createDatabase(c.env.FINANCE_MANAGER_DB);
  const jwtSecret = c.env.JWT_SECRET;

  try {
    console.log('Registration attempt started');
    const { email, password, name } = await c.req.json();
    console.log('Request data parsed:', { email, hasPassword: !!password, name });

    if (!email || !password) {
      return c.json({ error: 'Missing required fields', message: 'Email and password are required' }, 400);
    }

    console.log('Validating email...');
    if (!validateEmail(email)) {
      return c.json({ error: 'Invalid email format', message: 'Please provide a valid email address' }, 400);
    }

    console.log('Validating password...');
    if (!validatePassword(password)) {
      return c.json({ error: 'Password must be at least 8 characters long', message: 'Password does not meet security requirements' }, 400);
    }

    console.log('Checking for existing user...');
    const existingUserResult = await db.select().from(users).where(eq(users.email, email));
    const existingUser = existingUserResult[0];
    if (existingUser) {
      return c.json({ error: 'User already exists', message: 'A user with this email already exists' }, 409);
    }

    console.log('Hashing password...');
    const hashedPassword = await hashPassword(password);

    console.log('Inserting user into database...');
    const [user] = await db.insert(users).values({
      id: crypto.randomUUID(),
      email,
      passwordHash: hashedPassword,
      displayName: name || null,
      emailVerified: false,
    }).returning();
    console.log('User inserted successfully:', user.id);

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
    console.error('Registration error:', error);
    console.error('Error stack:', error.stack);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Registration error:', errorMessage);
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
      lastLoginAt: Math.floor(Date.now() / 1000),
      updatedAt: Math.floor(Date.now() / 1000)
    }).where(eq(users.id, user.id));

    return c.json({
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.displayName, emailVerified: user.emailVerified, lastLoginAt: new Date() },
      token,
      expiresIn: sessionDuration,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Login error:', errorMessage);
    return c.json({ error: 'Login failed', message: errorMessage }, 500);
  }
});

// Logout endpoint
authRouter.post('/logout', async (c) => {
  console.log('Logout endpoint hit');
  console.log('JWT_SECRET:', c.env.JWT_SECRET ? 'loaded' : 'missing');
  try {
    const authHeader = c.req.header('Authorization');
    if (authHeader) {
      const token = authHeader.startsWith('Bearer ') ? authHeader.substring(7) : authHeader;
      if (token) {
        try {
          const jwtSecret = c.env.JWT_SECRET;
          const payload = await verify(token, jwtSecret);
          if (payload && payload.id) {
            const sessionKey = `session:${payload.id}`;
            await c.env.FINANCE_MANAGER_CACHE.delete(sessionKey);
            return c.json({ message: 'Logged out successfully' });
          }
        } catch (jwtError) {
          // Ignore JWT errors (e.g., expired token), as the user is effectively logged out.
        }
      }
    }
    return c.json({ message: 'Logged out' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    console.error('Logout error:', errorMessage);
    return c.json({ error: 'Logout failed', message: 'An unexpected error occurred' }, 500);
  }
});

// Get current user profile
authRouter.get('/profile', authMiddleware, async (c) => {
  const user = getCurrentUser(c);
  return c.json({ user });
});

// Update user profile
authRouter.put('/profile', authMiddleware, async (c) => {
  const db = createDatabase(c.env.FINANCE_MANAGER_DB);
  const user = getCurrentUser(c);

  try {
    const { name } = await c.req.json();
    const [updatedUser] = await db.update(users).set({ displayName: name, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(users.id, user.id)).returning();

    return c.json({
      message: 'Profile updated successfully',
      user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.displayName, emailVerified: updatedUser.emailVerified, updatedAt: updatedUser.updatedAt },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Profile update error:', errorMessage);
    return c.json({ error: 'Profile update failed', message: errorMessage }, 500);
  }
});

// Change password endpoint
authRouter.put('/password', authMiddleware, async (c) => {
  console.log('Password change attempt started');
  const db = createDatabase(c.env.FINANCE_MANAGER_DB);
  const user = getCurrentUser(c);
  console.log('User from middleware:', user ? 'found' : 'not found');

  try {
    const { currentPassword, newPassword } = await c.req.json();
    console.log('Password change data:', { hasCurrentPassword: !!currentPassword, hasNewPassword: !!newPassword });

    if (!currentPassword || !newPassword) {
      return c.json({ error: 'Missing required fields', message: 'Current password and new password are required' }, 400);
    }

    const dbUserResult = await db.select().from(users).where(eq(users.id, user.id));
    const dbUser = dbUserResult[0];
    console.log('Database user lookup:', dbUser ? 'found' : 'not found');
    if (!dbUser) {
      return c.json({ error: 'User not found' }, 404); // Should not happen if authMiddleware works
    }

    console.log('Verifying current password...');
    const isValidPassword = await verifyPassword(currentPassword, dbUser.passwordHash as string);
    console.log('Password verification result:', isValidPassword);
    if (!isValidPassword) {
      return c.json({ error: 'Invalid current password', message: 'Current password is incorrect' }, 401);
    }

    console.log('Hashing new password...');
    const hashedNewPassword = await hashPassword(newPassword);
    console.log('Updating password in database...');
    await db.update(users).set({ passwordHash: hashedNewPassword, updatedAt: Math.floor(Date.now() / 1000) }).where(eq(users.id, user.id));

    console.log('Password change successful');
    return c.json({ message: 'Password updated successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Password change error:', errorMessage);
    console.error('Password change error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return c.json({ error: 'Password change failed', message: errorMessage }, 500);
  }
});

// Validate session endpoint
authRouter.get('/validate', authMiddleware, async (c) => {
  const user = getCurrentUser(c);
  return c.json({ valid: true, user });
});

export default authRouter