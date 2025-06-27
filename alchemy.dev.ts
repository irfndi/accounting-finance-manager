import { Worker, KVNamespace, R2Bucket, D1Database, Ai } from "alchemy/cloudflare";

// Development environment configuration

// Create KV Namespace for caching (development)
const cacheKV = await KVNamespace("finance-manager-cache-dev", {
  title: "Finance Manager Cache Dev",
});

// Create R2 Bucket for document storage (development)
const documentsBucket = await R2Bucket("finance-manager-documents-dev", {
  name: "finance-manager-documents-dev",
});

// Create D1 Database for application data (development)
const database = await D1Database("finance-manager-db-dev", {
  name: "finance-manager-db-dev",
});

// Create AI binding for OCR and other AI functionality
const ai = new Ai();

// Create the main worker (development)
const worker = await Worker("finance-manager-dev", {
  name: "finance-manager-dev",
  entrypoint: "./src/worker/index.ts",
  compatibilityDate: "2024-12-01",
  compatibilityFlags: ["nodejs_compat"],
  bindings: {
    FINANCE_MANAGER_DB: database,
    FINANCE_MANAGER_CACHE: cacheKV,
    FINANCE_MANAGER_DOCUMENTS: documentsBucket,
    AI: ai,
  },
  vars: {
    ENVIRONMENT: "development",
    AUTH_SESSION_DURATION: "7d",
    AWS_REGION: "us-east-1",
    SES_FROM_EMAIL: "noreply@finance-manager.com",
    SES_FROM_NAME: "Finance Manager",
  },
  assets: {
    directory: "dist/client",
  },
});

export { worker, cacheKV, documentsBucket, database, ai };