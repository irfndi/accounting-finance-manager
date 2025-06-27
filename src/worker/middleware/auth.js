import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import { createDatabase, createDatabaseService } from '../../db/index.js';
/**
 * Authentication middleware
 * Validates JWT token and adds user information to context
 */
export const authMiddleware = createMiddleware(async (c, next) => {
    try {
        const authHeader = c.req.header('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const decodedPayload = (await verify(token, c.env.JWT_SECRET));
        if (!decodedPayload) {
            return c.json({ error: 'Unauthorized' }, 401);
        }
        const session = {
            userId: decodedPayload.sub, // Use 'sub' for user ID
            sessionId: decodedPayload.jti,
        };
        const db = createDatabase(c.env.FINANCE_MANAGER_DB);
        const dbService = createDatabaseService(db);
        const user = await dbService.getCurrentUser(session);
        if (!user) {
            return c.json({ error: 'User not found' }, 401);
        }
        c.set('user', user);
        c.set('jwtPayload', decodedPayload);
        await next();
    }
    catch (_e) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
});
/**
 * Optional authentication middleware
 * Adds user information to context if token is valid, but doesn't block if invalid
 */
export const optionalAuthMiddleware = createMiddleware(async (c, next) => {
    const authHeader = c.req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        if (token) {
            try {
                const decodedPayload = (await verify(token, c.env.JWT_SECRET));
                if (decodedPayload) {
                    const session = {
                        userId: decodedPayload.sub,
                        sessionId: decodedPayload.jti,
                    };
                    const db = createDatabase(c.env.FINANCE_MANAGER_DB);
                    const dbService = createDatabaseService(db);
                    const user = await dbService.getCurrentUser(session);
                    if (user) {
                        c.set('user', user);
                        c.set('jwtPayload', decodedPayload);
                    }
                }
            }
            catch (_e) {
                // Invalid token, but we continue without setting the user
            }
        }
    }
    await next();
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
        // Check if user's role is in the allowed roles
        if (!allowedRoles.includes(user.role)) {
            return c.json({
                error: 'Forbidden',
                message: `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${user.role}`
            }, 403);
        }
        await next();
    });
};
