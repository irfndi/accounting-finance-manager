import alchemy from "alchemy";
import { Astro, KVNamespace, R2Bucket, D1Database, Ai } from "alchemy/cloudflare";

// Initialize Alchemy app
const app = await alchemy("finance-manager");

// Use existing KV Cache (since it already exists)
// We'll reference the existing cache by name)
const kvNamespace = await KVNamespace("finance-manager-cache-v2", {
  title: "finance-manager-cache-v2",
  adopt: true,
});

// Use existing R2 Bucket (since it already exists)
// We'll reference the existing bucket by name
const r2Bucket = await R2Bucket("finance-manager-docs-v2", {
  name: "finance-manager-docs-v2",
  adopt: true,
});

// Use existing D1 Database (since it already exists)
// We'll reference the existing database by name
const d1Database = await D1Database("finance-manager-db-v2", {
  name: "finance-manager-db-v2",
  adopt: true,
});

// Use existing AI (since it already exists)
// We'll reference the existing AI by name
const ai = new Ai();

// Create the Astro worker with bindings
export const worker = await Astro("finance-manager", {
  command: "pnpm run build",
  bindings: {
    FINANCE_MANAGER_DB: d1Database,
    FINANCE_MANAGER_CACHE: kvNamespace,
    FINANCE_MANAGER_DOCUMENTS: r2Bucket,
    AI: ai,
  },
  vars: {
    ALCHEMY_MANAGED: "true",
    CONTAINER_VERSION: "1.0.0",
    DEPLOYMENT_STRATEGY: "alchemy",
    STAGE: "dev",
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