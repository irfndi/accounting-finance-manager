import { describe, it, expect } from 'vitest';
import { SELF } from 'cloudflare:test';

import type { Env } from '../src/types';

describe('Basic Worker Tests', () => {
  it('should respond to health check', async () => {
    const response = await SELF.fetch('http://localhost/health');
    
    expect(response.status).toBe(200);
    
    const result = await response.json() as { status: string };
    expect(result.status).toBe('healthy');
  });

  it('should respond to API root', async () => {
    const response = await SELF.fetch('http://localhost/api', {
      headers: { 'Accept': 'application/json' }
    });
    
    expect(response.status).toBe(200);
    
    const result = await response.json() as { message: string };
    expect(result.message).toContain('Corporate Finance Manager API');
  });

  it('should handle 404 for unknown routes', async () => {
    const response = await SELF.fetch('http://localhost/api/nonexistent');
    
    expect(response.status).toBe(404);
  });
});