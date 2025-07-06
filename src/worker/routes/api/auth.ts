import { Hono } from 'hono';
import { sign, verify } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { users, createDatabase } from '../../../db/index.js';
import type { InferInsertModel } from 'drizzle-orm';
import type { AppContext } from '../../types';
import { authMiddleware } from '../../middleware/auth';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { createEmailService } from '../../services';
import { hashPassword, verifyPassword } from '../../../lib/auth/password.js';

// Simple email validation function
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Enhanced password validation that returns detailed results
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
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
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

// Password utilities are imported from the shared auth library

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
    return c.json({ success: false, error: 'Server configuration error', message: 'Authentication not properly configured' }, 500);
  }

  try {
    // Registration attempt started
    const { email, password, name } = await c.req.json();
    // Request data parsed

    if (!email || !password) {
      return c.json({ success: false, error: 'Missing required fields', message: 'Email and password are required' }, 400);
    }

    // Validating email
    if (!validateEmail(email)) {
      return c.json({ success: false, error: 'Invalid email format', message: 'Please provide a valid email address' }, 400);
    }

    // Validating password
    const passwordValidation = validatePasswordDetailed(password);
    if (!passwordValidation.isValid) {
      return c.json({ success: false, error: 'Password requirements not met', message: passwordValidation.errors.join(', ') }, 400);
    }

    // Checking for existing user
    const existingUserResult = await db.select().from(users).where(eq(users.email, email));
    const existingUser = existingUserResult[0];
    if (existingUser) {
      return c.json({ success: false, error: 'User already exists', message: 'A user with this email already exists' }, 409);
    }

    // Hashing password
    const hashResult = await hashPassword(password);
    const hashedPassword = hashResult.combined;

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
      success: true,
      message: 'User registered successfully',
      user: { id: user.id, email: user.email, name: user.displayName, emailVerified: user.emailVerified, createdAt: user.createdAt },
      token,
      expiresIn: sessionDuration,
    }, 201);
  } catch (error) {
    // Registration error occurred
    console.error('Registration error:', error instanceof Error ? error.message : String(error));
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // Registration error occurred
    return c.json({ success: false, error: 'Registration failed', message: errorMessage }, 500);
  }
});

// Login endpoint
authRouter.post('/login', async (c) => {
  const db = createDatabase(c.env.FINANCE_MANAGER_DB);
  const jwtSecret = c.env.JWT_SECRET;

  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, error: 'Missing credentials', message: 'Email and password are required' }, 400);
    }

    const userResult = await db.select().from(users).where(eq(users.email, email));
    const user = userResult[0];
    if (!user) {
      return c.json({ success: false, error: 'Invalid credentials', message: 'Email or password is incorrect' }, 401);
    }

    const isValidPassword = await verifyPassword(password, user.passwordHash as string);
    if (!isValidPassword) {
      return c.json({ success: false, error: 'Invalid credentials', message: 'Email or password is incorrect' }, 401);
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
      success: true,
      message: 'Login successful',
      user: { id: user.id, email: user.email, name: user.displayName, emailVerified: user.emailVerified, lastLoginAt: new Date() },
      token,
      expiresIn: sessionDuration,
    });
  } catch (error) {
    console.error('Login error:', error instanceof Error ? error.message : String(error));
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // Login error occurred
    return c.json({ success: false, error: 'Login failed', message: errorMessage }, 500);
  }
});

// Logout endpoint
authRouter.post('/logout', authMiddleware, async (c) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ success: false, error: 'User not authenticated' }, 401);
    }
    const sessionKey = `session:${user.id}`;
    await c.env.FINANCE_MANAGER_CACHE.delete(sessionKey);
    return c.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    // Logout error occurred
    return c.json({ success: false, error: 'Logout failed', message: errorMessage }, 500);
  }
});

// Get current user profile
authRouter.get('/profile', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'User not authenticated' }, 401);
  }
  return c.json({ success: true, user });
});

// Get current user information (alias for /profile)
authRouter.get('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  return c.json({ success: true, user });
});

// Update user profile
authRouter.put('/profile', authMiddleware, async (c) => {
  const db = createDatabase(c.env.FINANCE_MANAGER_DB);
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'User not authenticated' }, 401);
  }

  try {
    const { name } = await c.req.json();
    const [updatedUser] = await db.update(users).set({ displayName: name, updatedAt: new Date() }).where(eq(users.id, user.id)).returning();

    return c.json({
      success: true,
      message: 'Profile updated successfully',
      user: { id: updatedUser.id, email: updatedUser.email, name: updatedUser.displayName, emailVerified: updatedUser.emailVerified, updatedAt: updatedUser.updatedAt },
    });
  } catch (error) {
    console.error('Profile update error:', error instanceof Error ? error.message : String(error));
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // Profile update error occurred
    return c.json({ success: false, error: 'Profile update failed', message: errorMessage }, 500);
  }
});

// Change password endpoint
authRouter.put('/password', authMiddleware, async (c) => {
  // Password change attempt started
  const db = createDatabase(c.env.FINANCE_MANAGER_DB);
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'User not authenticated' }, 401);
  }
  // User from middleware

  try {
    const { currentPassword, newPassword } = await c.req.json();
    // Password change data received

    if (!currentPassword || !newPassword) {
      return c.json({ success: false, error: 'Missing required fields', message: 'Current password and new password are required' }, 400);
    }

    const dbUserResult = await db.select().from(users).where(eq(users.id, user.id));
    const dbUser = dbUserResult[0];
    // Database user lookup
    if (!dbUser) {
      return c.json({ success: false, error: 'User not found' }, 404); // Should not happen if authMiddleware works
    }

    // Verifying current password
    const isValidPassword = await verifyPassword(currentPassword, dbUser.passwordHash as string);
    // Password verification completed
    if (!isValidPassword) {
      return c.json({ success: false, error: 'Invalid current password', message: 'Current password is incorrect' }, 401);
    }

    // Hashing new password
    const hashedNewPassword = await hashPassword(newPassword);
    // Updating password in database
    await db.update(users).set({ passwordHash: hashedNewPassword.combined, updatedAt: new Date() }).where(eq(users.id, user.id));

    // Password change successful
    return c.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error instanceof Error ? error.message : String(error));
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    // Password change error occurred
    return c.json({ success: false, error: 'Password change failed', message: errorMessage }, 500);
  }
});

// Refresh token endpoint
authRouter.post('/refresh', async (c) => {
  try {
    const { refreshToken } = await c.req.json();
    
    if (!refreshToken) {
      return c.json({ success: false, error: 'Refresh token required' }, 400);
    }

    const jwtSecret = c.env.JWT_SECRET;
    const db = createDatabase(c.env.FINANCE_MANAGER_DB);

    // Verify the refresh token
    const payload = await verify(refreshToken, jwtSecret);
    
    // Get user from database
    const userResult = await db.select().from(users).where(eq(users.id, payload.id as string));
    const user = userResult[0];
    
    if (!user) {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }

    // Generate new token
    const sessionDuration = getSessionDuration(c.env);
    const newToken = await sign({ id: user.id, email: user.email, role: 'USER' }, jwtSecret);

    // Update session in cache
    const sessionKey = `session:${user.id}`;
    await c.env.FINANCE_MANAGER_CACHE.put(sessionKey, JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.displayName,
      createdAt: new Date().toISOString(),
    }), { expirationTtl: 7 * 24 * 60 * 60 });

    return c.json({
      success: true,
      message: 'Token refreshed successfully',
      token: newToken,
      expiresIn: sessionDuration,
    });
  } catch (error) {
    console.error('Token refresh error:', error instanceof Error ? error.message : String(error));
    return c.json({ success: false, error: 'Invalid or expired refresh token' }, 401);
  }
});

// Validate session endpoint
authRouter.get('/validate', authMiddleware, async (c) => {
  const user = c.get('user');
  if (!user) {
    return c.json({ success: false, error: 'Unauthorized', message: 'Invalid session' }, 401);
  }
  return c.json({ success: true, valid: true, user });
});

// Magic Link Routes

// Send magic link for login
authRouter.post('/magic-link/send', zValidator('json', z.object({
  email: z.string().email(),
  purpose: z.enum(['LOGIN', 'REGISTER', 'VERIFY_EMAIL', 'RESET_PASSWORD', 'CHANGE_EMAIL']).default('LOGIN'),
  redirectUrl: z.string().url().optional()
})), async (c) => {
  try {
    const { email, purpose, redirectUrl } = c.req.valid('json');
    const db = createDatabase(c.env.FINANCE_MANAGER_DB);
    
    // Import magic link utilities
    const { createMagicLinkManager, createMagicLinkRateLimiter, MagicLinkEmailTemplate } = await import('../../../lib/auth/magicLink');
const { MagicLinkPurpose } = await import('../../../lib/auth/types');
    
    // Create magic link manager and rate limiter
    const magicLinkManager = createMagicLinkManager(c.env.FINANCE_MANAGER_CACHE, {
      defaultTTLMinutes: 15
    });
    
    const rateLimiter = createMagicLinkRateLimiter(c.env.FINANCE_MANAGER_CACHE, {
      windowMinutes: 15, // 15 minutes
      maxAttempts: 5
    });
    
    // Check rate limit
    const rateLimitResult = await rateLimiter.checkRateLimit(email);
    if (!rateLimitResult.allowed) {
      return c.json({ 
        error: 'Rate limit exceeded', 
        message: `Too many requests. Try again in ${Math.ceil((rateLimitResult.resetTime.getTime() - Date.now()) / 1000 / 60)} minutes.`,
        retryAfter: rateLimitResult.resetTime.getTime()
      }, 429);
    }
    
    // For registration, check if user doesn't exist
    if (purpose === 'REGISTER') {
      const existingUserResult = await db.select().from(users).where(eq(users.email, email));
      if (existingUserResult[0]) {
        return c.json({ error: 'User already exists', message: 'An account with this email already exists' }, 400);
      }
    }
    
    // For login and other purposes, check if user exists
    if (purpose !== 'REGISTER') {
      const existingUserResult = await db.select().from(users).where(eq(users.email, email));
      if (!existingUserResult[0]) {
        return c.json({ error: 'User not found', message: 'No account found with this email address' }, 404);
      }
    }
    
    // Generate magic link
    const { token } = await magicLinkManager.generateMagicLink(email, purpose as typeof MagicLinkPurpose[keyof typeof MagicLinkPurpose], {
      ttlMinutes: 15
    });
    
    // Generate magic link URL
    const baseUrl = new URL(c.req.url).origin;
    const magicLinkUrl = magicLinkManager.generateMagicLinkUrl(
      token,
      baseUrl,
      purpose as typeof MagicLinkPurpose[keyof typeof MagicLinkPurpose],
      redirectUrl
    );
    
    // Generate email content
    const emailTemplate = new MagicLinkEmailTemplate({
      fromName: 'Finance Manager',
      companyName: 'Finance Manager',
      baseUrl: baseUrl
    });
    const emailContent = emailTemplate.generateEmail(
      purpose as typeof MagicLinkPurpose[keyof typeof MagicLinkPurpose],
      magicLinkUrl,
      new Date(Date.now() + (15 * 60 * 1000)), // 15 minutes from now
      email.split('@')[0] // Use email prefix as name
    );
    
    // Send email
    const emailService = createEmailService(c.env);
    await emailService.sendEmail({
      to: [email],
      subject: emailContent.subject,
      htmlBody: emailContent.html,
      textBody: emailContent.text
    });
    
    return c.json({ 
      success: true, 
      message: 'Magic link sent successfully',
      expiresIn: 15 * 60 // 15 minutes in seconds
    });
    
  } catch (error) {
    console.error('Magic link send error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to send magic link' }, 500);
  }
});

// Verify magic link
authRouter.post('/magic-link/verify', zValidator('json', z.object({
  token: z.string(),
  purpose: z.enum(['LOGIN', 'REGISTER', 'VERIFY_EMAIL', 'RESET_PASSWORD', 'CHANGE_EMAIL']).optional()
})), async (c) => {
  try {
    const { token, purpose } = c.req.valid('json');
    const db = createDatabase(c.env.FINANCE_MANAGER_DB);
    
    // Import magic link utilities
    const { createMagicLinkManager } = await import('../../../lib/auth/magicLink');
    const { MagicLinkPurpose } = await import('../../../lib/auth/types');
    
    // Create magic link manager
    const magicLinkManager = createMagicLinkManager(c.env.FINANCE_MANAGER_CACHE, {
      defaultTTLMinutes: 15
    });
    
    // Verify magic link
    const verificationResult = await magicLinkManager.verifyMagicLink(
      token,
      purpose as any
    );
    
    if (!verificationResult.isValid || !verificationResult.data) {
      return c.json({ 
        error: 'Invalid or expired magic link', 
        message: 'The magic link is invalid or has expired. Please request a new one.' 
      }, 400);
    }
    
    const { email, purpose: linkPurpose } = verificationResult.data;
    
    // Handle different purposes
    switch (linkPurpose) {
      case MagicLinkPurpose.REGISTER: {
        // Check if user already exists
        const existingUserResult = await db.select().from(users).where(eq(users.email, email));
        if (existingUserResult[0]) {
          return c.json({ error: 'User already exists', message: 'An account with this email already exists' }, 400);
        }
        
        // Create new user
        const userData: InferInsertModel<typeof users> = {
          id: crypto.randomUUID(),
          email,
          displayName: email.split('@')[0],
          emailVerified: true // Email is verified through magic link
        };
        const [newUser] = await db.insert(users).values(userData).returning();
        
        // Generate JWT token
        const sessionId = crypto.randomUUID();
        const payload = {
          userId: newUser.id,
          sessionId,
          email: newUser.email,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
        };
        
        const token = await sign(payload, c.env.JWT_SECRET);
        
        // Store session
        await c.env.FINANCE_MANAGER_CACHE.put(
          `session:${sessionId}`,
          JSON.stringify({ userId: newUser.id, email: newUser.email }),
          { expirationTtl: 7 * 24 * 60 * 60 }
        );
        
        return c.json({ 
          success: true, 
          message: 'Account created and logged in successfully',
          token,
          user: {
            id: newUser.id,
            email: newUser.email,
            displayName: newUser.displayName,
            emailVerified: newUser.emailVerified
          }
        });
      }
      
      case MagicLinkPurpose.LOGIN: {
        // Get user
        const userResult = await db.select().from(users).where(eq(users.email, email));
        const user = userResult[0];
        if (!user) {
          return c.json({ error: 'User not found', message: 'No account found with this email address' }, 404);
        }
        
        // Generate JWT token
        const sessionId = crypto.randomUUID();
        const payload = {
          userId: user.id,
          sessionId,
          email: user.email,
          iat: Math.floor(Date.now() / 1000),
          exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60) // 7 days
        };
        
        const token = await sign(payload, c.env.JWT_SECRET);
        
        // Store session
        await c.env.FINANCE_MANAGER_CACHE.put(
          `session:${sessionId}`,
          JSON.stringify({ userId: user.id, email: user.email }),
          { expirationTtl: 7 * 24 * 60 * 60 }
        );
        
        return c.json({ 
          success: true, 
          message: 'Logged in successfully',
          token,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.displayName,
            emailVerified: user.emailVerified
          }
        });
      }
      
      case MagicLinkPurpose.VERIFY_EMAIL: {
        // Get user and update email verification status
        const userResult = await db.select().from(users).where(eq(users.email, email));
        const user = userResult[0];
        if (!user) {
          return c.json({ error: 'User not found', message: 'No account found with this email address' }, 404);
        }
        
        // Update email verification status
        await db.update(users).set({ emailVerified: true, updatedAt: new Date() }).where(eq(users.id, user.id));
        
        return c.json({ 
          success: true, 
          message: 'Email verified successfully'
        });
      }
      
      case MagicLinkPurpose.RESET_PASSWORD: {
        // Return token for password reset form
        return c.json({ 
          success: true, 
          message: 'Magic link verified. You can now reset your password.',
          resetToken: token, // Frontend can use this for password reset
          email
        });
      }
      
      default:
        return c.json({ error: 'Invalid purpose', message: 'Unknown magic link purpose' }, 400);
    }
    
  } catch (error) {
    console.error('Magic link verification error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to verify magic link' }, 500);
  }
});

// Reset password with magic link token
authRouter.post('/magic-link/reset-password', zValidator('json', z.object({
  token: z.string(),
  newPassword: z.string().min(8)
})), async (c) => {
  try {
    const { token, newPassword } = c.req.valid('json');
    const db = createDatabase(c.env.FINANCE_MANAGER_DB);
    
    // Import magic link utilities
    const { createMagicLinkManager } = await import('../../../lib/auth/magicLink');
    const { MagicLinkPurpose } = await import('../../../lib/auth/types');
    
    // Create magic link manager
    const magicLinkManager = createMagicLinkManager(c.env.FINANCE_MANAGER_CACHE, {
      defaultTTLMinutes: 15
    });
    
    // Verify magic link for password reset
    const verificationResult = await magicLinkManager.verifyMagicLink(token, MagicLinkPurpose.RESET_PASSWORD);
    
    if (!verificationResult.isValid || !verificationResult.data) {
      return c.json({ 
        error: 'Invalid or expired reset token', 
        message: 'The password reset link is invalid or has expired. Please request a new one.' 
      }, 400);
    }
    
    const { email } = verificationResult.data;
    
    // Get user
    const userResult = await db.select().from(users).where(eq(users.email, email));
    const user = userResult[0];
    if (!user) {
      return c.json({ error: 'User not found', message: 'No account found with this email address' }, 404);
    }
    
    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update user password
    await db.update(users).set({ 
      passwordHash: hashedPassword.combined,
      updatedAt: new Date()
    }).where(eq(users.id, user.id));
    
    return c.json({ 
      success: true, 
      message: 'Password reset successfully'
    });
    
  } catch (error) {
    console.error('Password reset error:', error);
    return c.json({ error: 'Internal server error', message: 'Failed to reset password' }, 500);
  }
});

export default authRouter