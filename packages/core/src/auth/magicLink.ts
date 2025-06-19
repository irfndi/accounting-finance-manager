/**
 * Magic Link Utilities
 * Corporate Finance Manager - Passwordless authentication with magic links
 */

import { MagicLinkData, MagicLinkPurpose, AuthContext } from './types';
import { randomBytes } from '@noble/hashes/utils';

/**
 * Magic link manager for generating and validating magic links
 */
export class MagicLinkManager {
  private kv: KVNamespace;
  private keyPrefix: string;
  private defaultTTL: number; // seconds

  constructor(
    kv: KVNamespace,
    options: {
      keyPrefix?: string;
      defaultTTLMinutes?: number;
    } = {}
  ) {
    this.kv = kv;
    this.keyPrefix = options.keyPrefix || 'magic:';
    this.defaultTTL = (options.defaultTTLMinutes || 15) * 60; // Default 15 minutes
  }

  /**
   * Generate a new magic link token
   */
  async generateMagicLink(
    email: string,
    purpose: MagicLinkPurpose,
    options: {
      ttlMinutes?: number;
      metadata?: Record<string, any>;
    } = {}
  ): Promise<{ token: string; expiresAt: Date }> {
    // Generate cryptographically secure token
    const tokenBytes = randomBytes(32);
    const token = this.bytesToHex(tokenBytes);
    
    const now = Date.now();
    const ttl = (options.ttlMinutes || 15) * 60; // Convert to seconds
    const expiresAt = now + (ttl * 1000);

    const magicLinkData: MagicLinkData = {
      token,
      email: email.toLowerCase().trim(),
      purpose,
      expiresAt: Math.floor(expiresAt / 1000),
      metadata: options.metadata,
    };

    const key = this.getMagicLinkKey(token);
    
    await this.kv.put(key, JSON.stringify(magicLinkData), {
      expirationTtl: ttl,
    });

    return {
      token,
      expiresAt: new Date(expiresAt),
    };
  }

  /**
   * Verify and consume a magic link token
   */
  async verifyMagicLink(
    token: string,
    expectedPurpose?: MagicLinkPurpose
  ): Promise<{
    isValid: boolean;
    data?: MagicLinkData;
    error?: string;
  }> {
    if (!token || token.length !== 64) {
      return {
        isValid: false,
        error: 'Invalid token format',
      };
    }

    const key = this.getMagicLinkKey(token);
    const storedData = await this.kv.get(key);

    if (!storedData) {
      return {
        isValid: false,
        error: 'Token not found or expired',
      };
    }

    let magicLinkData: MagicLinkData;
    try {
      magicLinkData = JSON.parse(storedData);
    } catch {
      return {
        isValid: false,
        error: 'Invalid token data',
      };
    }

    // Check if token is expired
    const now = Math.floor(Date.now() / 1000);
    if (magicLinkData.expiresAt <= now) {
      await this.kv.delete(key);
      return {
        isValid: false,
        error: 'Token has expired',
      };
    }

    // Check purpose if specified
    if (expectedPurpose && magicLinkData.purpose !== expectedPurpose) {
      return {
        isValid: false,
        error: 'Token purpose mismatch',
      };
    }

    // Token is valid - consume it by deleting from KV
    await this.kv.delete(key);

    return {
      isValid: true,
      data: magicLinkData,
    };
  }

  /**
   * Check if a magic link exists without consuming it
   */
  async checkMagicLink(token: string): Promise<{
    exists: boolean;
    data?: MagicLinkData;
  }> {
    if (!token || token.length !== 64) {
      return { exists: false };
    }

    const key = this.getMagicLinkKey(token);
    const storedData = await this.kv.get(key);

    if (!storedData) {
      return { exists: false };
    }

    try {
      const magicLinkData: MagicLinkData = JSON.parse(storedData);
      const now = Math.floor(Date.now() / 1000);
      
      if (magicLinkData.expiresAt <= now) {
        await this.kv.delete(key);
        return { exists: false };
      }

      return {
        exists: true,
        data: magicLinkData,
      };
    } catch {
      return { exists: false };
    }
  }

  /**
   * Revoke a magic link token
   */
  async revokeMagicLink(token: string): Promise<boolean> {
    const key = this.getMagicLinkKey(token);
    const existed = await this.kv.get(key);
    
    if (existed) {
      await this.kv.delete(key);
      return true;
    }
    
    return false;
  }

  /**
   * Revoke all magic links for an email
   */
  async revokeAllMagicLinksForEmail(
    email: string,
    purpose?: MagicLinkPurpose
  ): Promise<number> {
    const normalizedEmail = email.toLowerCase().trim();
    let revokedCount = 0;

    // Note: This is inefficient for large numbers of tokens
    // In production, consider maintaining a reverse index
    const listResult = await this.kv.list({ prefix: this.keyPrefix });

    for (const key of listResult.keys) {
      const data = await this.kv.get(key.name);
      if (data) {
        try {
          const magicLinkData: MagicLinkData = JSON.parse(data);
          
          if (magicLinkData.email === normalizedEmail) {
            if (!purpose || magicLinkData.purpose === purpose) {
              await this.kv.delete(key.name);
              revokedCount++;
            }
          }
        } catch {
          // Skip invalid data
        }
      }
    }

    return revokedCount;
  }

  /**
   * Generate a magic link URL
   */
  generateMagicLinkUrl(
    token: string,
    baseUrl: string,
    purpose: MagicLinkPurpose,
    redirectPath?: string
  ): string {
    const url = new URL(baseUrl);
    
    // Set the path based on purpose
    switch (purpose) {
      case MagicLinkPurpose.LOGIN:
        url.pathname = '/auth/magic-login';
        break;
      case MagicLinkPurpose.REGISTER:
        url.pathname = '/auth/magic-register';
        break;
      case MagicLinkPurpose.VERIFY_EMAIL:
        url.pathname = '/auth/verify-email';
        break;
      case MagicLinkPurpose.RESET_PASSWORD:
        url.pathname = '/auth/reset-password';
        break;
      case MagicLinkPurpose.CHANGE_EMAIL:
        url.pathname = '/auth/change-email';
        break;
      default:
        url.pathname = '/auth/magic-link';
    }

    url.searchParams.set('token', token);
    if (redirectPath) {
      url.searchParams.set('redirect', redirectPath);
    }

    return url.toString();
  }

  /**
   * Get magic link key for KV storage
   */
  private getMagicLinkKey(token: string): string {
    return `${this.keyPrefix}${token}`;
  }

  /**
   * Convert bytes to hex string
   */
  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(byte => byte.toString(16).padStart(2, '0'))
      .join('');
  }
}

/**
 * Rate limiter for magic link requests
 */
export class MagicLinkRateLimiter {
  private kv: KVNamespace;
  private keyPrefix: string;
  private windowMs: number;
  private maxAttempts: number;

  constructor(
    kv: KVNamespace,
    options: {
      keyPrefix?: string;
      windowMinutes?: number;
      maxAttempts?: number;
    } = {}
  ) {
    this.kv = kv;
    this.keyPrefix = options.keyPrefix || 'ml_rate:';
    this.windowMs = (options.windowMinutes || 10) * 60 * 1000; // Default 10 minutes
    this.maxAttempts = options.maxAttempts || 3;
  }

  /**
   * Check and record magic link request
   */
  async checkRateLimit(
    email: string,
    ipAddress?: string
  ): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: Date;
  }> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    // Check both email and IP-based rate limits
    const emailKey = this.getRateLimitKey('email', email);
    const ipKey = ipAddress ? this.getRateLimitKey('ip', ipAddress) : null;

    const [emailCount, ipCount] = await Promise.all([
      this.getRequestCount(emailKey, windowStart),
      ipKey ? this.getRequestCount(ipKey, windowStart) : 0,
    ]);

    const isEmailLimited = emailCount >= this.maxAttempts;
    const isIpLimited = ipCount >= this.maxAttempts * 2; // More lenient for IP

    if (isEmailLimited || isIpLimited) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: new Date(now + this.windowMs),
      };
    }

    // Record the request
    await Promise.all([
      this.recordRequest(emailKey),
      ipKey ? this.recordRequest(ipKey) : Promise.resolve(),
    ]);

    return {
      allowed: true,
      remaining: this.maxAttempts - emailCount - 1,
      resetTime: new Date(now + this.windowMs),
    };
  }

  /**
   * Get request count for a key within the time window
   */
  private async getRequestCount(key: string, windowStart: number): Promise<number> {
    const data = await this.kv.get(key);
    if (!data) {
      return 0;
    }

    try {
      const requests: number[] = JSON.parse(data);
      return requests.filter(timestamp => timestamp > windowStart).length;
    } catch {
      return 0;
    }
  }

  /**
   * Record a new request
   */
  private async recordRequest(key: string): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    
    const data = await this.kv.get(key);
    let requests: number[] = [];

    if (data) {
      try {
        requests = JSON.parse(data);
      } catch {
        requests = [];
      }
    }

    // Add current request and filter old ones
    requests.push(now);
    requests = requests.filter(timestamp => timestamp > windowStart);

    await this.kv.put(key, JSON.stringify(requests), {
      expirationTtl: Math.ceil(this.windowMs / 1000),
    });
  }

  /**
   * Get rate limit key
   */
  private getRateLimitKey(type: string, identifier: string): string {
    return `${this.keyPrefix}${type}:${identifier.toLowerCase()}`;
  }
}

/**
 * Email template generator for magic links
 */
export class MagicLinkEmailTemplate {
  private fromName: string;
  private companyName: string;
  private baseUrl: string;

  constructor(options: {
    fromName: string;
    companyName: string;
    baseUrl: string;
  }) {
    this.fromName = options.fromName;
    this.companyName = options.companyName;
    this.baseUrl = options.baseUrl;
  }

  /**
   * Generate magic link email content
   */
  generateEmail(
    purpose: MagicLinkPurpose,
    magicLinkUrl: string,
    expiresAt: Date,
    recipientName?: string
  ): {
    subject: string;
    html: string;
    text: string;
  } {
    const greeting = recipientName ? `Hi ${recipientName}` : 'Hello';
    const expiryText = `This link expires at ${expiresAt.toLocaleString()}.`;

    switch (purpose) {
      case MagicLinkPurpose.LOGIN:
        return {
          subject: `Sign in to ${this.companyName}`,
          html: this.generateLoginEmailHtml(greeting, magicLinkUrl, expiryText),
          text: this.generateLoginEmailText(greeting, magicLinkUrl, expiryText),
        };

      case MagicLinkPurpose.REGISTER:
        return {
          subject: `Complete your ${this.companyName} registration`,
          html: this.generateRegisterEmailHtml(greeting, magicLinkUrl, expiryText),
          text: this.generateRegisterEmailText(greeting, magicLinkUrl, expiryText),
        };

      case MagicLinkPurpose.VERIFY_EMAIL:
        return {
          subject: `Verify your ${this.companyName} email address`,
          html: this.generateVerifyEmailHtml(greeting, magicLinkUrl, expiryText),
          text: this.generateVerifyEmailText(greeting, magicLinkUrl, expiryText),
        };

      case MagicLinkPurpose.RESET_PASSWORD:
        return {
          subject: `Reset your ${this.companyName} password`,
          html: this.generateResetPasswordHtml(greeting, magicLinkUrl, expiryText),
          text: this.generateResetPasswordText(greeting, magicLinkUrl, expiryText),
        };

      default:
        return {
          subject: `Access ${this.companyName}`,
          html: this.generateGenericEmailHtml(greeting, magicLinkUrl, expiryText),
          text: this.generateGenericEmailText(greeting, magicLinkUrl, expiryText),
        };
    }
  }

  private generateLoginEmailHtml(greeting: string, url: string, expiry: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${greeting}!</h2>
        <p>Click the button below to sign in to your ${this.companyName} account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Sign In</a>
        </div>
        <p><small>${expiry}</small></p>
        <p><small>If you didn't request this email, you can safely ignore it.</small></p>
      </div>
    `;
  }

  private generateLoginEmailText(greeting: string, url: string, expiry: string): string {
    return `${greeting}!\n\nClick the link below to sign in to your ${this.companyName} account:\n\n${url}\n\n${expiry}\n\nIf you didn't request this email, you can safely ignore it.`;
  }

  private generateRegisterEmailHtml(greeting: string, url: string, expiry: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ${this.companyName}!</h2>
        <p>${greeting}, click the button below to complete your registration:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Complete Registration</a>
        </div>
        <p><small>${expiry}</small></p>
      </div>
    `;
  }

  private generateRegisterEmailText(greeting: string, url: string, expiry: string): string {
    return `Welcome to ${this.companyName}!\n\n${greeting}, click the link below to complete your registration:\n\n${url}\n\n${expiry}`;
  }

  private generateVerifyEmailHtml(greeting: string, url: string, expiry: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${greeting}!</h2>
        <p>Please verify your email address by clicking the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
        </div>
        <p><small>${expiry}</small></p>
      </div>
    `;
  }

  private generateVerifyEmailText(greeting: string, url: string, expiry: string): string {
    return `${greeting}!\n\nPlease verify your email address by clicking the link below:\n\n${url}\n\n${expiry}`;
  }

  private generateResetPasswordHtml(greeting: string, url: string, expiry: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${greeting}!</h2>
        <p>Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #dc3545; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
        </div>
        <p><small>${expiry}</small></p>
        <p><small>If you didn't request this password reset, you can safely ignore it.</small></p>
      </div>
    `;
  }

  private generateResetPasswordText(greeting: string, url: string, expiry: string): string {
    return `${greeting}!\n\nClick the link below to reset your password:\n\n${url}\n\n${expiry}\n\nIf you didn't request this password reset, you can safely ignore it.`;
  }

  private generateGenericEmailHtml(greeting: string, url: string, expiry: string): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${greeting}!</h2>
        <p>Click the button below to access ${this.companyName}:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${url}" style="background-color: #6c757d; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Access Account</a>
        </div>
        <p><small>${expiry}</small></p>
      </div>
    `;
  }

  private generateGenericEmailText(greeting: string, url: string, expiry: string): string {
    return `${greeting}!\n\nClick the link below to access ${this.companyName}:\n\n${url}\n\n${expiry}`;
  }
}

/**
 * Create a magic link manager instance
 */
export function createMagicLinkManager(
  kv: KVNamespace,
  options?: {
    keyPrefix?: string;
    defaultTTLMinutes?: number;
  }
): MagicLinkManager {
  return new MagicLinkManager(kv, options);
}

/**
 * Create a magic link rate limiter instance
 */
export function createMagicLinkRateLimiter(
  kv: KVNamespace,
  options?: {
    keyPrefix?: string;
    windowMinutes?: number;
    maxAttempts?: number;
  }
): MagicLinkRateLimiter {
  return new MagicLinkRateLimiter(kv, options);
} 