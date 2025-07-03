import alchemy from "alchemy";
import { Worker, D1Database, KVNamespace, R2Bucket, Ai, Assets } from "alchemy/cloudflare";

// Create app with proper scope configuration
const app = await alchemy("finance-manager", {
  stage: process.env.NODE_ENV === "production" ? "prod" : "dev"
});

// Create D1 Database (adopt existing if present)
const database = await D1Database("finance-manager-db-v2", {
  name: "finance-manager-db-v2",
  adopt: true,
});

// Create KV Namespace (adopt existing if present)
const kvNamespace = await KVNamespace("finance-manager-cache-v2", {
  title: "finance-manager-cache-v2",
  adopt: true,
});

// Create R2 Bucket (adopt existing if present)
const r2Bucket = await R2Bucket("finance-manager-docs-v2", {
  name: "finance-manager-docs-v2",
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
  FINANCE_MANAGER_DB: database,
  FINANCE_MANAGER_CACHE: kvNamespace,
  FINANCE_MANAGER_DOCUMENTS: r2Bucket,
  AI: ai,
  ASSETS: assets,

};

const worker = await Worker("finance-manager", {
  name: "finance-manager",
  entrypoint: "./dist/_worker.js/index.js",
  adopt: true,
  bindings: {
    ...bindings,
    JWT_SECRET: alchemy.secret("JWT_SECRET"),
    ENCRYPTION_KEY: alchemy.secret("ENCRYPTION_KEY"),
    ENVIRONMENT: "production",
    OPENROUTER_API_KEY: alchemy.secret("OPENROUTER_API_KEY"),
  },
});

// Export resources
export { worker, database, kvNamespace, r2Bucket, ai, assets };

console.log({
  url: worker.url,
});

// Export the app for deployment scripts
export { app };

// Finalize the app
await app.finalize();
