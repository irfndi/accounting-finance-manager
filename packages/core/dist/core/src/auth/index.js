/**
 * Authentication Utilities
 * Corporate Finance Manager - Secure authentication with Argon2id and JWT
 */
export * from './password.js';
export * from './jwt.js';
export * from './magicLink.js';
export * from './types.js';
// Import all utilities
import * as PasswordUtils from './password.js';
import * as JwtUtils from './jwt.js';
import * as MagicLinkUtils from './magicLink.js';
// Create comprehensive auth service
export const authService = {
    // Password utilities
    password: PasswordUtils,
    // JWT utilities
    jwt: JwtUtils,
    // Magic link utilities
    magicLink: MagicLinkUtils
};
// Export as default for easier importing
export default authService;
