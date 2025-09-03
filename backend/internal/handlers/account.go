package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"

	"finance-manager/internal/models"
	"finance-manager/internal/services"
)

// AccountHandler handles account-related HTTP requests
type AccountHandler struct {
	accountService services.AccountService
}

// NewAccountHandler creates a new account handler
func NewAccountHandler(accountService services.AccountService) *AccountHandler {
	return &AccountHandler{
		accountService: accountService,
	}
}

// CreateAccount handles account creation
// @Summary Create a new account
// @Description Create a new financial account for the user
// @Tags accounts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param request body models.CreateAccountRequest true "Account creation data"
// @Success 201 {object} models.AccountResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Router /accounts [post]
func (h *AccountHandler) CreateAccount(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.NewErrorResponse(models.ErrUnauthorized))
		return
	}

	var req models.CreateAccountRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrBadRequest, err.Error()))
		return
	}

	account, err := h.accountService.Create(userID.(uuid.UUID), &req)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusCreated, account)
}

// GetAccounts handles getting user's accounts
// @Summary Get user accounts
// @Description Get all accounts for the current user
// @Tags accounts
// @Security BearerAuth
// @Produce json
// @Param type query string false "Filter by account type"
// @Success 200 {array} models.AccountResponse
// @Failure 401 {object} models.ErrorResponse
// @Router /accounts [get]
func (h *AccountHandler) GetAccounts(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.NewErrorResponse(models.ErrUnauthorized))
		return
	}

	accountType := c.Query("type")
	var accounts []*models.AccountResponse
	var err error

	if accountType != "" {
		accounts, err = h.accountService.GetByUserIDAndType(userID.(uuid.UUID), models.AccountType(accountType))
	} else {
		accounts, err = h.accountService.GetByUserID(userID.(uuid.UUID))
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusOK, accounts)
}

// GetAccount handles getting a specific account
// @Summary Get account by ID
// @Description Get a specific account by its ID
// @Tags accounts
// @Security BearerAuth
// @Produce json
// @Param id path int true "Account ID"
// @Success 200 {object} models.AccountResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 403 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Router /accounts/{id} [get]
func (h *AccountHandler) GetAccount(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrBadRequest))
		return
	}

	account, err := h.accountService.GetByID(id)
	if err != nil {
		if err == models.ErrAccountNotFound {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(models.ErrAccountNotFound, err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusOK, account)
}

// UpdateAccount handles account updates
// @Summary Update account
// @Description Update an existing account
// @Tags accounts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Account ID"
// @Param request body models.UpdateAccountRequest true "Account update data"
// @Success 200 {object} models.AccountResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 403 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Router /accounts/{id} [put]
func (h *AccountHandler) UpdateAccount(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrBadRequest))
		return
	}

	var req models.UpdateAccountRequest
	if bindErr := c.ShouldBindJSON(&req); bindErr != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrBadRequest, bindErr.Error()))
		return
	}

	account, err := h.accountService.Update(id, &req)
	if err != nil {
		if err == models.ErrAccountNotFound {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(models.ErrAccountNotFound, err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusOK, account)
}

// DeleteAccount handles account deletion
// @Summary Delete account
// @Description Delete an existing account (soft delete)
// @Tags accounts
// @Security BearerAuth
// @Produce json
// @Param id path int true "Account ID"
// @Success 200 {object} map[string]string
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 403 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Router /accounts/{id} [delete]
func (h *AccountHandler) DeleteAccount(c *gin.Context) {
	id, err := uuid.Parse(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrBadRequest))
		return
	}

	err = h.accountService.Delete(id)
	if err != nil {
		if err == models.ErrAccountNotFound {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(models.ErrAccountNotFound, err.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// GetAccountSummary handles getting account summary
// @Summary Get account summary
// @Description Get summary of all accounts for the user
// @Tags accounts
// @Security BearerAuth
// @Produce json
// @Success 200 {object} models.AccountSummary
// @Failure 401 {object} models.ErrorResponse
// @Router /accounts/summary [get]
func (h *AccountHandler) GetAccountSummary(c *gin.Context) {
	userID, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.NewErrorResponse(models.ErrUnauthorized))
		return
	}

	summary, err := h.accountService.GetSummary(userID.(uuid.UUID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, err.Error()))
		return
	}

	c.JSON(http.StatusOK, summary)
}

// UpdateAccountBalance handles manual balance updates
// @Summary Update account balance
// @Description Manually update account balance
// @Tags accounts
// @Security BearerAuth
// @Accept json
// @Produce json
// @Param id path int true "Account ID"
// @Param request body object{amount=number} true "Balance update data"
// @Success 200 {object} models.AccountResponse
// @Failure 400 {object} models.ErrorResponse
// @Failure 401 {object} models.ErrorResponse
// @Failure 403 {object} models.ErrorResponse
// @Failure 404 {object} models.ErrorResponse
// @Router /accounts/{id}/balance [patch]
func (h *AccountHandler) UpdateAccountBalance(c *gin.Context) {
	_, exists := c.Get("userID")
	if !exists {
		c.JSON(http.StatusUnauthorized, models.NewErrorResponse(models.ErrUnauthorized))
		return
	}

	id, parseErr := uuid.Parse(c.Param("id"))
	if parseErr != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrBadRequest, "Invalid account ID"))
		return
	}

	var req struct {
		Amount float64 `json:"amount" binding:"required"`
	}
	if bindErr := c.ShouldBindJSON(&req); bindErr != nil {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrBadRequest, bindErr.Error()))
		return
	}

	// Parse and validate amount
	amount := decimal.NewFromFloat(req.Amount)
	if amount.LessThanOrEqual(decimal.Zero) {
		c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrInvalidAmount, "Amount must be positive"))
		return
	}

	updateErr := h.accountService.UpdateBalance(id, amount)
	if updateErr != nil {
		if updateErr == models.ErrAccountNotFound {
			c.JSON(http.StatusNotFound, models.NewErrorResponse(models.ErrAccountNotFound, updateErr.Error()))
			return
		}
		if updateErr == models.ErrInsufficientFunds {
			c.JSON(http.StatusBadRequest, models.NewErrorResponse(models.ErrInsufficientFunds, updateErr.Error()))
			return
		}
		c.JSON(http.StatusInternalServerError, models.NewErrorResponse(models.ErrInternalServer, updateErr.Error()))
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Balance updated successfully"})
}

// TransferFunds transfers funds between accounts
// @Summary Transfer funds between accounts
// @Description Transfer funds from one account to another
// @Tags accounts
// @Accept json
// @Produce json
// @Param request body models.TransferRequest true "Transfer request"
// @Success 200 {object} map[string]string
// @Failure 400 {object} map[string]string
// @Failure 500 {object} map[string]string
// @Router /accounts/transfer [post]
// @Security BearerAuth
func (h *AccountHandler) TransferFunds(c *gin.Context) {
	_, exists := c.Get("user_id")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	var req models.TransferRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Verify that the from account exists
	_, err := h.accountService.GetByID(req.FromAccountID)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "From account not found"})
		return
	}

	err = h.accountService.TransferFunds(req.FromAccountID, req.ToAccountID, req.Amount, req.Description)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Transfer completed successfully"})
}

// GetChartOfAccounts handles getting the chart of accounts
// @Summary Get chart of accounts
// @Description Get all account types and categories
// @Tags accounts
// @Security BearerAuth
// @Produce json
// @Success 200 {array} models.AccountType
// @Failure 401 {object} models.ErrorResponse
// @Router /accounts/chart [get]
func (h *AccountHandler) GetChartOfAccounts(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User ID not found in context",
		})
		return
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid user ID",
			Message: err.Error(),
		})
		return
	}

	chartOfAccounts, err := h.accountService.GetChartOfAccounts(userUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to get chart of accounts",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, chartOfAccounts)
}

// GetAccountBalances handles getting account balances
// @Summary Get account balances
// @Description Get balances for all user accounts
// @Tags accounts
// @Security BearerAuth
// @Produce json
// @Success 200 {array} models.AccountBalance
// @Failure 401 {object} models.ErrorResponse
// @Router /accounts/balances [get]
func (h *AccountHandler) GetAccountBalances(c *gin.Context) {
	userID := c.GetString("user_id")
	if userID == "" {
		c.JSON(http.StatusUnauthorized, models.ErrorResponse{
			Error:   "Unauthorized",
			Message: "User ID not found in context",
		})
		return
	}

	userUUID, err := uuid.Parse(userID)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.ErrorResponse{
			Error:   "Invalid user ID",
			Message: err.Error(),
		})
		return
	}

	balances, err := h.accountService.GetAccountBalances(userUUID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.ErrorResponse{
			Error:   "Failed to get account balances",
			Message: err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, balances)
}
