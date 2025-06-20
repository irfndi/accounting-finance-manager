/**
 * Authentication Utilities
 * Corporate Finance Manager - Secure authentication with Argon2id and JWT
 */

export * from './password';
export * from './jwt';
export * from './magicLink';
export * from './types';

// Import all utilities
import * as PasswordUtils from './password';
import * as JwtUtils from './jwt';
import * as MagicLinkUtils from './magicLink';

// Create comprehensive auth service
export const createAuthService = (jwtSecret: string) => ({
  // Password utilities
  password: PasswordUtils,
  
  // JWT utilities
  jwt: new JwtUtils.JWTManager({ secret: jwtSecret }),
  
  // Magic link utilities
  magicLink: MagicLinkUtils
});