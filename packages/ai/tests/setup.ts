import { vi } from 'vitest';

// Mock environment variables for AI testing
process.env.NODE_ENV = 'test';
process.env.OPENAI_API_KEY = 'test-openai-key';
process.env.ANTHROPIC_API_KEY = 'test-anthropic-key';

// Global test utilities for AI operations
declare global {
  var aiTestUtils: {
    mockOpenAIResponse: (response: any) => void;
    mockAnthropicResponse: (response: any) => void;
    createMockFinancialData: () => any;
    createMockTransactionData: () => any[];
    mockAIProvider: (provider: string, response: any) => void;
    resetAllMocks: () => void;
  };
}

// Mock external AI API calls
globalThis.fetch = vi.fn();

// Mock console for cleaner test output
globalThis.console = {
  ...console,
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
} as Console;

globalThis.aiTestUtils = {
  mockOpenAIResponse: (response: any) => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        choices: [{
          message: {
            role: 'assistant',
            content: typeof response === 'string' ? response : JSON.stringify(response)
          },
          finish_reason: 'stop'
        }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150
        }
      })
    });
  },

  mockAnthropicResponse: (response: any) => {
    (globalThis.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        content: [{
          type: 'text',
          text: typeof response === 'string' ? response : JSON.stringify(response)
        }],
        id: 'msg_test_id',
        model: 'claude-3-sonnet-20240229',
        role: 'assistant'
      })
    });
  },

  createMockFinancialData: () => ({
    revenue: [
      { account: 'Sales Revenue', amount: 100000, month: '2023-01' },
      { account: 'Service Revenue', amount: 50000, month: '2023-01' }
    ],
    expenses: [
      { account: 'Cost of Goods Sold', amount: 40000, month: '2023-01' },
      { account: 'Operating Expenses', amount: 30000, month: '2023-01' }
    ],
    metrics: {
      grossMargin: 0.60,
      netMargin: 0.20,
      currentRatio: 2.5,
      debtToEquity: 0.45
    }
  }),

  createMockTransactionData: () => [
    {
      id: 1,
      date: '2023-01-15',
      description: 'Office supplies purchase',
      amount: 250.00,
      category: 'Office Expenses',
      type: 'expense'
    },
    {
      id: 2,
      date: '2023-01-20',
      description: 'Client payment received',
      amount: 5000.00,
      category: 'Service Revenue',
      type: 'revenue'
    }
  ],

  mockAIProvider: (provider: string, response: any) => {
    switch (provider.toLowerCase()) {
      case 'openai':
        aiTestUtils.mockOpenAIResponse(response);
        break;
      case 'anthropic':
        aiTestUtils.mockAnthropicResponse(response);
        break;
      default:
        throw new Error(`Unknown AI provider: ${provider}`);
    }
  },

  resetAllMocks: () => {
    vi.clearAllMocks();
  }
};

// Mock crypto for consistent UUID generation in tests
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid-' + Math.random().toString(36).substr(2, 9),
    getRandomValues: (arr: Uint8Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }
  }
});

// Mock setTimeout and setInterval for predictable timing in tests
vi.stubGlobal('setTimeout', vi.fn((fn, delay = 0) => {
  return fn();
}));

vi.stubGlobal('setInterval', vi.fn((fn, delay = 0) => {
  return fn();
})); 