import { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';
import type { Ai, Vectorize } from '@cloudflare/workers-types';
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
export type JwtPayload = {
    userId: string;
    email: string;
    name?: string;
    exp: number;
};
export type AuthVariables = {
    user: {
        id: string;
        email: string;
        displayName: string | null;
        firstName: string | null;
        lastName: string | null;
    };
};
export type AppContext = {
    Bindings: Env;
    Variables: AuthVariables;
};
