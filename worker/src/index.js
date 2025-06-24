/**
 * Corporate Finance Manager - Cloudflare Worker API
 * Main entry point for the finance management system API
 */
// Cloudflare Worker types
/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import api from './routes/api/index';
// Create Hono app
export const app = new Hono();
// Middleware
app.use('*', cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
}));
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
    if (err.name === 'Unauthorized' ||
        err.message.includes('Unauthorized') ||
        err.message.includes('Invalid or expired token') ||
        err.message.includes('Authentication not configured') ||
        err.message.includes('Authorization header') ||
        err.message.includes('Session not found')) {
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
        worker: 'finance-manager'
    });
});
// Mount API routes BEFORE catch-all routes
app.route('/api', api);
// Root endpoint - redirect to enhanced interface
// Static file serving for Astro front-end
// This handles serving built Astro assets and SPA routing
app.get('*', async (c) => {
    const isBrowser = c.req.header('user-agent')?.includes('Mozilla');
    if (c.req.path === '/' && !isBrowser) {
        return c.json({
            message: 'Welcome to the Finance Manager API!',
            version: '1.0.0',
            documentation: '/api-docs',
            health: '/health',
            api_entry: '/api',
            production: c.env.ENVIRONMENT === 'production',
            endpoints: {
                accounts: '/api/accounts',
                transactions: '/api/transactions',
                reports: '/api/reports',
                search: '/api/search'
            }
        });
    }
    const path = c.req.path;
    // Check if this is an API route (should not reach here due to routing order)
    if (path.startsWith('/api/') || path === '/health') {
        return c.json({
            error: 'Route not found',
            message: `The route ${path} was not found`,
            availableRoutes: ['/api', '/api/accounts', '/api/transactions', '/api/reports', '/health']
        }, 404);
    }
    try {
        // Import the static assets from the built Astro app
        const { getAssetFromKV } = await import('@cloudflare/kv-asset-handler');
        console.log('Successfully imported getAssetFromKV');
        // Create event object for getAssetFromKV
        const event = {
            request: c.req.raw,
            waitUntil: () => { },
            ...c.env
        };
        console.log('Attempting to serve:', path);
        // Try to serve static assets first
        if (path.includes('.') || path.startsWith('/_astro/')) {
            try {
                console.log('Serving static asset:', path);
                return await getAssetFromKV(event);
            }
            catch (e) {
                console.log('Asset not found:', path, e instanceof Error ? e.message : String(e));
                // Asset not found, continue to SPA routing
            }
        }
        // Handle SPA routing - serve index.html for all non-asset routes
        try {
            console.log('Serving SPA route, looking for index.html');
            const indexRequest = new Request(new URL('/index.html', c.req.url).toString());
            const event2 = {
                request: indexRequest,
                waitUntil: () => { },
                ...c.env
            };
            return await getAssetFromKV(event2);
        }
        catch (e) {
            console.log('Index.html not found:', e instanceof Error ? e.message : String(e));
            throw e;
        }
    }
    catch (e) {
        // Fallback to development interface if assets are not available
        console.log('Static assets not available, serving development fallback:', e instanceof Error ? e.message : String(e));
        // Handle specific front-end routes that would exist in production
        const frontendRoutes = ['/', '/general-ledger', '/reports', '/search'];
        const isFrontendRoute = frontendRoutes.includes(path) || path === '';
        if (isFrontendRoute) {
            return c.html(`
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <title>Corporate Finance Manager${path !== '/' ? ` - ${path.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}` : ''}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <meta name="description" content="Professional corporate finance and accounting management system">
            <style>
              * { box-sizing: border-box; }
              body { 
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                margin: 0; padding: 2rem; background: #f8fafc; color: #1e293b;
              }
              .container { max-width: 800px; margin: 0 auto; }
              .card { background: white; border-radius: 12px; padding: 2rem; margin-bottom: 2rem; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
              .status { background: #dcfce7; color: #166534; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
              .nav { display: flex; gap: 1rem; margin-bottom: 2rem; }
              .nav a { color: #2563eb; text-decoration: none; padding: 0.5rem 1rem; border-radius: 6px; background: #eff6ff; }
              .nav a:hover { background: #dbeafe; }
              .endpoint { background: #f1f5f9; padding: 1rem; border-radius: 8px; margin: 1rem 0; }
              .endpoint a { color: #2563eb; text-decoration: none; font-weight: 500; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="status">✅ Finance Manager API Online - Development Mode</div>
              
              <div class="nav">
                <a href="/">Dashboard</a>
                <a href="/general-ledger">General Ledger</a>
                <a href="/reports">Reports</a>
                <a href="/search">Search</a>
              </div>
              
              <div class="card">
                <h1>Corporate Finance Manager</h1>
                <p>Professional double-entry bookkeeping system with comprehensive financial reporting.</p>
                <p><strong>Note:</strong> The Astro frontend will be served here once properly configured with static assets.</p>
              </div>
              
              <div class="card">
                <h3>API Endpoints</h3>
                <div class="endpoint">
                  <strong>Chart of Accounts:</strong> <a href="/api/accounts">/api/accounts</a>
                </div>
                <div class="endpoint">
                  <strong>Transactions:</strong> <a href="/api/transactions">/api/transactions</a>
                </div>
                <div class="endpoint">
                  <strong>Reports:</strong> <a href="/api/reports">/api/reports</a>
                </div>
                <div class="endpoint">
                  <strong>Health Check:</strong> <a href="/health">/health</a>
                </div>
              </div>
            </div>
          </body>
        </html>
      `);
        }
        // Fallback for any other routes
        return c.redirect('/', 302);
    }
});
export default app;
