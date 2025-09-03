package repositories

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"

	"finance-manager/internal/models"
)

// TransactionRepository defines the interface for transaction data operations
type TransactionRepository interface {
	Create(transaction *models.Transaction) error
	GetByID(id uuid.UUID) (*models.Transaction, error)
	GetByUserID(userID uuid.UUID, filter *models.TransactionFilter) ([]*models.Transaction, error)
	GetByAccountID(accountID uuid.UUID, filter *models.TransactionFilter) ([]*models.Transaction, error)
	Update(transaction *models.Transaction) error
	Delete(id uuid.UUID) error
	GetSummaryByDateRange(startDate, endDate time.Time) (*models.TransactionSummary, error)
	CreateJournalEntry(entry *models.JournalEntry) error
}

// transactionRepository implements TransactionRepository interface
type transactionRepository struct {
	db *gorm.DB
}

// NewTransactionRepository creates a new transaction repository
func NewTransactionRepository(db *gorm.DB) TransactionRepository {
	return &transactionRepository{
		db: db,
	}
}

// Create creates a new transaction in the database
func (r *transactionRepository) Create(transaction *models.Transaction) error {
	if err := r.db.Create(transaction).Error; err != nil {
		return err
	}
	return nil
}

// GetByID retrieves a transaction by ID
func (r *transactionRepository) GetByID(id uuid.UUID) (*models.Transaction, error) {
	var transaction models.Transaction
	if err := r.db.Where("id = ?", id).First(&transaction).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, models.ErrTransactionNotFound
		}
		return nil, err
	}
	return &transaction, nil
}

// GetByUserID retrieves transactions for a user with optional filtering
func (r *transactionRepository) GetByUserID(userID uuid.UUID, filter *models.TransactionFilter) ([]*models.Transaction, error) {
	query := r.db.Preload("JournalEntries").Preload("JournalEntries.Account")

	// Apply filters
	query = r.applyFilters(query, filter)

	var transactions []*models.Transaction
	if err := query.Order("transaction_date DESC, created_at DESC").Find(&transactions).Error; err != nil {
		return nil, err
	}
	return transactions, nil
}

// GetByAccountID retrieves transactions for an account with optional filtering
func (r *transactionRepository) GetByAccountID(accountID uuid.UUID, filter *models.TransactionFilter) ([]*models.Transaction, error) {
	query := r.db.Joins("JOIN journal_entries ON transactions.id = journal_entries.transaction_id").
		Where("journal_entries.account_id = ?", accountID).
		Preload("JournalEntries").Preload("JournalEntries.Account")

	// Apply filters
	query = r.applyFilters(query, filter)

	var transactions []*models.Transaction
	if err := query.Order("transaction_date DESC, created_at DESC").Find(&transactions).Error; err != nil {
		return nil, err
	}
	return transactions, nil
}

// Update updates an existing transaction
func (r *transactionRepository) Update(transaction *models.Transaction) error {
	result := r.db.Save(transaction)
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return models.ErrTransactionNotFound
	}
	return nil
}

// Delete soft deletes a transaction by ID
func (r *transactionRepository) Delete(id uuid.UUID) error {
	result := r.db.Where("id = ?", id).Delete(&models.Transaction{})
	if result.Error != nil {
		return result.Error
	}
	if result.RowsAffected == 0 {
		return models.ErrTransactionNotFound
	}
	return nil
}

// GetSummaryByDateRange calculates transaction summary within a date range
func (r *transactionRepository) GetSummaryByDateRange(startDate, endDate time.Time) (*models.TransactionSummary, error) {
	var summary models.TransactionSummary

	// Get transaction count
	if err := r.db.Model(&models.Transaction{}).
		Where("transaction_date BETWEEN ? AND ?", startDate, endDate).
		Count(&summary.TransactionCount).Error; err != nil {
		return nil, err
	}

	// Calculate totals from journal entries
	type AmountSum struct {
		TotalDebits  float64
		TotalCredits float64
	}

	var amountSum AmountSum
	if err := r.db.Table("journal_entries").
		Select("COALESCE(SUM(debit_amount), 0) as total_debits, COALESCE(SUM(credit_amount), 0) as total_credits").
		Joins("JOIN transactions ON journal_entries.transaction_id = transactions.id").
		Where("transactions.transaction_date BETWEEN ? AND ?", startDate, endDate).
		Scan(&amountSum).Error; err != nil {
		return nil, err
	}

	summary.TotalIncome = decimal.NewFromFloat(amountSum.TotalCredits)
	summary.TotalExpenses = decimal.NewFromFloat(amountSum.TotalDebits)
	summary.NetIncome = summary.TotalIncome.Sub(summary.TotalExpenses)
	summary.StartDate = startDate
	summary.EndDate = endDate

	return &summary, nil
}

// applyFilters applies filtering conditions to the query
func (r *transactionRepository) applyFilters(query *gorm.DB, filter *models.TransactionFilter) *gorm.DB {
	if filter == nil {
		return query
	}

	if !filter.StartDate.IsZero() {
		query = query.Where("transaction_date >= ?", filter.StartDate)
	}

	if !filter.EndDate.IsZero() {
		query = query.Where("transaction_date <= ?", filter.EndDate)
	}

	if filter.Reference != "" {
		query = query.Where("reference ILIKE ?", "%"+filter.Reference+"%")
	}

	if filter.Description != "" {
		query = query.Where("description ILIKE ?", "%"+filter.Description+"%")
	}

	if filter.MinAmount > 0 {
		query = query.Where("total_amount >= ?", filter.MinAmount)
	}

	if filter.MaxAmount > 0 {
		query = query.Where("total_amount <= ?", filter.MaxAmount)
	}

	if filter.Limit > 0 {
		query = query.Limit(filter.Limit)
	}

	if filter.Offset > 0 {
		query = query.Offset(filter.Offset)
	}

	return query
}

// CreateJournalEntry creates a new journal entry in the database
func (r *transactionRepository) CreateJournalEntry(entry *models.JournalEntry) error {
	if err := r.db.Create(entry).Error; err != nil {
		return err
	}
	return nil
}
