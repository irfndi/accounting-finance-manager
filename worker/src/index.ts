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
import { createDatabase, accounts, transactions, journalEntries, eq } from "@finance-manager/db"

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

// Root endpoint
app.get('/', (c) => {
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
})

// API Routes
const api = new Hono<{ Bindings: Env }>()

// Accounts API
api.get('/accounts', async (c) => {
  try {
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    const allAccounts = await db.select().from(accounts)
    
    return c.json({
      accounts: allAccounts,
      count: allAccounts.length,
    })
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return c.json({
      error: 'Failed to fetch accounts',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

api.get('/accounts/:id', async (c) => {
  try {
    const accountId = Number.parseInt(c.req.param('id'), 10)
    if (Number.isNaN(accountId)) {
      return c.json({ error: 'Invalid account ID' }, 400)
    }

    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    const account = await db.select().from(accounts).where(eq(accounts.id, accountId))
    
    return c.json({
      account: account[0] || null,
    })
  } catch (error) {
    console.error('Error fetching account:', error)
    return c.json({
      error: 'Failed to fetch account',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

api.post('/accounts', async (c) => {
  try {
    const body = await c.req.json()
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    // Calculate hierarchical path and level
    let level = 0
    let path = body.code as string
    
    if (body.parentId) {
      const parent = await db.select().from(accounts).where(eq(accounts.id, Number(body.parentId)))
      if (parent[0]) {
        level = parent[0].level + 1
        path = `${parent[0].path}.${body.code}`
      }
    }
    
    // Determine normal balance based on account type
    const accountType = body.type as string
    const normalBalance = body.normalBalance as string || 
      (['ASSET', 'EXPENSE'].includes(accountType) ? 'DEBIT' : 'CREDIT')
    
    const newAccount = await db.insert(accounts).values({
      code: body.code as string,
      name: body.name as string,
      description: body.description as string || null,
      type: body.type as string,
      subtype: body.subtype as string || null,
      category: body.category as string || null,
      parentId: body.parentId ? Number(body.parentId) : null,
      level,
      path,
      isActive: Boolean(body.isActive ?? true),
      isSystem: Boolean(body.isSystem ?? false),
      allowTransactions: Boolean(body.allowTransactions ?? true),
      normalBalance,
      reportCategory: body.reportCategory as string || null,
      reportOrder: body.reportOrder ? Number(body.reportOrder) : null,
      currentBalance: 0,
      entityId: 'default',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: 'system'
    }).returning()
    
    return c.json({
      account: newAccount[0],
      message: 'Account created successfully'
    }, 201)
  } catch (error) {
    console.error('Error creating account:', error)
    return c.json({
      error: 'Failed to create account',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Transactions API
api.get('/transactions', async (c) => {
  try {
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    const allTransactions = await db.select().from(transactions)
    
    return c.json({
      transactions: allTransactions,
      count: allTransactions.length,
    })
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return c.json({
      error: 'Failed to fetch transactions',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

api.get('/transactions/:id', async (c) => {
  try {
    const transactionId = Number.parseInt(c.req.param('id'), 10)
    if (Number.isNaN(transactionId)) {
      return c.json({ error: 'Invalid transaction ID' }, 400)
    }

    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    const transaction = await db.select().from(transactions).where(eq(transactions.id, transactionId))
    
    return c.json({
      transaction: transaction[0] || null,
    })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return c.json({
      error: 'Failed to fetch transaction',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Reports API
api.get('/reports/trial-balance', async (c) => {
  try {
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    // Get all accounts with their current balances
    const accountsWithBalances = await db.select().from(accounts)
    
    let totalDebits = 0
    let totalCredits = 0
    
    const trialBalance = accountsWithBalances.map(account => {
      const balance = account.currentBalance || 0
      const isDebitBalance = account.normalBalance === 'DEBIT'
      
      const debitAmount = isDebitBalance && balance > 0 ? balance : 0
      const creditAmount = !isDebitBalance && balance > 0 ? balance : 0
      
      totalDebits += debitAmount
      totalCredits += creditAmount
      
      return {
        accountCode: account.code,
        accountName: account.name,
        accountType: account.type,
        debitAmount,
        creditAmount,
        balance
      }
    })
    
    return c.json({
      trialBalance,
      summary: {
        totalDebits,
        totalCredits,
        isBalanced: Math.abs(totalDebits - totalCredits) < 0.01
      },
      generatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating trial balance:', error)
    return c.json({
      error: 'Failed to generate trial balance',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

// Mount API routes
app.route('/api', api)

// Static file serving for Astro front-end
// Note: In Cloudflare Workers, static assets are served automatically when configured with [site] in wrangler.toml
// This fallback handles SPA routing by serving the main app for non-API routes
app.get('*', async (c) => {
  // Check if this is an API route (should not reach here due to routing order)
  if (c.req.path.startsWith('/api/') || c.req.path === '/health') {
    return c.json({ error: 'Route not found' }, 404)
  }
  
  // Fallback to serving the main app for client-side routing
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Corporate Finance Manager</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 2rem; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { color: #2563eb; margin-bottom: 2rem; }
          .nav { background: #f8fafc; padding: 1rem; border-radius: 8px; margin-bottom: 2rem; }
          .nav a { color: #2563eb; text-decoration: none; margin-right: 1rem; }
          .nav a:hover { text-decoration: underline; }
          .status { color: #059669; font-weight: 500; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">Corporate Finance Manager</h1>
          <div class="status">✅ System Online</div>
          
          <div class="nav">
            <h3>Available Endpoints:</h3>
            <a href="/api">API Root</a>
            <a href="/api/accounts">Chart of Accounts</a>
            <a href="/api/transactions">Transactions</a>
            <a href="/health">Health Check</a>
          </div>
          
          <p>This is the Cloudflare Worker serving the Corporate Finance Manager API.</p>
          <p>The Astro front-end will be integrated here once built.</p>
        </div>
      </body>
    </html>
  `)
})

export default app 