import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

import type { Ai, Vectorize } from '@cloudflare/workers-types';

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
import type { User } from '../db/index.js';

// Define the application context for Hono
export type AppContext = {
  Bindings: Env;
  Variables: {
    user: User;
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