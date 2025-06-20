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
  /** User email */
  email?: string;
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
  token?: string; // For magic-link based password reset
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
export enum UserRole {
  USER = 'USER',
  ACCOUNTANT = 'ACCOUNTANT',
  ADMIN = 'ADMIN',
  VIEWER = 'VIEWER',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

/**
 * Magic link purposes
 */
export enum MagicLinkPurpose {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  RESET_PASSWORD = 'RESET_PASSWORD',
  CHANGE_EMAIL = 'CHANGE_EMAIL',
}

/**
 * Audit event types for security logging
 */
export enum AuditEventType {
  // Authentication events
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  REGISTER = 'REGISTER',
  VERIFY_EMAIL = 'VERIFY_EMAIL',
  PASSWORD_RESET = 'PASSWORD_RESET',
  
  // Session events
  SESSION_CREATED = 'SESSION_CREATED',
  SESSION_RENEWED = 'SESSION_RENEWED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  SESSION_REVOKED = 'SESSION_REVOKED',
  
  // Account events
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED = 'ACCOUNT_UNLOCKED',
  PROFILE_UPDATED = 'PROFILE_UPDATED',
  ROLE_CHANGED = 'ROLE_CHANGED',
  
  // Security events
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  TWO_FACTOR_ENABLED = 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED = 'TWO_FACTOR_DISABLED',
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
  accessTokenExpiresIn: number; // seconds
  refreshTokenExpiresIn: number; // seconds
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
    maxAge?: number; // days
  };
}

/**
 * Error types for authentication
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export class UnauthorizedError extends AuthError {
  constructor(message: string = 'Unauthorized') {
    super(message, 'UNAUTHORIZED', 401);
  }
}

export class ForbiddenError extends AuthError {
  constructor(message: string = 'Forbidden') {
    super(message, 'FORBIDDEN', 403);
  }
}

export class NotFoundError extends AuthError {
  constructor(message: string = 'Not found') {
    super(message, 'NOT_FOUND', 404);
  }
}

export class RateLimitError extends AuthError {
  constructor(message: string = 'Too many requests') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
  }
}

export class ValidationError extends AuthError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR', 400);
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
} as const;

export type AuthErrorCode = typeof AUTH_ERROR_CODES[keyof typeof AUTH_ERROR_CODES];