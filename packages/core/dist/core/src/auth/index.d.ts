/**
 * Authentication Utilities
 * Corporate Finance Manager - Secure authentication with Argon2id and JWT
 */
export * from './password';
export * from './jwt';
export * from './magicLink';
export * from './types';
import * as PasswordUtils from './password';
import * as JwtUtils from './jwt';
import * as MagicLinkUtils from './magicLink';
export declare const authService: {
    password: typeof PasswordUtils;
    jwt: typeof JwtUtils;
    magicLink: typeof MagicLinkUtils;
};
export default authService;
//# sourceMappingURL=index.d.ts.map