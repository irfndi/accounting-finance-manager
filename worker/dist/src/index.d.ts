/**
 * Corporate Finance Manager - Cloudflare Worker API
 * Main entry point for the finance management system API
 */
import { Hono } from 'hono';
type Env = {
    FINANCE_MANAGER_DB: D1Database;
    FINANCE_MANAGER_CACHE: KVNamespace;
    FINANCE_MANAGER_DOCUMENTS: R2Bucket;
    ENVIRONMENT?: string;
};
declare const app: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default app;
