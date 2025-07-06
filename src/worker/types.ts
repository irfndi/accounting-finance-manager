import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';
import type { Ai, Vectorize } from '@cloudflare/workers-types';
import type { InferSelectModel } from 'drizzle-orm';

// Environment bindings interface
export type Env = {
  FINANCE_MANAGER_DB: D1Database;
  FINANCE_MANAGER_CACHE: KVNamespace;
  FINANCE_MANAGER_DOCUMENTS: R2Bucket;
  AI: Ai;
  DOCUMENT_EMBEDDINGS: Vectorize;
  ENVIRONMENT?: string;
  JWT_SECRET: string;
  AUTH_SESSION_DURATION?: string;
  OPENROUTER_API_KEY?: string;
  // AWS SES Configuration
  AWS_ACCESS_KEY_ID?: string;
  AWS_SECRET_ACCESS_KEY?: string;
  AWS_REGION?: string;
  SES_FROM_EMAIL?: string;
  SES_FROM_NAME?: string;
};

// Define the JWT payload structure
export type JwtPayload = {
  id: string;
  email: string;
  role: string;
  exp: number;
  jti: string;
  sub: string;
};

import type { RawDocument } from '../types/index.js';
import type { users, sessions, budgets, transactions, categories } from '../db/schema';
import type { Database } from '../db';
import type { MagicLinkManager, MagicLinkRateLimiter } from '../lib/auth/magicLink';
import type { VectorizeIndex } from '@cloudflare/workers-types';
import type { AIService } from '../ai/services/ai-service';

// Define type aliases using InferSelectModel
export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type Budget = InferSelectModel<typeof budgets>;
export type Transaction = InferSelectModel<typeof transactions>;
export type Category = InferSelectModel<typeof categories>;

// Mock Cache interface for now
export interface Cache {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

// Mock EmailService interface for now
export interface EmailService {
  sendEmail(options: {
    to: string[];
    subject: string;
    htmlBody: string;
    textBody: string;
  }): Promise<void>;
}

// Define the application context for Hono
export type AppContext = {
  Bindings: Env;
  Variables: {
    db: Database;
    cache: Cache;
    user: User | null;
    session: Session | null;
    emailService: EmailService;
    magicLinkManager: MagicLinkManager;
    rateLimiter: MagicLinkRateLimiter;
    aiService: AIService;
    doc: RawDocument;
    jwtPayload: JwtPayload;
  };
};

// Define the variables that the middleware will add to the context
export type AuthVariables = {
  user: AppContext['Variables']['user'];
  jwtPayload: AppContext['Variables']['jwtPayload'];
};

// Define the variables that the middleware will add to the context
export type SearchResultDocument = RawDocument & {
  similarity: number;
  matchedText: string;
  chunkInfo?: {
    chunkIndex: number;
    totalChunks: number;
    chunkId: string;
  };
};

export type DocVariable = {
  doc: AppContext['Variables']['doc'];
};

// Type aliases are already exported above