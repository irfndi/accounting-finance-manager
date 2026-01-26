# Strategic Decisions & Requirements for fin-in-flow Refactoring

## Executive Summary

This document captures all strategic decisions made before implementation begins. These decisions guide the entire refactoring project and ensure all requirements are met.

---

## 1. Dependency Management & Versioning Strategy

### User Decision: **Latest with Automated Testing**

**Strategy:**

- ✅ Always use latest versions of all dependencies
- ✅ Require passing test suite before adopting new version
- ✅ No version locking to exact versions (unless proven stable)
- ✅ Accept potential breaking changes from major updates
- ✅ Auto-upgrade when available (no waiting periods)

**Dependencies Covered:**

| Library                                             | Version Strategy                   | Breaking Change Handling                     |
| --------------------------------------------------- | ---------------------------------- | -------------------------------------------- |
| **Astro**                                           | Latest Beta 6                      | Accept breaking changes, migrate immediately |
| **EffectTS**                                        | Latest stable                      | Accept breaking changes, auto-upgrade        |
| **TanStack** (Router, Query, Store, Virtual, Table) | Latest                             | Accept breaking changes, migrate immediately |
| **Go**                                              | 1.25+ (latest)                     | Accept breaking changes, upgrade immediately |
| **Cloudflare**                                      | Latest Workers/Containers features | Harness all new features                     |

**Rationale:**

- Staying on latest ensures access to new Cloudflare features
- Test suite prevents regressions
- No "waiting periods" means faster innovation
- Breaking changes are opportunity to improve

**Implications:**

- Higher maintenance frequency
- Need robust automated testing
- Continuous migration guide updates
- Breaking change communication critical

---

## 2. Breaking Change Communication Strategy

### User Decision: **Changelog + Web-Based UI**

**Strategy:**

- ✅ Document all breaking changes in changelog
- ✅ Display changelog in web UI (users' dashboard, not email)
- ✅ Include in-app banners for critical changes
- ✅ Provide migration guides for each breaking version
- ✅ No email notifications (users access via web)

**Communication Channels:**

| Channel               | Purpose                             | Details                                         |
| --------------------- | ----------------------------------- | ----------------------------------------------- |
| **Changelog Page**    | Public-facing record of all changes | Searchable, filterable by version/date          |
| **Web UI Banners**    | Immediate in-app awareness          | Dismissible, context-aware (only show relevant) |
| **Migration Guides**  | Step-by-step upgrade instructions   | Integrated in docs site, linked from changelog  |
| **API Documentation** | Developer-facing breaking changes   | Updated automatically from changelog            |

**Rationale:**

- Users access everything via web interface (consistent with Astro-based UI)
- No email spam or notification fatigue
- Searchable changelog for historical context
- In-app banners ensure awareness

---

## 3. Cloudflare Feature Harnessing Strategy

### User Decision: **All New Features Immediately**

**Strategy:**

- ✅ Implement ALL new Cloudflare features immediately
- ✅ No selective implementation
- ✅ Harness full platform capabilities
- ✅ No "wait and see" approach

**Features to Implement:**

| Feature                     | Implementation Priority | Business Value                             |
| --------------------------- | ----------------------- | ------------------------------------------ |
| **R2 SQL Query Engine**     | P1                      | Query petabyte-scale financial data        |
| **D1 Read Replication**     | P1                      | Heavy query workloads, multi-region        |
| **D1 Time Travel**          | P1                      | Database restoration, disaster recovery    |
| **D1 Jurisdiction Support** | P1                      | Multi-region compliance (EU, US, APAC)     |
| **Vectorize 10M Vectors**   | P1                      | Document search, ML embeddings scale       |
| **Vectorize Namespaces**    | P1                      | Multi-tenant isolation                     |
| **KV Bulk Reads**           | P2                      | Session optimization, caching efficiency   |
| **Containers GA Features**  | P1                      | Rolling deployments, autoscaling, metrics  |
| **Workerd Runtime in Dev**  | P0                      | Same dev/prod runtime (already in Astro 6) |

**Rationale:**

- Maximum value from Cloudflare paid plan
- Competitive advantage using latest features
- No technical debt from deferred implementations
- Platform-native optimization

---

## 4. Dependency Update Frequency

### User Decision: **Automated Monthly Checks** (with manual interpretation: "automated montly?")

**Strategy:**

- ✅ Automated monthly dependency checks via Dependabot or Renovate
- ✅ GitHub PRs created automatically for updates
- ✅ Manual team review and approval cycle
- ✅ Security patches override monthly cycle (immediate deployment)

**Update Types:**

| Type                         | Frequency | Approval Process                  |
| ---------------------------- | --------- | --------------------------------- |
| **Minor/Patch Updates**      | Monthly   | Auto-approve after tests pass     |
| **Security Vulnerabilities** | Immediate | Bypass monthly cycle, deploy ASAP |
| **Major/Breaking Changes**   | Monthly   | Team review, risk assessment      |
| **Feature Updates**          | Monthly   | Evaluate value, decide timeline   |

**Tools:**

- **Dependabot**: Native GitHub integration, automatic PRs
- **Renovate**: Alternative if Dependabot insufficient
- **npm audit**: Runtime vulnerability checks
- **GitHub Dependabot Security**: Automated vulnerability scanning

**Rationale:**

- Balance automation with control
- Security patches addressed immediately
- Monthly review cycle manageable
- Prevents dependency rot

---

## 5. Security Vulnerability Scanning

### User Decision: **CI/CD Scanning (GitHub Actions)**

**Strategy:**

- ✅ Scan on each CI/CD run
- ✅ Fail builds on critical vulnerabilities
- ✅ Integration with GitHub Dependabot
- ✅ No manual review (fully automated)
- ✅ Block deployment if security issues found

**Scanning Tools:**

| Tool                  | Purpose                            | Integration                    |
| --------------------- | ---------------------------------- | ------------------------------ |
| **GitHub Dependabot** | Automated vulnerability scanning   | Native GitHub integration      |
| **Snyk** (optional)   | Deep vulnerability analysis        | GitHub Actions, PR comments    |
| **CodeQL**            | Code-level security analysis       | GitHub Actions, custom queries |
| **npm audit**         | Runtime dependency vulnerabilities | CI step, blocking              |

**Scanning Pipeline:**

```
1. Code Push → GitHub
2. GitHub Actions Triggered
3. Dependabot scans dependencies
4. CodeQL scans code patterns
5. If vulnerabilities found:
   → Fail build
   → Block PR merge
   → Notify team
   → Create fix PR automatically (if simple)
6. If no vulnerabilities:
   → Continue to tests
   → Pass security gate
   → Deploy
```

**Rationale:**

- Security-first approach
- Prevents vulnerable code from reaching production
- Automated, no human error
- Block deployment as safety net

---

## 6. Rollback Strategy

### User Decision: **Immediate (1-Click) Rollback**

**Strategy:**

- ✅ Use Cloudflare Workers automatic rollback
- ✅ No manual diagnosis before rollback
- ✅ Immediate rollback on failure detection
- ✅ Automatic health checks trigger rollback

**Rollback Triggers:**

| Trigger                             | Action                            | Timing         |
| ----------------------------------- | --------------------------------- | -------------- |
| **Health Check Failure**            | Auto-rollback to previous version | < 5 min        |
| **Error Rate Spike** (>5% errors)   | Auto-rollback to previous version | < 2 min        |
| **Critical Bug Report** (from user) | Auto-rollback to previous version | Manual trigger |
| **Deployment Failure**              | Deploy fails, auto-rollback       | Immediate      |
| **Monitoring Alert** (P3/P4 alerts) | Team decision to rollback         | Manual         |

**Cloudflare Workers Rollback:**

```bash
# Cloudflare supports automatic rollback
wrangler rollback

# Or via Alchemy IaC
alchemy rollback --env production

# Rollback history (last 10 deployments)
wrangler rollback --count 3  # Rollback 3 versions
```

**Rationale:**

- Minimize downtime
- No human decision delay
- Health checks as fail-fast
- Multiple rollback history for flexibility

---

## 7. Migration Guide Templates

### User Decision: **Yes, Create Migration Guide Templates**

**Strategy:**

- ✅ Templates for user-facing migration guides
- ✅ Steps to upgrade from version N to N+1
- ✅ Include breaking changes, new features, deprecated features
- ✅ Integrated with web-based changelog

**Migration Guide Template:**

````markdown
# Migrating from v1.0.0 to v1.1.0

## Breaking Changes ⚠️

- [List all breaking changes]
- Provide migration steps for each

## New Features ✨

- [List new features]
- Highlight major improvements

## Deprecated Features 🗑️

- [List features being removed]
- Provide alternatives

## Migration Steps

1. [Step 1: Backup data]
2. [Step 2: Update dependencies]
3. [Step 3: Run migrations]
4. [Step 4: Verify functionality]
5. [Step 5: Update documentation]

## Rollback Plan

If migration fails, rollback to v1.0.0:

```bash
# UI: Click "Rollback" button in settings
# Or manually:
wrangler rollback --version v1.0.0
```
````

## Support

If you encounter issues:

- [Link to support page]
- [Link to documentation]

````

**Rationale:**
- Reduces support burden
- Empowers users to self-serve
- Clear expectation setting
- Linked from changelog for discoverability

---

## 8. Feature Flag System

### User Decision: **Yes, Implement for Gradual Rollout**

**Strategy:**
- ✅ Feature flags for testing new features
- ✅ Gradual rollout to small user groups first
- ✅ Monitoring dashboard for flag usage
- ✅ Kill switch for breaking changes

**Feature Flag Use Cases:**

| Scenario | Flag Strategy |
|---------|--------------|
| **Breaking Changes** | Roll out to 10% → monitor → 50% → 100% |
| **New Features** | Roll out to beta users → monitor → all users |
| **Experimental Features** | Opt-in via settings page |
| **Bug Fixes** | Roll out to affected users only |
| **Performance Impact** | A/B test with flag: enabled/disabled |

**Implementation:**

```typescript
// Worker-side flag check
import { getFeatureFlag } from "./lib/feature-flags";

app.get("/api/new-feature", async (c) => {
  const flag = await getFeatureFlag("new-financial-calculation");

  if (!flag.enabled) {
    return c.json({ message: "Feature not available" }, 404);
  }

  // Proceed with new feature
  const result = await newFinancialCalculation(req.data);

  // Track flag usage
  await trackFlagUsage(flag.id, c.req.user.id);

  return c.json(result);
});
````

**Monitoring Dashboard:**

- Flag enablement rate per user group
- Error rates by flag status
- Performance impact comparison
- Feature adoption rate

**Rationale:**

- Mitigates risk of breaking changes
- Enables gradual rollout and monitoring
- Kill switch for immediate problem resolution
- A/B testing for optimization

---

## 9. Architecture Decision: Hybrid Worker + Container

### Decision: **Hybrid Architecture (Option B)**

**Confirmed:**

- ✅ Worker (Hono/TypeScript): Auth, routing, edge logic, simple CRUD
- ✅ Container (Go): Financial calculations, heavy processing, statement generation
- ✅ Single entry point: All traffic via Worker
- ✅ HTTP fetch pattern: Worker → Container for heavy operations
- ✅ Queue system: Prevent hitting 100 vCPU limit
- ✅ Instance management: max_instances: 20, sleepAfter: 10m

**See:** `docs/workers-containers-architecture.md` for full details

---

## 10. Container Limits Strategy

### Confirmed Constraints:\*\*

| Resource         | Limit   | Allocation Strategy                      |
| ---------------- | ------- | ---------------------------------------- |
| **Total Memory** | 400 GiB | 20 instances × 20 GiB (standard-3)       |
| **Total vCPU**   | 100     | 20 instances × 1-2 vCPU = 20-40 vCPU max |
| **Total Disk**   | 2 TB    | 20 instances × 100 GB average = 2TB      |

**Instance Types:**

- **lite (256 MiB)**: Simple Container calls
- **standard-1 (4 GiB)**: Financial calculations
- **standard-2 (6 GiB)**: Bank statement parsing
- **standard-3 (8 GiB)**: PDF/OCR processing
- **standard-4 (12 GiB)**: Maximum performance batch jobs

**See:** `docs/containers-limits-and-optimization.md` for full details

---

## Summary of Added Requirements

Based on user decisions, following tasks have been added to plan:

### New Tasks Created (16 tasks):

| ID                  | Title                                           | Priority |
| ------------------- | ----------------------------------------------- | -------- |
| finance-manager-733 | Setup automated dependency monitoring           | P1       |
| finance-manager-69m | Implement latest version strategy with testing  | P0       |
| finance-manager-y4i | Create changelog process and web UI             | P2       |
| finance-manager-6sf | Implement all new Cloudflare features           | P1       |
| finance-manager-jse | Setup automated monthly dependency reviews      | P2       |
| finance-manager-bt6 | Implement CI/CD security vulnerability scanning | P0       |
| finance-manager-0bn | Implement immediate 1-click rollback            | P0       |
| finance-manager-y24 | Create migration guide templates                | P2       |
| finance-manager-4qm | Implement feature flag system                   | P1       |
| finance-manager-omo | Setup D1 read replication and Time Travel       | P1       |
| finance-manager-xbt | Enable R2 SQL query engine                      | P1       |
| finance-manager-caa | Configure Vectorize 10M vectors and namespaces  | P1       |
| finance-manager-916 | Implement KV bulk reads optimization            | P2       |
| finance-manager-5qz | Configure D1 jurisdiction support               | P1       |
| finance-manager-bi5 | Enable Containers GA features                   | P1       |
| finance-manager-0zj | Create web-based changelog and documentation UI | P2       |

---

## Final Plan Statistics

| Metric           | Count                                                       |
| ---------------- | ----------------------------------------------------------- |
| **Total Issues** | 143 → **159** (+16 new)                                     |
| **EPICs**        | 11                                                          |
| **Ready Tasks**  | 121 → **137** (+16 new)                                     |
| **P0 Tasks**     | 5 (critical: version strategy, security scanning, rollback) |
| **P1 Tasks**     | 8 (dependency monitoring, CF features, feature flags)       |
| **P2 Tasks**     | 3 (changelog, monthly reviews, migration guides)            |

---

## Next Steps for Implementation

1. **Start with P0 tasks:**
   - `finance-manager-69m` - Implement latest version strategy
   - `finance-manager-bt6` - Implement CI/CD security scanning
   - `finance-manager-0bn` - Implement immediate rollback

2. **Follow with P1 tasks:**
   - `finance-manager-6sf` - Implement all new Cloudflare features
   - `finance-manager-4qm` - Implement feature flag system
   - `finance-manager-733` - Setup automated dependency monitoring

3. **Enable Cloudflare features:**
   - D1 read replication and Time Travel
   - R2 SQL query engine
   - Vectorize 10M vectors
   - D1 jurisdiction support
   - Containers GA features

4. **Build communication:**
   - Web-based changelog UI
   - Migration guide templates
   - In-app banner system

---

## Document References

- `docs/workers-containers-architecture.md` - Hybrid architecture pattern
- `docs/containers-limits-and-optimization.md` - Container limits and strategies
- `docs/refactoring-plan.md` - Complete refactoring plan
- `docs/strategic-decisions.md` - This document (for reference)

---

**All strategic decisions captured. Ready to begin implementation.** ✅
