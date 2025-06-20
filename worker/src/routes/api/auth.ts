import { Hono } from 'hono'
import { authService } from '@finance-manager/core'
import { createEnhancedDatabase } from '@finance-manager/db'


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

// Helper to get JWT secret from environment
const getJWTSecret = (env: Env): string => {
  return env.JWT_SECRET || 'default-development-secret-please-change-in-production'
}

// Helper to get session duration from environment (default 7 days)
const getSessionDuration = (env: Env): string => {
  return env.AUTH_SESSION_DURATION || '7d'
}

// Register endpoint
authRouter.post('/register', async (c) => {
  try {
    const { email, password, name } = await c.req.json()

    if (!email || !password) {
      return c.json({
        error: 'Missing required fields',
        message: 'Email and password are required'
      }, 400)
    }

    // Initialize database connection
    const database = createEnhancedDatabase(c.env.FINANCE_MANAGER_DB)
    
    // Check if user already exists
    const existingUser = await database.getUserByEmail(email)
    if (existingUser) {
      return c.json({
        error: 'User already exists',
        message: 'A user with this email already exists'
      }, 409)
    }

    // Hash password
    const hashedPassword = await authService.password.hashPassword(password)

    // Create user
    const user = await database.createUser({
      email,
      password: hashedPassword,
      name: name || null,
      emailVerified: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    // Generate JWT token
    const jwtSecret = getJWTSecret(c.env)
    const sessionDuration = getSessionDuration(c.env)
    
    const token = await authService.jwt.generateToken({
      id: user.id,
      email: user.email,
      role: 'USER' // Default role, should be from user data
    })

    // Store session in KV
    const sessionKey = `session:${user.id}`
    await c.env.FINANCE_MANAGER_CACHE.put(sessionKey, JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.name,
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
        name: user.name,
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
  try {
    const { email, password } = await c.req.json()

    if (!email || !password) {
      return c.json({
        error: 'Missing credentials',
        message: 'Email and password are required'
      }, 400)
    }

    // Initialize database connection
    const database = createEnhancedDatabase(c.env.FINANCE_MANAGER_DB)
    
    // Get user by email
    const user = await database.getUserByEmail(email)
    if (!user) {
      return c.json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      }, 401)
    }

    // Verify password
    const isValidPassword = await authService.verifyPassword(password, user.password)
    if (!isValidPassword) {
      return c.json({
        error: 'Invalid credentials',
        message: 'Email or password is incorrect'
      }, 401)
    }

    // Generate JWT token
    const jwtSecret = getJWTSecret(c.env)
    const sessionDuration = getSessionDuration(c.env)
    
    const token = await authService.jwt.generateToken({
      id: user.id,
      email: user.email,
      role: 'USER' // Default role, should be from user data
    })

    // Store session in KV
    const sessionKey = `session:${user.id}`
    await c.env.FINANCE_MANAGER_CACHE.put(sessionKey, JSON.stringify({
      userId: user.id,
      email: user.email,
      name: user.name,
      createdAt: new Date().toISOString()
    }), {
      expirationTtl: 7 * 24 * 60 * 60 // 7 days in seconds
    })

    // Update last login timestamp
    await database.updateUser(user.id, {
      lastLoginAt: new Date(),
      updatedAt: new Date()
    })

    return c.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
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
    const jwtSecret = getJWTSecret(c.env)

    // Verify and decode token
    const payload = await authService.verifyJWT(token, jwtSecret)
    
    // Remove session from KV
    const sessionKey = `session:${payload.userId}`
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
    const jwtSecret = getJWTSecret(c.env)

    // Verify and decode token
    const payload = await authService.verifyJWT(token, jwtSecret)
    
    // Get user from database
    const database = createEnhancedDatabase(c.env.FINANCE_MANAGER_DB)
    const user = await database.getUserById(payload.userId)
    
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
        name: user.name,
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
    const jwtSecret = getJWTSecret(c.env)

    // Verify and decode token
    const payload = await authService.verifyJWT(token, jwtSecret)
    
    const { name } = await c.req.json()

    // Update user in database
    const database = createEnhancedDatabase(c.env.FINANCE_MANAGER_DB)
    const updatedUser = await database.updateUser(payload.userId, {
      name,
      updatedAt: new Date()
    })

    return c.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
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
    const jwtSecret = getJWTSecret(c.env)

    // Verify and decode token
    const payload = await authService.verifyJWT(token, jwtSecret)
    
    const { currentPassword, newPassword } = await c.req.json()

    if (!currentPassword || !newPassword) {
      return c.json({
        error: 'Missing required fields',
        message: 'Current password and new password are required'
      }, 400)
    }

    // Get user from database
    const database = createEnhancedDatabase(c.env.FINANCE_MANAGER_DB)
    const user = await database.getUserById(payload.userId)
    
    if (!user) {
      return c.json({
        error: 'User not found',
        message: 'User associated with this token no longer exists'
      }, 404)
    }

    // Verify current password
    const isValidPassword = await authService.verifyPassword(currentPassword, user.password)
    if (!isValidPassword) {
      return c.json({
        error: 'Invalid current password',
        message: 'Current password is incorrect'
      }, 401)
    }

    // Hash new password
    const hashedNewPassword = await authService.hashPassword(newPassword)

    // Update password in database
    await database.updateUser(user.id, {
      password: hashedNewPassword,
      updatedAt: new Date()
    })

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
    const jwtSecret = getJWTSecret(c.env)

    // Verify token
    const payload = await authService.verifyJWT(token, jwtSecret)
    
    // Check if session exists in KV
    const sessionKey = `session:${payload.userId}`
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
        id: payload.userId,
        email: payload.email,
        name: payload.name
      }
    })

  } catch {
    return c.json({
      valid: false,
      message: 'Invalid or expired token'
    }, 401)
  }
})

export default authRouter