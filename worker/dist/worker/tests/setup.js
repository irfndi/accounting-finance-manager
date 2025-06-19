import { vi } from 'vitest';
import { Miniflare } from 'miniflare';
// Mock Cloudflare Worker environment
const miniflare = new Miniflare({
    modules: true,
    script: '',
    bindings: {
        ENVIRONMENT: 'test',
        JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
        AUTH_SESSION_DURATION: '7d'
    },
    kvNamespaces: ['FINANCE_MANAGER_CACHE'],
    r2Buckets: ['FINANCE_MANAGER_DOCUMENTS'],
    d1Databases: ['FINANCE_MANAGER_DB']
});
globalThis.miniflare = miniflare;
globalThis.workerTestUtils = {
    createTestRequest: (method, url, options = {}) => {
        return new Request(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        });
    },
    createAuthenticatedRequest: (method, url, token, options = {}) => {
        return new Request(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                ...options.headers
            },
            ...options
        });
    },
    parseJsonResponse: async (response) => {
        const text = await response.text();
        try {
            return JSON.parse(text);
        }
        catch (error) {
            throw new Error(`Failed to parse JSON response: ${text}`);
        }
    },
    createMockFormData: (files = []) => {
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append(`file${index}`, file);
        });
        formData.append('description', 'Test file upload');
        formData.append('category', 'receipt');
        return formData;
    },
    createTestJWTToken: (payload) => {
        // Simple JWT token for testing (not secure, only for tests)
        const header = { alg: 'HS256', typ: 'JWT' };
        const encodedHeader = btoa(JSON.stringify(header));
        const encodedPayload = btoa(JSON.stringify(payload));
        const signature = 'test-signature';
        return `${encodedHeader}.${encodedPayload}.${signature}`;
    },
    mockCloudflareBindings: () => ({
        ENVIRONMENT: 'test',
        JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
        AUTH_SESSION_DURATION: '7d',
        FINANCE_MANAGER_DB: {
            prepare: vi.fn(() => ({
                bind: vi.fn().mockReturnThis(),
                run: vi.fn(),
                get: vi.fn(),
                all: vi.fn(() => []),
                first: vi.fn()
            })),
            batch: vi.fn(),
            dump: vi.fn(),
            exec: vi.fn()
        },
        FINANCE_MANAGER_CACHE: {
            get: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            list: vi.fn()
        },
        FINANCE_MANAGER_DOCUMENTS: {
            get: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            list: vi.fn(),
            head: vi.fn()
        }
    })
};
// Mock fetch for external API calls
globalThis.fetch = vi.fn(() => Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    headers: new Headers()
}));
// Mock console for cleaner test output
globalThis.console = {
    ...console,
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
};
// Environment variables for testing
process.env.NODE_ENV = 'test';
process.env.ENVIRONMENT = 'test';
