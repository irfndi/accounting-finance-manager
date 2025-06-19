/**
 * Corporate Finance Manager - Cloudflare Worker API
 * Main entry point for the finance management system API
 */

// Cloudflare Worker types
/// <reference types="@cloudflare/workers-types" />

import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { prettyJSON } from 'hono/pretty-json'
import api from './routes/api/index'

// Environment bindings interface
type Env = {
  FINANCE_MANAGER_DB: D1Database
  FINANCE_MANAGER_CACHE: KVNamespace
  FINANCE_MANAGER_DOCUMENTS: R2Bucket
  ENVIRONMENT?: string
}

// Create Hono app
const app = new Hono<{ Bindings: Env }>()

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}))

app.use('*', logger())
app.use('*', prettyJSON())

// Error handling middleware
app.onError((err, c) => {
  console.error('Worker error:', err)
  return c.json({
    error: 'Internal server error',
    message: err.message || 'Unknown error'
  }, 500)
})

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    environment: c.env.ENVIRONMENT,
    timestamp: new Date().toISOString(),
    worker: 'finance-manager'
  })
})

// Root endpoint - redirect to enhanced interface
app.get('/', (c) => {
  // Check if this is an API request (Accept header contains application/json)
  const acceptHeader = c.req.header('Accept') || ''
  if (acceptHeader.includes('application/json')) {
    return c.json({
      message: 'Corporate Finance Manager API',
      environment: c.env.ENVIRONMENT,
      endpoints: [
        '/health - Health check',
        '/api/accounts - Chart of accounts management',
        '/api/transactions - Financial transactions',
        '/api/reports - Financial reporting'
      ]
    })
  }
  
  // For browser requests, serve the enhanced interface
  // This will be handled by the catch-all route below
  return c.redirect('/?interface=web', 302)
})

// Mount API routes
app.route('/api', api)

// Static file serving for Astro front-end
// This handles serving built Astro assets and SPA routing
app.get('*', async (c) => {
  const path = c.req.path
  
  // Check if this is an API route (should not reach here due to routing order)
  if (path.startsWith('/api/') || path === '/health') {
    return c.json({ 
      error: 'Route not found',
      message: `The route ${path} was not found`,
      availableRoutes: ['/api', '/api/accounts', '/api/transactions', '/api/reports', '/health']
    }, 404)
  }
  
  // TODO: When Astro front-end is built, serve actual static assets
  // For now, serve enhanced development fallback
  
  // Handle specific front-end routes that would exist in production
  const frontendRoutes = ['/', '/general-ledger', '/reports']
  const isFrontendRoute = frontendRoutes.includes(path) || path === ''
  
  if (isFrontendRoute) {
    // Enhanced fallback page with navigation to actual front-end pages
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <title>Corporate Finance Manager${path !== '/' ? ` - ${path.replace('/', '').replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}` : ''}</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta name="description" content="Professional corporate finance and accounting management system">
          <link rel="icon" type="image/svg+xml" href="/favicon.svg">
          <style>
            * { box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; 
              margin: 0; padding: 0; background: #f8fafc; color: #1e293b;
            }
            .header { background: white; border-bottom: 1px solid #e2e8f0; padding: 1rem 0; }
            .container { max-width: 1200px; margin: 0 auto; padding: 0 2rem; }
            .nav { display: flex; align-items: center; justify-content: space-between; }
            .logo { font-size: 1.5rem; font-weight: 700; color: #2563eb; }
            .nav-links { display: flex; gap: 2rem; }
            .nav-links a { 
              color: #64748b; text-decoration: none; font-weight: 500; 
              transition: color 0.2s;
            }
            .nav-links a:hover, .nav-links a.active { color: #2563eb; }
            .main { padding: 3rem 0; }
            .status { 
              background: #dcfce7; color: #166534; padding: 0.75rem 1rem; 
              border-radius: 8px; margin-bottom: 2rem; font-weight: 500;
            }
            .card { 
              background: white; border-radius: 12px; padding: 2rem; 
              box-shadow: 0 1px 3px rgba(0,0,0,0.1); margin-bottom: 2rem;
            }
            .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; }
            .endpoint { 
              background: #f1f5f9; padding: 1rem; border-radius: 8px; 
              border-left: 4px solid #2563eb;
            }
            .endpoint h4 { margin: 0 0 0.5rem 0; color: #2563eb; }
            .endpoint p { margin: 0; color: #64748b; font-size: 0.9rem; }
            .endpoint a { 
              color: #2563eb; text-decoration: none; font-weight: 500;
              display: inline-block; margin-top: 0.5rem;
            }
            .endpoint a:hover { text-decoration: underline; }
            .footer { text-align: center; padding: 2rem; color: #64748b; }
          </style>
        </head>
        <body>
          <header class="header">
            <div class="container">
              <nav class="nav">
                <div class="logo">Finance Manager</div>
                <div class="nav-links">
                  <a href="/" ${path === '/' ? 'class="active"' : ''}>Dashboard</a>
                  <a href="/general-ledger" ${path === '/general-ledger' ? 'class="active"' : ''}>General Ledger</a>
                  <a href="/reports" ${path === '/reports' ? 'class="active"' : ''}>Reports</a>
                </div>
              </nav>
            </div>
          </header>
          
          <main class="main">
            <div class="container">
              <div class="status">
                ✅ System Online - API Server Running
              </div>
              
              <div class="card">
                <h2>Corporate Finance & Accounting Manager</h2>
                <p>Professional-grade double-entry bookkeeping system with comprehensive financial reporting.</p>
                <p><strong>Current Status:</strong> API fully operational with enhanced accounting engine integration.</p>
                <p><strong>Note:</strong> This is a development fallback. The Astro front-end will replace this interface when built.</p>
              </div>
              
              <div class="card">
                <h3>Available API Endpoints</h3>
                <div class="grid">
                  <div class="endpoint">
                    <h4>Chart of Accounts</h4>
                    <p>Manage your company's chart of accounts with hierarchical structure and validation.</p>
                    <a href="/api/accounts" target="_blank">→ /api/accounts</a>
                  </div>
                  <div class="endpoint">
                    <h4>Transactions</h4>
                    <p>Double-entry transaction processing with journal entry management.</p>
                    <a href="/api/transactions" target="_blank">→ /api/transactions</a>
                  </div>
                  <div class="endpoint">
                    <h4>Financial Reports</h4>
                    <p>Trial balance, balance sheet, and income statement generation.</p>
                    <a href="/api/reports/trial-balance" target="_blank">→ /api/reports</a>
                  </div>
                  <div class="endpoint">
                    <h4>System Health</h4>
                    <p>Monitor system status and performance metrics.</p>
                    <a href="/health" target="_blank">→ /health</a>
                  </div>
                </div>
              </div>
              
              <div class="card">
                <h3>Integration Ready</h3>
                <p>The worker is configured to serve the Astro front-end when built assets are available:</p>
                <ul>
                  <li>✅ Enhanced API routing with core accounting logic</li>
                  <li>✅ Double-entry bookkeeping validation</li>
                  <li>✅ Professional financial reporting</li>
                  <li>✅ SPA routing support for client-side navigation</li>
                  <li>⏳ Astro static asset serving (pending build integration)</li>
                </ul>
              </div>
            </div>
          </main>
          
          <footer class="footer">
            <p>Corporate Finance Manager v1.0 • Powered by Cloudflare Workers</p>
          </footer>
        </body>
      </html>
    `)
  }
  
  // Handle other potential static assets (CSS, JS, images)
  if (path.includes('.')) {
    // This would be where static assets are served in production
    // For now, return 404 for missing assets
    return c.json({
      error: 'Asset not found',
      message: `Static asset ${path} is not available in development mode`,
      note: 'Static assets will be served when Astro front-end is built'
    }, 404)
  }
  
  // Fallback for any other routes - redirect to home
  return c.redirect('/', 302)
})

export default app 