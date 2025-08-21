package handlers

import (
	"net/http"
	"time"

	"finance-manager/internal/middleware"
	"finance-manager/internal/models"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

// CategoryHandler handles category-related requests
type CategoryHandler struct {
	db *gorm.DB
}

// NewCategoryHandler creates a new category handler
func NewCategoryHandler(db *gorm.DB) *CategoryHandler {
	return &CategoryHandler{
		db: db,
	}
}

// GetCategories returns all categories for the user
func (h *CategoryHandler) GetCategories(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Get category type filter if provided
	categoryType := c.Query("type")

	var categories []models.Category
	query := h.db.Where("user_id = ?", userID)

	if categoryType != "" {
		query = query.Where("category_type = ?", categoryType)
	}

	err := query.Order("category_type, name").Find(&categories).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch categories"})
		return
	}

	c.JSON(http.StatusOK, categories)
}

// GetCategory returns a specific category by ID
func (h *CategoryHandler) GetCategory(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	categoryID := c.Param("id")
	if categoryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category ID is required"})
		return
	}

	var category models.Category
	err := h.db.Where("id = ? AND user_id = ?", categoryID, userID).First(&category).Error

	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	c.JSON(http.StatusOK, category)
}

// CreateCategory creates a new category
func (h *CategoryHandler) CreateCategory(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.CreateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if category name already exists for this user and type
	var existingCategory models.Category
	err := h.db.Where("name = ? AND category_type = ? AND user_id = ?", req.Name, req.CategoryType, userID).First(&existingCategory).Error
	if err == nil {
		c.JSON(http.StatusConflict, gin.H{"error": "Category with this name already exists for this type"})
		return
	}
	if err != gorm.ErrRecordNotFound {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Create category
	category := models.Category{
		ID:           uuid.New(),
		Name:         req.Name,
		Description:  req.Description,
		CategoryType: req.CategoryType,
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}

	if err := h.db.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create category"})
		return
	}

	c.JSON(http.StatusCreated, category)
}

// UpdateCategory updates an existing category
func (h *CategoryHandler) UpdateCategory(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	categoryID := c.Param("id")
	if categoryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category ID is required"})
		return
	}

	var req models.UpdateCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if category exists and belongs to user
	var existingCategory models.Category
	err := h.db.Where("id = ? AND user_id = ?", categoryID, userID).First(&existingCategory).Error

	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Check if new name conflicts with existing categories (excluding current one)
	if req.Name != "" && req.Name != existingCategory.Name {
		var conflictCategory models.Category
		err := h.db.Where("name = ? AND user_id = ? AND id != ?", req.Name, userID, categoryID).First(&conflictCategory).Error
		if err == nil {
			c.JSON(http.StatusConflict, gin.H{"error": "Category with this name already exists"})
			return
		}
		if err != gorm.ErrRecordNotFound {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
			return
		}
	}

	// Update category
	if req.Name != "" {
		existingCategory.Name = req.Name
	}
	if req.Description != "" {
		existingCategory.Description = req.Description
	}
	existingCategory.UpdatedAt = time.Now()

	if err := h.db.Save(&existingCategory).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update category"})
		return
	}

	c.JSON(http.StatusOK, existingCategory)
}

// DeleteCategory soft deletes a category
func (h *CategoryHandler) DeleteCategory(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	categoryID := c.Param("id")
	if categoryID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Category ID is required"})
		return
	}

	// Check if category exists and belongs to user
	var category models.Category
	err := h.db.Where("id = ? AND user_id = ?", categoryID, userID).First(&category).Error
	if err == gorm.ErrRecordNotFound {
		c.JSON(http.StatusNotFound, gin.H{"error": "Category not found"})
		return
	}
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Check if category is being used by any transactions
	var transactionCount int64
	err = h.db.Model(&models.Transaction{}).Where("category_id = ?", categoryID).Count(&transactionCount).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	if transactionCount > 0 {
		c.JSON(http.StatusConflict, gin.H{"error": "Cannot delete category that is being used by transactions"})
		return
	}

	// Delete category
	if err := h.db.Delete(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete category"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Category deleted successfully"})
}

// GetCategoryStats returns category usage statistics
func (h *CategoryHandler) GetCategoryStats(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse date range
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	// Get categories with transaction counts and totals
	type CategoryStat struct {
		ID               uuid.UUID `json:"id"`
		Name             string    `json:"name"`
		CategoryType     string    `json:"category_type"`
		TransactionCount int64     `json:"transaction_count"`
		TotalAmount      float64   `json:"total_amount"`
	}

	var stats []CategoryStat
	query := h.db.Table("categories c").
		Select("c.id, c.name, c.category_type, COUNT(t.id) as transaction_count, COALESCE(SUM(t.amount), 0) as total_amount").
		Joins("LEFT JOIN transactions t ON c.id = t.category_id").
		Where("c.user_id = ?", userID).
		Group("c.id, c.name, c.category_type")

	if startDate != "" {
		query = query.Where("t.transaction_date IS NULL OR t.transaction_date >= ?", startDate)
	}

	if endDate != "" {
		query = query.Where("t.transaction_date IS NULL OR t.transaction_date <= ?", endDate)
	}

	query = query.Order("total_amount DESC")

	if err := query.Scan(&stats).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch category stats"})
		return
	}

	c.JSON(http.StatusOK, stats)
}
