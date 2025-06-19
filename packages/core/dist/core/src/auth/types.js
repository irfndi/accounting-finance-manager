/**
 * Authentication Types and Interfaces
 * Corporate Finance Manager - Type definitions for auth system
 */
/**
 * User roles for role-based access control
 */
export var UserRole;
(function (UserRole) {
    UserRole["USER"] = "USER";
    UserRole["ACCOUNTANT"] = "ACCOUNTANT";
    UserRole["ADMIN"] = "ADMIN";
    UserRole["VIEWER"] = "VIEWER";
    UserRole["SUPER_ADMIN"] = "SUPER_ADMIN";
})(UserRole || (UserRole = {}));
/**
 * Magic link purposes
 */
export var MagicLinkPurpose;
(function (MagicLinkPurpose) {
    MagicLinkPurpose["LOGIN"] = "LOGIN";
    MagicLinkPurpose["REGISTER"] = "REGISTER";
    MagicLinkPurpose["VERIFY_EMAIL"] = "VERIFY_EMAIL";
    MagicLinkPurpose["RESET_PASSWORD"] = "RESET_PASSWORD";
    MagicLinkPurpose["CHANGE_EMAIL"] = "CHANGE_EMAIL";
})(MagicLinkPurpose || (MagicLinkPurpose = {}));
/**
 * Audit event types for security logging
 */
export var AuditEventType;
(function (AuditEventType) {
    // Authentication events
    AuditEventType["LOGIN_SUCCESS"] = "LOGIN_SUCCESS";
    AuditEventType["LOGIN_FAILED"] = "LOGIN_FAILED";
    AuditEventType["LOGOUT"] = "LOGOUT";
    AuditEventType["REGISTER"] = "REGISTER";
    AuditEventType["VERIFY_EMAIL"] = "VERIFY_EMAIL";
    AuditEventType["PASSWORD_RESET"] = "PASSWORD_RESET";
    // Session events
    AuditEventType["SESSION_CREATED"] = "SESSION_CREATED";
    AuditEventType["SESSION_RENEWED"] = "SESSION_RENEWED";
    AuditEventType["SESSION_EXPIRED"] = "SESSION_EXPIRED";
    AuditEventType["SESSION_REVOKED"] = "SESSION_REVOKED";
    // Account events
    AuditEventType["ACCOUNT_LOCKED"] = "ACCOUNT_LOCKED";
    AuditEventType["ACCOUNT_UNLOCKED"] = "ACCOUNT_UNLOCKED";
    AuditEventType["PROFILE_UPDATED"] = "PROFILE_UPDATED";
    AuditEventType["ROLE_CHANGED"] = "ROLE_CHANGED";
    // Security events
    AuditEventType["SUSPICIOUS_ACTIVITY"] = "SUSPICIOUS_ACTIVITY";
    AuditEventType["TWO_FACTOR_ENABLED"] = "TWO_FACTOR_ENABLED";
    AuditEventType["TWO_FACTOR_DISABLED"] = "TWO_FACTOR_DISABLED";
})(AuditEventType || (AuditEventType = {}));
/**
 * Error types for authentication
 */
export class AuthError extends Error {
    code;
    statusCode;
    constructor(message, code, statusCode = 400) {
        super(message);
        this.code = code;
        this.statusCode = statusCode;
        this.name = 'AuthError';
    }
}
export class UnauthorizedError extends AuthError {
    constructor(message = 'Unauthorized') {
        super(message, 'UNAUTHORIZED', 401);
    }
}
export class ForbiddenError extends AuthError {
    constructor(message = 'Forbidden') {
        super(message, 'FORBIDDEN', 403);
    }
}
export class NotFoundError extends AuthError {
    constructor(message = 'Not found') {
        super(message, 'NOT_FOUND', 404);
    }
}
export class RateLimitError extends AuthError {
    constructor(message = 'Too many requests') {
        super(message, 'RATE_LIMIT_EXCEEDED', 429);
    }
}
export class ValidationError extends AuthError {
    field;
    constructor(message, field) {
        super(message, 'VALIDATION_ERROR', 400);
        this.field = field;
    }
}
/**
 * Common authentication error codes
 */
export const AUTH_ERROR_CODES = {
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    ACCOUNT_NOT_VERIFIED: 'ACCOUNT_NOT_VERIFIED',
    INVALID_TOKEN: 'INVALID_TOKEN',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    SESSION_EXPIRED: 'SESSION_EXPIRED',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
    EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
    WEAK_PASSWORD: 'WEAK_PASSWORD',
    MAGIC_LINK_EXPIRED: 'MAGIC_LINK_EXPIRED',
    MAGIC_LINK_INVALID: 'MAGIC_LINK_INVALID',
};
