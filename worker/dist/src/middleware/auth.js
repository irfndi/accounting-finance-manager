import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
/**
 * Authentication middleware
 * Validates JWT token and adds user information to context
 */
export const authMiddleware = createMiddleware(async (c, next) => {
    if (!c.env.JWT_SECRET) {
        console.error('JWT_SECRET is not configured');
        return c.json({ error: 'Internal Server Error', message: 'JWT secret is not configured.' }, 500);
    }
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return c.json({
                error: 'Unauthorized',
                message: 'Authorization header with Bearer token is required',
            }, 401);
        }
        const token = authHeader.substring(7);
        // Verify JWT token
        const payload = (await verify(token, c.env.JWT_SECRET));
        // Check if session exists in KV (optional additional security)
        const sessionKey = `session:${payload.userId}`;
        const session = await c.env.FINANCE_MANAGER_CACHE.get(sessionKey);
        if (!session) {
            return c.json({ error: 'Unauthorized', message: 'Session not found or expired' }, 401);
        }
        // Add user information to context
        c.set('user', {
            id: payload.userId,
            email: payload.email,
            displayName: payload.name || null,
            firstName: null, // Or get from payload if available
            lastName: null, // Or get from payload if available
        });
        // Continue to next middleware/handler
        await next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return c.json({ error: 'Unauthorized', message: 'Invalid or expired token' }, 401);
    }
});
/**
 * Optional authentication middleware
 * Adds user information to context if token is valid, but doesn't block if invalid
 */
export const optionalAuthMiddleware = createMiddleware(async (c, next) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                if (!c.env.JWT_SECRET) {
                    throw new Error('JWT_SECRET is not configured');
                }
                // Verify JWT token
                const payload = (await verify(token, c.env.JWT_SECRET));
                // Check if session exists in KV
                const sessionKey = `session:${payload.userId}`;
                const session = await c.env.FINANCE_MANAGER_CACHE.get(sessionKey);
                if (session) {
                    // Add user information to context
                    c.set('user', {
                        id: payload.userId,
                        email: payload.email,
                        displayName: payload.name || null,
                        firstName: null, // Or get from payload if available
                        lastName: null, // Or get from payload if available
                    });
                }
            }
            catch (error) {
                // Token is invalid, but we don't block the request
                console.log('Optional auth failed, continuing without user context:', error);
            }
        }
        // Continue to next middleware/handler regardless of auth status
        await next();
    }
    catch (error) {
        console.error('Optional auth middleware error:', error);
        // Continue anyway since this is optional
        await next();
    }
});
/**
 * Role-based authorization middleware
 * Requires authMiddleware to be used first
 */
export const requireRole = (allowedRoles) => {
    return createMiddleware(async (c, next) => {
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
export const getCurrentUser = (c) => {
    const user = c.get('user');
    if (!user) {
        // This should not happen if authMiddleware is used before this function is called.
        // Throw an error or handle it as per your application's needs.
        throw new Error('User not found in context. Ensure authMiddleware is used.');
    }
    return user;
};
