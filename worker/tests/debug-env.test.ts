import { describe, it, expect } from 'vitest';
import { SELF, env } from 'cloudflare:test';

describe('Environment Debug', () => {
  it('should show environment variables', async () => {
    console.log('=== ENV DEBUG TEST ===');
    console.log('env object:', env);
    console.log('JWT_SECRET:', env.JWT_SECRET);
    console.log('ENVIRONMENT:', env.ENVIRONMENT);
    console.log('All env keys:', Object.keys(env));
    
    expect(env.JWT_SECRET).toBeDefined();
    expect(env.JWT_SECRET).toBe('dev-jwt-secret-please-change-in-production-use-strong-random-key');
  });
  
  it('should test SELF.fetch with environment', async () => {
    console.log('=== SELF.FETCH ENV TEST ===');
    
    const response = await SELF.fetch('http://localhost/health');
    console.log('Health check status:', response.status);
    
    const registerResponse = await SELF.fetch('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'securepassword123',
        name: 'Test User'
      })
    });
    
    console.log('Register response status:', registerResponse.status);
    const registerResult = await registerResponse.json();
    console.log('Register response body:', registerResult);
  });
});