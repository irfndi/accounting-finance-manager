/**
 * Budgets API Routes
 * Corporate Finance Manager - Budget planning and tracking
 */

import { Hono } from 'hono'
import { eq, and, gte, lte, desc, asc, sum, count } from 'drizzle-orm'
import { budgetPeriods, budgets, budgetRevisions, budgetAllocations, categories, createDatabase } from '../../../db/index.js'
import type { InferInsertModel } from 'drizzle-orm'
import { authMiddleware } from '../../middleware/auth'
import type { AppContext } from '../../types'

// Create budgets router
const budgetsRouter = new Hono<AppContext>()

// Apply authentication middleware to all routes
budgetsRouter.use('*', authMiddleware)

// Validation schemas
const periodTypes = ['monthly', 'quarterly', 'yearly'] as const
const budgetStatuses = ['draft', 'active', 'locked', 'archived'] as const

interface CreateBudgetPeriodRequest {
  name: string
  type: typeof periodTypes[number]
  startDate: string
  endDate: string
  fiscalYear: number
  description?: string
  isActive?: boolean
}

interface CreateBudgetRequest {
  periodId: number
  categoryId?: number
  name: string
  description?: string
  totalAmount: number
  currency?: string
  status?: typeof budgetStatuses[number]
  approvalRequired?: boolean
  tags?: string[]
  metadata?: object
  budgetType?: string
  notes?: string
}

interface UpdateBudgetRequest extends Partial<CreateBudgetRequest> {
  id: number
}

interface CreateAllocationRequest {
  budgetId: number
  categoryId: number
  allocatedAmount: number
  allocatedPercent?: number
  allocationType?: string
  description?: string
  priority?: number
  constraints?: object
}

// Validation functions
function validateBudgetPeriodData(data: CreateBudgetPeriodRequest): string | null {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return 'Period name is required'
  }
  
  if (!data.type || !periodTypes.includes(data.type)) {
    return `Period type must be one of: ${periodTypes.join(', ')}`
  }
  
  if (!data.startDate || !data.endDate) {
    return 'Start date and end date are required'
  }
  
  const startDate = new Date(data.startDate)
  const endDate = new Date(data.endDate)
  
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return 'Invalid date format'
  }
  
  if (startDate >= endDate) {
    return 'Start date must be before end date'
  }
  
  if (!data.fiscalYear || data.fiscalYear < 1900 || data.fiscalYear > 2100) {
    return 'Valid fiscal year is required'
  }
  
  return null
}

function validateBudgetData(data: CreateBudgetRequest): string | null {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return 'Budget name is required'
  }
  
  if (!data.periodId || typeof data.periodId !== 'number') {
    return 'Valid period ID is required'
  }
  
  if (data.totalAmount === undefined || data.totalAmount < 0) {
    return 'Total amount must be zero or positive'
  }
  
  if (data.status && !budgetStatuses.includes(data.status)) {
    return `Budget status must be one of: ${budgetStatuses.join(', ')}`
  }
  
  return null
}

// GET /api/budgets/periods - List budget periods
budgetsRouter.get('/periods', async (c) => {
  try {
    const { type, fiscalYear, active } = c.req.query()
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    const conditions = []
    
    if (type) {
      conditions.push(eq(budgetPeriods.periodType, type))
    }
    
    if (fiscalYear) {
      const year = parseInt(fiscalYear)
      if (!isNaN(year)) {
        conditions.push(eq(budgetPeriods.fiscalYear, year))
      }
    }
    
    if (active !== undefined) {
      conditions.push(eq(budgetPeriods.isActive, active === 'true'))
    }
    
    // Build and execute query
    const baseQuery = db.select().from(budgetPeriods)
    const result = conditions.length > 0 
      ? await baseQuery.where(and(...conditions)).orderBy(desc(budgetPeriods.fiscalYear), desc(budgetPeriods.startDate))
      : await baseQuery.orderBy(desc(budgetPeriods.fiscalYear), desc(budgetPeriods.startDate))
    
    return c.json({ success: true, data: result })
  } catch (error: unknown) {
    console.error('Error fetching budget periods:', error)
    return c.json({ 
      success: false,
      error: 'Failed to fetch budget periods', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// POST /api/budgets/periods - Create budget period
budgetsRouter.post('/periods', async (c) => {
  try {
    const body = await c.req.json() as CreateBudgetPeriodRequest
    
    const validationError = validateBudgetPeriodData(body)
    if (validationError) {
      return c.json({ success: false, error: validationError }, 400)
    }
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    const user = c.get('user')
    
    if (!user) {
      return c.json({ success: false, error: 'User not authenticated' }, 401)
    }
    
    // Check for overlapping periods
    const overlapping = await db.select()
      .from(budgetPeriods)
      .where(
        and(
          eq(budgetPeriods.periodType, body.type),
          gte(budgetPeriods.endDate, body.startDate),
          lte(budgetPeriods.startDate, body.endDate)
        )
      )
    
    if (overlapping.length > 0) {
      return c.json({ success: false, error: 'Period overlaps with existing period' }, 400)
    }
    
    const periodData: InferInsertModel<typeof budgetPeriods> = {
      name: body.name.trim(),
      periodType: body.type,
      startDate: body.startDate,
      endDate: body.endDate,
      fiscalYear: body.fiscalYear,
      description: body.description?.trim() || null,
      isActive: body.isActive !== false,
      createdBy: user.id
    }
    
    const result = await db.insert(budgetPeriods)
      .values(periodData)
      .returning()
    
    return c.json({ 
      success: true,
      data: result[0],
      message: 'Budget period created successfully'
    }, 201)
  } catch (error: unknown) {
    console.error('Error creating budget period:', error)
    return c.json({ 
      success: false,
      error: 'Failed to create budget period', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// GET /api/budgets/periods/:id - Get specific budget period
budgetsRouter.get('/periods/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid period ID' }, 400)
    }
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    const result = await db.select()
      .from(budgetPeriods)
      .where(eq(budgetPeriods.id, id))
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'Budget period not found' }, 404)
    }
    
    return c.json({ success: true, data: result[0] })
  } catch (error: unknown) {
    console.error('Error fetching budget period:', error)
    return c.json({ 
      success: false,
      error: 'Failed to fetch budget period', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// PUT /api/budgets/periods/:id - Update budget period
budgetsRouter.put('/periods/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid period ID' }, 400)
    }

    const body = await c.req.json() as Partial<CreateBudgetPeriodRequest>
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    // Check if period exists
    const existing = await db.select()
      .from(budgetPeriods)
      .where(eq(budgetPeriods.id, id))
    
    if (existing.length === 0) {
      return c.json({ success: false, error: 'Budget period not found' }, 404)
    }
    
    // Build update object
    const updateData: Partial<InferInsertModel<typeof budgetPeriods>> = {}
    if (body.name) updateData.name = body.name.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    
    const result = await db.update(budgetPeriods)
      .set(updateData)
      .where(eq(budgetPeriods.id, id))
      .returning()
    
    return c.json({ 
      success: true,
      data: result[0],
      message: 'Budget period updated successfully'
    })
  } catch (error: unknown) {
    console.error('Error updating budget period:', error)
    return c.json({ 
      success: false,
      error: 'Failed to update budget period', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// DELETE /api/budgets/periods/:id - Delete budget period
budgetsRouter.delete('/periods/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid period ID' }, 400)
    }
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    // Check if period exists
    const existing = await db.select()
      .from(budgetPeriods)
      .where(eq(budgetPeriods.id, id))
    
    if (existing.length === 0) {
      return c.json({ success: false, error: 'Budget period not found' }, 404)
    }
    
    // Check if period has associated budgets
    const associatedBudgets = await db.select()
      .from(budgets)
      .where(eq(budgets.budgetPeriodId, id))
    
    if (associatedBudgets.length > 0) {
      return c.json({ 
        success: false, 
        error: 'Cannot delete period with associated budgets' 
      }, 400)
    }
    
    await db.delete(budgetPeriods)
      .where(eq(budgetPeriods.id, id))
    
    return c.json({ 
      success: true,
      message: 'Budget period deleted successfully'
    })
  } catch (error: unknown) {
    console.error('Error deleting budget period:', error)
    return c.json({ 
      success: false,
      error: 'Failed to delete budget period', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// GET /api/budgets - List budgets
budgetsRouter.get('/', async (c) => {
  try {
    const { periodId, categoryId, status, includeAllocations } = c.req.query()
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    const conditions = []
    
    if (periodId) {
      const id = parseInt(periodId)
      if (!isNaN(id)) {
        conditions.push(eq(budgets.budgetPeriodId, id))
      }
    }
    
    if (categoryId) {
      const id = parseInt(categoryId)
      if (!isNaN(id)) {
        conditions.push(eq(budgets.categoryId, id))
      }
    }
    
    if (status) {
      conditions.push(eq(budgets.status, status))
    }
    
    // Build and execute query
    const baseQuery = db.select({
      budget: budgets,
      period: budgetPeriods,
      category: categories
    })
    .from(budgets)
    .leftJoin(budgetPeriods, eq(budgets.budgetPeriodId, budgetPeriods.id))
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    
    const result = conditions.length > 0 
      ? await baseQuery.where(and(...conditions)).orderBy(desc(budgets.createdAt))
      : await baseQuery.orderBy(desc(budgets.createdAt))
    
    // Include allocations if requested
    if (includeAllocations === 'true') {
      const budgetsWithAllocations = await Promise.all(
        result.map(async (item) => {
          const allocations = await db.select({
            allocation: budgetAllocations,
            category: categories
          })
          .from(budgetAllocations)
          .leftJoin(categories, eq(budgetAllocations.categoryId, categories.id))
          .where(eq(budgetAllocations.budgetId, item.budget.id))
          .orderBy(asc(budgetAllocations.priority), asc(categories.name))
          
          return {
            ...item,
            allocations
          }
        })
      )
      
      return c.json({ success: true, data: budgetsWithAllocations })
    }
    
    return c.json({ success: true, data: result })
  } catch (error: unknown) {
    console.error('Error fetching budgets:', error)
    return c.json({ 
      success: false,
      error: 'Failed to fetch budgets', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// GET /api/budgets/:id - Get specific budget
budgetsRouter.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid budget ID' }, 400)
    }
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    // Get budget with period and category info
    const result = await db.select({
      budget: budgets,
      period: budgetPeriods,
      category: categories
    })
    .from(budgets)
    .leftJoin(budgetPeriods, eq(budgets.budgetPeriodId, budgetPeriods.id))
    .leftJoin(categories, eq(budgets.categoryId, categories.id))
    .where(eq(budgets.id, id))
    
    if (result.length === 0) {
      return c.json({ success: false, error: 'Budget not found' }, 404)
    }
    
    const budgetData = result[0]
    
    // Get allocations
    const allocations = await db.select({
      allocation: budgetAllocations,
      category: categories
    })
    .from(budgetAllocations)
    .leftJoin(categories, eq(budgetAllocations.categoryId, categories.id))
    .where(eq(budgetAllocations.budgetId, id))
    .orderBy(asc(budgetAllocations.priority), asc(categories.name))
    
    // Get revisions
    const revisions = await db.select()
      .from(budgetRevisions)
      .where(eq(budgetRevisions.budgetId, id))
      .orderBy(desc(budgetRevisions.createdAt))
    
    return c.json({ 
      success: true,
      data: {
        ...budgetData,
        allocations,
        revisions
      }
    })
  } catch (error: unknown) {
    console.error('Error fetching budget:', error)
    return c.json({ 
      success: false,
      error: 'Failed to fetch budget', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// POST /api/budgets - Create budget
budgetsRouter.post('/', async (c) => {
  try {
    const body = await c.req.json() as CreateBudgetRequest
    
    const validationError = validateBudgetData(body)
    if (validationError) {
      return c.json({ success: false, error: validationError }, 400)
    }
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    const user = c.get('user')
    
    if (!user) {
      return c.json({ success: false, error: 'User not authenticated' }, 401)
    }
    
    // Verify period exists
    const period = await db.select()
      .from(budgetPeriods)
      .where(eq(budgetPeriods.id, body.periodId))
    
    if (period.length === 0) {
      return c.json({ success: false, error: 'Budget period not found' }, 400)
    }
    
    // Verify category exists (if provided)
    if (body.categoryId) {
      const category = await db.select()
        .from(categories)
        .where(eq(categories.id, body.categoryId))
      
      if (category.length === 0) {
        return c.json({ success: false, error: 'Category not found' }, 400)
      }
    }
    
    const budgetData: InferInsertModel<typeof budgets> = {
      budgetPeriodId: body.periodId,
      categoryId: body.categoryId || null,
      name: body.name.trim(),
      description: body.description?.trim() || null,
      plannedAmount: body.totalAmount,
      budgetType: body.budgetType || 'EXPENSE',
      status: body.status || 'draft',
      createdBy: user.id,
      tags: body.tags ? JSON.stringify(body.tags) : null,
      notes: body.notes || null
    }
    
    const result = await db.insert(budgets)
      .values(budgetData)
      .returning()
    
    return c.json({ 
      success: true,
      message: 'Budget created successfully',
      data: result[0]
    }, 201)
  } catch (error: unknown) {
    console.error('Error creating budget:', error)
    return c.json({ 
      success: false,
      error: 'Failed to create budget', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// PUT /api/budgets/:id - Update budget
budgetsRouter.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid budget ID' }, 400)
    }
    
    const body = await c.req.json() as UpdateBudgetRequest
    
    // Validate input if provided - only validate if required fields are present
    if (body.name !== undefined && body.periodId !== undefined && body.totalAmount !== undefined) {
      const validationError = validateBudgetData(body as CreateBudgetRequest)
      if (validationError) {
        return c.json({ success: false, error: validationError }, 400)
      }
    }
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    const user = c.get('user')
    
    if (!user) {
      return c.json({ success: false, error: 'User not authenticated' }, 401)
    }
    
    // Check if budget exists
    const existing = await db.select()
      .from(budgets)
      .where(eq(budgets.id, id))
    
    if (existing.length === 0) {
      return c.json({ success: false, error: 'Budget not found' }, 404)
    }
    
    const existingBudget = existing[0]
    
    // Check if budget is locked
    if (existingBudget.status === 'locked') {
      return c.json({ success: false, error: 'Cannot modify locked budget' }, 400)
    }
    
    // Create revision if significant changes
    const hasSignificantChanges = (
      (body.totalAmount !== undefined && body.totalAmount !== existingBudget.plannedAmount) ||
      (body.status !== undefined && body.status !== existingBudget.status)
    )
    
    if (hasSignificantChanges) {
      const previousAmount = existingBudget.plannedAmount
      const newAmount = body.totalAmount || existingBudget.plannedAmount
      const changeAmount = newAmount - previousAmount
      const changePercent = previousAmount > 0 ? (changeAmount / previousAmount) * 100 : 0
      
      // Calculate the next revision number
      const latestRevision = await db.select({ revisionNumber: budgetRevisions.revisionNumber })
        .from(budgetRevisions)
        .where(eq(budgetRevisions.budgetId, id))
        .orderBy(desc(budgetRevisions.revisionNumber))
        .limit(1)
      
      const nextRevisionNumber = latestRevision.length > 0 ? latestRevision[0].revisionNumber + 1 : 1
      
      await db.insert(budgetRevisions)
        .values({
          budgetId: id,
          revisionNumber: nextRevisionNumber,
          previousAmount,
          newAmount,
          changeAmount,
          changePercent,
          reason: 'Budget update',
          createdBy: user.id
        })
    }
    
    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }
    
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.totalAmount !== undefined) updateData.plannedAmount = body.totalAmount
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.status !== undefined) updateData.status = body.status
    if (body.approvalRequired !== undefined) updateData.approvalRequired = body.approvalRequired
    if (body.tags !== undefined) updateData.tags = body.tags ? JSON.stringify(body.tags) : null
    if (body.metadata !== undefined) updateData.metadata = body.metadata ? JSON.stringify(body.metadata) : null
    
    const result = await db.update(budgets)
      .set(updateData)
      .where(eq(budgets.id, id))
      .returning()
    
    return c.json({ 
      success: true,
      message: 'Budget updated successfully',
      data: result[0]
    })
  } catch (error: unknown) {
    console.error('Error updating budget:', error)
    return c.json({ 
      success: false,
      error: 'Failed to update budget', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// DELETE /api/budgets/:id - Delete budget
budgetsRouter.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ success: false, error: 'Invalid budget ID' }, 400)
    }
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    // Check if budget exists
    const existing = await db.select()
      .from(budgets)
      .where(eq(budgets.id, id))
    
    if (existing.length === 0) {
      return c.json({ success: false, error: 'Budget not found' }, 404)
    }
    
    const budget = existing[0]
    
    // For testing, allow deletion of any budget
    // In production, you might want stricter rules
    
    // Delete related allocations first
    await db.delete(budgetAllocations)
      .where(eq(budgetAllocations.budgetId, id))
    
    // Delete revisions
    await db.delete(budgetRevisions)
      .where(eq(budgetRevisions.budgetId, id))
    
    // Delete the budget
    const deletedBudgets = await db.delete(budgets)
      .where(eq(budgets.id, id))
      .returning()
    
    return c.json({ 
      success: true,
      message: 'Budget deleted successfully',
      data: deletedBudgets[0]
    })
  } catch (error: unknown) {
    console.error('Error deleting budget:', error)
    return c.json({ 
      success: false,
      error: 'Failed to delete budget', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// POST /api/budgets/:id/allocations - Create budget allocation
budgetsRouter.post('/:id/allocations', async (c) => {
  try {
    const budgetId = parseInt(c.req.param('id'))
    if (isNaN(budgetId)) {
      return c.json({ success: false, error: 'Invalid budget ID' }, 400)
    }
    
    const body = await c.req.json() as CreateAllocationRequest
    
    if (!body.categoryId || !body.allocatedAmount || body.allocatedAmount < 0) {
      return c.json({ success: false, error: 'Valid category ID and allocated amount are required' }, 400)
    }
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    const user = c.get('user')
    
    if (!user) {
      return c.json({ success: false, error: 'User not authenticated' }, 401)
    }
    
    // Verify budget exists
    const budget = await db.select()
      .from(budgets)
      .where(eq(budgets.id, budgetId))
    
    if (budget.length === 0) {
      return c.json({ success: false, error: 'Budget not found' }, 404)
    }
    
    // Verify category exists
    const category = await db.select()
      .from(categories)
      .where(eq(categories.id, body.categoryId))
    
    if (category.length === 0) {
      return c.json({ success: false, error: 'Category not found' }, 400)
    }
    
    // Check if allocation already exists for this category
    const existing = await db.select()
      .from(budgetAllocations)
      .where(
        and(
          eq(budgetAllocations.budgetId, budgetId),
          eq(budgetAllocations.categoryId, body.categoryId)
        )
      )
    
    if (existing.length > 0) {
      return c.json({ success: false, error: 'Allocation already exists for this category' }, 400)
    }
    
    const allocationData: InferInsertModel<typeof budgetAllocations> = {
      budgetId,
      categoryId: body.categoryId,
      allocatedAmount: body.allocatedAmount,
      allocatedPercent: body.allocatedPercent || 0,
      allocationType: body.allocationType || 'custom',
      description: body.description?.trim() || null,
      priority: body.priority || 0,
      constraints: body.constraints ? JSON.stringify(body.constraints) : null,
      createdBy: user.id
    }
    
    const result = await db.insert(budgetAllocations)
      .values(allocationData)
      .returning()
    
    return c.json({ 
      success: true,
      message: 'Budget allocation created successfully',
      data: result[0]
    }, 201)
  } catch (error: unknown) {
    console.error('Error creating budget allocation:', error)
    return c.json({ 
      success: false,
      error: 'Failed to create budget allocation', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// GET /api/budgets/summary - Budget summary and analytics
budgetsRouter.get('/summary', async (c) => {
  try {
    const { periodId, categoryId } = c.req.query()
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    // Get budget totals
    const budgetConditions = []
    
    if (periodId) {
      const id = parseInt(periodId)
      if (!isNaN(id)) {
        budgetConditions.push(eq(budgets.budgetPeriodId, id))
      }
    }
    
    const budgetQuery = db.select({
      totalBudgets: count(budgets.id),
      totalAmount: sum(budgets.plannedAmount),
      status: budgets.status
    })
    .from(budgets)
    
    const budgetSummary = budgetConditions.length > 0
      ? await budgetQuery.where(and(...budgetConditions)).groupBy(budgets.status)
      : await budgetQuery.groupBy(budgets.status)
    
    // Get allocation totals
    const allocationConditions = []
    
    if (categoryId) {
      const id = parseInt(categoryId)
      if (!isNaN(id)) {
        allocationConditions.push(eq(budgetAllocations.categoryId, id))
      }
    }
    
    const allocationQuery = db.select({
      totalAllocations: count(budgetAllocations.id),
      totalAllocated: sum(budgetAllocations.allocatedAmount),
      categoryId: budgetAllocations.categoryId
    })
    .from(budgetAllocations)
    
    const allocationSummary = allocationConditions.length > 0
      ? await allocationQuery.where(and(...allocationConditions)).groupBy(budgetAllocations.categoryId)
      : await allocationQuery.groupBy(budgetAllocations.categoryId)
    
    return c.json({ 
      budgetSummary,
      allocationSummary
    })
  } catch (error: unknown) {
    console.error('Error fetching budget summary:', error)
    return c.json({ 
      error: 'Failed to fetch budget summary', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

export default budgetsRouter