/**
 * Magic Link Authentication Unit Tests
 * Tests for magic link generation, verification, and rate limiting utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  MagicLinkManager,
  MagicLinkRateLimiter,
  MagicLinkEmailTemplate,
  createMagicLinkManager,
  createMagicLinkRateLimiter
} from '../../src/lib/auth/magicLink';
import { MagicLinkPurpose } from '../../src/lib/auth/types';
import type { KVNamespace } from '@cloudflare/workers-types';

// Mock KV namespace
const createMockKV = (): KVNamespace => {
  const storage = new Map<string, { value: string; expiration?: number }>();
  
  return {
    get: vi.fn(async (key: string) => {
      const item = storage.get(key);
      if (!item) return null;
      
      // Check expiration
      if (item.expiration && Date.now() > item.expiration) {
        storage.delete(key);
        return null;
      }
      
      return item.value;
    }),
    
    put: vi.fn(async (key: string, value: string, options?: { expirationTtl?: number }) => {
      const expiration = options?.expirationTtl 
        ? Date.now() + (options.expirationTtl * 1000)
        : undefined;
      
      storage.set(key, { value, expiration });
    }),
    
    delete: vi.fn(async (key: string) => {
      storage.delete(key);
    }),
    
    list: vi.fn(async (options?: { prefix?: string }) => {
      const keys = Array.from(storage.keys())
        .filter(key => !options?.prefix || key.startsWith(options.prefix))
        .map(name => ({ name }));
      
      return { keys, list_complete: true, cursor: '' };
    }),
    
    // Add other required methods as no-ops
    getWithMetadata: vi.fn(),
    prepare: vi.fn()
  } as unknown as KVNamespace;
};

// Mock randomBytes with incrementing counter for uniqueness
let randomBytesCounter = 0;
vi.mock('@noble/hashes/utils', () => ({
  randomBytes: vi.fn((size: number) => {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = (i + randomBytesCounter) % 256; // Different pattern each call
    }
    randomBytesCounter++; // Increment counter for next call
    return bytes;
  })
}));

// Mock Date.now for consistent timestamps
const NOW = 1625097600000; // 2021-07-01T00:00:00Z
vi.spyOn(Date, 'now').mockImplementation(() => NOW);

describe('Magic Link Utilities', () => {
  let mockKV: KVNamespace;
  let magicLinkManager: MagicLinkManager;
  let rateLimiter: MagicLinkRateLimiter;
  let emailTemplate: MagicLinkEmailTemplate;
  
  const testEmail = 'test@example.com';
  const testPurpose = MagicLinkPurpose.LOGIN;
  
  beforeEach(() => {
    randomBytesCounter = 0; // Reset counter for each test
    mockKV = createMockKV();
    magicLinkManager = new MagicLinkManager(mockKV);
    rateLimiter = new MagicLinkRateLimiter(mockKV);
    emailTemplate = new MagicLinkEmailTemplate({
      fromName: 'Finance Manager',
      companyName: 'Finance Corp',
      baseUrl: 'https://finance.example.com'
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('MagicLinkManager', () => {
    describe('constructor', () => {
      it('should initialize with default options', () => {
        const manager = new MagicLinkManager(mockKV);
        expect(manager).toBeInstanceOf(MagicLinkManager);
      });
      
      it('should initialize with custom options', () => {
        const manager = new MagicLinkManager(mockKV, {
          keyPrefix: 'custom:',
          defaultTTLMinutes: 30
        });
        expect(manager).toBeInstanceOf(MagicLinkManager);
      });
    });
    
    describe('generateMagicLink', () => {
      it('should generate a magic link with token and expiry', async () => {
        const result = await magicLinkManager.generateMagicLink(testEmail, testPurpose);
        
        expect(result.token).toBeDefined();
        expect(result.token).toHaveLength(64); // 32 bytes = 64 hex chars
        expect(result.expiresAt).toBeInstanceOf(Date);
        
        // Check that token was stored in KV
        expect(mockKV.put).toHaveBeenCalledWith(
          expect.stringContaining('magic:'),
          expect.stringContaining(testEmail),
          expect.objectContaining({ expirationTtl: 900 }) // 15 minutes default
        );
      });
      
      it('should generate different tokens for same email', async () => {
        const result1 = await magicLinkManager.generateMagicLink(testEmail, testPurpose);
        const result2 = await magicLinkManager.generateMagicLink(testEmail, testPurpose);
        
        expect(result1.token).not.toBe(result2.token);
      });
      
      it('should use custom TTL when provided', async () => {
        const customTTL = 30; // 30 minutes
        const result = await magicLinkManager.generateMagicLink(testEmail, testPurpose, {
          ttlMinutes: customTTL
        });
        
        expect(mockKV.put).toHaveBeenCalledWith(
          expect.any(String),
          expect.any(String),
          expect.objectContaining({ expirationTtl: customTTL * 60 })
        );
        
        const expectedExpiry = new Date(NOW + (customTTL * 60 * 1000));
        expect(result.expiresAt).toEqual(expectedExpiry);
      });
      
      it('should store metadata when provided', async () => {
        const metadata = { userId: '123', redirectUrl: '/dashboard' };
        await magicLinkManager.generateMagicLink(testEmail, testPurpose, { metadata });
        
        const storedData = JSON.parse((mockKV.put as any).mock.calls[0][1]);
        expect(storedData.metadata).toEqual(metadata);
      });
      
      it('should normalize email to lowercase', async () => {
        const upperCaseEmail = 'TEST@EXAMPLE.COM';
        await magicLinkManager.generateMagicLink(upperCaseEmail, testPurpose);
        
        const storedData = JSON.parse((mockKV.put as any).mock.calls[0][1]);
        expect(storedData.email).toBe('test@example.com');
      });
    });
    
    describe('verifyMagicLink', () => {
      it('should verify a valid magic link', async () => {
        // Generate a magic link first
        const { token } = await magicLinkManager.generateMagicLink(testEmail, testPurpose);
        
        // Verify it
        const result = await magicLinkManager.verifyMagicLink(token, testPurpose);
        
        expect(result.isValid).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.email).toBe(testEmail);
        expect(result.data?.purpose).toBe(testPurpose);
        expect(result.error).toBeUndefined();
        
        // Check that token was consumed (deleted)
        expect(mockKV.delete).toHaveBeenCalledWith(expect.stringContaining('magic:'));
      });
      
      it('should reject invalid token format', async () => {
        const result = await magicLinkManager.verifyMagicLink('invalid-token');
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid token format');
        expect(result.data).toBeUndefined();
      });
      
      it('should reject non-existent token', async () => {
        const fakeToken = '0'.repeat(64);
        const result = await magicLinkManager.verifyMagicLink(fakeToken);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Token not found or expired');
        expect(result.data).toBeUndefined();
      });
      
      it('should reject token with wrong purpose', async () => {
        const { token } = await magicLinkManager.generateMagicLink(testEmail, MagicLinkPurpose.LOGIN);
        
        const result = await magicLinkManager.verifyMagicLink(token, MagicLinkPurpose.REGISTER);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Token purpose mismatch');
      });
      
      it('should reject expired token', async () => {
        // Mock an expired token in storage
        const expiredToken = '1'.repeat(64);
        const expiredData = {
          email: testEmail,
          purpose: testPurpose,
          expiresAt: Math.floor((NOW - 1000) / 1000), // 1 second ago
          metadata: {}
        };
        
        (mockKV.get as any).mockResolvedValueOnce(JSON.stringify(expiredData));
        
        const result = await magicLinkManager.verifyMagicLink(expiredToken);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Token has expired');
        expect(mockKV.delete).toHaveBeenCalled();
      });
      
      it('should handle invalid JSON in storage', async () => {
        const invalidToken = '2'.repeat(64);
        (mockKV.get as any).mockResolvedValueOnce('invalid-json');
        
        const result = await magicLinkManager.verifyMagicLink(invalidToken);
        
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid token data');
      });
    });
    
    describe('checkMagicLink', () => {
      it('should check if magic link exists without consuming it', async () => {
        const { token } = await magicLinkManager.generateMagicLink(testEmail, testPurpose);
        
        const result = await magicLinkManager.checkMagicLink(token);
        
        expect(result.exists).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data?.email).toBe(testEmail);
        
        // Verify token was not consumed
        expect(mockKV.delete).not.toHaveBeenCalled();
      });
      
      it('should return false for non-existent token', async () => {
        const fakeToken = '0'.repeat(64);
        const result = await magicLinkManager.checkMagicLink(fakeToken);
        
        expect(result.exists).toBe(false);
        expect(result.data).toBeUndefined();
      });
      
      it('should return false for invalid token format', async () => {
        const result = await magicLinkManager.checkMagicLink('invalid');
        
        expect(result.exists).toBe(false);
      });
    });
    
    describe('revokeMagicLink', () => {
      it('should revoke an existing magic link', async () => {
        const { token } = await magicLinkManager.generateMagicLink(testEmail, testPurpose);
        
        const result = await magicLinkManager.revokeMagicLink(token);
        
        expect(result).toBe(true);
        expect(mockKV.delete).toHaveBeenCalled();
      });
      
      it('should return false for non-existent token', async () => {
        const fakeToken = '0'.repeat(64);
        (mockKV.get as any).mockResolvedValueOnce(null);
        
        const result = await magicLinkManager.revokeMagicLink(fakeToken);
        
        expect(result).toBe(false);
      });
    });
    
    describe('generateMagicLinkUrl', () => {
      it('should generate correct URL for login purpose', () => {
        const token = 'test-token';
        const baseUrl = 'https://example.com';
        
        const url = magicLinkManager.generateMagicLinkUrl(
          token,
          baseUrl,
          MagicLinkPurpose.LOGIN
        );
        
        expect(url).toBe('https://example.com/auth/magic-login?token=test-token');
      });
      
      it('should generate correct URL for register purpose', () => {
        const token = 'test-token';
        const baseUrl = 'https://example.com';
        
        const url = magicLinkManager.generateMagicLinkUrl(
          token,
          baseUrl,
          MagicLinkPurpose.REGISTER
        );
        
        expect(url).toBe('https://example.com/auth/magic-register?token=test-token');
      });
      
      it('should include redirect parameter when provided', () => {
        const token = 'test-token';
        const baseUrl = 'https://example.com';
        const redirectPath = '/dashboard';
        
        const url = magicLinkManager.generateMagicLinkUrl(
          token,
          baseUrl,
          MagicLinkPurpose.LOGIN,
          redirectPath
        );
        
        expect(url).toBe('https://example.com/auth/magic-login?token=test-token&redirect=%2Fdashboard');
      });
      
      it('should handle all purpose types', () => {
        const token = 'test-token';
        const baseUrl = 'https://example.com';
        
        const purposes = [
          { purpose: MagicLinkPurpose.LOGIN, path: '/auth/magic-login' },
          { purpose: MagicLinkPurpose.REGISTER, path: '/auth/magic-register' },
          { purpose: MagicLinkPurpose.VERIFY_EMAIL, path: '/auth/verify-email' },
          { purpose: MagicLinkPurpose.RESET_PASSWORD, path: '/auth/reset-password' },
          { purpose: MagicLinkPurpose.CHANGE_EMAIL, path: '/auth/change-email' }
        ];
        
        purposes.forEach(({ purpose, path }) => {
          const url = magicLinkManager.generateMagicLinkUrl(token, baseUrl, purpose);
          expect(url).toBe(`https://example.com${path}?token=test-token`);
        });
      });
    });
  });
  
  describe('MagicLinkRateLimiter', () => {
    describe('checkRateLimit', () => {
      it('should allow requests within rate limit', async () => {
        const result = await rateLimiter.checkRateLimit(testEmail);
        
        expect(result.allowed).toBe(true);
        expect(result.remaining).toBe(2); // 3 max - 1 used = 2 remaining
        expect(result.resetTime).toBeInstanceOf(Date);
      });
      
      it('should block requests exceeding email rate limit', async () => {
        // Make 3 requests (the limit)
        await rateLimiter.checkRateLimit(testEmail);
        await rateLimiter.checkRateLimit(testEmail);
        await rateLimiter.checkRateLimit(testEmail);
        
        // 4th request should be blocked
        const result = await rateLimiter.checkRateLimit(testEmail);
        
        expect(result.allowed).toBe(false);
        expect(result.remaining).toBe(0);
      });
      
      it('should handle IP-based rate limiting', async () => {
        const ipAddress = '192.168.1.1';
        
        // Make requests up to IP limit (6 requests for IP vs 3 for email)
        for (let i = 0; i < 6; i++) {
          await rateLimiter.checkRateLimit(`user${i}@example.com`, ipAddress);
        }
        
        // 7th request should be blocked due to IP limit
        const result = await rateLimiter.checkRateLimit('newuser@example.com', ipAddress);
        
        expect(result.allowed).toBe(false);
      });
      
      it('should reset rate limit after time window', async () => {
        // Mock time progression
        const originalNow = Date.now;
        let currentTime = NOW;
        
        vi.spyOn(Date, 'now').mockImplementation(() => currentTime);
        
        // Make 3 requests
        await rateLimiter.checkRateLimit(testEmail);
        await rateLimiter.checkRateLimit(testEmail);
        await rateLimiter.checkRateLimit(testEmail);
        
        // 4th request should be blocked
        let result = await rateLimiter.checkRateLimit(testEmail);
        expect(result.allowed).toBe(false);
        
        // Advance time by 11 minutes (past the 10-minute window)
        currentTime += 11 * 60 * 1000;
        
        // Request should now be allowed
        result = await rateLimiter.checkRateLimit(testEmail);
        expect(result.allowed).toBe(true);
        
        // Restore original Date.now
        Date.now = originalNow;
      });
    });
  });
  
  describe('MagicLinkEmailTemplate', () => {
    describe('generateEmail', () => {
      const magicLinkUrl = 'https://example.com/auth/magic-login?token=abc123';
      const expiresAt = new Date(NOW + 15 * 60 * 1000); // 15 minutes from now
      
      it('should generate login email template', () => {
        const email = emailTemplate.generateEmail(
          MagicLinkPurpose.LOGIN,
          magicLinkUrl,
          expiresAt
        );
        
        expect(email.subject).toContain('Sign in to Finance Corp');
        expect(email.html).toContain('Sign In');
        expect(email.html).toContain(magicLinkUrl);
        expect(email.text).toContain('sign in');
        expect(email.text).toContain(magicLinkUrl);
      });
      
      it('should generate register email template', () => {
        const email = emailTemplate.generateEmail(
          MagicLinkPurpose.REGISTER,
          magicLinkUrl,
          expiresAt
        );
        
        expect(email.subject).toContain('Complete your Finance Corp registration');
        expect(email.html).toContain('Complete Registration');
        expect(email.text).toContain('registration');
      });
      
      it('should generate verify email template', () => {
        const email = emailTemplate.generateEmail(
          MagicLinkPurpose.VERIFY_EMAIL,
          magicLinkUrl,
          expiresAt
        );
        
        expect(email.subject).toContain('Verify your Finance Corp email');
        expect(email.html).toContain('Verify Email');
        expect(email.text).toContain('verify');
      });
      
      it('should generate reset password email template', () => {
        const email = emailTemplate.generateEmail(
          MagicLinkPurpose.RESET_PASSWORD,
          magicLinkUrl,
          expiresAt
        );
        
        expect(email.subject).toContain('Reset your Finance Corp password');
        expect(email.html).toContain('Reset Password');
        expect(email.text).toContain('reset');
      });
      
      it('should include recipient name when provided', () => {
        const email = emailTemplate.generateEmail(
          MagicLinkPurpose.LOGIN,
          magicLinkUrl,
          expiresAt,
          'John Doe'
        );
        
        expect(email.html).toContain('Hi John Doe');
        expect(email.text).toContain('Hi John Doe');
      });
      
      it('should use generic greeting when no name provided', () => {
        const email = emailTemplate.generateEmail(
          MagicLinkPurpose.LOGIN,
          magicLinkUrl,
          expiresAt
        );
        
        expect(email.html).toContain('Hello!');
        expect(email.text).toContain('Hello!');
      });
      
      it('should include expiry information', () => {
        const email = emailTemplate.generateEmail(
          MagicLinkPurpose.LOGIN,
          magicLinkUrl,
          expiresAt
        );
        
        const expiryText = expiresAt.toLocaleString();
        expect(email.html).toContain(expiryText);
        expect(email.text).toContain(expiryText);
      });
    });
  });
  
  describe('Factory Functions', () => {
    it('should create MagicLinkManager instance', () => {
      const manager = createMagicLinkManager(mockKV);
      expect(manager).toBeInstanceOf(MagicLinkManager);
    });
    
    it('should create MagicLinkRateLimiter instance', () => {
      const limiter = createMagicLinkRateLimiter(mockKV);
      expect(limiter).toBeInstanceOf(MagicLinkRateLimiter);
    });
    
    it('should pass options to factory functions', () => {
      const options = {
        keyPrefix: 'test:',
        defaultTTLMinutes: 30
      };
      
      const manager = createMagicLinkManager(mockKV, options);
      expect(manager).toBeInstanceOf(MagicLinkManager);
      
      const rateLimiterOptions = {
        keyPrefix: 'rate:',
        windowMinutes: 5,
        maxAttempts: 5
      };
      
      const limiter = createMagicLinkRateLimiter(mockKV, rateLimiterOptions);
      expect(limiter).toBeInstanceOf(MagicLinkRateLimiter);
    });
  });
});