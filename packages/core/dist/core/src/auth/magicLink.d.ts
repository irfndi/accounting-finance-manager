/**
 * Magic Link Utilities
 * Corporate Finance Manager - Passwordless authentication with magic links
 */
import { MagicLinkData, MagicLinkPurpose } from './types';
/**
 * Magic link manager for generating and validating magic links
 */
export declare class MagicLinkManager {
    private kv;
    private keyPrefix;
    private defaultTTL;
    constructor(kv: KVNamespace, options?: {
        keyPrefix?: string;
        defaultTTLMinutes?: number;
    });
    /**
     * Generate a new magic link token
     */
    generateMagicLink(email: string, purpose: MagicLinkPurpose, options?: {
        ttlMinutes?: number;
        metadata?: Record<string, any>;
    }): Promise<{
        token: string;
        expiresAt: Date;
    }>;
    /**
     * Verify and consume a magic link token
     */
    verifyMagicLink(token: string, expectedPurpose?: MagicLinkPurpose): Promise<{
        isValid: boolean;
        data?: MagicLinkData;
        error?: string;
    }>;
    /**
     * Check if a magic link exists without consuming it
     */
    checkMagicLink(token: string): Promise<{
        exists: boolean;
        data?: MagicLinkData;
    }>;
    /**
     * Revoke a magic link token
     */
    revokeMagicLink(token: string): Promise<boolean>;
    /**
     * Revoke all magic links for an email
     */
    revokeAllMagicLinksForEmail(email: string, purpose?: MagicLinkPurpose): Promise<number>;
    /**
     * Generate a magic link URL
     */
    generateMagicLinkUrl(token: string, baseUrl: string, purpose: MagicLinkPurpose, redirectPath?: string): string;
    /**
     * Get magic link key for KV storage
     */
    private getMagicLinkKey;
    /**
     * Convert bytes to hex string
     */
    private bytesToHex;
}
/**
 * Rate limiter for magic link requests
 */
export declare class MagicLinkRateLimiter {
    private kv;
    private keyPrefix;
    private windowMs;
    private maxAttempts;
    constructor(kv: KVNamespace, options?: {
        keyPrefix?: string;
        windowMinutes?: number;
        maxAttempts?: number;
    });
    /**
     * Check and record magic link request
     */
    checkRateLimit(email: string, ipAddress?: string): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: Date;
    }>;
    /**
     * Get request count for a key within the time window
     */
    private getRequestCount;
    /**
     * Record a new request
     */
    private recordRequest;
    /**
     * Get rate limit key
     */
    private getRateLimitKey;
}
/**
 * Email template generator for magic links
 */
export declare class MagicLinkEmailTemplate {
    private fromName;
    private companyName;
    private baseUrl;
    constructor(options: {
        fromName: string;
        companyName: string;
        baseUrl: string;
    });
    /**
     * Generate magic link email content
     */
    generateEmail(purpose: MagicLinkPurpose, magicLinkUrl: string, expiresAt: Date, recipientName?: string): {
        subject: string;
        html: string;
        text: string;
    };
    private generateLoginEmailHtml;
    private generateLoginEmailText;
    private generateRegisterEmailHtml;
    private generateRegisterEmailText;
    private generateVerifyEmailHtml;
    private generateVerifyEmailText;
    private generateResetPasswordHtml;
    private generateResetPasswordText;
    private generateGenericEmailHtml;
    private generateGenericEmailText;
}
/**
 * Create a magic link manager instance
 */
export declare function createMagicLinkManager(kv: KVNamespace, options?: {
    keyPrefix?: string;
    defaultTTLMinutes?: number;
}): MagicLinkManager;
/**
 * Create a magic link rate limiter instance
 */
export declare function createMagicLinkRateLimiter(kv: KVNamespace, options?: {
    keyPrefix?: string;
    windowMinutes?: number;
    maxAttempts?: number;
}): MagicLinkRateLimiter;
//# sourceMappingURL=magicLink.d.ts.map