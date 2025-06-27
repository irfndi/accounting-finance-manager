/**
 * Categories API Routes
 * Corporate Finance Manager - Transaction and expense categories management
 */

import { Hono } from 'hono'
import { eq, and, isNull, desc, asc, count } from 'drizzle-orm'
import { categories, categoryStats, journalEntries, transactions, createDatabase } from '../../../db/index.js'
import type { InferInsertModel } from 'drizzle-orm'
import { authMiddleware } from '../../middleware/auth'
import type { AppContext } from '../../types'

// Create categories router
const categoriesRouter = new Hono<AppContext>()

// Apply authentication middleware to all routes
categoriesRouter.use('*', authMiddleware)

// Validation schemas
const categoryTypes = ['INCOME', 'EXPENSE', 'TRANSFER'] as const
const budgetPeriods = ['monthly', 'quarterly', 'yearly'] as const

interface CreateCategoryRequest {
  name: string
  description?: string
  code?: string
  type: typeof categoryTypes[number]
  subtype?: string
  parentId?: number
  color?: string
  icon?: string
  sortOrder?: number
  defaultBudgetAmount?: number
  budgetPeriod?: typeof budgetPeriods[number]
  isActive?: boolean
  allowSubcategories?: boolean
  tags?: string[]
  rules?: object
}

interface UpdateCategoryRequest extends Partial<CreateCategoryRequest> {
  id: number
}

// Validation functions
function validateCategoryData(data: CreateCategoryRequest): string | null {
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    return 'Category name is required'
  }
  
  if (data.name.length > 100) {
    return 'Category name must be 100 characters or less'
  }
  
  if (!data.type || !categoryTypes.includes(data.type)) {
    return `Category type must be one of: ${categoryTypes.join(', ')}`
  }
  
  if (data.code && (data.code.length < 2 || data.code.length > 20)) {
    return 'Category code must be between 2 and 20 characters'
  }
  
  if (data.budgetPeriod && !budgetPeriods.includes(data.budgetPeriod)) {
    return `Budget period must be one of: ${budgetPeriods.join(', ')}`
  }
  
  if (data.defaultBudgetAmount && data.defaultBudgetAmount < 0) {
    return 'Default budget amount cannot be negative'
  }
  
  if (data.color && !/^#[0-9A-Fa-f]{6}$/.test(data.color)) {
    return 'Color must be a valid hex color code (e.g., #FF0000)'
  }
  
  return null
}

// GET /api/categories - List all categories
categoriesRouter.get('/', async (c) => {
  try {
    const { parentId, type, active, includeStats } = c.req.query()
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    // Apply filters
    const conditions = []
    
    if (parentId !== undefined) {
      if (parentId === 'null' || parentId === '') {
        conditions.push(isNull(categories.parentId))
      } else {
        const parentIdNum = parseInt(parentId)
        if (!isNaN(parentIdNum)) {
          conditions.push(eq(categories.parentId, parentIdNum))
        }
      }
    }
    
    if (type) {
      conditions.push(eq(categories.type, type))
    }
    
    if (active !== undefined) {
      conditions.push(eq(categories.isActive, active === 'true'))
    }
    
    // Build and execute query
    const baseQuery = db.select().from(categories)
    const result = conditions.length > 0 
      ? await baseQuery.where(and(...conditions)).orderBy(asc(categories.sortOrder), asc(categories.name))
      : await baseQuery.orderBy(asc(categories.sortOrder), asc(categories.name))
    
    // Include statistics if requested
    if (includeStats === 'true') {
      const statsPromises = result.map(async (category) => {
        const stats = await db.select()
          .from(categoryStats)
          .where(eq(categoryStats.categoryId, category.id))
          .orderBy(desc(categoryStats.period))
          .limit(12) // Last 12 periods
        
        return {
          ...category,
          stats
        }
      })
      
      const categoriesWithStats = await Promise.all(statsPromises)
      return c.json({ categories: categoriesWithStats })
    }
    
    return c.json({ categories: result })
  } catch (error) {
    console.error('Error fetching categories:', error)
    return c.json({ 
      error: 'Failed to fetch categories', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// GET /api/categories/:id - Get specific category
categoriesRouter.get('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ error: 'Invalid category ID' }, 400)
    }
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    const result = await db.select()
      .from(categories)
      .where(eq(categories.id, id))
    
    if (result.length === 0) {
      return c.json({ error: 'Category not found' }, 404)
    }
    
    const category = result[0]
    
    // Get children categories
    const children = await db.select()
      .from(categories)
      .where(eq(categories.parentId, id))
      .orderBy(asc(categories.sortOrder), asc(categories.name))
    
    // Get recent statistics
    const stats = await db.select()
      .from(categoryStats)
      .where(eq(categoryStats.categoryId, id))
      .orderBy(desc(categoryStats.period))
      .limit(12)
    
    return c.json({ 
      category: {
        ...category,
        children,
        stats
      }
    })
  } catch (error) {
    console.error('Error fetching category:', error)
    return c.json({ 
      error: 'Failed to fetch category', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// POST /api/categories - Create new category
categoriesRouter.post('/', async (c) => {
  try {
    const body = await c.req.json() as CreateCategoryRequest
    
    // Validate input
    const validationError = validateCategoryData(body)
    if (validationError) {
      return c.json({ error: validationError }, 400)
    }
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    const user = c.get('user')
    
    // Check if code is unique (if provided)
    if (body.code) {
      const existingCode = await db.select()
        .from(categories)
        .where(eq(categories.code, body.code))
      
      if (existingCode.length > 0) {
        return c.json({ error: 'Category code already exists' }, 400)
      }
    }
    
    // Validate parent category exists (if provided)
    let level = 0
    let path = `/${body.name}`
    
    if (body.parentId) {
      const parent = await db.select()
        .from(categories)
        .where(eq(categories.id, body.parentId))
      
      if (parent.length === 0) {
        return c.json({ error: 'Parent category not found' }, 400)
      }
      
      level = parent[0].level + 1
      path = `${parent[0].path}/${body.name}`
    }
    
    // Prepare category data
    const categoryData: InferInsertModel<typeof categories> = {
      name: body.name.trim(),
      description: body.description?.trim() || null,
      code: body.code?.trim() || null,
      type: body.type,
      subtype: body.subtype?.trim() || null,
      parentId: body.parentId || null,
      level,
      path,
      color: body.color || null,
      icon: body.icon || null,
      sortOrder: body.sortOrder || 0,
      defaultBudgetAmount: body.defaultBudgetAmount || null,
      budgetPeriod: body.budgetPeriod || 'monthly',
      isActive: body.isActive !== false,
      isSystem: false,
      allowSubcategories: body.allowSubcategories !== false,
      createdBy: user.id,
      tags: body.tags ? JSON.stringify(body.tags) : null,
      rules: body.rules ? JSON.stringify(body.rules) : null,
    }
    
    const result = await db.insert(categories)
      .values(categoryData)
      .returning()
    
    return c.json({ 
      message: 'Category created successfully',
      category: result[0]
    }, 201)
  } catch (error) {
    console.error('Error creating category:', error)
    return c.json({ 
      error: 'Failed to create category', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// PUT /api/categories/:id - Update category
categoriesRouter.put('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ error: 'Invalid category ID' }, 400)
    }
    
    const body = await c.req.json() as UpdateCategoryRequest
    
    // Validate input if provided
    if (body.name !== undefined || body.type !== undefined) {
      const validationError = validateCategoryData(body as CreateCategoryRequest)
      if (validationError) {
        return c.json({ error: validationError }, 400)
      }
    }
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    // Check if category exists
    const existing = await db.select()
      .from(categories)
      .where(eq(categories.id, id))
    
    if (existing.length === 0) {
      return c.json({ error: 'Category not found' }, 404)
    }
    
    const existingCategory = existing[0]
    
    // Check if code is unique (if being updated)
    if (body.code && body.code !== existingCategory.code) {
      const existingCode = await db.select()
        .from(categories)
        .where(eq(categories.code, body.code))
      
      if (existingCode.length > 0) {
        return c.json({ error: 'Category code already exists' }, 400)
      }
    }
    
    // Validate parent category (if being updated)
    let updateData: any = {
      updatedAt: new Date().toISOString()
    }
    
    if (body.name !== undefined) updateData.name = body.name.trim()
    if (body.description !== undefined) updateData.description = body.description?.trim() || null
    if (body.code !== undefined) updateData.code = body.code?.trim() || null
    if (body.type !== undefined) updateData.type = body.type
    if (body.subtype !== undefined) updateData.subtype = body.subtype?.trim() || null
    if (body.color !== undefined) updateData.color = body.color || null
    if (body.icon !== undefined) updateData.icon = body.icon || null
    if (body.sortOrder !== undefined) updateData.sortOrder = body.sortOrder
    if (body.defaultBudgetAmount !== undefined) updateData.defaultBudgetAmount = body.defaultBudgetAmount || null
    if (body.budgetPeriod !== undefined) updateData.budgetPeriod = body.budgetPeriod
    if (body.isActive !== undefined) updateData.isActive = body.isActive
    if (body.allowSubcategories !== undefined) updateData.allowSubcategories = body.allowSubcategories
    if (body.tags !== undefined) updateData.tags = body.tags ? JSON.stringify(body.tags) : null
    if (body.rules !== undefined) updateData.rules = body.rules ? JSON.stringify(body.rules) : null
    
    // Handle parent change (requires path recalculation)
    if (body.parentId !== undefined) {
      if (body.parentId === null) {
        updateData.parentId = null
        updateData.level = 0
        updateData.path = `/${updateData.name || existingCategory.name}`
      } else {
        const parent = await db.select()
          .from(categories)
          .where(eq(categories.id, body.parentId))
        
        if (parent.length === 0) {
          return c.json({ error: 'Parent category not found' }, 400)
        }
        
        updateData.parentId = body.parentId
        updateData.level = parent[0].level + 1
        updateData.path = `${parent[0].path}/${updateData.name || existingCategory.name}`
      }
    }
    
    const result = await db.update(categories)
      .set(updateData)
      .where(eq(categories.id, id))
      .returning()
    
    return c.json({ 
      message: 'Category updated successfully',
      category: result[0]
    })
  } catch (error) {
    console.error('Error updating category:', error)
    return c.json({ 
      error: 'Failed to update category', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// DELETE /api/categories/:id - Delete category
categoriesRouter.delete('/:id', async (c) => {
  try {
    const id = parseInt(c.req.param('id'))
    if (isNaN(id)) {
      return c.json({ error: 'Invalid category ID' }, 400)
    }
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    // Check if category exists
    const existing = await db.select()
      .from(categories)
      .where(eq(categories.id, id))
    
    if (existing.length === 0) {
      return c.json({ error: 'Category not found' }, 404)
    }
    
    const category = existing[0]
    
    // Check if category is system-defined
    if (category.isSystem) {
      return c.json({ error: 'Cannot delete system-defined category' }, 400)
    }
    
    // Check for child categories
    const children = await db.select()
      .from(categories)
      .where(eq(categories.parentId, id))
    
    if (children.length > 0) {
      return c.json({ 
        error: 'Cannot delete category with subcategories', 
        message: `This category has ${children.length} subcategories. Please delete or move them first.`
      }, 400)
    }
    
    // Check for associated transactions
    const associatedTransactions = await db.select({ count: count() })
      .from(transactions)
      .where(eq(transactions.category, id.toString()))
    
    if (associatedTransactions[0].count > 0) {
      return c.json({ 
        error: 'Cannot delete category with associated transactions', 
        message: `This category has ${associatedTransactions[0].count} associated transactions. Please reassign or delete them first.`
      }, 400)
    }
    
    // Delete the category
    await db.delete(categories)
      .where(eq(categories.id, id))
    
    return c.json({ 
      message: 'Category deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return c.json({ 
      error: 'Failed to delete category', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

// GET /api/categories/tree - Get hierarchical category tree
categoriesRouter.get('/tree', async (c) => {
  try {
    const { type, active } = c.req.query()
    
    const db = createDatabase(c.env.FINANCE_MANAGER_DB)
    
    const conditions = []
    
    if (type) {
      conditions.push(eq(categories.type, type))
    }
    
    if (active !== undefined) {
      conditions.push(eq(categories.isActive, active === 'true'))
    }
    
    // Build and execute query
    const baseQuery = db.select().from(categories)
    const allCategories = conditions.length > 0 
      ? await baseQuery.where(and(...conditions)).orderBy(asc(categories.level), asc(categories.sortOrder), asc(categories.name))
      : await baseQuery.orderBy(asc(categories.level), asc(categories.sortOrder), asc(categories.name))
    
    // Build hierarchical tree
    const categoryMap = new Map()
    const rootCategories: number[] = []
    
    // First pass: create map and identify roots
    allCategories.forEach((category: any) => {
      categoryMap.set(category.id, { ...category, children: [] })
      if (!category.parentId) {
        rootCategories.push(category.id)
      }
    })
    
    // Second pass: build parent-child relationships
    allCategories.forEach((category: any) => {
      if (category.parentId) {
        const parent = categoryMap.get(category.parentId)
        if (parent) {
          parent.children.push(categoryMap.get(category.id))
        }
      }
    })
    
    // Get root categories with their full trees
    const tree = rootCategories.map(id => categoryMap.get(id))
    
    return c.json({ tree })
  } catch (error) {
    console.error('Error fetching category tree:', error)
    return c.json({ 
      error: 'Failed to fetch category tree', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, 500)
  }
})

export default categoriesRouter