/**
 * Test data fixtures for E2E tests
 * Centralized data management to avoid duplication
 */

export const testData = {
  navigation: {
    routes: [
      { path: '/', title: 'Finance Manager', description: 'Dashboard' },
      { path: '/chart-of-accounts', title: 'Chart of Accounts', description: 'Account management' },
      { path: '/general-ledger', title: 'General Ledger', description: 'Transaction history' },
      { path: '/financial-statements', title: 'Financial Statements', description: 'Reports' },
      { path: '/reports', title: 'Reports', description: 'Analytics' },
      { path: '/search', title: 'Search', description: 'Document search' },
    ],
  },
  accounts: {
    sample: {
      name: 'Test Cash Account',
      type: 'Asset',
      code: '1001',
      description: 'Test cash account for E2E testing',
    },
  },
  transactions: {
    sample: {
      description: 'Test Transaction',
      amount: 1000,
      date: '2024-01-15',
      category: 'Revenue',
      reference: 'REF-001',
      entries: [
        { account: 'Cash', debit: 1000, credit: 0 },
        { account: 'Revenue', debit: 0, credit: 1000 }
      ],
    },
  },
  search: {
    queries: [
      'invoice',
      'receipt',
      'transaction',
      'account',
    ],
  },
  searchQueries: [
    'test transaction',
    'revenue',
    'cash account',
    'invoice',
  ],
} as const;

export type TestData = typeof testData;