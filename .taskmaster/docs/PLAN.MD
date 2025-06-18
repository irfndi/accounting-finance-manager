Overview

You’re building a single-runtime Cloudflare Worker that serves an Astro (TypeScript) front-end, exposes an API, runs an accounting engine, talks to every Cloudflare data product, calls OpenRouter/Cloudflare-AI for OCR & data-clean-up, and is shipped with industrial-grade CI/CD & test coverage.
Below is a pragmatic, end-to-end plan that you can lift directly into a GitHub project board.

1. Architecture at a Glance
┌────────────────────────────────────────────────────────────────────────┐
│  Browser (Astro Islands, HTMX/Alpine)                                 │
│     ⬇ fetch/WS                                                        │
│  Cloudflare Worker (Hono router) ──▶  D1 (SQL, ACID)                  │
│        │                         ├─▶  R2 (files, receipts)            │
│        │                         ├─▶  KV (sessions, feature flags)    │
│        │                         ├─▶  Vectorize (doc embeddings)      │
│        │                         ├─▶  OpenRouter / CF-AI (LLM/OCR)    │
│        └─▶ AWS SES (mail)                                             │
└────────────────────────────────────────────────────────────────────────┘


Key Points

Everything (front-end + API) ships as one Worker bundle via wrangler.toml’s site and modules sections.
Hono gives Express-style routing + Type-safe middleware while still edge-friendly.
Drizzle ORM provides type-safe SQL for D1 (supports SQLite dialect).
Astro output set to “static” + “islands”. Built HTML/JS is copied into the Worker and served by Hono’s serveStatic.
Vectorize stores embeddings of receipts / vendor names for semantic lookup.
Miniflare 3 (in dev Make target) emulates all CF services for tests.
2. Repository Layout
.
├─ apps/
│  └─ web/           # Astro project (tsconfig references ./packages)
├─ packages/
│  ├─ db/            # Drizzle schema & migrator
│  ├─ core/          # Pure accounting engine, no IO
│  ├─ ai/            # OpenRouter + Vectorize helpers
│  └─ types/         # Shared zod schemas & ts types
├─ worker/
│  ├─ router.ts
│  └─ index.ts       # export default worker
├─ scripts/
│  ├─ dev/           # lint, unit, e2e shortcuts
│  └─ prod/          # build, wrangler publish, migrate
├─ .github/
│  └─ workflows/ci.yml
├─ Makefile
└─ pnpm-workspace.yaml

3. Data Model (Double-Entry)

Using Drizzle:

// packages/db/schema.ts
export const accounts     = sqliteTable("accounts", {
  id: integer("id").primaryKey(),
  code: text("code").unique(),   // e.g. 1000-Cash
  name: text("name"),
  type: text("type"),            // Asset | Liability | Equity | Rev | Exp
  createdAt: integer("created_at").default(sql`(strftime('%s','now'))`)
});

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey(),
  txId: integer("tx_id").references(() => transactions.id),
  accountId: integer("account_id").references(() => accounts.id),
  debit: real("debit").default(0),
  credit: real("credit").default(0)
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey(),
  description: text("description"),
  ts: integer("ts").default(sql`(strftime('%s','now'))`)
});


The core rules:

Σ debits = Σ credits for each transaction (enforced via trigger or run-time check).
Statements are just SQL views:
• Balance Sheet = SELECT ... GROUP BY type IN ('Asset', 'Liability', 'Equity')
• P&L = Rev − Exp for given period.
• Cash-Flow from ∆ in cash accounts.
4. AI Integration Workflow

User uploads receipt (image/pdf).

Worker streams file to R2 (PUT /uploads/:uuid).

Triggers AI pipeline:
a. Run Cloudflare AI’s @cf/experimental-content-scan → extract text.
b. Feed text to OpenRouter (LLM) with prompt: “Return JSON: {vendor, date, amount, currency, account_hint}”.
c. Store clean JSON in D1 (table raw_docs).
d. Compute embeddings for both raw text & JSON; store in Vectorize with docId.

When user types “upload all Amazon receipts 2024-Q1”, we vector-search “Amazon 2024-Q1”, fetch ids, and post them to bookkeeping UI for confirmation.

5. Authentication & Security

• Use Cloudflare Access JWT or DIY email-magic-link flow.
• Sessions stored in KV; JWT (HS256) signed with CF_JWT_SECRET.
• Argon2id password hashing (running at edge ~2-3 ms) via Wasm build.
• CSP, same-site cookies, OWASP CSRF tokens for non-API posts.
• Audit log table in D1 (immutable append).

6. CI / CD & Tooling

Makefile (excerpt):

dev: ## Local worker + Astro + hot reload
	pnpm i
	pnpm --filter=apps/web dev & \
	npx wrangler dev --local --persist

lint: ## ESLint + Prettier + type-check
	pnpm eslint . && pnpm tsc -p .

unit:
	pnpm vitest run --coverage

e2e:
	pnpm playwright test

publish: prod/build prod/migrate
	npx wrangler deploy

help:
	@grep -E '^[a-zA-Z_-]+:.*##' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*##"}; {printf "%-15s %s\n", $$1, $$2}'


GitHub Actions (ci.yml):

on: [push, pull_request]
jobs:
  build:
    runs-on: ubuntu-latest
    strategy: { matrix: { node: [20] } }
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - run: pnpm i --frozen-lockfile
      - run: make lint unit
      - run: make e2e
      - run: make prod/build
  deploy:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: pnpm i --frozen-lockfile
      - run: npx wrangler deploy --yes


Testing stack:
• Vitest + ts-mock for unit (100 % lines/branches).
• Miniflare 3 simulates KV/D1 for integration.
• Playwright (Chromium) for end-to-end.
• NYC/Istanbul merges coverage.

7. Design System
Tailwind 3 + shadcn/ui components (gives radix-based modals, tables).
Light/Dark via Astro’s color-scheme hooks.
Figma tokens exported to Tailwind config for brand colors.
Accessibility (WCAG 2.1 AA) + keyboard nav out of the box with shadcn.
8. Development Timeline (12 Weeks)
Week	Focus	Deliverables
0	Spec / tickets	Detailed backlog, ERD, Figma wireframes
1-2	Scaffold	pnpm monorepo, Astro skeleton, Worker w/ Hono, CI green
3-4	Auth & Core DB	Sign-up, login, Drizzle schema, migrations
5-6	Accounting Engine	Double-entry API, statement views, unit tests
7-8	AI Pipeline	R2 upload, OCR → JSON, Vectorize search, UI preview
9	Email & Notifs	AWS SES integration, magic-link & alerts
10	UX Polish	UI themes, responsive, ARIA audit
11	Hardening	Perf budget, edge caching, abuse mitigation
12	Beta & Docs	100 % coverage check, README, onboarding videos
9. “Unknown Unknowns” & Enhancements

• Multi-tenant isolation: prefix every D1 table with tenant_id column; isolate KV keys (tenant:id:*).
• Time-zone aware close-of-day via Temporal API polyfill.
• Plug-in marketplace: generic “import CSV” & “webhook listener” endpoints.
• Optional Stripe billing for SaaS tiering.

10. Next Actions (You)
git init + copy repo skeleton above.
Create Cloudflare project & resources (wrangler d1 create ..., wrangler kv:namespace create ..., etc.).
Provision SES sandbox & verify domain.
Move tasks into GitHub Projects (automation → Sprint 1).

You now have a battle-tested blueprint—follow it and you’ll ship a Cloudflare-native, AI-augmented accounting platform with confidence and full test coverage. 🚀