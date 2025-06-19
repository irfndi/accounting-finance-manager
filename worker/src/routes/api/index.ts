import { Hono } from 'hono'
import accountsRouter from './accounts'
import transactionsRouter from './transactions'
import reportsRouter from './reports'
import authRouter from './auth'
import uploadsRouter from './uploads'

// Environment bindings interface
type Env = {
  FINANCE_MANAGER_DB: D1Database
  FINANCE_MANAGER_CACHE: KVNamespace
  FINANCE_MANAGER_DOCUMENTS: R2Bucket
  ENVIRONMENT?: string
}

// Create main API router
const api = new Hono<{ Bindings: Env }>()

// API root endpoint
api.get('/', (c) => {
  return c.json({
    message: 'Corporate Finance Manager API',
    version: '1.0.0',
    environment: c.env.ENVIRONMENT,
    endpoints: {
      auth: '/api/auth - Authentication and user management',
      accounts: '/api/accounts - Chart of accounts management',
      transactions: '/api/transactions - Financial transactions',
      reports: '/api/reports - Financial reporting',
      uploads: '/api/uploads - File upload and document management'
    },
    availableReports: {
      trialBalance: '/api/reports/trial-balance',
      balanceSheet: '/api/reports/balance-sheet',
      incomeStatement: '/api/reports/income-statement'
    },
    authEndpoints: {
      register: 'POST /api/auth/register - User registration',
      login: 'POST /api/auth/login - User login',
      logout: 'POST /api/auth/logout - User logout',
      profile: 'GET /api/auth/profile - Get user profile',
      updateProfile: 'PUT /api/auth/profile - Update user profile',
      changePassword: 'PUT /api/auth/password - Change password',
      validate: 'GET /api/auth/validate - Validate session'
    },
    uploadEndpoints: {
      upload: 'POST /api/uploads - Upload file',
      list: 'GET /api/uploads - List files',
      download: 'GET /api/uploads/{fileId} - Download file',
      metadata: 'GET /api/uploads/{fileId}/metadata - Get file metadata',
      delete: 'DELETE /api/uploads/{fileId} - Delete file'
    },
    documentation: 'https://github.com/irfndi/finance-manager#api-documentation'
  })
})

// Mount route modules
api.route('/auth', authRouter)
api.route('/accounts', accountsRouter)
api.route('/transactions', transactionsRouter)
api.route('/reports', reportsRouter)
api.route('/uploads', uploadsRouter)

// API health check specific to API routes
api.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    service: 'finance-manager-api',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT,
    modules: {
      auth: 'operational',
      accounts: 'operational',
      transactions: 'operational',
      reports: 'operational',
      uploads: 'operational'
    }
  })
})

// Catch-all for unmatched API routes
api.all('*', (c) => {
  return c.json({
    error: 'API endpoint not found',
    message: `The endpoint ${c.req.method} ${c.req.path} does not exist`,
    availableEndpoints: [
      'GET /api/',
      'GET /api/health',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/auth/logout',
      'GET /api/auth/profile',
      'PUT /api/auth/profile',
      'PUT /api/auth/password',
      'GET /api/auth/validate',
      'GET /api/accounts',
      'POST /api/accounts',
      'GET /api/accounts/:id',
      'GET /api/transactions',
      'POST /api/transactions',
      'GET /api/transactions/:id',
      'GET /api/reports/trial-balance',
      'GET /api/reports/balance-sheet',
      'GET /api/reports/income-statement',
      'POST /api/uploads',
      'GET /api/uploads',
      'GET /api/uploads/{fileId}',
      'GET /api/uploads/{fileId}/metadata',
      'DELETE /api/uploads/{fileId}'
    ],
    code: 'API_ENDPOINT_NOT_FOUND'
  }, 404)
})

export default api 