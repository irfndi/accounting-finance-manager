package handlers

import (
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"

	"finance-manager/internal/middleware"
	"finance-manager/internal/models"
)

// AccountAmount represents account balance data for reports
type AccountAmount struct {
	ID      string  `gorm:"column:id"`
	Code    string  `gorm:"column:code"`
	Name    string  `gorm:"column:name"`
	Balance float64 `gorm:"column:balance"`
}

// ReportsHandler handles financial reports
type ReportsHandler struct {
	db *gorm.DB
}

// NewReportsHandler creates a new reports handler
func NewReportsHandler(db *gorm.DB) *ReportsHandler {
	return &ReportsHandler{
		db: db,
	}
}

// GetTrialBalance generates a trial balance report
func (h *ReportsHandler) GetTrialBalance(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse date parameter (optional)
	asOfDate := c.Query("as_of_date")
	var asOf time.Time
	var err error

	if asOfDate != "" {
		asOf, err = time.Parse("2006-01-02", asOfDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}
	} else {
		asOf = time.Now()
	}

	// Define a struct for the query result
	type AccountBalance struct {
		AccountID   string  `gorm:"column:id"`
		AccountCode string  `gorm:"column:code"`
		AccountName string  `gorm:"column:name"`
		AccountType string  `gorm:"column:account_type"`
		Balance     float64 `gorm:"column:balance"`
	}

	var accountBalances []AccountBalance
	err = h.db.Table("accounts a").
		Select("a.id, a.code, a.name, a.account_type, COALESCE(SUM(CASE WHEN t.date <= ? THEN je.debit_amount - je.credit_amount ELSE 0 END), 0) as balance").
		Joins("LEFT JOIN journal_entries je ON a.id = je.account_id").
		Joins("LEFT JOIN transactions t ON je.transaction_id = t.id").
		Where("a.user_id = ? AND a.is_active = true", userID, asOf).
		Group("a.id, a.code, a.name, a.account_type").
		Order("a.account_type, a.code").
		Find(&accountBalances).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to generate trial balance"})
		return
	}

	accounts := []models.TrialBalanceAccount{}
	totalDebits := 0.0
	totalCredits := 0.0

	for _, ab := range accountBalances {
		var account models.TrialBalanceAccount
		account.AccountID = uuid.MustParse(ab.AccountID)
		account.AccountCode = ab.AccountCode
		account.AccountName = ab.AccountName
		account.AccountType = models.AccountType(ab.AccountType)
		balance := ab.Balance

		// Determine debit/credit based on account type and balance
		switch account.AccountType {
		case "asset", "expense":
			if balance >= 0 {
				account.DebitTotal = decimal.NewFromFloat(balance)
				totalDebits += balance
			} else {
				account.CreditTotal = decimal.NewFromFloat(-balance)
				totalCredits += -balance
			}
		case "liability", "equity", "revenue":
			if balance <= 0 {
				account.CreditTotal = decimal.NewFromFloat(-balance)
				totalCredits += -balance
			} else {
				account.DebitTotal = decimal.NewFromFloat(balance)
				totalDebits += balance
			}
		}

		account.Balance = decimal.NewFromFloat(balance)
		accounts = append(accounts, account)
	}

	trialBalance := models.TrialBalance{
		Accounts:     accounts,
		TotalDebits:  decimal.NewFromFloat(totalDebits),
		TotalCredits: decimal.NewFromFloat(totalCredits),
		GeneratedAt:  time.Now(),
	}

	c.JSON(http.StatusOK, trialBalance)
}

// GetProfitLoss generates a profit and loss statement
func (h *ReportsHandler) GetProfitLoss(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse date range
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Both start_date and end_date are required"})
		return
	}

	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format. Use YYYY-MM-DD"})
		return
	}

	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format. Use YYYY-MM-DD"})
		return
	}

	// Define a struct for the query result
	type AccountAmount struct {
		AccountID   string  `gorm:"column:id"`
		AccountCode string  `gorm:"column:code"`
		AccountName string  `gorm:"column:name"`
		Amount      float64 `gorm:"column:amount"`
	}

	// Get revenue accounts
	var revenueAmounts []AccountAmount
	err = h.db.Table("accounts a").
		Select("a.id, a.code, a.name, COALESCE(SUM(je.credit_amount - je.debit_amount), 0) as amount").
		Joins("LEFT JOIN journal_entries je ON a.id = je.account_id").
		Joins("LEFT JOIN transactions t ON je.transaction_id = t.id").
		Where("a.user_id = ? AND a.account_type = 'revenue' AND a.is_active = true AND t.date >= ? AND t.date <= ?", userID, start, end).
		Group("a.id, a.code, a.name").
		Having("SUM(je.credit_amount - je.debit_amount) != 0").
		Order("a.code").
		Find(&revenueAmounts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch revenue accounts"})
		return
	}

	revenueAccounts := []map[string]interface{}{}
	totalRevenue := 0.0

	for _, ra := range revenueAmounts {
		accountID := uuid.MustParse(ra.AccountID)
		revenueAccounts = append(revenueAccounts, map[string]interface{}{
			"account_id": accountID,
			"code":       ra.AccountCode,
			"name":       ra.AccountName,
			"amount":     ra.Amount,
		})
		totalRevenue += ra.Amount
	}

	// Get expense accounts
	var expenseAmounts []AccountAmount
	err = h.db.Table("accounts a").
		Select("a.id, a.code, a.name, COALESCE(SUM(je.debit_amount - je.credit_amount), 0) as amount").
		Joins("LEFT JOIN journal_entries je ON a.id = je.account_id").
		Joins("LEFT JOIN transactions t ON je.transaction_id = t.id").
		Where("a.user_id = ? AND a.account_type = 'expense' AND a.is_active = true AND t.date >= ? AND t.date <= ?", userID, start, end).
		Group("a.id, a.code, a.name").
		Having("SUM(je.debit_amount - je.credit_amount) != 0").
		Order("a.code").
		Find(&expenseAmounts).Error

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch expense accounts"})
		return
	}

	expenseAccounts := []map[string]interface{}{}
	totalExpenses := 0.0

	for _, ea := range expenseAmounts {
		accountID := uuid.MustParse(ea.AccountID)
		expenseAccounts = append(expenseAccounts, map[string]interface{}{
			"account_id": accountID,
			"code":       ea.AccountCode,
			"name":       ea.AccountName,
			"amount":     ea.Amount,
		})
		totalExpenses += ea.Amount
	}

	netIncome := totalRevenue - totalExpenses

	profitLoss := map[string]interface{}{
		"period": map[string]interface{}{
			"start_date": start.Format("2006-01-02"),
			"end_date":   end.Format("2006-01-02"),
		},
		"revenue": map[string]interface{}{
			"accounts": revenueAccounts,
			"total":    totalRevenue,
		},
		"expenses": map[string]interface{}{
			"accounts": expenseAccounts,
			"total":    totalExpenses,
		},
		"net_income": netIncome,
	}

	c.JSON(http.StatusOK, profitLoss)
}

// GetBalanceSheet generates a balance sheet
func (h *ReportsHandler) GetBalanceSheet(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse date parameter
	asOfDate := c.Query("as_of_date")
	var asOf time.Time
	var err error

	if asOfDate != "" {
		asOf, err = time.Parse("2006-01-02", asOfDate)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format. Use YYYY-MM-DD"})
			return
		}
	} else {
		asOf = time.Now()
	}

	// Get assets
	var assetAmounts []AccountAmount
	err = h.db.Table("accounts a").
		Select("a.id, a.code, a.name, COALESCE(SUM(CASE WHEN t.date <= ? THEN je.debit_amount - je.credit_amount ELSE 0 END), 0) as balance").
		Joins("LEFT JOIN journal_entries je ON a.id = je.account_id").
		Joins("LEFT JOIN transactions t ON je.transaction_id = t.id").
		Where("a.user_id = ? AND a.account_type = 'asset' AND a.is_active = true", userID).
		Group("a.id, a.code, a.name").
		Having("COALESCE(SUM(CASE WHEN t.date <= ? THEN je.debit_amount - je.credit_amount ELSE 0 END), 0) != 0", asOf).
		Order("a.code").
		Find(&assetAmounts, asOf).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch assets"})
		return
	}

	assets := []map[string]interface{}{}
	totalAssets := 0.0

	for _, asset := range assetAmounts {
		assets = append(assets, map[string]interface{}{
			"account_id": asset.ID,
			"code":       asset.Code,
			"name":       asset.Name,
			"balance":    asset.Balance,
		})
		totalAssets += asset.Balance
	}

	// Get liabilities
	var liabilityAmounts []AccountAmount
	err = h.db.Table("accounts a").
		Select("a.id, a.code, a.name, COALESCE(SUM(CASE WHEN t.date <= ? THEN je.credit_amount - je.debit_amount ELSE 0 END), 0) as balance").
		Joins("LEFT JOIN journal_entries je ON a.id = je.account_id").
		Joins("LEFT JOIN transactions t ON je.transaction_id = t.id").
		Where("a.user_id = ? AND a.account_type = 'liability' AND a.is_active = true", userID).
		Group("a.id, a.code, a.name").
		Having("COALESCE(SUM(CASE WHEN t.date <= ? THEN je.credit_amount - je.debit_amount ELSE 0 END), 0) != 0", asOf).
		Order("a.code").
		Find(&liabilityAmounts, asOf).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch liabilities"})
		return
	}

	liabilities := []map[string]interface{}{}
	totalLiabilities := 0.0

	for _, liability := range liabilityAmounts {
		liabilities = append(liabilities, map[string]interface{}{
			"account_id": liability.ID,
			"code":       liability.Code,
			"name":       liability.Name,
			"balance":    liability.Balance,
		})
		totalLiabilities += liability.Balance
	}

	// Get equity
	var equityAmounts []AccountAmount
	err = h.db.Table("accounts a").
		Select("a.id, a.code, a.name, COALESCE(SUM(CASE WHEN t.date <= ? THEN je.credit_amount - je.debit_amount ELSE 0 END), 0) as balance").
		Joins("LEFT JOIN journal_entries je ON a.id = je.account_id").
		Joins("LEFT JOIN transactions t ON je.transaction_id = t.id").
		Where("a.user_id = ? AND a.account_type = 'equity' AND a.is_active = true", userID).
		Group("a.id, a.code, a.name").
		Having("COALESCE(SUM(CASE WHEN t.date <= ? THEN je.credit_amount - je.debit_amount ELSE 0 END), 0) != 0", asOf).
		Order("a.code").
		Find(&equityAmounts, asOf).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch equity"})
		return
	}

	equity := []map[string]interface{}{}
	totalEquity := 0.0

	for _, equityAccount := range equityAmounts {
		equity = append(equity, map[string]interface{}{
			"account_id": equityAccount.ID,
			"code":       equityAccount.Code,
			"name":       equityAccount.Name,
			"balance":    equityAccount.Balance,
		})
		totalEquity += equityAccount.Balance
	}

	balanceSheet := map[string]interface{}{
		"as_of_date": asOf.Format("2006-01-02"),
		"assets": map[string]interface{}{
			"accounts": assets,
			"total":    totalAssets,
		},
		"liabilities": map[string]interface{}{
			"accounts": liabilities,
			"total":    totalLiabilities,
		},
		"equity": map[string]interface{}{
			"accounts": equity,
			"total":    totalEquity,
		},
		"total_liabilities_and_equity": totalLiabilities + totalEquity,
		"is_balanced":                  fmt.Sprintf("%.2f", totalAssets) == fmt.Sprintf("%.2f", totalLiabilities+totalEquity),
	}

	c.JSON(http.StatusOK, balanceSheet)
}

// GetCashFlow generates a cash flow statement
func (h *ReportsHandler) GetCashFlow(c *gin.Context) {
	userID, exists := middleware.GetUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not authenticated"})
		return
	}

	// Parse date range
	startDate := c.Query("start_date")
	endDate := c.Query("end_date")

	if startDate == "" || endDate == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Both start_date and end_date are required"})
		return
	}

	start, err := time.Parse("2006-01-02", startDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid start_date format. Use YYYY-MM-DD"})
		return
	}

	end, err := time.Parse("2006-01-02", endDate)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid end_date format. Use YYYY-MM-DD"})
		return
	}

	// Define struct for cash flow data
	type CashFlowData struct {
		Date        time.Time `gorm:"column:date"`
		Description string    `gorm:"column:description"`
		NetChange   float64   `gorm:"column:net_change"`
	}

	// Get cash account transactions
	var cashFlowData []CashFlowData
	err = h.db.Table("transactions t").
		Select("t.date, t.description, SUM(je.debit_amount - je.credit_amount) as net_change").
		Joins("JOIN journal_entries je ON t.id = je.transaction_id").
		Joins("JOIN accounts a ON je.account_id = a.id").
		Where("a.user_id = ? AND a.account_type = 'asset' AND (a.name ILIKE '%cash%' OR a.name ILIKE '%bank%' OR a.name ILIKE '%checking%' OR a.name ILIKE '%savings%') AND t.date >= ? AND t.date <= ?", userID, start, end).
		Group("t.id, t.date, t.description").
		Order("t.date").
		Find(&cashFlowData).Error
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch cash flow data"})
		return
	}

	cashFlows := []map[string]interface{}{}
	totalCashFlow := 0.0

	for _, flow := range cashFlowData {
		cashFlows = append(cashFlows, map[string]interface{}{
			"date":        flow.Date.Format("2006-01-02"),
			"description": flow.Description,
			"amount":      flow.NetChange,
		})
		totalCashFlow += flow.NetChange
	}

	cashFlowStatement := map[string]interface{}{
		"period": map[string]interface{}{
			"start_date": start.Format("2006-01-02"),
			"end_date":   end.Format("2006-01-02"),
		},
		"cash_flows":      cashFlows,
		"net_cash_change": totalCashFlow,
	}

	c.JSON(http.StatusOK, cashFlowStatement)
}
