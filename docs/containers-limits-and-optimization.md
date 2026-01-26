# Cloudflare Containers Limits & Constraints for fin-in-flow

## Global Limits (Workers Paid Account)

| Resource          | Limit                              | Implications for fin-in-flow                        |
| ----------------- | ---------------------------------- | --------------------------------------------------- |
| **Total Memory**  | 400 GiB (all concurrent instances) | Heavy calculations need efficient memory usage      |
| **Total vCPU**    | 100 (all concurrent instances)     | Limited concurrent heavy operations                 |
| **Total Disk**    | 2 TB (all concurrent instances)    | Bank statements, PDFs, receipts stored in Container |
| **Image Storage** | 50 GB per account                  | Manage old images to avoid hitting limit            |

---

## Instance Types Available

| Instance Type  | vCPU | Memory  | Disk  | Best For                                 |
| -------------- | ---- | ------- | ----- | ---------------------------------------- |
| **lite**       | 1/16 | 256 MiB | 2 GB  | Simple operations, minimal cost          |
| **basic**      | 1/4  | 1 GiB   | 4 GB  | Low-computation tasks                    |
| **standard-1** | 1/2  | 4 GiB   | 8 GB  | **Financial calculations** (RECOMMENDED) |
| **standard-2** | 1    | 6 GiB   | 12 GB | Bank statement parsing, PDF processing   |
| **standard-3** | 2    | 8 GiB   | 16 GB | Heavy computation, large datasets        |
| **standard-4** | 4    | 12 GiB  | 20 GB | Maximum performance                      |

**Custom Instance Constraints:**

- Min vCPU: 1
- Max vCPU: 4
- Max Memory: 12 GiB
- Max Disk: 20 GB
- Memory to vCPU ratio: Minimum 3 GiB memory per vCPU
- Disk to Memory ratio: Maximum 2 GB disk per 1 GiB memory

---

## Recommended Instance Types for fin-in-flow

### Worker (Hono/TypeScript)

- **No Container limits apply** (runs on Workers runtime)
- Fast, always warm (~50ms response time)
- Handles: Auth, routing, simple CRUD, edge logic

### Container (Go) - Instance Allocation

| Use Case                   | Instance Type       | Reason                                          |
| -------------------------- | ------------------- | ----------------------------------------------- |
| **Simple Calculations**    | lite or basic       | Low resource needs, fast response               |
| **Financial Statements**   | standard-1 (4 GiB)  | Moderate computation, memory for data           |
| **Bank Statement Parsing** | standard-2 (6 GiB)  | Heavy processing, needs memory for large files  |
| **PDF/OCR Processing**     | standard-3 (8 GiB)  | Computationally expensive, benefits from 2 vCPU |
| **Batch Jobs**             | standard-4 (12 GiB) | Maximum performance for large datasets          |

---

## Concurrency Strategy

### Challenge

- **100 vCPU total limit** for all concurrent instances
- If 20 users request financial statements simultaneously (each needs 1 vCPU), they're all queued
- High load = throttling or failures

### Solutions

#### 1. Queue System (Worker-Based)

```
Worker (Hono) handles incoming requests
  ↓
Worker queues heavy tasks in Durable Object or KV
  ↓
Worker processes queue with max concurrency control
  ↓
Container (Go) instances process jobs at controlled rate
```

**Benefits:**

- Never exceed 100 vCPU limit
- Fair job scheduling
- Can prioritize jobs (user tier, urgency)

#### 2. Instance Management

```typescript
// wrangler.jsonc configuration
{
  "containers": [{
    "class_name": "FinanceContainer",
    "image": "./Dockerfile",
    "max_instances": 20,  // Control concurrent instances
    "sleepAfter": "10m"     // Shutdown idle after 10 min
  }]
}
```

**Strategy:**

- **max_instances**: 20 (20% of vCPU limit, leaving buffer for other instances)
- **sleepAfter**: 5-10 minutes (balance cost vs responsiveness)
- **Result**: Only 20 financial calculations can run simultaneously, others queue

#### 3. Pre-Warming

```
Worker schedules pre-warm tasks during low-traffic periods
  ↓
Container instances start and cache common data
  ↓
When user requests, Container already warm (~50ms response)
```

**What to Pre-Warm:**

- Common account balances
- Cached financial statement templates
- Frequently accessed entities

---

## Cost Optimization

### Container Cost Factors

| Factor                | Impact                 | Optimization                             |
| --------------------- | ---------------------- | ---------------------------------------- |
| **vCPU usage**        | Direct cost impact     | Use Worker for 80% of requests           |
| **Memory allocation** | Direct cost impact     | Choose smallest sufficient instance type |
| **Running time**      | Direct cost impact     | Aggressive `sleepAfter` (5 min)          |
| **Cold starts**       | Poor UX, but same cost | Pre-warm strategies, caching             |

### Recommended Strategy

```
Request → Worker Decision:
  ├─ Simple (auth, CRUD)? → Handle in Worker (fast, no Container)
  ├─ Heavy (calculations)? → Check for cached result in KV
  │    ├─ Cached? → Return immediately (~50ms)
  │    └─ Not cached? → Queue job in Durable Object
  │        ↓
  │     Container processes job
  │        ↓
  │     Worker updates KV cache
  └─ User receives response
```

**Cost Benefits:**

- 80% of requests never hit Container (Worker only)
- Heavy operations benefit from Go performance
- KV cache reduces redundant Container calls
- Queue prevents hitting vCPU limits

---

## Specific Limits Impact on fin-in-flow Features

### Double-Entry Accounting

```
✅ Fits in standard-1 (4 GiB)
✅ Single vCPU sufficient for typical calculations
✅ Cache intermediate results in KV
```

### Financial Statement Generation

```
⚠️ Heavy computation
→ Use standard-2 (6 GiB) or standard-3 (8 GiB)
→ Process in batches if 1000+ accounts
→ Queue system prevents 100 vCPU limit
```

### Bank Statement Parsing

```
⚠️ Very heavy (CSV, PDF, OFX, QIF)
→ Use standard-3 (8 GiB) for large statements
→ Implement progress reporting (long-running jobs)
→ Batch process multiple statements together
```

### Receipt/Invoice OCR

```
⚠️ Computationally expensive
→ Use standard-4 (12 GiB) if many images
→ Limit concurrent OCR jobs (max 10 instances)
→ Cache results in R2
```

---

## Monitoring Requirements

### Must Track

| Metric              | Alert Threshold         | Action                                          |
| ------------------- | ----------------------- | ----------------------------------------------- |
| **Concurrent vCPU** | > 80 (80% of 100 limit) | Scale down requests, implement queue throttling |
| **Memory Usage**    | > 320 GiB (80% of 400)  | Release cached data, optimize algorithms        |
| **Disk Usage**      | > 1.6 TB (80% of 2TB)   | Clean up temporary files, archive old data      |
| **Cold Start Rate** | > 50% (high churn)      | Adjust `sleepAfter`, implement pre-warming      |

### Recommended Tools

- **Cloudflare Dashboard**: Real-time monitoring
- **Wrangler metrics**: `wrangler containers metrics`
- **Custom metrics**: Track per-instance resource usage
- **Cost alerts**: Monthly spend notifications

---

## Architecture Decision Reinforcement

Based on limits, **Hybrid Architecture (Option B)** remains **HIGHLY RECOMMENDED**:

### Why Hybrid Still Best

| Architecture   | Container Hits   | vCPU Impact                   | UX Impact                          |
| -------------- | ---------------- | ----------------------------- | ---------------------------------- |
| **Pure Go**    | 100% of requests | ⚠️ Hit 100 vCPU limit quickly | ⚠️ Slow cold starts for simple ops |
| **Hybrid**     | ~20% of requests | ✅ Well under limits          | ✅ Fast for 80% of requests        |
| **Minimal Go** | ~5% of requests  | ✅ Minimal vCPU usage         | ✅ Mostly fast, some slow          |

### Final Recommendation

**Hybrid with Queue System:**

1. **Worker**: Handles 80% (auth, routing, simple CRUD)
2. **KV Cache**: Reduces Container calls by 40%
3. **Queue System**: Manages Container concurrency (max 20 instances)
4. **Container**: Handles heavy operations (financial calculations, parsing)
5. **Monitoring**: Alerts at 80% of limits (80 vCPU, 320 GiB memory)

---

## Tasks Added to Plan

1. **finance-manager-d0q** (P0): Review Container limits and configure instance types
2. **finance-manager-9ir** (P1): Design queue system for heavy calculations
3. **finance-manager-ad5** (P1): Implement Container instance management
4. **finance-manager-rxd** (P2): Add Container cost monitoring and alerting
5. **finance-manager-lrv** (P1): Implement batch processing for statements
6. **finance-manager-trz** (P1): Add Container cold start optimization
7. **finance-manager-682** (P2): Document Container usage patterns and best practices

---

## Next Steps

1. **Start with P0**: `finance-manager-d0q` - Configure instance types
2. **Design queue**: `finance-manager-9ir` - Prevent hitting limits
3. **Implement monitoring**: `finance-manager-rxd` - Alert at 80% threshold
4. **Optimize cold starts**: `finance-manager-trz` - Pre-warming strategies
5. **Document patterns**: `finance-manager-682` - Team guidelines

---

**Conclusion: Container limits reinforce Hybrid architecture decision. Queue system, instance management, and monitoring are critical for production success.**
