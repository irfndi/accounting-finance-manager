package models

import (
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// TransactionType represents the type of transaction
type TransactionType string

// Transaction types
const (
	TransactionTypeIncome  TransactionType = "income"
	TransactionTypeExpense TransactionType = "expense"
)

// TransactionStatus represents the status of a transaction
type TransactionStatus string

// Transaction statuses
const (
	TransactionStatusPending   TransactionStatus = "pending"
	TransactionStatusCompleted TransactionStatus = "completed"
	TransactionStatusCancelled TransactionStatus = "cancelled"
)

// Transaction represents a financial transaction
type Transaction struct {
	ID                    uuid.UUID       `json:"id" db:"id"`
	Reference             string          `json:"reference" db:"reference"`
	Description           string          `json:"description" db:"description"`
	TotalAmount           decimal.Decimal `json:"total_amount" db:"total_amount"`
	TransactionDate       time.Time       `json:"transaction_date" db:"transaction_date"`
	ReversedTransactionID *uuid.UUID      `json:"reversed_transaction_id,omitempty" db:"reversed_transaction_id"`
	CreatedAt             time.Time       `json:"created_at" db:"created_at"`
	UpdatedAt             time.Time       `json:"updated_at" db:"updated_at"`

	// Related journal entries
	JournalEntries []JournalEntry `json:"journal_entries,omitempty" gorm:"-"`
}

// JournalEntry represents a journal entry (debit or credit)
type JournalEntry struct {
	ID            uuid.UUID       `json:"id" db:"id"`
	TransactionID uuid.UUID       `json:"transaction_id" db:"transaction_id"`
	AccountID     uuid.UUID       `json:"account_id" db:"account_id"`
	DebitAmount   decimal.Decimal `json:"debit_amount" db:"debit_amount"`
	CreditAmount  decimal.Decimal `json:"credit_amount" db:"credit_amount"`
	Description   string          `json:"description,omitempty" db:"description"`
	CreatedAt     time.Time       `json:"created_at" db:"created_at"`

	// Related account information
	Account *Account `json:"account,omitempty" gorm:"-"`
}

// CreateTransactionRequest represents the request to create a new transaction
type CreateTransactionRequest struct {
	Reference       string                      `json:"reference" binding:"required,max=50"`
	Description     string                      `json:"description" binding:"required"`
	TransactionDate time.Time                   `json:"transaction_date" binding:"required"`
	JournalEntries  []CreateJournalEntryRequest `json:"journal_entries" binding:"required,min=2,dive"`
}

// CreateJournalEntryRequest represents the request to create a journal entry
type CreateJournalEntryRequest struct {
	AccountID    uuid.UUID       `json:"account_id" binding:"required"`
	DebitAmount  decimal.Decimal `json:"debit_amount,omitempty"`
	CreditAmount decimal.Decimal `json:"credit_amount,omitempty"`
	Description  string          `json:"description,omitempty"`
}

// UpdateTransactionRequest represents the request to update a transaction
type UpdateTransactionRequest struct {
	Description     string    `json:"description,omitempty"`
	TransactionDate time.Time `json:"transaction_date,omitempty"`
}

// TransactionFilter represents filters for transaction queries
type TransactionFilter struct {
	StartDate   time.Time         `json:"start_date,omitempty" form:"start_date"`
	EndDate     time.Time         `json:"end_date,omitempty" form:"end_date"`
	AccountID   uuid.UUID         `json:"account_id,omitempty" form:"account_id"`
	MinAmount   float64           `json:"min_amount,omitempty" form:"min_amount"`
	MaxAmount   float64           `json:"max_amount,omitempty" form:"max_amount"`
	Reference   string            `json:"reference,omitempty" form:"reference"`
	Description string            `json:"description,omitempty" form:"description"`
	Type        TransactionType   `json:"type,omitempty" form:"type"`
	Status      TransactionStatus `json:"status,omitempty" form:"status"`
	Category    string            `json:"category,omitempty" form:"category"`
	Limit       int               `json:"limit,omitempty" form:"limit"`
	Offset      int               `json:"offset,omitempty" form:"offset"`
}

// TransactionSummary represents transaction summary information
type TransactionSummary struct {
	TransactionCount int64           `json:"transaction_count"`
	TotalIncome      decimal.Decimal `json:"total_income"`
	TotalExpenses    decimal.Decimal `json:"total_expenses"`
	NetIncome        decimal.Decimal `json:"net_income"`
	StartDate        time.Time       `json:"start_date"`
	EndDate          time.Time       `json:"end_date"`
}

// TrialBalance represents the trial balance
type TrialBalance struct {
	Accounts     []TrialBalanceAccount `json:"accounts"`
	TotalDebits  decimal.Decimal       `json:"total_debits"`
	TotalCredits decimal.Decimal       `json:"total_credits"`
	GeneratedAt  time.Time             `json:"generated_at"`
}

// TrialBalanceAccount represents an account in the trial balance
type TrialBalanceAccount struct {
	AccountID   uuid.UUID       `json:"account_id"`
	AccountCode string          `json:"account_code"`
	AccountName string          `json:"account_name"`
	AccountType AccountType     `json:"account_type"`
	DebitTotal  decimal.Decimal `json:"debit_total"`
	CreditTotal decimal.Decimal `json:"credit_total"`
	Balance     decimal.Decimal `json:"balance"`
}

// TransactionResponse represents the response format for transaction operations
type TransactionResponse struct {
	ID                    uuid.UUID       `json:"id"`
	Reference             string          `json:"reference"`
	Description           string          `json:"description"`
	TotalAmount           decimal.Decimal `json:"total_amount"`
	TransactionDate       time.Time       `json:"transaction_date"`
	ReversedTransactionID *uuid.UUID      `json:"reversed_transaction_id,omitempty"`
	CreatedAt             time.Time       `json:"created_at"`
	UpdatedAt             time.Time       `json:"updated_at"`
	JournalEntries        []JournalEntry  `json:"journal_entries,omitempty"`
}
