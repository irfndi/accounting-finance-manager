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
export declare const authService: {
    password: typeof PasswordUtils;
    jwt: typeof JwtUtils;
    magicLink: typeof MagicLinkUtils;
};
export default authService;
//# sourceMappingURL=index.d.ts.map