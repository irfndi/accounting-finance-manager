/// <reference types="@cloudflare/workers-types" />

// Global type declarations for Cloudflare Workers
declare global {
  // These types are already exported from @cloudflare/workers-types
  // but we need to make them globally available
  type KVNamespace = import('@cloudflare/workers-types').KVNamespace;
  type KVNamespaceGetOptions<T> = import('@cloudflare/workers-types').KVNamespaceGetOptions<T>;
  type D1Database = import('@cloudflare/workers-types').D1Database;
  type R2Bucket = import('@cloudflare/workers-types').R2Bucket;
}

export {};