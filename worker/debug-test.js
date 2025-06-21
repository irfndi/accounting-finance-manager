import app from './src/index.ts';

console.log('App imported:', typeof app);
console.log('App methods:', Object.getOwnPropertyNames(app));

const mockEnv = {
  FINANCE_MANAGER_DB: {
    prepare: () => ({
      bind: () => ({ run: () => {}, get: () => {}, all: () => [], first: () => {} })
    })
  },
  FINANCE_MANAGER_CACHE: {
    get: () => null,
    put: () => {},
    delete: () => {}
  },
  FINANCE_MANAGER_DOCUMENTS: {
    get: () => null,
    put: () => {},
    delete: () => {}
  },
  JWT_SECRET: 'test-secret',
  ENVIRONMENT: 'test'
};

try {
  const request = new Request('https://example.com/health', { method: 'GET' });
  const response = await app.fetch(request, mockEnv);
  console.log('Health check status:', response.status);
  const text = await response.text();
  console.log('Health check response:', text);
} catch (error) {
  console.error('Error testing app:', error);
}