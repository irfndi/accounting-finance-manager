import alchemy from "alchemy";
import { Worker, D1Database, KVNamespace, R2Bucket, Ai, Assets } from "alchemy/cloudflare";

// Initialize Alchemy app for production
const app = await alchemy("finance-manager-prod", {
  stage: "prod",
});

// Create D1 Database (adopt existing if present)
const d1Database = await D1Database("finance-manager-db-prod", {
  name: "finance-manager-db-prod",
  adopt: true,
});

// Create KV Namespace (adopt existing if present)
const kvNamespace = await KVNamespace("finance-manager-cache-prod", {
  title: "finance-manager-cache-prod",
  adopt: true,
});

// Create R2 Bucket (adopt existing if present)
const r2Bucket = await R2Bucket("finance-manager-documents-prod", {
  name: "finance-manager-documents-prod",
  adopt: true,
});

// Use existing AI (since it already exists)
const ai = new Ai();

// Create Assets for serving static files
const assets = await Assets("static", {
  path: "./dist",
});

// Create Worker with all bindings (adopt existing if present)
const bindings: Record<string, unknown> = {
  FINANCE_MANAGER_DB: d1Database,
  FINANCE_MANAGER_CACHE: kvNamespace,
  FINANCE_MANAGER_DOCUMENTS: r2Bucket,
  AI: ai,
  ASSETS: assets,
  JWT_SECRET: alchemy.secret("JWT_SECRET"),
  ENCRYPTION_KEY: alchemy.secret("ENCRYPTION_KEY"),
  ENVIRONMENT: "production",
  OPENROUTER_API_KEY: alchemy.secret("OPENROUTER_API_KEY"),
};

const worker = await Worker("finance-manager-prod", {
  name: "finance-manager",
  entrypoint: "./dist/_worker.js/index.js",
  adopt: true,
  bindings,
});

console.log({
  url: worker.url,
  kvNamespace: kvNamespace.title,
  r2Bucket: r2Bucket.name,
  d1Database: d1Database.name,
});

// Finalize the app
await app.finalize();

export { worker, kvNamespace, r2Bucket, d1Database, ai, assets };