/**
 * Transaction Categorization API
 * AI-powered transaction categorization with user approval workflow
 */

import { Hono } from 'hono'
import type { AppContext } from '../../types'
import { authMiddleware } from '../../middleware/auth'
import { FinancialAIService, AIService, createProvider } from '../../../ai/index.js'
import { DatabaseAdapter } from '../../../lib/index.js'
import type { Account } from '../../../types/index.js'
import { z } from 'zod'

// Validation schemas
const categorizationRequestSchema = z.object({
  transactionId: z.string().optional(),
  description: z.string().min(1, 'Description is required'),
  amount: z.number(),
  merchant: z.string().optional(),
  existingCategories: z.array(z.string()).optional()
})

const approvalRequestSchema = z.object({
  suggestionId: z.string(),
  approved: z.boolean(),
  accountId: z.string().optional() // Override suggested account
})

// Types
interface CategorizationSuggestion {
  id: string
  transactionId?: string
  description: string
  amount: number
  merchant?: string
  suggestedCategory: string
  suggestedSubcategory?: string
  suggestedAccountId?: string
  confidence: number
  timestamp: number
  userId: string
  status: 'pending' | 'approved' | 'rejected'
}

interface CategorizationResponse {
  suggestionId: string
  category: string
  subcategory?: string
  accountId?: string
  confidence: number
  requiresApproval: boolean
}

// Create categorization router
const categorization = new Hono<AppContext>()

// Apply authentication middleware
categorization.use('/*', authMiddleware)

/**
 * POST /api/categorization/suggest
 * Generate AI categorization suggestion for a transaction
 */
categorization.post('/suggest', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = categorizationRequestSchema.parse(body)
    
    const { description, amount, merchant, existingCategories, transactionId } = validatedData
    const user = c.get('user')
    
    // Initialize AI service
    const primaryProvider = createProvider({
        provider: 'openrouter',
        modelId: 'google/gemini-flash-1.5',
        apiKey: c.env.OPENROUTER_API_KEY || '',
        baseUrl: 'https://openrouter.ai/api/v1'
      })
      
      const aiService = new AIService({
        primaryProvider,
        retryAttempts: 3,
        retryDelay: 1000,
        timeout: 30000
      })
      
      const financialAI = new FinancialAIService(aiService)
    
    // Get AI categorization suggestion
    const aiResult = await financialAI.categorizeExpense(
      description,
      amount,
      merchant,
      existingCategories
    )
    
    // Find matching account based on category
    const db = new DatabaseAdapter({ database: c.env.FINANCE_MANAGER_DB })
    let suggestedAccountId: string | undefined
    
    try {
      const accounts = await db.getAllAccounts();
      const lowerCaseCategory = aiResult.category.toLowerCase();
      const matchingAccount = accounts.find((account: Account) => 
        account.category?.toLowerCase().includes(lowerCaseCategory) ||
        account.name.toLowerCase().includes(lowerCaseCategory)
      );
      
      if (matchingAccount) {
        suggestedAccountId = matchingAccount.id?.toString();
      }
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error while finding matching account';
        console.warn('Failed to find matching account:', errorMessage);
    }
    
    // Generate unique suggestion ID
    const suggestionId = `cat_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    
    // Create suggestion object
    const suggestion: CategorizationSuggestion = {
      id: suggestionId,
      transactionId,
      description,
      amount,
      merchant,
      suggestedCategory: aiResult.category,
      suggestedSubcategory: aiResult.subcategory,
      suggestedAccountId,
      confidence: aiResult.confidence,
      timestamp: Date.now(),
      userId: user.id,
      status: 'pending'
    }
    
    // Store suggestion in KV for user approval
    const kvKey = `categorization:${user.id}:${suggestionId}`
    await c.env.FINANCE_MANAGER_CACHE.put(
      kvKey,
      JSON.stringify(suggestion),
      { expirationTtl: 86400 * 7 } // 7 days expiration
    )
    
    // Determine if approval is required (low confidence suggestions)
    const requiresApproval = aiResult.confidence < 0.8
    
    const response: CategorizationResponse = {
      suggestionId,
      category: aiResult.category,
      subcategory: aiResult.subcategory,
      accountId: suggestedAccountId,
      confidence: aiResult.confidence,
      requiresApproval
    }
    
    return c.json({
      success: true,
      data: response
    })
    
  } catch (error: unknown) {
    console.error('Categorization suggestion error:', error)
    
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, 400)
    }
    
    return c.json({
      success: false,
      error: 'Failed to generate categorization suggestion',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/categorization/pending
 * Get all pending categorization suggestions for the user
 */
categorization.get('/pending', async (c) => {
  try {
    const user = c.get('user')
    
    // List all categorization keys for the user
    const listResult = await c.env.FINANCE_MANAGER_CACHE.list({
      prefix: `categorization:${user.id}:`
    })
    
    const pendingSuggestions: CategorizationSuggestion[] = []
    
    // Fetch each suggestion
    for (const key of listResult.keys) {
      const suggestionData = await c.env.FINANCE_MANAGER_CACHE.get(key.name)
      if (suggestionData) {
        const suggestion: CategorizationSuggestion = JSON.parse(suggestionData)
        if (suggestion.status === 'pending') {
          pendingSuggestions.push(suggestion)
        }
      }
    }
    
    // Sort by timestamp (newest first)
    pendingSuggestions.sort((a, b) => b.timestamp - a.timestamp)
    
    return c.json({
      success: true,
      data: pendingSuggestions
    })
    
  } catch (error: unknown) {
    console.error('Failed to fetch pending suggestions:', error instanceof Error ? error.message : String(error))
    return c.json({
      success: false,
      error: 'Failed to fetch pending suggestions'
    }, 500)
  }
})

/**
 * POST /api/categorization/approve
 * Approve or reject a categorization suggestion
 */
categorization.post('/approve', async (c) => {
  try {
    const body = await c.req.json()
    const validatedData = approvalRequestSchema.parse(body)
    
    const { suggestionId, approved, accountId } = validatedData
    const user = c.get('user')
    
    const kvKey = `categorization:${user.id}:${suggestionId}`
    
    // Get the suggestion
    const suggestionData = await c.env.FINANCE_MANAGER_CACHE.get(kvKey)
    if (!suggestionData) {
      return c.json({
        success: false,
        error: 'Suggestion not found or expired'
      }, 404)
    }
    
    const suggestion: CategorizationSuggestion = JSON.parse(suggestionData)
    
    // Update suggestion status
    suggestion.status = approved ? 'approved' : 'rejected'
    
    // If approved and accountId override provided, use it
    if (approved && accountId) {
      suggestion.suggestedAccountId = accountId
    }
    
    // Update in KV
    await c.env.FINANCE_MANAGER_CACHE.put(
      kvKey,
      JSON.stringify(suggestion),
      { expirationTtl: 86400 * 30 } // Keep approved/rejected for 30 days for analytics
    )
    
    // If approved and has transaction ID, update the transaction
    if (approved && suggestion.transactionId && suggestion.suggestedAccountId) {
      try {
        // Note: This would require implementing transaction update in core
        // For now, we'll just store the approval
        // console.log(`Transaction ${suggestion.transactionId} categorized as ${suggestion.suggestedCategory}`)
      } catch (error) {
        console.warn('Failed to update transaction with approved category:', error instanceof Error ? error.message : String(error))
      }
    }
    
    return c.json({
      success: true,
      data: {
        suggestionId,
        status: suggestion.status,
        category: suggestion.suggestedCategory,
        accountId: suggestion.suggestedAccountId
      }
    })
    
  } catch (error: unknown) {
    console.error('Approval error:', error)
    
    if (error instanceof z.ZodError) {
      return c.json({
        success: false,
        error: 'Validation error',
        details: error.errors
      }, 400)
    }
    
    return c.json({
      success: false,
      error: 'Failed to process approval',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, 500)
  }
})

/**
 * GET /api/categorization/history
 * Get categorization history and analytics
 */
categorization.get('/history', async (c) => {
  try {
    const user = c.get('user')
    const url = new URL(c.req.url)
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const status = url.searchParams.get('status') // 'approved', 'rejected', or 'all'
    
    // List all categorization keys for the user
    const listResult = await c.env.FINANCE_MANAGER_CACHE.list({
      prefix: `categorization:${user.id}:`
    })
    
    const suggestions: CategorizationSuggestion[] = []
    
    // Fetch each suggestion
    for (const key of listResult.keys) {
      const suggestionData = await c.env.FINANCE_MANAGER_CACHE.get(key.name)
      if (suggestionData) {
        const suggestion: CategorizationSuggestion = JSON.parse(suggestionData)
        
        // Filter by status if specified
        if (!status || status === 'all' || suggestion.status === status) {
          suggestions.push(suggestion)
        }
      }
    }
    
    // Sort by timestamp (newest first) and limit
    suggestions.sort((a, b) => b.timestamp - a.timestamp)
    const limitedSuggestions = suggestions.slice(0, limit)
    
    // Calculate analytics
    const analytics = {
      total: suggestions.length,
      approved: suggestions.filter(s => s.status === 'approved').length,
      rejected: suggestions.filter(s => s.status === 'rejected').length,
      pending: suggestions.filter(s => s.status === 'pending').length,
      averageConfidence: suggestions.length > 0 
        ? suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length 
        : 0,
      topCategories: getTopCategories(suggestions.filter(s => s.status === 'approved'))
    }
    
    return c.json({
      success: true,
      data: {
        suggestions: limitedSuggestions,
        analytics
      }
    })
    
  } catch (error) {
    console.error('Failed to fetch categorization history:', error instanceof Error ? error.message : String(error))
    return c.json({
      success: false,
      error: 'Failed to fetch categorization history'
    }, 500)
  }
})

/**
 * DELETE /api/categorization/suggestion/:id
 * Delete a specific categorization suggestion
 */
categorization.delete('/suggestion/:id', async (c) => {
  try {
    const suggestionId = c.req.param('id')
    const user = c.get('user')
    
    const kvKey = `categorization:${user.id}:${suggestionId}`
    
    // Check if suggestion exists
    const suggestionData = await c.env.FINANCE_MANAGER_CACHE.get(kvKey)
    if (!suggestionData) {
      return c.json({
        success: false,
        error: 'Suggestion not found'
      }, 404)
    }
    
    // Delete from KV
    await c.env.FINANCE_MANAGER_CACHE.delete(kvKey)
    
    return c.json({
      success: true,
      message: 'Suggestion deleted successfully'
    })
    
  } catch (error) {
    console.error('Failed to delete suggestion:', error instanceof Error ? error.message : String(error))
    return c.json({
      success: false,
      error: 'Failed to delete suggestion'
    }, 500)
  }
})

// Helper function to get top categories
function getTopCategories(approvedSuggestions: CategorizationSuggestion[]): Array<{ category: string; count: number }> {
  const categoryCount = approvedSuggestions.reduce((acc, suggestion) => {
    const category = suggestion.suggestedCategory;
    acc.set(category, (acc.get(category) || 0) + 1);
    return acc;
  }, new Map<string, number>());

  return Array.from(categoryCount.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

export default categorization