import { Hono } from 'hono';
import type { D1Database, KVNamespace, R2Bucket } from '@cloudflare/workers-types';
type Env = {
    FINANCE_MANAGER_DB: D1Database;
    FINANCE_MANAGER_CACHE: KVNamespace;
    FINANCE_MANAGER_DOCUMENTS: R2Bucket;
    ENVIRONMENT?: string;
    JWT_SECRET: string;
    AUTH_SESSION_DURATION?: string;
};
declare const accounts: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default accounts;
