/**
 * Password Hashing Utilities
 * Using @noble/hashes argon2id for secure password hashing
 */
import { argon2id } from '@noble/hashes/argon2';
import { randomBytes } from '@noble/hashes/utils';
/**
 * Default Argon2id configuration
 * Balanced for security and performance in Workers environment
 */
export const DEFAULT_ARGON2_CONFIG = {
    timeCost: 3, // 3 iterations for good security
    memoryCost: 65536, // 64 MiB memory usage
    parallelism: 1, // Single thread (Workers limitation)
    hashLength: 32, // 256-bit hash
    saltLength: 16, // 128-bit salt
};
/**
 * Production Argon2id configuration
 * Higher security parameters for production use
 */
export const PRODUCTION_ARGON2_CONFIG = {
    timeCost: 4, // 4 iterations for higher security
    memoryCost: 65536, // 64 MiB memory usage (Workers limit)
    parallelism: 1, // Single thread
    hashLength: 32, // 256-bit hash
    saltLength: 16, // 128-bit salt
};
/**
 * Hash a password using Argon2id
 *
 * @param password - The password to hash
 * @param config - Argon2id configuration (optional)
 * @returns Promise containing hash result
 */
export async function hashPassword(password, config = DEFAULT_ARGON2_CONFIG) {
    try {
        // Generate cryptographically secure random salt
        const salt = randomBytes(config.saltLength);
        // Convert password to bytes
        const passwordBytes = new TextEncoder().encode(password);
        // Hash the password using Argon2id
        const hash = argon2id(passwordBytes, salt, {
            t: config.timeCost,
            m: config.memoryCost,
            p: config.parallelism,
            dkLen: config.hashLength,
        });
        // Convert to base64 for storage
        const saltB64 = btoa(String.fromCharCode(...salt));
        const hashB64 = btoa(String.fromCharCode(...hash));
        // Create combined format for easy storage/retrieval
        const combined = `${saltB64}:${hashB64}`;
        return {
            hash: hashB64,
            salt: saltB64,
            combined,
            config,
        };
    }
    catch (error) {
        throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}
/**
 * Verify a password against a stored hash
 *
 * @param password - The password to verify
 * @param combined - The combined hash string (salt:hash format)
 * @param config - Argon2id configuration (optional)
 * @returns Promise<boolean> indicating if password matches
 */
export async function verifyPassword(password, combined, config = DEFAULT_ARGON2_CONFIG) {
    try {
        // Split the combined hash into salt and hash
        const [saltB64, hashB64] = combined.split(':');
        if (!saltB64 || !hashB64) {
            throw new Error('Invalid hash format. Expected salt:hash');
        }
        // Decode from base64
        const salt = new Uint8Array(atob(saltB64).split('').map(char => char.charCodeAt(0)));
        const expectedHash = new Uint8Array(atob(hashB64).split('').map(char => char.charCodeAt(0)));
        // Convert password to bytes
        const passwordBytes = new TextEncoder().encode(password);
        // Hash the password with the stored salt
        const computedHash = argon2id(passwordBytes, salt, {
            t: config.timeCost,
            m: config.memoryCost,
            p: config.parallelism,
            dkLen: config.hashLength,
        });
        // Constant-time comparison
        return constantTimeEqual(computedHash, expectedHash);
    }
    catch (error) {
        // Don't reveal specific error details for security
        return false;
    }
}
/**
 * Constant-time comparison to prevent timing attacks
 */
function constantTimeEqual(a, b) {
    if (a.length !== b.length) {
        return false;
    }
    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a[i] ^ b[i];
    }
    return result === 0;
}
/**
 * Get Argon2id configuration based on environment
 */
export function getArgon2Config(environment = 'development') {
    return environment === 'production' ? PRODUCTION_ARGON2_CONFIG : DEFAULT_ARGON2_CONFIG;
}
export function validatePassword(password) {
    const errors = [];
    let score = 0;
    // Length check
    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }
    else if (password.length >= 12) {
        score += 20;
    }
    else {
        score += 10;
    }
    // Character variety checks
    if (/[a-z]/.test(password))
        score += 10;
    if (/[A-Z]/.test(password))
        score += 10;
    if (/[0-9]/.test(password))
        score += 10;
    if (/[^a-zA-Z0-9]/.test(password))
        score += 15;
    // Complexity bonus
    if (password.length >= 16)
        score += 10;
    if (/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9])/.test(password)) {
        score += 25;
    }
    // Common pattern penalties
    if (/(.)\1{2,}/.test(password)) {
        errors.push('Password contains repeated characters');
        score -= 10;
    }
    if (/^[a-zA-Z]+$/.test(password)) {
        errors.push('Password should contain numbers or special characters');
        score -= 15;
    }
    if (/^[0-9]+$/.test(password)) {
        errors.push('Password should contain letters');
        score -= 20;
    }
    // Common weak passwords
    const weakPasswords = ['password', '123456', 'qwerty', 'admin', 'letmein'];
    if (weakPasswords.some(weak => password.toLowerCase().includes(weak))) {
        errors.push('Password contains common weak patterns');
        score -= 25;
    }
    score = Math.max(0, Math.min(100, score));
    return {
        isValid: errors.length === 0 && score >= 60,
        errors,
        score,
    };
}
