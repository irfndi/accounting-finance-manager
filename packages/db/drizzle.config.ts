import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID || "",
    databaseId: "886fa63b-1b70-42bc-8acd-62c21d68e42b",
    token: process.env.CLOUDFLARE_API_TOKEN || "",
  },
  verbose: true,
  strict: true,
}); 