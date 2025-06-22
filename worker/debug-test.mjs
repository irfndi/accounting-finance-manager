import worker from './dist/src/index.js';

// Fix ES module imports by adding .js extensions to relative imports
// This is a temporary workaround for testing

const mockEnv = {
  ENVIRONMENT: 'test',
  JWT_SECRET: 'test-jwt-secret-key-for-testing-only',
  AUTH_SESSION_DURATION: '86400',
  FINANCE_MANAGER_CACHE: {
    get: () => Promise.resolve(null),
    put: () => Promise.resolve(),
    delete: () => Promise.resolve()
  },
  FINANCE_MANAGER_DOCUMENTS: {},
  FINANCE_MANAGER_DB: {}
};

async function testRequest() {
  try {
    const req = new Request('http://localhost/api/auth/validate', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });
    
    console.log('Making request to:', req.url);
    console.log('Request method:', req.method);
    console.log('Request headers:', Object.fromEntries(req.headers.entries()));
    
    const response = await worker.fetch(req, mockEnv);
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));
    
    const body = await response.text();
    console.log('Response body:', body);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testRequest();