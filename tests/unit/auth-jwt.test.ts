/**
 * JWT Authentication Unit Tests
 * Tests for JWT token generation, verification, and validation utilities
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DEFAULT_JWT_CONFIG,
  JWTManager,
  createJWTManager,
  extractUserIdFromToken,
  generateToken,
  validateToken
} from '../../src/lib/auth/jwt';
import type { AuthUser, JWTConfig } from '../../src/lib/auth/types';
import { UserRole } from '../../src/lib/auth/types';

// Mock crypto.subtle for Node.js environment
global.crypto = {
  subtle: {
    importKey: vi.fn().mockResolvedValue('mock-key'),
    sign: vi.fn().mockResolvedValue(new Uint8Array([1, 2, 3, 4])),
  },
  randomUUID: vi.fn(() => 'test-uuid-123'),
} as any;

describe('JWT Authentication', () => {
  const testSecret = 'test-secret-key-very-long-for-security';
  const testConfig: JWTConfig = {
    ...DEFAULT_JWT_CONFIG,
    secret: testSecret,
    issuer: 'test-app',
  };

  const testUser: AuthUser = {
    id: 'user-123',
    email: 'test@example.com',
    role: UserRole.USER,
    entityId: 'entity-123',
    emailVerified: true,
    isActive: true,
    firstName: 'Test',
    lastName: 'User',
    displayName: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('JWTManager', () => {
    let jwtManager: JWTManager;

    beforeEach(() => {
      jwtManager = new JWTManager(testConfig);
    });

    describe('constructor', () => {
      it('should create manager with provided config', () => {
        const manager = new JWTManager(testConfig);
        expect(manager).toBeInstanceOf(JWTManager);
      });

      it('should throw error if no secret provided', () => {
        expect(() => new JWTManager({})).toThrow('JWT secret is required');
      });
    });

    describe('createAccessToken', () => {
      it('should create access token for a user', async () => {
        const sessionId = 'session-123';
        const token = await jwtManager.createAccessToken(testUser, sessionId);

        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
        expect(crypto.subtle.sign).toHaveBeenCalled();
      });

      it('should work with userId field', async () => {
        const userWithUserId = { ...testUser, id: undefined, userId: 'user-456' };
        const sessionId = 'session-123';
        const token = await jwtManager.createAccessToken(userWithUserId, sessionId);

        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });
    });

    describe('createRefreshToken', () => {
      it('should create refresh token for a user', async () => {
        const sessionId = 'session-123';
        const token = await jwtManager.createRefreshToken(testUser, sessionId);

        expect(typeof token).toBe('string');
        expect(token.length).toBeGreaterThan(0);
      });
    });

    describe('extractTokenFromHeader', () => {
      it('should extract token from valid Bearer header', () => {
        const token = 'valid-jwt-token';
        const header = `Bearer ${token}`;
        const result = jwtManager.extractTokenFromHeader(header);
        
        expect(result).toBe(token);
      });

      it('should return null for missing header', () => {
        const result = jwtManager.extractTokenFromHeader(null);
        expect(result).toBeNull();
      });

      it('should return null for invalid header format', () => {
        const result = jwtManager.extractTokenFromHeader('InvalidHeader');
        expect(result).toBeNull();
      });

      it('should return null for non-Bearer token', () => {
        const result = jwtManager.extractTokenFromHeader('Basic abc123');
        expect(result).toBeNull();
      });
    });

    describe('getTokenExpiry', () => {
      it('should return null for invalid token format', () => {
        const result = jwtManager.getTokenExpiry('invalid-token');
        expect(result).toBeNull();
      });

      it('should return expiry date for valid token', () => {
        const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        const payload = { exp };
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const token = `header.${encodedPayload}.signature`;
        
        const result = jwtManager.getTokenExpiry(token);
        expect(result).toBeInstanceOf(Date);
        expect(result?.getTime()).toBe(exp * 1000);
      });
    });

    describe('isTokenExpired', () => {
      it('should return true for invalid token', () => {
        const result = jwtManager.isTokenExpired('invalid-token');
        expect(result).toBe(true);
      });

      it('should return true for expired token', () => {
        const exp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
        const payload = { exp };
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const token = `header.${encodedPayload}.signature`;
        
        const result = jwtManager.isTokenExpired(token);
        expect(result).toBe(true);
      });

      it('should return false for valid token', () => {
        const exp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
        const payload = { exp };
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const token = `header.${encodedPayload}.signature`;
        
        const result = jwtManager.isTokenExpired(token);
        expect(result).toBe(false);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('createJWTManager', () => {
      it('should create JWT manager with provided config', () => {
        const manager = createJWTManager(testConfig);
        expect(manager).toBeInstanceOf(JWTManager);
      });

      it('should create JWT manager with minimal config', () => {
        const manager = createJWTManager({ secret: testSecret });
        expect(manager).toBeInstanceOf(JWTManager);
      });
    });

    describe('extractUserIdFromToken', () => {
      it('should return null for invalid token', () => {
        const result = extractUserIdFromToken('invalid-token');
        expect(result).toBeNull();
      });

      it('should extract user ID from valid token', () => {
        const userId = 'user-123';
        const payload = { sub: userId };
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const token = `header.${encodedPayload}.signature`;
        
        const result = extractUserIdFromToken(token);
        expect(result).toBe(userId);
      });

      it('should return null for token without sub claim', () => {
        const payload = { other: 'data' };
        const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
        const token = `header.${encodedPayload}.signature`;
        
        const result = extractUserIdFromToken(token);
        expect(result).toBeNull();
      });
    });

    describe('generateToken', () => {
      it('should generate token for user', async () => {
        const user = {
          id: 'user-123',
          role: UserRole.USER,
          entityId: 'entity-123',
          email: 'test@example.com',
        };
        
        const token = await generateToken(user);
        expect(typeof token).toBe('string');
        expect(token.split('.')).toHaveLength(3);
      });

      it('should handle user with userId field', async () => {
        const user = {
          userId: 'user-456',
          role: UserRole.ADMIN,
          entityId: 'entity-123',
          email: 'admin@example.com',
        };
        
        const token = await generateToken(user);
        expect(typeof token).toBe('string');
      });

      it('should use custom expiration', async () => {
        const user = {
          id: 'user-123',
          role: UserRole.USER,
          entityId: 'entity-123',
          email: 'test@example.com',
        };
        
        const token = await generateToken(user, '2h');
        expect(typeof token).toBe('string');
      });
    });

    describe('validateToken', () => {
      it('should validate token format', async () => {
        const mockToken = 'valid.jwt.token';
        
        const result = await validateToken(mockToken);
        expect(result).toHaveProperty('valid');
        expect(typeof result.valid).toBe('boolean');
      });

      it('should return invalid for empty token', async () => {
        const result = await validateToken('');
        expect(result.valid).toBe(false);
        expect(result.error).toBe('Token is required');
      });
    });
  });

  describe('Configuration', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_JWT_CONFIG).toEqual({
        secret: '',
        issuer: 'finance-manager',
        audience: 'finance-manager-users',
        accessTokenExpiresIn: 3600,
        refreshTokenExpiresIn: 604800,
        algorithm: 'HS256',
      });
    });

    it('should allow custom configuration override', () => {
      const customConfig: JWTConfig = {
        secret: 'custom-secret',
        algorithm: 'HS256',
        accessTokenExpiresIn: 7200,
        refreshTokenExpiresIn: 1209600,
        issuer: 'custom-app',
        audience: 'custom-users',
      };

      const manager = new JWTManager(customConfig);
      expect(manager).toBeInstanceOf(JWTManager);
    });
  });
});