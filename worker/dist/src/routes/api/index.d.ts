import { Hono } from 'hono';
type Env = {
    FINANCE_MANAGER_DB: D1Database;
    FINANCE_MANAGER_CACHE: KVNamespace;
    FINANCE_MANAGER_DOCUMENTS: R2Bucket;
    ENVIRONMENT?: string;
};
declare const api: Hono<{
    Bindings: Env;
}, import("hono/types").BlankSchema, "/">;
export default api;
