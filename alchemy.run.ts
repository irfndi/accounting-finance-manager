import alchemy from "alchemy";
import { Worker, KVNamespace, R2Bucket, D1Database, Ai } from "alchemy/cloudflare";

// Initialize Alchemy app
const app = await alchemy("finance-manager");

// Create KV Namespace for caching (use unique name to avoid conflicts)
const kvNamespace = await KVNamespace("finance-manager-cache-v2", {
  title: "finance-manager-cache-v2",
});

// Use existing R2 Bucket (since it already exists)
// We'll reference the existing bucket by name
const r2Bucket = await R2Bucket("finance-manager-docs-v2", {
  name: "finance-manager-docs-v2",
});

// Create D1 Database with unique name
const d1Database = await D1Database("finance-manager-db-v2", {
  name: "finance-manager-db-v2",
});

// Create AI binding
const ai = new Ai();

// Create the main Worker
export const worker = await Worker("finance-manager-worker", {
  name: "finance-manager-worker",
  entrypoint: "./src/index.ts",
  compatibilityDate: "2024-12-01",
  compatibilityFlags: ["nodejs_compat"],
  assets: {
    directory: "./dist/client",
  },
  bindings: {
    FINANCE_MANAGER_DB: d1Database,
    FINANCE_MANAGER_CACHE: kvNamespace,
    FINANCE_MANAGER_DOCUMENTS: r2Bucket,
    AI: ai,
  },
  vars: {
    ENVIRONMENT: "development",
    AUTH_SESSION_DURATION: "7d",
    AWS_REGION: "us-east-1",
    SES_FROM_EMAIL: "noreply@finance-manager.com",
    SES_FROM_NAME: "Finance Manager",
  },
});

console.log({
  url: worker.url,
  kvNamespace: kvNamespace.name,
  r2Bucket: r2Bucket.name,
  d1Database: d1Database.name,
});

// Finalize the app
await app.finalize();