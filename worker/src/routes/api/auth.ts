import { Hono } from 'hono'
import { sign, verify } from 'hono/jwt'
import * as bcrypt from 'bcryptjs'

import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types'
import { createEnhancedDatabase, users } from '@finance-manager/db';
import { eq } from 'drizzle-orm';


// Environment bindings interface
type Env = {
  FINANCE_MANAGER_DB: D1Database
  FINANCE_MANAGER_CACHE: KVNamespace
  FINANCE_MANAGER_DOCUMENTS: R2Bucket
  ENVIRONMENT?: string
  JWT_SECRET?: string
  AUTH_SESSION_DURATION?: string
}

// Create auth router
const authRouter = new Hono<{ Bindings: Env }>()






import { createDatabaseService } from '@finance-manager/db/services';

// Middleware to initialize services
authRouter.use('*', async (c, next) => {
  const db = createEnhancedDatabase(c.env.FINANCE_MANAGER_DB);

  if (c.env.ENVIRONMENT === 'production' && !c.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set in production');
  }

  c.set('db', db);
  c.set('jwtSecret', c.env.JWT_SECRET || 'default-development-secret-please-change-in-production');
  await next();
});



// Helper to get session duration from environment (default 7 days)
const getSessionDuration = (env: Env): string => {
  return env.AUTH_SESSION_DURATION || '7d'
}

// Register endpoint
authRouter.post('/register', async (c) => {
  
  const db = c.get('db');
  try {
    const { email, password, name } = await c.req.json()

    if (!email || !password) {
      return c.json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      }, 400)
    }
    
    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).get();
    if (existingUser) {
      return c.json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      }, 409)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user
    const [user] = await db.insert(users).values({
      email,
      password: hashedPassword,
      displayName: name || null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();

    // Generate JWT token
    const sessionDuration = getSessionDuration(c.env);
    const token = await sign({ id: user.id, email: user.email, role: 'USER' }, c.get('jwtSecret'));

    // Store session in KV
    const sessionKey = `session:${user.id}`
    await c.env.FINANCE_MANAGER_CACHE.put(sessionKey, JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      createdAt: new Date().toISOString()
    }), {
      expirationTtl: 7 * 24 * 60 * 60 // 7 days in seconds
    })

    // Return success response (don't include password hash)
    return c.json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        emailVerified: user.emailVerified,
        createdAt: user.createdAt
      },
      token,
      expiresIn: sessionDuration
    }, 201)

  } catch (error) {
    console.error('Registration error:', error)
    return c.json({
      error: 'Registration failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500)
  }
})

// Login endpoint
authRouter.post('/login', async (c) => {
  
  const db = c.get('db');
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      }, 400)
    }
    
    // Get user by email
    const user = await db.select().from(users).where(eq(users.email, email)).get();
    if (!user) {
      return c.json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      }, 401)
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password as string)
    if (!isValidPassword) {
      return c.json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      }, 401)
    }

    // Generate JWT token
    const sessionDuration = getSessionDuration(c.env);
    const token = await sign({ id: user.id, email: user.email, role: 'USER' }, c.get('jwtSecret'));

    // Store session in KV
    const sessionKey = `session:${user.id}`
    await c.env.FINANCE_MANAGER_CACHE.put(sessionKey, JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      createdAt: new Date().toISOString()
    }), {
      expirationTtl: 7 * 24 * 60 * 60 // 7 days in seconds
    })

    // Update last login timestamp
    await db.update(users).set({
      lastLoginAt: new Date(),
      updatedAt: new Date()
    }).where(eq(users.id, user.id));

    return c.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        emailVerified: user.emailVerified,
        lastLoginAt: new Date()
      },
      token,
      expiresIn: sessionDuration
    })

  } catch (error) {
    console.error('Login error:', error)
    return c.json({
      error: 'Login failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500)
  }
})

// Logout endpoint
authRouter.post('/logout', async (c) => {
  
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({
        error: 'No token provided',
        message: 'Authorization header with Bearer token is required'
      }, 401)
    }

    const token = authHeader.substring(7)
    // Verify and decode token
    const payload = await verify(token, c.get('jwtSecret'));;;
    
    // Remove session from KV
    const sessionKey = `session:${payload.id}`
    await c.env.FINANCE_MANAGER_CACHE.delete(sessionKey)

    return c.json({
      message: 'Logout successful'
    })

  } catch (error) {
    console.error('Logout error:', error)
    return c.json({
      error: 'Logout failed',
      message: 'Invalid or expired token'
    }, 401)
  }
})

// Get current user profile
authRouter.get('/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({
        error: 'No token provided',
        message: 'Authorization header with Bearer token is required'
      }, 401)
    }

    const token = authHeader.substring(7)
    

    // Verify and decode token
    const payload = await verify(token, c.get('jwtSecret'))
    
    // Get user from database
    const db = c.get('db');
    const user = await db.select().from(users).where(eq(users.id, payload.id)).get();
    
    if (!user) {
      return c.json({
        error: 'User not found',
        message: 'User associated with this token no longer exists'
      }, 404)
    }

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.displayName || `${user.firstName || ''} ${user.lastName || ''}`.trim(),
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    })

  } catch (error) {
    console.error('Profile fetch error:', error)
    return c.json({
      error: 'Unauthorized',
      message: 'Invalid or expired token'
    }, 401)
  }
})

// Update user profile
authRouter.put('/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({
        error: 'No token provided',
        message: 'Authorization header with Bearer token is required'
      }, 401)
    }

    const token = authHeader.substring(7)
    

    // Verify and decode token
    const payload = await verify(token, c.get('jwtSecret'))
    
    const { name } = await c.req.json()

    // Update user in database
    const db = c.get('db');
    const [updatedUser] = await db.update(users).set({
      displayName: name,
      updatedAt: new Date()
    }).where(eq(users.id, payload.id)).returning();

    return c.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.displayName || `${updatedUser.firstName || ''} ${updatedUser.lastName || ''}`.trim(),
        emailVerified: updatedUser.emailVerified,
        updatedAt: updatedUser.updatedAt
      }
    })

  } catch (error) {
    console.error('Profile update error:', error)
    return c.json({
      error: 'Profile update failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500)
  }
})

// Change password endpoint
authRouter.put('/password', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({
        error: 'No token provided',
        message: 'Authorization header with Bearer token is required'
      }, 401)
    }

    const token = authHeader.substring(7)
    

    // Verify and decode token
    const payload = await verify(token, c.get('jwtSecret'))
    
    const { currentPassword, newPassword } = await c.req.json()

    if (!currentPassword || !newPassword) {
      return c.json({
        error: 'Missing required fields',
        message: 'Current password and new password are required'
      }, 400)
    }

    // Get user from database
    const db = c.get('db');
    const user = await db.select().from(users).where(eq(users.id, payload.id)).get();
    
    if (!user) {
      return c.json({
        error: 'User not found',
        message: 'User associated with this token no longer exists'
      }, 404)
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password as string)
    if (!isValidPassword) {
      return c.json({
        error: 'Invalid current password',
        message: 'Current password is incorrect'
      }, 401)
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10)

    // Update password in database
    await db.update(users).set({
      password: hashedNewPassword,
      updatedAt: new Date()
    }).where(eq(users.id, user.id));

    return c.json({
      message: 'Password updated successfully'
    })

  } catch (error) {
    console.error('Password change error:', error)
    return c.json({
      error: 'Password change failed',
      message: error instanceof Error ? error.message : 'Unknown error occurred'
    }, 500)
  }
})

// Validate session endpoint (useful for frontend auth checks)
authRouter.get('/validate', async (c) => {
  try {
    const authHeader = c.req.header('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return c.json({
        valid: false,
        message: 'No token provided'
      }, 401)
    }

    const token = authHeader.substring(7)
    

    // Verify token
    const payload = await verify(token, c.get('jwtSecret'));
    
    // Check if session exists in KV
    const sessionKey = `session:${payload.id}`
    const session = await c.env.FINANCE_MANAGER_CACHE.get(sessionKey)
    
    if (!session) {
      return c.json({
        valid: false,
        message: 'Session not found'
      }, 401)
    }

    return c.json({
      valid: true,
      user: {
        id: payload.id,
        email: payload.email,
        name: payload.name
      }
    })

  } catch (error) {
    console.error('Validation error:', error);
    return c.json({
      valid: false,
      message: 'Invalid or expired token'
    }, 401)
  }
})

export default authRouter