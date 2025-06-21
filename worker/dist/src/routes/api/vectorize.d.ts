/**
 * Vectorize API Routes
 * Handles document vectorization and semantic search
 */
import { Hono } from 'hono';
import type { D1Database, KVNamespace, R2Bucket, Vectorize, Ai } from '@cloudflare/workers-types';
type Env = {
    FINANCE_MANAGER_DB: D1Database;
    FINANCE_MANAGER_CACHE: KVNamespace;
    FINANCE_MANAGER_DOCUMENTS: R2Bucket;
    AI: Ai;
    DOCUMENT_EMBEDDINGS: Vectorize;
    JWT_SECRET?: string;
    ENVIRONMENT?: string;
    OPENROUTER_API_KEY?: string;
};
declare const vectorize: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default vectorize;
