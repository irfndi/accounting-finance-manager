import { AppContext, AuthVariables } from '../types';
/**
 * Authentication middleware
 * Validates JWT token and adds user information to context
 */
export declare const authMiddleware: import("hono").MiddlewareHandler<AppContext, string, {}>;
/**
 * Optional authentication middleware
 * Adds user information to context if token is valid, but doesn't block if invalid
 */
export declare const optionalAuthMiddleware: import("hono").MiddlewareHandler<AppContext, string, {}>;
/**
 * Role-based authorization middleware
 * Requires authMiddleware to be used first
 */
export declare const requireRole: (allowedRoles: string[]) => import("hono").MiddlewareHandler<AppContext, string, {}>;
/**
 * Helper function to get current user from context
 */
export declare const getCurrentUser: (c: any) => AuthVariables["user"];
