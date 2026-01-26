# Fin-in-Flow End-to-End Refactoring Plan

## Overview

This document provides a comprehensive end-to-end plan for refactoring the fin-in-flow Finance Manager application from its current stack to a modern, scalable architecture.

**Total Issues:** 109 (11 EPICs + 98 subtasks)
**Estimated Duration:** 150-200 days across all workstreams

---

## Tech Stack Migration

### Current Stack → New Stack

| Component      | Current                | New                                 |
| -------------- | ---------------------- | ----------------------------------- |
| **Frontend**   | React 19.2.1           | Astro Beta 6 + EffectTS + TanStack  |
| **Runtime**    | Node.js                | Deno                                |
| **Backend**    | Hono 4.10.7 (Node)     | Go 1.25                             |
| **Deployment** | Cloudflare Workers     | Workers + Containers                |
| **Database**   | Drizzle ORM + D1       | Go native + D1 (migrate)            |
| **Storage**    | R2                     | R2 + SQL Query Engine               |
| **Vector DB**  | Vectorize              | Vectorize (enhanced)                |
| **AI**         | OpenRouter, Workers AI | OpenRouter + Workers AI + Custom ML |

---

## EPIC Breakdown

### **P0 - Critical Path (Must Complete First)**

#### EPIC 1: Infrastructure & Deployment Setup (finance-manager-aik)

**Priority:** P0 | **Estimate:** 8-12 days
**Status:** ✅ Ready to Start

**Subtasks:**

1. Setup Cloudflare Workers + Containers infrastructure
2. Configure D1 database with jurisdictions and replication
3. Configure R2 storage with SQL engine
4. Setup Vectorize vector database
5. Configure environment variables and secrets
6. Create deployment scripts and CI/CD pipeline
7. Setup monitoring and error tracking
8. Document deployment process

**Blocks:** None (foundational epic)

---

#### EPIC 2: Frontend Migration - Core Setup (finance-manager-o08)

**Priority:** P0 | **Estimate:** 10-14 days
**Status:** ⏸️ Blocked by EPIC 1

**Subtasks:**

1. Initialize Astro Beta 6 project with Deno
2. Configure TypeScript and build tooling
3. Integrate EffectTS
4. Setup TanStack Router
5. Setup TanStack Query
6. Setup TanStack Store
7. Configure Astro components for React integration
8. Create base layout and routing structure
9. Setup development environment
10. Migrate shared utilities and types

**Blocks:** EPIC 1 (Infrastructure)

---

#### EPIC 3: Backend Migration - Go + Containers (finance-manager-hbo)

**Priority:** P0 | **Estimate:** 12-16 days
**Status:** ⏸️ Blocked by EPIC 1

**Subtasks:**

1. Initialize Go 1.25 project structure
2. Configure Go for Container deployment
3. Setup HTTP server and routing
4. Implement D1 database connection and query builder
5. Implement R2 storage access layer
6. Implement Vectorize client for vector operations
7. Setup middleware chain (auth, logging, recovery)
8. Create base API structure and handlers
9. Configure environment-based settings
10. Setup development workflow with hot reload

**Blocks:** EPIC 1 (Infrastructure)

---

#### EPIC 4: Database Schema & Migrations (finance-manager-bkr)

**Priority:** P0 | **Estimate:** 8-10 days
**Status:** ⏸️ Blocked by EPIC 3

**Subtasks:**

1. Design double-entry accounting schema
2. Design multi-tenant schema (users, entities, roles, permissions)
3. Design document storage schema (receipts, invoices, statements)
4. Design ML/AI data schema (embeddings, categorization models)
5. Setup migration system (golang-migrate)
6. Create initial schema migrations
7. Add indexes for performance optimization
8. Create seed data for development
9. Test schema integrity with transactions
10. Document data model and relationships

**Blocks:** EPIC 3 (Backend)

---

### **P1 - High Priority (Important Features)**

#### EPIC 5: Frontend Features - Data Input (finance-manager-5xh)

**Priority:** P1 | **Estimate:** 14-18 days
**Status:** ⏸️ Blocked by EPIC 2, EPIC 4

**Subtasks:**

1. Design one-page input layout and UX flow
2. Implement drag-and-drop file upload component
3. Create file type validation and parsing preview
4. Build manual data entry form with validation
5. Implement confirmation workflow UI
6. Create dashboard with data completeness indicators
7. Implement warning system for incomplete data
8. Add regional configuration selector (accounting standards, currency)
9. Implement mobile-responsive design
10. Add accessibility features (screen reader, keyboard nav, contrast)

**Blocks:** EPIC 2 (Frontend), EPIC 4 (Database)

---

#### EPIC 6: Backend Features - Data Processing (finance-manager-kw2)

**Priority:** P1 | **Estimate:** 16-20 days
**Status:** ⏸️ Blocked by EPIC 3, EPIC 4

**Subtasks:**

1. Implement file upload API endpoint
2. Create PDF parsing service
3. Create CSV parsing service
4. Create OFX parsing service
5. Create QIF parsing service
6. Integrate Workers AI for OCR
7. Implement structured data extraction
8. Add confidence scoring algorithm
9. Integrate Vectorize for semantic search
10. Implement auto-categorization service (rule-based + ML)
11. Add error handling and retry logic
12. Create batch processing pipeline

**Blocks:** EPIC 3 (Backend), EPIC 4 (Database)

---

#### EPIC 7: Accounting Engine (finance-manager-obi)

**Priority:** P1 | **Estimate:** 18-22 days
**Status:** ⏸️ Blocked by EPIC 4, EPIC 6

**Subtasks:**

1. Implement double-entry journal entry system
2. Create account chart and hierarchy
3. Implement debit/credit validation
4. Build three-layer balance sheet validation
5. Create income statement calculator
6. Create balance sheet generator
7. Implement cash flow statement generator (direct method)
8. Implement cash flow statement generator (indirect method)
9. Add IFRS 7 compliance for cash flow
10. Implement graceful degradation for partial data
11. Create smart suggestions engine for missing data
12. Add real-time validation hooks
13. Create audit trail system

**Blocks:** EPIC 4 (Database), EPIC 6 (Data Processing)

---

#### EPIC 8: ML/AI System (finance-manager-irr)

**Priority:** P1 | **Estimate:** 20-24 days
**Status:** ⏸️ Blocked by EPIC 6, EPIC 7

**Subtasks:**

1. Design ML data collection system (anonymized)
2. Implement data preprocessing pipeline
3. Create categorization model (using Fina V2 reference)
4. Create anomaly detection model (LightGBM or Isolation Forest)
5. Create optimization suggestion model
6. Setup model training pipeline
7. Implement model versioning
8. Create model serving API
9. Integrate with OpenRouter for AI services
10. Integrate with Workers AI for document processing
11. Implement Vectorize embeddings for semantic search
12. Create feedback loop system
13. Add A/B testing framework
14. Implement privacy preservation (data aggregation, anonymization)

**Blocks:** EPIC 6 (Data Processing), EPIC 7 (Accounting)

---

#### EPIC 9: RBAC & Multi-Entity (finance-manager-20c)

**Priority:** P1 | **Estimate:** 14-16 days
**Status:** ⏸️ Blocked by EPIC 4, EPIC 2

**Subtasks:**

1. Design multi-entity data model
2. Implement entity management API
3. Create role and permission system
4. Implement permission checking middleware
5. Build entity switching UI
6. Create entity configuration management
7. Implement audit trail for RBAC
8. Add multi-tenant data isolation
9. Create role management UI
10. Implement permission inheritance
11. Setup authentication integration (JWT/session)
12. Test RBAC with various scenarios

**Blocks:** EPIC 4 (Database), EPIC 2 (Frontend)

---

### **P2 - Medium Priority (Quality & DX)**

#### EPIC 10: Testing & Quality Assurance (finance-manager-3s8)

**Priority:** P2 | **Estimate:** 12-16 days
**Status:** ⏸️ Blocked by EPIC 2, EPIC 3, EPIC 4, EPIC 7

**Subtasks:**

1. Setup testing framework (Jest/Vitest for frontend, Go testing for backend)
2. Create test utilities and helpers
3. Write unit tests for EffectTS business logic
4. Write unit tests for Go backend services
5. Create integration tests for API endpoints
6. Setup Playwright for E2E testing
7. Write E2E tests for key flows (upload, categorization, statements)
8. Create performance test suite
9. Setup security testing automation
10. Create accessibility test suite
11. Configure test reporting and coverage
12. Integrate tests into CI/CD pipeline
13. Create test data fixtures and seed scripts

**Blocks:** EPIC 2, 3, 4 (Foundation), EPIC 7 (Accounting)

---

#### EPIC 11: Documentation & Developer Experience (finance-manager-677)

**Priority:** P2 | **Estimate:** 8-10 days
**Status:** ⏸️ Blocked by EPIC 1, EPIC 2, EPIC 3

**Subtasks:**

1. Create Architecture Decision Records (ADRs)
2. Document project structure and conventions
3. Generate OpenAPI/Swagger documentation
4. Create database ER diagrams
5. Document UI component library
6. Write setup and onboarding guide
7. Create deployment guide
8. Write contribution guidelines
9. Setup code style and linting (ESLint, golangci-lint)
10. Create VS Code workspace settings
11. Write troubleshooting guide
12. Create comprehensive README

**Blocks:** EPIC 1, 2, 3 (Infrastructure & Core)

---

## Dependency Graph

```
EPIC 1: Infrastructure & Deployment Setup (P0)
├── EPIC 2: Frontend Migration (P0)
│   ├── EPIC 5: Frontend Features (P1)
│   └── EPIC 9: RBAC & Multi-Entity (P1)
├── EPIC 3: Backend Migration (P0)
│   ├── EPIC 4: Database Schema (P0)
│   │   ├── EPIC 5: Frontend Features (P1)
│   │   ├── EPIC 6: Backend Data Processing (P1)
│   │   │   ├── EPIC 7: Accounting Engine (P1)
│   │   │   │   ├── EPIC 8: ML/AI System (P1)
│   │   │   │   └── EPIC 10: Testing (P2)
│   │   └── EPIC 9: RBAC & Multi-Entity (P1)
│   ├── EPIC 6: Backend Data Processing (P1)
│   ├── EPIC 10: Testing (P2)
│   └── EPIC 11: Documentation (P2)
└── EPIC 11: Documentation (P2)
```

---

## Milestones

### **MVP1: Foundation & Basic Functionality**

**Target:** Days 30-45
**Complete:** EPICs 1, 2, 3, 4

**Deliverables:**

- Infrastructure fully deployed (Workers + Containers)
- Frontend running on Astro with TanStack
- Backend running on Go
- Database schema implemented
- Basic CRUD operations working

---

### **MVP2: Core Features with Smart Processing**

**Target:** Days 60-90
**Complete:** EPICs 5, 6, 7

**Deliverables:**

- One-page data input interface
- File upload and parsing (PDF, CSV, OFX, QIF)
- OCR processing for receipts
- Double-entry accounting engine
- Financial statements (income, balance sheet, cash flow)
- Smart categorization

---

### **Full Product: AI & Multi-Entity**

**Target:** Days 120-150
**Complete:** EPICs 8, 9

**Deliverables:**

- ML models improving from user data
- Multi-entity support
- RBAC with configurable roles
- Anomaly detection
- Optimization suggestions
- Tax eligibility features

---

### **Production Ready: Quality & DX**

**Target:** Days 150-180
**Complete:** EPICs 10, 11

**Deliverables:**

- 90%+ test coverage
- E2E tests for key flows
- Performance and security testing
- Comprehensive documentation
- Developer onboarding guides
- Production deployment

---

## Current Status

**Ready to Start (99 issues):**

- ✅ EPIC 1: Infrastructure & Deployment Setup (8 subtasks)

**Blocked (10 EPICs):**

- ⏸️ EPIC 2-11 waiting on dependencies

---

## Next Steps

1. **Start with EPIC 1** (Infrastructure & Deployment Setup)
   - Begin with "Setup Cloudflare Workers + Containers infrastructure"
   - Work through subtasks sequentially

2. **Parallel Workstreams** (after EPIC 1 complete):
   - Team A: Frontend Migration (EPIC 2)
   - Team B: Backend Migration (EPIC 3)
   - Can run concurrently

3. **Feature Development** (after foundation complete):
   - Follow dependency graph for proper sequencing
   - Frontend features can start after EPIC 2
   - Backend features after EPIC 3 & 4

---

## Technical Highlights

### **Frontend Architecture**

- **Astro Beta 6:** Modern static-first framework with Deno runtime
- **EffectTS:** Type-safe business logic with composable effects
- **TanStack Router:** State-first routing with URL as state
- **TanStack Query:** Server state caching and synchronization
- **TanStack Store:** Client state management
- **TanStack Virtual:** Large dataset virtualization (10,000+ rows)

### **Backend Architecture**

- **Go 1.25:** Performance, simplicity, strong typing
- **Container Deployment:** Full binary deployment via Cloudflare Containers
- **Middleware Chain:** Auth, logging, CORS, recovery
- **Clean Architecture:** Repository pattern, service layer, domain logic

### **Data Architecture**

- **D1:** SQLite-compatible with read replicas, Time Travel
- **R2:** Object storage with SQL query engine
- **Vectorize:** Vector embeddings for semantic search
- **Double-Entry Accounting:** Medici-inspired pattern, IFRS 7 compliant

### **ML/AI Architecture**

- **OpenRouter:** Existing AI services integration
- **Workers AI:** OCR and document processing
- **Custom ML:** Categorization, anomaly detection, optimization
- **Feedback Loop:** Continuous model improvement
- **Privacy:** Anonymized data aggregation

---

## Risk Management

### **Technical Risks**

- **Container Deployment:** New Cloudflare Containers feature - mitigate with thorough testing
- **EffectTS Integration:** Learning curve - allocate extra time for team training
- **ML Model Accuracy:** Start with rule-based, iterate to ML

### **Dependency Risks**

- **Cloudflare Feature Availability:** Workers Containers in beta - monitor releases
- **Go WASM Limitations:** Use Containers for full Go capabilities
- **Vectorize Limits:** 10M vectors/index - plan for scaling

### **Timeline Risks**

- **Parallel Workstreams:** EPIC 2 & 3 can run concurrently after EPIC 1
- **Feature Complexity:** Accounting engine is complex - prioritize EPIC 7
- **ML Training:** Requires data - start with simple models, iterate

---

## Resources & Research

This plan leverages research from:

- **bg_2df1308a:** Current architecture analysis
- **bg_cd9ca592:** Cloudflare latest features
- **bg_7cfa6608:** Frontend tech stack (Astro, EffectTS, TanStack)
- **bg_99e2d336:** Finance app patterns (double-entry, parsing, ML)
- **bg_b9a79ba0:** Go and Deno best practices
- **bg_585a75a2:** Finance UI/UX patterns

---

## Commands

```bash
# View ready tasks
bd ready

# Show issue details
bd show <issue-id>

# Start working on task
bd update <issue-id> --status in_progress

# Complete task
bd close <issue-id>

# Check dependencies
bd blocked

# Sync changes
bd sync
```

---

## Summary

This comprehensive refactoring plan provides:

- ✅ **11 EPICs** covering all aspects of the migration
- ✅ **98 subtasks** for detailed execution
- ✅ **Clear priorities** (P0, P1, P2)
- ✅ **Proper dependencies** between workstreams
- ✅ **Milestones** for tracking progress
- ✅ **Technical details** for implementation
- ✅ **Risk management** strategies

**Ready to begin execution!** Start with EPIC 1 (Infrastructure & Deployment Setup).
