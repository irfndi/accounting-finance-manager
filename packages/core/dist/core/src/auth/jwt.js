/**
 * JWT Utilities
 * Corporate Finance Manager - JWT token management with HS256 signing
 */
import { UnauthorizedError } from './types';
/**
 * Default JWT configuration
 */
export const DEFAULT_JWT_CONFIG = {
    secret: '', // Must be set from environment
    issuer: 'finance-manager',
    audience: 'finance-manager-users',
    accessTokenExpiresIn: 3600, // 1 hour
    refreshTokenExpiresIn: 604800, // 7 days
    algorithm: 'HS256',
};
/**
 * JWT utility class for token management
 */
export class JWTManager {
    config;
    encoder = new TextEncoder();
    constructor(config = {}) {
        this.config = { ...DEFAULT_JWT_CONFIG, ...config };
        if (!this.config.secret) {
            throw new Error('JWT secret is required');
        }
    }
    /**
     * Create an access token for a user
     */
    async createAccessToken(user, sessionId) {
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            jti: crypto.randomUUID(),
            sub: user.id,
            iss: this.config.issuer,
            aud: this.config.audience,
            exp: now + this.config.accessTokenExpiresIn,
            iat: now,
            nbf: now,
            role: user.role,
            entityId: user.entityId,
            sessionId,
            type: 'access',
        };
        return this.signToken(payload);
    }
    /**
     * Create a refresh token for a user
     */
    async createRefreshToken(user, sessionId) {
        const now = Math.floor(Date.now() / 1000);
        const payload = {
            jti: crypto.randomUUID(),
            sub: user.id,
            iss: this.config.issuer,
            aud: this.config.audience,
            exp: now + this.config.refreshTokenExpiresIn,
            iat: now,
            nbf: now,
            role: user.role,
            entityId: user.entityId,
            sessionId,
            type: 'refresh',
        };
        return this.signToken(payload);
    }
    /**
     * Verify and decode a JWT token
     */
    async verifyToken(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                throw new UnauthorizedError('Invalid token format');
            }
            const [headerB64, payloadB64, signatureB64] = parts;
            // Verify signature
            const expectedSignature = await this.createSignature(`${headerB64}.${payloadB64}`);
            const providedSignature = this.base64UrlDecode(signatureB64);
            if (!this.constantTimeEqual(expectedSignature, providedSignature)) {
                throw new UnauthorizedError('Invalid token signature');
            }
            // Decode payload
            const payloadJson = this.base64UrlDecodeToString(payloadB64);
            const payload = JSON.parse(payloadJson);
            // Validate token
            await this.validatePayload(payload);
            return payload;
        }
        catch (error) {
            if (error instanceof UnauthorizedError) {
                throw error;
            }
            throw new UnauthorizedError('Token verification failed');
        }
    }
    /**
     * Extract token from Authorization header
     */
    extractTokenFromHeader(authHeader) {
        if (!authHeader) {
            return null;
        }
        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') {
            return null;
        }
        return parts[1];
    }
    /**
     * Get token expiry date
     */
    getTokenExpiry(token) {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return null;
            }
            const payloadJson = this.base64UrlDecodeToString(parts[1]);
            const payload = JSON.parse(payloadJson);
            return new Date(payload.exp * 1000);
        }
        catch {
            return null;
        }
    }
    /**
     * Check if token is expired
     */
    isTokenExpired(token) {
        const expiry = this.getTokenExpiry(token);
        if (!expiry) {
            return true;
        }
        return expiry.getTime() <= Date.now();
    }
    /**
     * Sign a JWT token
     */
    async signToken(payload) {
        const header = {
            alg: this.config.algorithm,
            typ: 'JWT',
        };
        const headerB64 = this.base64UrlEncode(JSON.stringify(header));
        const payloadB64 = this.base64UrlEncode(JSON.stringify(payload));
        const data = `${headerB64}.${payloadB64}`;
        const signature = await this.createSignature(data);
        const signatureB64 = this.base64UrlEncode(signature);
        return `${data}.${signatureB64}`;
    }
    /**
     * Create HMAC-SHA256 signature
     */
    async createSignature(data) {
        const key = await crypto.subtle.importKey('raw', this.encoder.encode(this.config.secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
        const signature = await crypto.subtle.sign('HMAC', key, this.encoder.encode(data));
        return new Uint8Array(signature);
    }
    /**
     * Validate JWT payload
     */
    async validatePayload(payload) {
        const now = Math.floor(Date.now() / 1000);
        // Check required fields
        if (!payload.sub || !payload.jti || !payload.sessionId) {
            throw new UnauthorizedError('Missing required token fields');
        }
        // Check issuer and audience
        if (payload.iss !== this.config.issuer) {
            throw new UnauthorizedError('Invalid token issuer');
        }
        if (payload.aud !== this.config.audience) {
            throw new UnauthorizedError('Invalid token audience');
        }
        // Check timing
        if (payload.exp <= now) {
            throw new UnauthorizedError('Token has expired');
        }
        if (payload.nbf > now) {
            throw new UnauthorizedError('Token not yet valid');
        }
        if (payload.iat > now + 60) { // Allow 1 minute clock skew
            throw new UnauthorizedError('Token issued in the future');
        }
    }
    /**
     * Base64 URL encode
     */
    base64UrlEncode(data) {
        const bytes = typeof data === 'string' ? this.encoder.encode(data) : data;
        const base64 = btoa(String.fromCharCode(...bytes));
        return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    }
    /**
     * Base64 URL decode to Uint8Array
     */
    base64UrlDecode(data) {
        const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
        const binary = atob(padded);
        return new Uint8Array(binary.split('').map(char => char.charCodeAt(0)));
    }
    /**
     * Base64 URL decode to string
     */
    base64UrlDecodeToString(data) {
        const bytes = this.base64UrlDecode(data);
        return new TextDecoder().decode(bytes);
    }
    /**
     * Constant-time comparison to prevent timing attacks
     */
    constantTimeEqual(a, b) {
        if (a.length !== b.length) {
            return false;
        }
        let result = 0;
        for (let i = 0; i < a.length; i++) {
            result |= a[i] ^ b[i];
        }
        return result === 0;
    }
}
/**
 * Create a JWT manager instance
 */
export function createJWTManager(config) {
    return new JWTManager(config);
}
/**
 * Extract user ID from token without verification (for logging/debugging)
 */
export function extractUserIdFromToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) {
            return null;
        }
        const payloadJson = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
        const payload = JSON.parse(payloadJson);
        return payload.sub || null;
    }
    catch {
        return null;
    }
}
