import alchemy from "alchemy";
import { KVNamespace, R2Bucket, D1Database } from "alchemy/cloudflare";

// Initialize Alchemy app for resource management only
const app = await alchemy("finance-manager-resources");

// KV Namespace for caching
  const kvNamespace = await KVNamespace("finance-manager-cache-v3", {
    title: "finance-manager-cache-v3",
  });

// Create R2 Bucket for document storage
const r2Bucket = await R2Bucket("finance-manager-docs-v3", {
  name: "finance-manager-docs-v3",
});

// Create D1 Database
const d1Database = await D1Database("finance-manager-db-v3", {
  name: "finance-manager-db-v3",
});

console.log("✅ Alchemy Resources Created:");
console.log({
  kvNamespace: kvNamespace.name,
  r2Bucket: r2Bucket.name,
  d1Database: d1Database.name,
});

console.log("\n📝 Update your wrangler.toml with these resource names:");
console.log(`KV Namespace: ${kvNamespace.name}`);
console.log(`R2 Bucket: ${r2Bucket.name}`);
console.log(`D1 Database: ${d1Database.name}`);

// Finalize the app
await app.finalize();

export { kvNamespace, r2Bucket, d1Database };