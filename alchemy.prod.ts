import { Worker, KVNamespace, R2Bucket, D1Database, Ai } from "alchemy/cloudflare";

// Production environment configuration

// Create KV Namespace for caching (production)
const cacheKV = await KVNamespace("finance-manager-cache-prod", {
  title: "Finance Manager Cache Production",
});

// Create R2 Bucket for document storage (production)
const documentsBucket = await R2Bucket("finance-manager-documents-prod", {
  name: "prod-finance-manager-documents",
});

// Create D1 Database for application data (production)
const database = await D1Database("finance-manager-db-prod", {
  name: "prod-finance-manager-db",
});

// Create AI binding for OCR and other AI functionality
const ai = new Ai();

// Create the main worker (production)
const worker = await Worker("finance-manager-prod", {
  name: "finance-manager",
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
    ENVIRONMENT: "production",
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