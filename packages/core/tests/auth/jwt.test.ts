import { describe, it, expect, beforeEach, vi } from 'vitest';
import { authService } from '@/auth';

describe('JWT Authentication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', async () => {
      const payload = { userId: 'test-user-id', role: 'USER' };
      const token = await authService.jwt.generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });

    it('should include correct payload in token', async () => {
      const payload = { userId: 'test-user-id', role: 'ADMIN', email: 'test@example.com' };
      const token = await authService.jwt.generateToken(payload);
      const decoded = await authService.jwt.verifyToken(token);
      
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.role).toBe(payload.role);
      expect(decoded.email).toBe(payload.email);
    });

    it('should set expiration time for token', async () => {
      const payload = { userId: 'test-user-id', role: 'USER' };
      const token = await authService.jwt.generateToken(payload, '1h');
      const decoded = await authService.jwt.verifyToken(token);
      
      expect(decoded.exp).toBeDefined();
      expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token successfully', async () => {
      const payload = { userId: 'test-user-id', role: 'USER' };
      const token = await authService.jwt.generateToken(payload);
      const decoded = await authService.jwt.verifyToken(token);
      
      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
    });

    it('should reject invalid token', async () => {
      const invalidToken = 'invalid.token.here';
      
      await expect(authService.jwt.verifyToken(invalidToken)).rejects.toThrow();
    });

    it('should reject expired token', async () => {
      const payload = { userId: 'test-user-id', role: 'USER' };
      const token = await authService.jwt.generateToken(payload, '-1h'); // Expired 1 hour ago
      
      await expect(authService.jwt.verifyToken(token)).rejects.toThrow();
    });

    it('should reject token with wrong signature', async () => {
      const payload = { userId: 'test-user-id', role: 'USER' };
      const token = await authService.jwt.generateToken(payload);
      const tamperedToken = token.slice(0, -5) + 'wrong';
      
      await expect(authService.jwt.verifyToken(tamperedToken)).rejects.toThrow();
    });
  });

  describe('refreshToken', () => {
    it('should refresh valid token with new expiration', async () => {
      const payload = { userId: 'test-user-id', role: 'USER' };
      const originalToken = await authService.jwt.generateToken(payload, '1h');
      const refreshedToken = await authService.jwt.refreshToken(originalToken);
      
      expect(refreshedToken).toBeDefined();
      expect(refreshedToken).not.toBe(originalToken);
      
      const decoded = await authService.jwt.verifyToken(refreshedToken);
      expect(decoded.userId).toBe(payload.userId);
    });

    it('should not refresh expired token', async () => {
      const payload = { userId: 'test-user-id', role: 'USER' };
      const expiredToken = await authService.jwt.generateToken(payload, '-1h');
      
      await expect(authService.jwt.refreshToken(expiredToken)).rejects.toThrow();
    });
  });
}); 