/**
 * Corporate Finance Manager - Cloudflare Worker API
 * Hono application responsible for API and health endpoints.
 * Static asset handling is delegated to the Worker entry (src/worker/entry.ts).
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import api from './routes/api/index';
import type { AppContext } from './types';

// Create Hono app
export const app = new Hono<AppContext>();

// Middleware
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use('*', logger());
app.use('*', prettyJSON());

// Error handling middleware
app.onError((err, c) => {
  console.error('=== Global error handler called ===');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Request URL:', c.req.url);
  console.error('Request method:', c.req.method);
  console.error('=====================================');

  // Check if this is an authentication error
  if (
    err.name === 'Unauthorized' ||
    err.message.includes('Unauthorized') ||
    err.message.includes('Invalid or expired token') ||
    err.message.includes('Authentication not configured') ||
    err.message.includes('Authorization header') ||
    err.message.includes('Session not found')
  ) {
    console.log('🔒 Returning 401 for auth error');
    return c.json({ error: 'Unauthorized', message: err.message }, 401);
  }

  console.log('💥 Returning 500 for non-auth error');
  return c.json({ error: 'Internal server error', details: err.message }, 500);
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
    worker: 'finance-manager',
  });
});

// Mount API routes BEFORE catch-all routes
app.route('/api', api);

// Handle non-matched API routes
app.notFound((c) => {
  const path = c.req.path;
  const isApi = path.startsWith('/api');

  if (isApi) {
    return c.json(
      {
        error: 'API endpoint not found',
        path,
        available: ['/api', '/api/health', '/health'],
      },
      404,
    );
  }

  return c.json(
    {
      message: 'Route not handled by API application',
      path,
      hint: 'Static assets are served via the Worker entry. Ensure assets are built to dist/client.',
    },
    404,
  );
});

export default app;
