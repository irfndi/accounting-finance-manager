import { Hono } from 'hono'
import accountsRouter from './accounts'
import authRouter from './auth'
import categoriesRouter from './categories'
import budgetsRouter from './budgets'
import categorizationRouter from './categorization'
import notificationsRouter from './notifications'
import reportsRouter from './reports'
import transactionsRouter from './transactions'
import uploadsRouter from './uploads'
import vectorizeRouter from './vectorize'
import type { AppContext } from '../../types'

// Create main API router
const api = new Hono<AppContext>()

// API root endpoint
api.get('/', (c) => {
  return c.json({
    message: 'Corporate Finance Manager API',
    version: '1.0.0',
    environment: c.env.ENVIRONMENT,
    endpoints: {
      auth: '/api/auth - Authentication and user management',
      accounts: '/api/accounts - Chart of accounts management',
      categories: '/api/categories - Category management',
      budgets: '/api/budgets - Budget management',
      categorization: '/api/categorization - AI-powered transaction categorization',
      notifications: '/api/notifications - Email notifications and alerts',
      transactions: '/api/transactions - Financial transactions',
      reports: '/api/reports - Financial reporting',
      uploads: '/api/uploads - File upload and document management',
      vectorize: '/api/vectorize - Document embeddings and semantic search'
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
api.route('/categories', categoriesRouter)
api.route('/budgets', budgetsRouter)
api.route('/categorization', categorizationRouter)
api.route('/notifications', notificationsRouter)
api.route('/transactions', transactionsRouter)
api.route('/reports', reportsRouter)
api.route('/uploads', uploadsRouter)
api.route('/vectorize', vectorizeRouter)

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
        categorization: 'operational',
        notifications: 'operational',
        transactions: 'operational',
        reports: 'operational',
        uploads: 'operational',
        vectorize: 'operational'
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
        'POST /api/categorization/suggest',
        'GET /api/categorization/pending',
        'POST /api/categorization/approve',
        'POST /api/categorization/reject',
        'GET /api/categorization/history',
        'DELETE /api/categorization/:suggestionId',
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