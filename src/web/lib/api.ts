const normalizeBaseUrl = (value?: string) => {
  if (!value) return '';
  return value.endsWith('/') ? value.slice(0, -1) : value;
};

export const API_BASE_URL = normalizeBaseUrl(
  (import.meta as any)?.env?.VITE_API_URL ?? (typeof process !== 'undefined' ? (process.env as any)?.VITE_API_URL : undefined),
);

export const apiUrl = (path: string) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

// Auth helper
export const getAuthToken = () => localStorage.getItem('authToken');

export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Handle 401 Unauthorized globally if needed, e.g., redirect to login
    if (response.status === 401) {
      // events.emit('unauthorized');
    }
    const errorData = await response.json().catch(() => ({})) as any;
    throw new Error(errorData.error || errorData.message || `Request failed with status ${response.status}`);
  }

  return response;
};

// --- Budget API Types ---

export interface BudgetPeriod {
  id: number;
  name: string;
  type: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  fiscalYear: number;
  description?: string;
  isActive: boolean;
}

export interface Budget {
  id: number;
  budgetPeriodId: number;
  categoryId?: number;
  name: string;
  description?: string;
  plannedAmount: number;
  status: 'draft' | 'active' | 'locked' | 'archived';
  budgetType: string; // 'EXPENSE' | 'REVENUE' ...
  allocations?: BudgetAllocation[];
  revisions?: BudgetRevision[];
}

export interface BudgetAllocation {
  id: number;
  budgetId: number;
  categoryId: number;
  allocatedAmount: number;
  allocatedPercent: number;
  allocationType: string;
}

export interface BudgetRevision {
  id: number;
  budgetId: number;
  revisionNumber: number;
  reason: string;
  previousAmount: number;
  newAmount: number;
  changeAmount: number;
  changePercent: number;
  createdAt: string;
}

export interface CreateBudgetPeriodRequest {
  name: string;
  type: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  fiscalYear: number;
  description?: string;
}

export interface CreateBudgetRequest {
  periodId: number;
  name: string;
  totalAmount: number;
  description?: string;
  status?: string;
  budgetType?: string;
}

// --- Budget API Client ---

export const budgetApi = {
  getPeriods: async (): Promise<{ periods: BudgetPeriod[] }> => {
    const response = await authFetch(apiUrl('/api/budgets/periods'));
    return response.json();
  },

  createPeriod: async (data: CreateBudgetPeriodRequest): Promise<{ period: BudgetPeriod }> => {
    const response = await authFetch(apiUrl('/api/budgets/periods'), {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  getBudgets: async (params?: { periodId?: number; status?: string }): Promise<{ budgets: Budget[] }> => {
    const url = new URL(apiUrl('/api/budgets'));
    if (params?.periodId) url.searchParams.append('periodId', params.periodId.toString());
    if (params?.status) url.searchParams.append('status', params.status);

    const response = await authFetch(url.toString());
    return response.json();
  },

  createBudget: async (data: CreateBudgetRequest): Promise<{ budget: Budget }> => {
    const response = await authFetch(apiUrl('/api/budgets'), {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  updateBudget: async (id: number, data: Partial<CreateBudgetRequest>): Promise<{ budget: Budget }> => {
    const response = await authFetch(apiUrl(`/api/budgets/${id}`), {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  deleteBudget: async (id: number): Promise<void> => {
    await authFetch(apiUrl(`/api/budgets/${id}`), {
      method: 'DELETE',
    });
  }
};

