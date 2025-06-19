/**
 * Authentication Types and Interfaces
 * Corporate Finance Manager - Type definitions for auth system
 */
/**
 * User authentication context
 */
export interface AuthUser {
    id: string;
    email: string;
    emailVerified: boolean;
    role: UserRole;
    entityId?: string;
    entityAccess?: string[];
    isActive: boolean;
    firstName?: string;
    lastName?: string;
    displayName?: string;
}
/**
 * JWT token payload
 */
export interface JWTPayload {
    /** JWT ID (unique token identifier) */
    jti: string;
    /** Subject (user ID) */
    sub: string;
    /** Issuer */
    iss: string;
    /** Audience */
    aud: string;
    /** Expiration time (Unix timestamp) */
    exp: number;
    /** Issued at (Unix timestamp) */
    iat: number;
    /** Not before (Unix timestamp) */
    nbf: number;
    /** User role */
    role: UserRole;
    /** Primary entity ID */
    entityId?: string;
    /** Session ID for tracking */
    sessionId: string;
    /** Token type */
    type: 'access' | 'refresh';
}
/**
 * Session data stored in KV
 */
export interface SessionData {
    userId: string;
    sessionId: string;
    deviceInfo?: string;
    ipAddress?: string;
    location?: string;
    issuedAt: number;
    expiresAt: number;
    lastActiveAt: number;
    isActive: boolean;
    userAgent?: string;
}
/**
 * Magic link data
 */
export interface MagicLinkData {
    token: string;
    email: string;
    purpose: MagicLinkPurpose;
    expiresAt: number;
    metadata?: Record<string, any>;
}
/**
 * Authentication request context
 */
export interface AuthContext {
    ipAddress?: string;
    userAgent?: string;
    location?: string;
    timestamp: number;
}
/**
 * Login request
 */
export interface LoginRequest {
    email: string;
    password?: string;
    magicLink?: boolean;
    context?: AuthContext;
}
/**
 * Registration request
 */
export interface RegistrationRequest {
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    context?: AuthContext;
}
/**
 * Magic link verification request
 */
export interface MagicLinkVerificationRequest {
    token: string;
    context?: AuthContext;
}
/**
 * Password reset request
 */
export interface PasswordResetRequest {
    email: string;
    context?: AuthContext;
}
/**
 * Password change request
 */
export interface PasswordChangeRequest {
    currentPassword?: string;
    newPassword: string;
    token?: string;
}
/**
 * Authentication response
 */
export interface AuthResponse {
    success: boolean;
    user?: AuthUser;
    accessToken?: string;
    refreshToken?: string;
    expiresIn?: number;
    message?: string;
    requiresVerification?: boolean;
}
/**
 * Session validation result
 */
export interface SessionValidation {
    isValid: boolean;
    user?: AuthUser;
    session?: SessionData;
    error?: string;
}
/**
 * User roles for role-based access control
 */
export declare enum UserRole {
    USER = "USER",
    ACCOUNTANT = "ACCOUNTANT",
    ADMIN = "ADMIN",
    VIEWER = "VIEWER",
    SUPER_ADMIN = "SUPER_ADMIN"
}
/**
 * Magic link purposes
 */
export declare enum MagicLinkPurpose {
    LOGIN = "LOGIN",
    REGISTER = "REGISTER",
    VERIFY_EMAIL = "VERIFY_EMAIL",
    RESET_PASSWORD = "RESET_PASSWORD",
    CHANGE_EMAIL = "CHANGE_EMAIL"
}
/**
 * Audit event types for security logging
 */
export declare enum AuditEventType {
    LOGIN_SUCCESS = "LOGIN_SUCCESS",
    LOGIN_FAILED = "LOGIN_FAILED",
    LOGOUT = "LOGOUT",
    REGISTER = "REGISTER",
    VERIFY_EMAIL = "VERIFY_EMAIL",
    PASSWORD_RESET = "PASSWORD_RESET",
    SESSION_CREATED = "SESSION_CREATED",
    SESSION_RENEWED = "SESSION_RENEWED",
    SESSION_EXPIRED = "SESSION_EXPIRED",
    SESSION_REVOKED = "SESSION_REVOKED",
    ACCOUNT_LOCKED = "ACCOUNT_LOCKED",
    ACCOUNT_UNLOCKED = "ACCOUNT_UNLOCKED",
    PROFILE_UPDATED = "PROFILE_UPDATED",
    ROLE_CHANGED = "ROLE_CHANGED",
    SUSPICIOUS_ACTIVITY = "SUSPICIOUS_ACTIVITY",
    TWO_FACTOR_ENABLED = "TWO_FACTOR_ENABLED",
    TWO_FACTOR_DISABLED = "TWO_FACTOR_DISABLED"
}
/**
 * Rate limiting configuration
 */
export interface RateLimitConfig {
    windowMs: number;
    maxAttempts: number;
    blockDurationMs: number;
}
/**
 * JWT configuration
 */
export interface JWTConfig {
    secret: string;
    issuer: string;
    audience: string;
    accessTokenExpiresIn: number;
    refreshTokenExpiresIn: number;
    algorithm: 'HS256';
}
/**
 * Email configuration for magic links
 */
export interface EmailConfig {
    from: string;
    fromName: string;
    replyTo?: string;
    baseUrl: string;
}
/**
 * Authentication configuration
 */
export interface AuthConfig {
    jwt: JWTConfig;
    email: EmailConfig;
    magicLink: {
        expiresInMinutes: number;
        maxClickCount: number;
    };
    session: {
        kvTtlSeconds: number;
        inactivityTimeoutMinutes: number;
    };
    rateLimit: {
        login: RateLimitConfig;
        registration: RateLimitConfig;
        magicLink: RateLimitConfig;
    };
    passwordPolicy: {
        minLength: number;
        requireUppercase: boolean;
        requireLowercase: boolean;
        requireNumbers: boolean;
        requireSpecialChars: boolean;
        maxAge?: number;
    };
}
/**
 * Error types for authentication
 */
export declare class AuthError extends Error {
    code: string;
    statusCode: number;
    constructor(message: string, code: string, statusCode?: number);
}
export declare class UnauthorizedError extends AuthError {
    constructor(message?: string);
}
export declare class ForbiddenError extends AuthError {
    constructor(message?: string);
}
export declare class NotFoundError extends AuthError {
    constructor(message?: string);
}
export declare class RateLimitError extends AuthError {
    constructor(message?: string);
}
export declare class ValidationError extends AuthError {
    field?: string | undefined;
    constructor(message: string, field?: string | undefined);
}
/**
 * Common authentication error codes
 */
export declare const AUTH_ERROR_CODES: {
    readonly INVALID_CREDENTIALS: "INVALID_CREDENTIALS";
    readonly ACCOUNT_LOCKED: "ACCOUNT_LOCKED";
    readonly ACCOUNT_NOT_VERIFIED: "ACCOUNT_NOT_VERIFIED";
    readonly INVALID_TOKEN: "INVALID_TOKEN";
    readonly TOKEN_EXPIRED: "TOKEN_EXPIRED";
    readonly SESSION_EXPIRED: "SESSION_EXPIRED";
    readonly RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED";
    readonly EMAIL_ALREADY_EXISTS: "EMAIL_ALREADY_EXISTS";
    readonly WEAK_PASSWORD: "WEAK_PASSWORD";
    readonly MAGIC_LINK_EXPIRED: "MAGIC_LINK_EXPIRED";
    readonly MAGIC_LINK_INVALID: "MAGIC_LINK_INVALID";
};
export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];
//# sourceMappingURL=types.d.ts.map