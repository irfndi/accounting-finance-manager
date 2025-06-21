/**
 * JWT Utilities
 * Corporate Finance Manager - JWT token management with HS256 signing
 */
import { JWTPayload, JWTConfig, AuthUser, UserRole } from './types';
/**
 * Default JWT configuration
 */
export declare const DEFAULT_JWT_CONFIG: JWTConfig;
/**
 * JWT utility class for token management
 */
export declare class JWTManager {
    private config;
    private encoder;
    constructor(config?: Partial<JWTConfig>);
    /**
     * Create an access token for a user
     */
    createAccessToken(user: Partial<AuthUser> & {
        id?: string;
        userId?: string;
        role: UserRole;
    }, sessionId: string): Promise<string>;
    /**
     * Create a refresh token for a user
     */
    createRefreshToken(user: AuthUser, sessionId: string): Promise<string>;
    /**
     * Verify and decode a JWT token
     */
    verifyToken(token: string): Promise<JWTPayload>;
    /**
     * Extract token from Authorization header
     */
    extractTokenFromHeader(authHeader: string | null): string | null;
    /**
     * Get token expiry date
     */
    getTokenExpiry(token: string): Date | null;
    /**
     * Check if token is expired
     */
    isTokenExpired(token: string): boolean;
    /**
     * Sign a JWT token
     */
    signToken(payload: JWTPayload): Promise<string>;
    /**
     * Create HMAC-SHA256 signature
     */
    private createSignature;
    /**
     * Validate JWT payload
     */
    private validatePayload;
    /**
     * Base64 URL encode
     */
    private base64UrlEncode;
    /**
     * Base64 URL decode to Uint8Array
     */
    private base64UrlDecode;
    /**
     * Base64 URL decode to string
     */
    private base64UrlDecodeToString;
    /**
     * Constant-time comparison to prevent timing attacks
     */
    private constantTimeEqual;
}
/**
 * Create a JWT manager instance
 */
export declare function createJWTManager(config: Partial<JWTConfig>): JWTManager;
/**
 * Extract user ID from token without verification (for logging/debugging)
 */
export declare function extractUserIdFromToken(token: string): string | null;
export declare const generateToken: (user: {
    id?: string;
    userId?: string;
    role: UserRole;
    entityId?: string;
    email?: string;
    emailVerified?: boolean;
    isActive?: boolean;
}, expiresIn?: string) => Promise<string>;
/**
 * Verify a JWT token and return the payload
 */
export declare function verifyToken(token: string): Promise<any>;
/**
 * Refresh a JWT token
 */
export declare function refreshToken(token: string): Promise<string>;
//# sourceMappingURL=jwt.d.ts.map