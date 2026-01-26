import { describe, it, expect, beforeEach, vi } from "vitest";
import { Hono } from "hono";

// Mock the validation functions
vi.mock("../../src/lib/index.worker", () => ({
  DatabaseAdapter: class {
    constructor() {}
    getAccount() {
      return null;
    }
    createAccount() {
      return null;
    }
    updateAccount() {
      return null;
    }
  },
  DatabaseAccountRegistry: class {
    constructor() {}
    loadAccountsFromDatabase() {
      return Promise.resolve();
    }
    getAllAccounts() {
      return [];
    }
    getAccountsByTypeFromDatabase() {
      return Promise.resolve([]);
    }
    registerAccount() {}
  },
  FINANCIAL_CONSTANTS: {
    DEFAULT_CURRENCY: "USD",
    SUPPORTED_CURRENCIES: ["USD", "EUR", "GBP"],
  },
  getNormalBalance: (type: string) => {
    const balances: Record<string, string> = {
      ASSET: "DEBIT",
      LIABILITY: "CREDIT",
      EQUITY: "CREDIT",
      REVENUE: "CREDIT",
      EXPENSE: "DEBIT",
    };
    return balances[type] || "DEBIT";
  },
  formatCurrency: (val: number) => `$${val}`,
  AccountingValidationError: class extends Error {
    code: string;
    details?: any;
    constructor(message: string, code: string, details?: any) {
      super(message);
      this.code = code;
      this.details = details;
    }
  },
}));

vi.mock("../../src/worker/middleware/auth", () => ({
  authMiddleware: async (c: any, next: any) => {
    // Basic mock that passes if auth header is present
    const auth = c.req.header("Authorization");
    if (!auth || auth !== "Bearer valid-token") {
      return c.json({ error: "Invalid token" }, 401);
    }
    await next();
  },
}));

// Import the router
import accountsRouter from "../../src/worker/routes/api/accounts";

describe("Account API Endpoints", () => {
  let app: Hono<any>;
  let mockDatabase: any;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Create a mock D1 database
    mockDatabase = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnThis(),
        all: vi.fn().mockResolvedValue({ results: [] }),
        first: vi.fn().mockResolvedValue(null),
        run: vi.fn().mockResolvedValue({ success: true }),
      }),
      exec: vi.fn().mockResolvedValue({ results: [] }),
    };

    // Setup Hono app with the router
    app = new Hono();
    // Inject mock env
    app.use("*", async (c, next) => {
      c.env = { FINANCE_MANAGER_DB: mockDatabase };
      await next();
    });
    app.route("/accounts", accountsRouter);
  });

  describe("POST /accounts", () => {
    it("should return 400 for missing required fields", async () => {
      const res = await app.request("/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer valid-token",
        },
        body: JSON.stringify({
          code: "",
          name: "",
          type: "",
        }),
      });

      expect(res.status).toBe(400);
      const data = (await res.json()) as any;
      // The validator returns generic "VALIDATION_ERROR" code but also specific error messages
      expect(data.code).toBe("VALIDATION_ERROR");
    });

    it("should return 401 for invalid token", async () => {
      const res = await app.request("/accounts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer invalid-token",
        },
        body: JSON.stringify({
          code: "1000",
          name: "Test Account",
          type: "ASSET",
        }),
      });

      expect(res.status).toBe(401);
      const data = (await res.json()) as any;
      expect(data.error).toBe("Invalid token");
    });
  });

  describe("GET /accounts", () => {
    it("should return accounts list", async () => {
      // Mock registry getAllAccounts via the module mock we defined at top
      // Note: In a real integration test we'd mock the DB response more deeply,
      // but here we are primarily testing the route handler logic.
      // Since we mocked the library classes to return empty arrays, we expect empty result.

      const res = await app.request("/accounts", {
        method: "GET",
        headers: {
          Authorization: "Bearer valid-token",
        },
      });

      expect(res.status).toBe(200);
      const data = (await res.json()) as any;
      expect(data).toHaveProperty("accounts");
      expect(Array.isArray(data.accounts)).toBe(true);
    });

    it("should return 401 for invalid token", async () => {
      const res = await app.request("/accounts", {
        method: "GET",
        headers: {
          Authorization: "Bearer invalid-token",
        },
      });

      expect(res.status).toBe(401);
    });
  });
});
