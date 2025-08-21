package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// AccountType represents the type of account
type AccountType string

const (
	AccountTypeAsset     AccountType = "asset"
	AccountTypeLiability AccountType = "liability"
	AccountTypeEquity    AccountType = "equity"
	AccountTypeRevenue   AccountType = "revenue"
	AccountTypeExpense   AccountType = "expense"
)

// Account represents an account in the chart of accounts
type Account struct {
	ID          uuid.UUID       `json:"id" db:"id"`
	Code        string          `json:"code" db:"code"`
	Name        string          `json:"name" db:"name"`
	AccountType AccountType     `json:"account_type" db:"account_type"`
	ParentID    *uuid.UUID      `json:"parent_id,omitempty" db:"parent_id"`
	Balance     decimal.Decimal `json:"balance" db:"balance"`
	IsActive    bool            `json:"is_active" db:"is_active"`
	CreatedAt   time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at" db:"updated_at"`

	// Nested accounts for hierarchical display
	Children []Account `json:"children,omitempty" gorm:"-"`
}

// CreateAccountRequest represents the request to create a new account
type CreateAccountRequest struct {
	Code        string      `json:"code" binding:"required,max=20"`
	Name        string      `json:"name" binding:"required,max=255"`
	AccountType AccountType `json:"account_type" binding:"required,oneof=asset liability equity revenue expense"`
	ParentID    *uuid.UUID  `json:"parent_id,omitempty"`
}

// UpdateAccountRequest represents the request to update an account
type UpdateAccountRequest struct {
	Name     string     `json:"name,omitempty" binding:"omitempty,max=255"`
	ParentID *uuid.UUID `json:"parent_id,omitempty"`
	IsActive *bool      `json:"is_active,omitempty"`
}

// AccountBalance represents account balance information
type AccountBalance struct {
	AccountID   uuid.UUID       `json:"account_id"`
	AccountCode string          `json:"account_code"`
	AccountName string          `json:"account_name"`
	Balance     decimal.Decimal `json:"balance"`
	AccountType AccountType     `json:"account_type"`
}

// AccountSummary represents a summary of accounts by type
type AccountSummary struct {
	AccountType  AccountType     `json:"account_type"`
	TotalBalance decimal.Decimal `json:"total_balance"`
	AccountCount int             `json:"account_count"`
}

// ChartOfAccounts represents the hierarchical chart of accounts
type ChartOfAccounts struct {
	Accounts []Account `json:"accounts"`
}

// AccountTypeSummary represents summary information for an account type
type AccountTypeSummary struct {
	AccountType  AccountType     `json:"account_type"`
	TotalBalance decimal.Decimal `json:"total_balance"`
	AccountCount int             `json:"account_count"`
}

// TransferRequest represents the request to transfer funds between accounts
type TransferRequest struct {
	FromAccountID uuid.UUID       `json:"from_account_id" binding:"required"`
	ToAccountID   uuid.UUID       `json:"to_account_id" binding:"required"`
	Amount        decimal.Decimal `json:"amount" binding:"required"`
	Description   string          `json:"description" binding:"required"`
}

// AccountResponse represents the response format for account operations
type AccountResponse struct {
	ID          uuid.UUID       `json:"id"`
	Code        string          `json:"code"`
	Name        string          `json:"name"`
	Type        AccountType     `json:"type"`
	Balance     decimal.Decimal `json:"balance"`
	ParentID    *uuid.UUID      `json:"parent_id,omitempty"`
	Description string          `json:"description,omitempty"`
	IsActive    bool            `json:"is_active"`
	CreatedAt   time.Time       `json:"created_at"`
	UpdatedAt   time.Time       `json:"updated_at"`
}
