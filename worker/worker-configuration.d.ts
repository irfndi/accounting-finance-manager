// Cloudflare Worker environment configuration
/// <reference types="@cloudflare/workers-types" />

interface Env {
	FINANCE_MANAGER_CACHE: KVNamespace;
	ENVIRONMENT: "development" | "production";
	JWT_SECRET: "dev-jwt-secret-please-change-in-production-use-strong-random-key";
	AUTH_SESSION_DURATION: "7d";
	FINANCE_MANAGER_DOCUMENTS: R2Bucket;
	FINANCE_MANAGER_DB: D1Database;
	AI: Ai;
	DOCUMENT_EMBEDDINGS: Vectorize;
	[key: string]: unknown;
}
