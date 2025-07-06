/**
 * Password Hashing Utilities
 * Using Web Crypto API (crypto.subtle) for secure password hashing
 */

/**
 * PBKDF2 configuration for password hashing
 * Optimized for Cloudflare Workers environment
 */
export interface PBKDF2Config {
  /** Iterations count */
  iterations: number;
  /** Hash algorithm */
  hash: 'SHA-256' | 'SHA-384' | 'SHA-512';
  /** Salt length in bytes */
  saltLength: number;
  /** Key length in bytes */
  keyLength: number;
}

/**
 * Default PBKDF2 configuration
 * Balanced for security and performance in Workers environment
 */
export const DEFAULT_PBKDF2_CONFIG: PBKDF2Config = {
  iterations: 100000, // OWASP recommendation
  hash: 'SHA-256',
  saltLength: 16,     // 128-bit salt
  keyLength: 32,      // 256-bit key
};

/**
 * Production PBKDF2 configuration
 * Higher security parameters for production use
 */
export const PRODUCTION_PBKDF2_CONFIG: PBKDF2Config = {
    iterations: 200000, // Increased iterations
    hash: 'SHA-256',
    saltLength: 16,     // 128-bit salt
    keyLength: 32,      // 256-bit key
};


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
  config: PBKDF2Config;
}

/**
 * Hash a password using PBKDF2
 * 
 * @param password - The password to hash
 * @param config - PBKDF2 configuration (optional)
 * @param providedSalt - An optional salt to use for hashing (used for verification)
 * @returns Promise containing hash result
 */
export async function hashPassword(
  password: string, 
  config: PBKDF2Config = DEFAULT_PBKDF2_CONFIG,
  providedSalt?: Uint8Array
): Promise<HashResult> {
  try {
    const encoder = new TextEncoder();
    const salt = providedSalt || crypto.getRandomValues(new Uint8Array(config.saltLength));
    const passwordBuffer = encoder.encode(password);
    
    // 1. Import the password as a key
    const passwordKey = await crypto.subtle.importKey(
      "raw",
      passwordBuffer,
      { name: "PBKDF2" },
      false,
      ["deriveBits"]
    );
    
    // 2. Derive the bits using PBKDF2
    const hashBuffer = await crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        salt: salt as BufferSource,
        iterations: config.iterations,
        hash: config.hash,
      },
      passwordKey,
      config.keyLength * 8 // keyLength is in bytes, deriveBits expects bits
    );
    
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    const saltHex = Array.from(salt)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    
    const combined = `${saltHex}:${hashHex}`;
    
    return {
      hash: hashHex,
      salt: saltHex,
      combined,
      config,
    };
  } catch (error) {
    console.error('Error in hashPassword:', error);
    throw new Error(`Password hashing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Verify a password against a stored hash
 * 
 * @param password - The password to verify
 * @param combined - The combined hash string (salt:hash format)
 * @param config - PBKDF2 configuration (optional)
 * @returns Promise<boolean> indicating if password matches
 */
export async function verifyPassword(
  password: string,
  combined: string,
  config: PBKDF2Config = DEFAULT_PBKDF2_CONFIG
): Promise<boolean> {
  try {
    const [saltHex, originalHashHex] = combined.split(':');
    if (!saltHex || !originalHashHex) {
      throw new Error('Invalid hash format. Expected salt:hash');
    }
    
    const salt = new Uint8Array(saltHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    
    const hashResult = await hashPassword(password, config, salt);
    
    const originalHash = new Uint8Array(originalHashHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    const computedHash = new Uint8Array(hashResult.hash.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)));
    
    return constantTimeEqual(originalHash, computedHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

/**
 * Constant-time comparison to prevent timing attacks
 */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
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
 * Get PBKDF2 configuration based on environment
 */
export function getPBKDF2Config(environment: 'development' | 'production' = 'development'): PBKDF2Config {
  return environment === 'production' ? PRODUCTION_PBKDF2_CONFIG : DEFAULT_PBKDF2_CONFIG;
}

/**
 * Validate password strength
 * Basic validation for corporate finance application
 */
export interface PasswordValidation {
  isValid: boolean;
  errors: string[];
  score: number; // 0-100
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = [];
  let score = 0;
  
  // Length check
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    // Scale score based on length - longer passwords get higher scores
    if (password.length >= 8 && password.length < 12) {
      score += 10;
    } else if (password.length >= 12 && password.length < 16) {
      score += 20;
    } else if (password.length >= 16 && password.length < 20) {
      score += 30;
    } else if (password.length >= 20) {
      score += 40; // Extra bonus for very long passwords
    }
  }
  
  // Character variety checks
  if (/[a-z]/.test(password)) score += 10;
  if (/[A-Z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 10;
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
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