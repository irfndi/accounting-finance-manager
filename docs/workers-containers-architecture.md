# Workers + Containers Architecture for fin-in-flow

## Architecture Overview

### Understanding the Pattern

Cloudflare **Workers + Containers** is NOT two separate backends. It's a **single unified architecture** where:

```
┌─────────────────────────────────────────────────┐
│        Cloudflare Worker (Entry Point)        │
│  - Hono/TypeScript for edge logic           │
│  - Request routing and validation            │
│  - Authentication & authorization             │
│  - R2 upload/download                     │
│  - Cloudflare AI/Vectorize API calls         │
│  - KV caching                             │
└────────────────┬────────────────────────────────┘
                 │ HTTP fetch()
                 ▼
┌─────────────────────────────────────────────────┐
│   Durable Object (Container Binding)         │
│  - Extends Container class                │
│  - Manages Container instance lifecycle        │
│  - Stateful (per-instance)                │
└────────────────┬────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────┐
│         Go Container (Service)               │
│  - Handles intensive computation             │
│  - Financial calculations                   │
│  - Heavy data processing                  │
│  - Long-running tasks                    │
└─────────────────────────────────────────────────┘
```

### Key Points

1. **Single Entry Point**: All traffic enters via the Worker
2. **Container as Binding**: The Container is a resource binding that the Worker can call
3. **HTTP Communication**: Worker communicates with Container via `fetch()` - standard HTTP
4. **Stateful**: Each Container instance is addressable and maintains state
5. **Not Two Backends**: Worker and Container are parts of ONE unified system

---

## Architecture Options for fin-in-flow

### Option A: Pure Go (Everything in Container)

```
Worker (minimal) ──→ Go Container (everything)

- Worker: Just forwards requests to Container
- Container: All logic (auth, validation, calculations, parsing)
```

**Pros:**

- Simpler codebase (one language: Go)
- Consistent error handling and patterns
- Full Go performance benefits

**Cons:**

- Container has cold starts (2-3 seconds)
- No edge-first logic optimization
- Overkill for simple CRUD operations

**Best For:**

- Purely computational workloads
- When every request needs heavy processing

---

### Option B: Hybrid (Worker + Container) ⭐ **RECOMMENDED**

```
Worker (Hono/TypeScript) ──┬───→ Handle: Auth, routing, edge logic
                              │
                              ├───→ Container (Go): Heavy computation
                              │       - Financial calculations
                              │       - Bank statement parsing
                              │       - PDF processing
                              │
                              └───→ Direct: Cloudflare services
                                      - R2 upload/download
                                      - KV caching
                                      - AI/Vectorize API calls
```

**Worker Responsibilities:**

- ✅ Authentication/Authorization (JWT validation, magic links)
- ✅ Request routing (Hono router)
- ✅ Input validation (Zod schemas)
- ✅ R2 file operations (upload/download)
- ✅ KV caching (session storage)
- ✅ Cloudflare AI API calls (categorization suggestions)
- ✅ Vectorize API calls (document search, embeddings)
- ✅ Simple CRUD operations (via D1)
- ✅ Response formatting and error handling

**Container (Go) Responsibilities:**

- ✅ Double-entry accounting calculations (precision-critical)
- ✅ Financial statement generation (intensive computation)
- ✅ Bank statement parsing (CSV, PDF, OFX, QIF)
- ✅ Receipt/invoice OCR processing (heavy computation)
- ✅ Large dataset aggregations
- ✅ Complex business logic (multi-entity RBAC, tax calculations)

**Pros:**

- Fast edge routing (Worker has ~50ms response for simple requests)
- Cold start isolation (only Container has cold starts)
- Right tool for each job (TypeScript for edge, Go for computation)
- Leverage Cloudflare's edge capabilities directly from Worker

**Cons:**

- More complex codebase (two languages)
- Need to define clear Worker vs Container responsibilities
- HTTP communication overhead for Container calls

**Best For:**

- Mixed workloads (simple edge requests + heavy computation)
- When edge speed matters for common operations
- Applications using multiple Cloudflare services (R2, KV, AI, Vectorize)

---

### Option C: Minimal Go (Container Only for Specific Tasks)

```
Worker (Hono/TypeScript) ──┬───→ Most logic in Worker
                              │
                              └───→ Container (Go): Only for heaviest tasks
                                      - Batch financial calculations
                                      - Heavy PDF parsing
```

**Pros:**

- Minimizes Container usage (fewer cold starts)
- Worker handles most requests (fast)
- Go only when absolutely needed

**Cons:**

- Still two languages
- Complex to decide what goes where
- May need to refactor later as workload changes

**Best For:**

- When heavy computation is rare
- Want to minimize Container cold starts

---

## Recommendation for fin-in-flow

### Choose **Option B: Hybrid Architecture**

**Rationale:**

| Feature                       | Best Location | Reason                                                |
| ----------------------------- | ------------- | ----------------------------------------------------- |
| **Authentication**            | Worker        | Fast, edge-optimized, can use KV for sessions         |
| **Routing/Validation**        | Worker        | Simple, no computation needed                         |
| **File Upload/Download**      | Worker        | Direct R2 access, no need for Container               |
| **AI/Vectorize Calls**        | Worker        | Edge API calls, faster response                       |
| **Simple CRUD**               | Worker        | Direct D1 access, ~50ms response                      |
| **Double-Entry Calculations** | Container     | Precision-critical, benefits from Go decimal packages |
| **Financial Statements**      | Container     | Intensive computation, complex aggregations           |
| **Bank Statement Parsing**    | Container     | Heavy processing, complex parsing logic               |
| **PDF/OCR Processing**        | Container     | Computationally expensive                             |

### Estimated Performance

**With Hybrid Architecture:**

- **Edge requests** (auth, simple CRUD): ~50-100ms response
- **Container requests** (calculations, parsing): 2-3s cold start + processing time
- **Overall experience**: Fast for 80% of requests, acceptable for heavy operations

### Implementation Pattern

```typescript
// Worker (Hono)
import { getContainer } from "@cloudflare/containers";

const app = new Hono();

app.post("/api/transactions", async (c) => {
  // 1. Worker: Auth validation
  const user = await validateJWT(c.req.header("Authorization"));

  // 2. Worker: Request validation
  const data = await c.req.json();
  validateTransaction(data);

  // 3. Worker: Simple case (no heavy computation)
  if (isSimpleTransaction(data)) {
    await db.insert(data);
    return c.json({ success: true });
  }

  // 4. Container: Heavy case (needs Go calculations)
  const container = getContainer(env.FINANCE_CONTAINER, user.id);
  const result = await container.fetch(
    new Request("http://container/process-transaction", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  );

  return c.json(await result.json());
});

export default app;
```

```go
// Container (Go)
package main

import (
    "net/http"
    "encoding/json"
    "github.com/govalues/decimal"
)

type TransactionProcessor struct{}

func (t *TransactionProcessor) ServeHTTP(w http.ResponseWriter, r *http.Request) {
    var req TransactionRequest
    json.NewDecoder(r.Body).Decode(&req)

    // Go: Precise decimal calculations
    debit := decimal.New(req.Debit, 2)
    credit := decimal.New(req.Credit, 2)
    balance := debit.Sub(credit)

    // Go: Financial statement generation
    statements := generateFinancialStatements(req.AccountID)

    result := map[string]interface{}{
        "balance": balance.String(),
        "statements": statements,
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(result)
}

func main() {
    http.ListenAndServe(":8080", &TransactionProcessor{})
}
```

---

## Tasks to Update the Plan

Based on this architectural decision, the following tasks have been added to the plan:

1. **finance-manager-pmx** (P0): Review and document Workers + Containers architecture pattern
2. **finance-manager-gw7** (P0): Define Worker vs Container responsibilities
3. **finance-manager-vkd** (P0): Update Backend Migration EPIC with hybrid approach
4. **finance-manager-ueq** (P1): Setup Worker-Container communication (HTTP fetch pattern)
5. **finance-manager-x1f** (P1): Add Worker-layer tasks (auth, routing, edge logic)
6. **finance-manager-0px** (P1): Add Container-layer tasks (financial calculations, processing)
7. **finance-manager-tt9** (P2): Add architectural decision documentation
8. **finance-manager-a64** (P2): Create architecture diagrams

---

## Next Steps

1. **Start with P0 task**: `finance-manager-pmx` - Review and document architecture
2. **Define responsibilities**: `finance-manager-gw7` - Which logic goes where
3. **Update backend tasks**: `finance-manager-vkd` - Reflect hybrid approach
4. **Implement Worker-Container comms**: `finance-manager-ueq` - HTTP fetch pattern
5. **Create diagrams**: `finance-manager-a64` - Visual documentation

---

**Conclusion: Hybrid architecture provides the best balance for fin-in-flow's mixed workload of edge operations and heavy financial computation.**
