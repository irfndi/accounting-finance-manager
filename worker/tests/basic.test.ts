import { describe, it, expect } from 'vitest';
import { env, createExecutionContext, waitOnExecutionContext } from 'cloudflare:test';
import worker from '../src/index';

describe('Basic Worker Tests', () => {
  it('should respond to health check', async () => {
    const request = new Request('http://localhost/health');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result.status).toBe('healthy');
  });

  it('should respond to API root', async () => {
    const request = new Request('http://localhost/api/', {
      headers: { 'Accept': 'application/json' }
    });
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    expect(response.status).toBe(200);
    
    const result = await response.json();
    expect(result.message).toContain('Corporate Finance Manager API');
  });

  it('should handle 404 for unknown routes', async () => {
    const request = new Request('http://localhost/api/nonexistent');
    const ctx = createExecutionContext();
    const response = await worker.fetch(request, env, ctx);
    await waitOnExecutionContext(ctx);
    
    expect(response.status).toBe(404);
  });
});