/**
 * Authentication Utilities
 * Corporate Finance Manager - Secure authentication with Argon2id and JWT
 */
export * from './password.js';
export * from './jwt.js';
export * from './magicLink.js';
export * from './types.js';

import * as PasswordUtils from './password.js';
import * as JwtUtils from './jwt.js';
import * as MagicLinkUtils from './magicLink.js';
// Create comprehensive auth service
export const createAuthService = (jwtSecret) => ({
    // Password utilities
    password: PasswordUtils,
    // JWT utilities
    jwt: new JwtUtils.JWTManager({ secret: jwtSecret }),
    // Magic link utilities
    magicLink: MagicLinkUtils
});
