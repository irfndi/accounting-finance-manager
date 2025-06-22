import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { AppContext, AuthVariables, JwtPayload } from '../types';

/**
 * Authentication middleware
 * Validates JWT token and adds user information to context
 */
export const authMiddleware = createMiddleware<AppContext>(async (c, next) => {
  const jwtSecret = c.env.JWT_SECRET;
  
  if (!jwtSecret) {
    const error = new Error('Authentication not configured');
    error.name = 'Unauthorized';
    throw error;
  }

  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Authorization header with Bearer token is required');
    error.name = 'Unauthorized';
    throw error;
  }

  const token = authHeader.substring(7);

  // Verify JWT token
  let payload: JwtPayload;
  try {
    payload = (await verify(token, c.env.JWT_SECRET)) as JwtPayload;
  } catch (jwtError) {
    console.error('JWT verification failed:', jwtError);
    const error = new Error('Invalid or expired token');
    error.name = 'Unauthorized';
    throw error;
  }

  // Check if session exists in KV
  const sessionKey = `session:${payload.id}`;
  const session = await c.env.FINANCE_MANAGER_CACHE.get(sessionKey, 'json');

  if (!session) {
    const error = new Error('Session not found or expired');
    error.name = 'Unauthorized';
    throw error;
  }

  // Use session data to get user info
  const sessionData = session as any;

  // Add user information to context
  c.set('user', {
    id: payload.id,
    email: payload.email,
    displayName: sessionData.name || null,
    firstName: null,
    lastName: null,
  });

  // Continue to next middleware/handler
  await next();
});

/**
 * Optional authentication middleware
 * Adds user information to context if token is valid, but doesn't block if invalid
 */
export const optionalAuthMiddleware = createMiddleware<AppContext>(async (c, next) => {
  try {
    const authHeader = c.req.header('Authorization');

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        if (!c.env.JWT_SECRET) {
          throw new Error('JWT_SECRET is not configured');
        }
        // Verify JWT token
        const payload = (await verify(token, c.env.JWT_SECRET)) as JwtPayload;

        // Check if session exists in KV
        const sessionKey = `session:${payload.id}`;
        const session = await c.env.FINANCE_MANAGER_CACHE.get(sessionKey);

        if (session) {
          // Parse session data to get user info
          const sessionData = JSON.parse(session);
          
          // Add user information to context
          c.set('user', {
            id: payload.id,
            email: payload.email,
            displayName: sessionData.name || null,
            firstName: null, // Or get from payload if available
            lastName: null, // Or get from payload if available
          });
        }
      } catch (error) {
        // Token is invalid, but we don't block the request
        // Optional auth failed, continuing without user context
      }
    }

    // Continue to next middleware/handler regardless of auth status
    await next();
  } catch (error) {
    // Optional auth middleware error occurred
    // Continue anyway since this is optional
    await next();
  }
});

/**
 * Role-based authorization middleware
 * Requires authMiddleware to be used first
 */
export const requireRole = (_allowedRoles: string[]) => {
  return createMiddleware<AppContext>(async (c, next) => {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized', message: 'Authentication required' }, 401);
    }

    // TODO: Implement role checking when user roles are added to the database
    // For now, all authenticated users have access
    // In the future, you could check user roles from database or JWT payload

    await next();
  });
};

/**
 * Helper function to get current user from context
 */
export const getCurrentUser = (
  c: any
): AuthVariables['user'] | null => {
  const user = c.get('user');
  if (!user) {
    // This should not happen if authMiddleware is used before this function is called.
    // Return null instead of throwing to avoid secondary errors
    return null;
  }
  return user;
};