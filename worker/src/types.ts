import { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';

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
};

// Define the JWT payload structure
export type JwtPayload = {
  id: string;
  email: string;
  role: string;
  exp: number;
};

// Define the variables that the middleware will add to the context
export type AuthVariables = {
  user: {
    id: string;
    email: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
  };
};

// Define the application context for Hono
export type AppContext = {
  Bindings: Env;
  Variables: AuthVariables;
};