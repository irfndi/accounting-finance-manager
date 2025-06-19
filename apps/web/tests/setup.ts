import { beforeEach, afterEach, vi } from 'vitest';

// Global test setup for Astro web application
// Mock browser APIs and Astro-specific functionality

// Mock window and document for SSR testing
Object.defineProperty(window, 'location', {
  value: {
    href: 'http://localhost:3000',
    origin: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: ''
  },
  writable: true
});

// Mock fetch for API calls
global.fetch = vi.fn();

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};
Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock console to avoid noise in tests
beforeEach(() => {
  // Reset all mocks before each test
  vi.clearAllMocks();
  
  // Reset localStorage and sessionStorage
  localStorageMock.getItem.mockReturnValue(null);
  sessionStorageMock.getItem.mockReturnValue(null);
  
  // Reset fetch mock
  (global.fetch as any).mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({}),
    text: async () => '',
    headers: new Headers()
  });
});

afterEach(() => {
  // Clean up after each test
  vi.clearAllMocks();
});

// Global test utilities for web app testing
declare global {
  var webTestUtils: {
    mockApiResponse: (data: any, status?: number) => void;
    mockApiError: (error: string, status?: number) => void;
    setLocalStorage: (key: string, value: string) => void;
    getLocalStorage: (key: string) => string | null;
    mockIntersectionObserver: (entries: any[]) => void;
    createMockFormData: (data: Record<string, any>) => FormData;
    waitForElement: (selector: string, timeout?: number) => Promise<Element | null>;
  };
}

globalThis.webTestUtils = {
  mockApiResponse: (data: any, status: number = 200) => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
      text: async () => JSON.stringify(data),
      headers: new Headers({ 'Content-Type': 'application/json' })
    });
  },

  mockApiError: (error: string, _status: number = 500) => {
    (global.fetch as any).mockRejectedValueOnce(new Error(error));
  },

  setLocalStorage: (key: string, value: string) => {
    localStorageMock.getItem.mockImplementation((k) => k === key ? value : null);
    localStorageMock.setItem.mockImplementation(() => {});
  },

  getLocalStorage: (key: string) => {
    return localStorageMock.getItem(key);
  },

  mockIntersectionObserver: (entries: any[]) => {
    const mockObserver = {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      root: null,
      rootMargin: '',
      thresholds: []
    };
    
    global.IntersectionObserver = vi.fn().mockImplementation((callback) => {
      // Simulate intersection
      setTimeout(() => callback(entries, mockObserver), 0);
      return mockObserver;
    });
  },

  createMockFormData: (data: Record<string, any>): FormData => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });
    return formData;
  },

  waitForElement: async (selector: string, timeout: number = 1000): Promise<Element | null> => {
    return new Promise((resolve) => {
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      const observer = new MutationObserver(() => {
        const element = document.querySelector(selector);
        if (element) {
          observer.disconnect();
          resolve(element);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true
      });

      setTimeout(() => {
        observer.disconnect();
        resolve(null);
      }, timeout);
    });
  }
};

// Mock Astro-specific globals if needed
// @ts-ignore
global.Astro = {
  url: new URL('http://localhost:3000'),
  request: {
    method: 'GET',
    headers: new Headers()
  },
  props: {},
  params: {},
  redirect: vi.fn(),
  cookies: {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn()
  }
};