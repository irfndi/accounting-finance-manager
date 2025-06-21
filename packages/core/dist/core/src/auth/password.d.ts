/**
 * Password Hashing Utilities
 * Using @noble/hashes argon2id for secure password hashing
 */
/**
 * Argon2id configuration for password hashing
 * Optimized for Cloudflare Workers environment
 */
export interface Argon2Config {
    /** Time cost (iterations) - number of passes */
    timeCost: number;
    /** Memory cost in KiB */
    memoryCost: number;
    /** Parallelism factor */
    parallelism: number;
    /** Hash length in bytes */
    hashLength: number;
    /** Salt length in bytes */
    saltLength: number;
}
/**
 * Default Argon2id configuration
 * Balanced for security and performance in Workers environment
 */
export declare const DEFAULT_ARGON2_CONFIG: Argon2Config;
/**
 * Production Argon2id configuration
 * Higher security parameters for production use
 */
export declare const PRODUCTION_ARGON2_CONFIG: Argon2Config;
/**
 * Hash result containing the hash and salt
 */
export interface HashResult {
    /** The hashed password */
    hash: string;
    /** Base64-encoded salt used for hashing */
    salt: string;
    /** Combined hash string for storage (salt:hash format) */
    combined: string;
    /** Configuration used for hashing */
    config: Argon2Config;
}
/**
 * Hash a password using Argon2id
 *
 * @param password - The password to hash
 * @param config - Argon2id configuration (optional)
 * @returns Promise containing hash result
 */
export declare function hashPassword(password: string, config?: Argon2Config): Promise<HashResult>;
/**
 * Verify a password against a stored hash
 *
 * @param password - The password to verify
 * @param combined - The combined hash string (salt:hash format)
 * @param config - Argon2id configuration (optional)
 * @returns Promise<boolean> indicating if password matches
 */
export declare function verifyPassword(password: string, combined: string, config?: Argon2Config): Promise<boolean>;
/**
 * Get Argon2id configuration based on environment
 */
export declare function getArgon2Config(environment?: 'development' | 'production'): Argon2Config;
/**
 * Validate password strength
 * Basic validation for corporate finance application
 */
export interface PasswordValidation {
    isValid: boolean;
    errors: string[];
    score: number;
}
export declare function validatePassword(password: string): PasswordValidation;
//# sourceMappingURL=password.d.ts.map