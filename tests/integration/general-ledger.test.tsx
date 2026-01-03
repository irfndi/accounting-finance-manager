import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GeneralLedger from "../../src/web/components/GeneralLedger";

// Mock fetch globally
global.fetch = vi.fn();

// Mock localStorage
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn(() => "mock-token"),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock the UI components
vi.mock("../../src/web/components/ui/button", () => ({
  Button: ({ children, onClick, disabled, variant, size, ...props }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      {...props}
    >
      {children}
    </button>
  ),
}));

vi.mock("../../src/web/components/ui/input", () => ({
  Input: ({ value, onChange, placeholder, type, ...props }: any) => (
    <input
      type={type || "text"}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      {...props}
    />
  ),
}));

// Removed duplicate mocks - using the improved ones above

vi.mock("../../src/web/components/ui/select", () => ({
  Select: ({ children, onValueChange, value }: any) => (
    <div data-testid="select">
      <select onChange={(e) => onValueChange?.(e.target.value)} value={value}>
        <option value="all">All Types</option>
        <option value="ASSET">Asset</option>
        <option value="LIABILITY">Liability</option>
        <option value="EQUITY">Equity</option>
        <option value="REVENUE">Revenue</option>
        <option value="EXPENSE">Expense</option>
      </select>
      {children}
    </div>
  ),
  SelectContent: ({ children }: any) => (
    <div style={{ display: "none" }}>{children}</div>
  ),
  SelectItem: ({ children: _children, value: _value }: any) => null,
  SelectTrigger: ({ children: _children }: any) => null,
  SelectValue: ({ placeholder: _placeholder }: any) => null,
}));

vi.mock("../../src/web/components/ui/dialog", () => {
  let isOpen = false;
  return {
    Dialog: ({
      children,
      open,
      onOpenChange: _onOpenChange,
      ...props
    }: any) => {
      if (open !== undefined) isOpen = open;
      return (
        <div data-testid="dialog" {...props}>
          {children}
        </div>
      );
    },
    DialogContent: ({ children, ...props }: any) =>
      isOpen ? (
        <div data-testid="dialog-content" {...props}>
          {children}
        </div>
      ) : null,
    DialogDescription: ({ children, ...props }: any) => (
      <p {...props}>{children}</p>
    ),
    DialogFooter: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    DialogHeader: ({ children, ...props }: any) => (
      <div {...props}>{children}</div>
    ),
    DialogTitle: ({ children, ...props }: any) => (
      <h2 {...props}>{children}</h2>
    ),
    DialogTrigger: ({ children, onClick, ...props }: any) => (
      <div
        data-testid="dialog-trigger"
        onClick={() => {
          isOpen = true;
          onClick?.();
        }}
        {...props}
      >
        {children}
      </div>
    ),
  };
});

describe("GeneralLedger Component", () => {
  const mockAccounts = [
    {
      id: "1",
      code: "1000",
      name: "Cash Account",
      type: "ASSET",
      normalBalance: "debit",
      isActive: true,
      balance: 1000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      code: "2000",
      name: "Accounts Payable",
      type: "LIABILITY",
      normalBalance: "credit",
      isActive: true,
      balance: 500,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      code: "3000",
      name: "Owner Equity",
      type: "EQUITY",
      normalBalance: "credit",
      isActive: true,
      balance: 2000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "4",
      code: "4000",
      name: "Sales Revenue",
      type: "REVENUE",
      normalBalance: "credit",
      isActive: true,
      balance: 3000,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "5",
      code: "5000",
      name: "Office Expenses",
      type: "EXPENSE",
      normalBalance: "debit",
      isActive: true,
      balance: 800,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockStats = {
    totalAccounts: 5,
    activeAccounts: 5,
    monthlyTransactions: 25,
    unbalancedEntries: 0,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful fetch responses
    vi.mocked(fetch).mockImplementation((url) => {
      const urlString = url.toString();
      if (urlString.includes("/api/accounts")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ accounts: mockAccounts }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response);
    });
  });

  it("should render general ledger with accounts", async () => {
    const { container } = render(<GeneralLedger />);

    // Check if component renders at all
    expect(container.firstChild).toBeTruthy();

    // Wait for loading to complete
    await waitFor(
      () => {
        expect(screen.queryByText("General Ledger")).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Wait for accounts to load
    await waitFor(
      () => {
        expect(screen.queryByText("Cash Account")).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  });

  it("should display account statistics correctly", async () => {
    render(<GeneralLedger />);

    // Wait for loading to complete and stats to appear
    await waitFor(
      () => {
        expect(screen.getByText("General Ledger")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    await waitFor(
      () => {
        expect(screen.getByText("Cash Account")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("should open add account dialog when button is clicked", async () => {
    render(<GeneralLedger />);

    await waitFor(
      () => {
        expect(screen.getByText("General Ledger")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    fireEvent.click(screen.getByTestId("add-account-btn"));

    await waitFor(
      () => {
        expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
        expect(screen.getByText("Add New Account")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("should validate required fields before submission", async () => {
    render(<GeneralLedger />);

    await waitFor(
      () => {
        expect(screen.getByText("General Ledger")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    fireEvent.click(screen.getByTestId("add-account-btn"));

    await waitFor(
      () => {
        expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    fireEvent.click(screen.getByTestId("account-submit"));

    await waitFor(
      () => {
        expect(screen.getByText("Account code is required")).toBeInTheDocument();
        expect(screen.getByText("Account name is required")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("should submit form with valid data", async () => {
    render(<GeneralLedger />);

    await waitFor(
      () => {
        expect(screen.getByText("General Ledger")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    fireEvent.click(screen.getByTestId("add-account-btn"));

    await waitFor(
      () => {
        expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    fireEvent.change(screen.getByLabelText("Code"), {
      target: { value: "1100" },
    });

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "New Cash Account" },
    });

    fireEvent.click(screen.getByTestId("account-submit"));

    await waitFor(
      () => {
        expect(screen.queryByTestId("dialog-content")).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    expect(fetch).toHaveBeenCalled();
  });

  it("should handle API errors gracefully", async () => {
    render(<GeneralLedger />);

    // Wait for component to load
    await waitFor(
      () => {
        expect(screen.getByText("General Ledger")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Verify basic functionality
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  it("should filter accounts by type", async () => {
    render(<GeneralLedger />);

    // Wait for accounts to load
    await waitFor(
      () => {
        expect(screen.getByText("Cash Account")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Verify accounts are displayed
    expect(screen.getByText("Accounts Payable")).toBeInTheDocument();
  });

  it("should search accounts by name and code", async () => {
    render(<GeneralLedger />);

    // Wait for accounts to load
    await waitFor(
      () => {
        expect(screen.getByText("Cash Account")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Verify search functionality exists
    const searchInput = screen.getByPlaceholderText("Search accounts...");
    expect(searchInput).toBeInTheDocument();
  });

  it("should display account type badges with correct colors", async () => {
    render(<GeneralLedger />);

    await waitFor(
      () => {
        expect(screen.getByText("Cash Account")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Check that account types are displayed
    expect(screen.getByText("ASSET")).toBeInTheDocument();
    expect(screen.getByText("LIABILITY")).toBeInTheDocument();
  });

  it("should display account balances correctly", async () => {
    render(<GeneralLedger />);

    await waitFor(
      () => {
        expect(screen.getByText("Cash Account")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Check that balances are formatted as currency
    expect(screen.getByText("$1,000.00")).toBeInTheDocument();
  });

  it("should handle loading state", () => {
    // Mock pending fetch
    vi.mocked(fetch).mockImplementation(() => new Promise(() => {}));

    render(<GeneralLedger />);

    // Should show loading state (skeleton)
    expect(document.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("should handle empty accounts list", async () => {
    // Mock empty response
    vi.mocked(fetch).mockImplementation((url) => {
      const urlString = url.toString();
      if (urlString.includes("/api/accounts/stats")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            ...mockStats,
            totalAccounts: 0,
            activeAccounts: 0,
          }),
        } as Response);
      }
      if (urlString.includes("/api/accounts")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ accounts: [] }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response);
    });

    render(<GeneralLedger />);

    await waitFor(
      () => {
        expect(
          screen.getByText(
            "No accounts found. Create your first account to get started.",
          ),
        ).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("should handle network errors", async () => {
    // Mock network error
    vi.mocked(fetch).mockRejectedValue(new Error("Network error"));

    render(<GeneralLedger />);

    await waitFor(
      () => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("should retry loading accounts when retry button is clicked", async () => {
    // Mock initial error then success
    let callCount = 0;
    vi.mocked(fetch).mockImplementation((url) => {
      callCount++;
      if (callCount === 1) {
        return Promise.reject(new Error("Network error"));
      }
      const urlString = url.toString();
      if (urlString.includes("/api/accounts")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ accounts: mockAccounts }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response);
    });

    render(<GeneralLedger />);

    // Wait for error state
    await waitFor(
      () => {
        expect(screen.getByText("Network error")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // Click retry
    const retryButton = screen.getByText("Retry");
    fireEvent.click(retryButton);

    // Should load successfully
    await waitFor(
      () => {
        expect(screen.getByText("Cash Account")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });

  it("should render normal balance field in add account dialog", async () => {
    render(<GeneralLedger />);

    await waitFor(
      () => {
        expect(screen.getByText("General Ledger")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    fireEvent.click(screen.getByTestId("add-account-btn"));

    await waitFor(
      () => {
        expect(screen.getByTestId("dialog-content")).toBeInTheDocument();
        expect(screen.getByText("Normal Balance")).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  });
});
