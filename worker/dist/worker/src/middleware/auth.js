import { Context, Next } from 'hono';
import { authService } from '@finance-manager/core';
// Helper to get JWT secret from environment
const getJWTSecret = (env) => {
    return env.JWT_SECRET || 'default-development-secret-please-change-in-production';
};
/**
 * Authentication middleware
 * Validates JWT token and adds user information to context
 */
export const authMiddleware = async (c, next) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return c.json({
                error: 'Unauthorized',
                message: 'Authorization header with Bearer token is required'
            }, 401);
        }
        const token = authHeader.substring(7);
        const jwtSecret = getJWTSecret(c.env);
        // Verify JWT token
        const payload = await authService.verifyJWT(token, jwtSecret);
        // Check if session exists in KV (optional additional security)
        const sessionKey = `session:${payload.userId}`;
        const session = await c.env.FINANCE_MANAGER_CACHE.get(sessionKey);
        if (!session) {
            return c.json({
                error: 'Unauthorized',
                message: 'Session not found or expired'
            }, 401);
        }
        // Add user information to context
        const authContext = c;
        authContext.user = {
            id: payload.userId,
            email: payload.email,
            name: payload.name
        };
        // Continue to next middleware/handler
        await next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        return c.json({
            error: 'Unauthorized',
            message: 'Invalid or expired token'
        }, 401);
    }
};
/**
 * Optional authentication middleware
 * Adds user information to context if token is valid, but doesn't block if invalid
 */
export const optionalAuthMiddleware = async (c, next) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const jwtSecret = getJWTSecret(c.env);
            try {
                // Verify JWT token
                const payload = await authService.verifyJWT(token, jwtSecret);
                // Check if session exists in KV
                const sessionKey = `session:${payload.userId}`;
                const session = await c.env.FINANCE_MANAGER_CACHE.get(sessionKey);
                if (session) {
                    // Add user information to context
                    const authContext = c;
                    authContext.user = {
                        id: payload.userId,
                        email: payload.email,
                        name: payload.name
                    };
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
};
/**
 * Role-based authorization middleware
 * Requires authMiddleware to be used first
 */
export const requireRole = (allowedRoles) => {
    return async (c, next) => {
        const authContext = c;
        if (!authContext.user) {
            return c.json({
                error: 'Unauthorized',
                message: 'Authentication required'
            }, 401);
        }
        // TODO: Implement role checking when user roles are added to the database
        // For now, all authenticated users have access
        // In the future, you could check user roles from database or JWT payload
        await next();
    };
};
/**
 * Helper function to get current user from context
 */
export const getCurrentUser = (c) => {
    const authContext = c;
    return authContext.user || null;
};
