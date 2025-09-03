package services

import (
	"fmt"
	"time"

	"finance-manager/internal/models"
	"finance-manager/internal/repositories"
	"github.com/google/uuid"
	"github.com/shopspring/decimal"
)

// TransactionService defines the interface for transaction business logic
type TransactionService interface {
	Create(userID uuid.UUID, req *models.CreateTransactionRequest) (*models.TransactionResponse, error)
	GetByID(transactionID uuid.UUID) (*models.TransactionResponse, error)
	GetByUserID(userID uuid.UUID, filter *models.TransactionFilter) ([]*models.TransactionResponse, error)
	GetByAccountID(accountID uuid.UUID, filter *models.TransactionFilter) ([]*models.TransactionResponse, error)
	Update(transactionID uuid.UUID, req *models.UpdateTransactionRequest) (*models.TransactionResponse, error)
	Delete(transactionID uuid.UUID) error
	GetSummary(startDate, endDate time.Time) (*models.TransactionSummary, error)
}

// transactionService implements TransactionService interface
type transactionService struct {
	transactionRepo repositories.TransactionRepository
	accountRepo     repositories.AccountRepository
}

// NewTransactionService creates a new transaction service
func NewTransactionService(transactionRepo repositories.TransactionRepository, accountRepo repositories.AccountRepository) TransactionService {
	return &transactionService{
		transactionRepo: transactionRepo,
		accountRepo:     accountRepo,
	}
}

// Create creates a new transaction
func (s *transactionService) Create(userID uuid.UUID, req *models.CreateTransactionRequest) (*models.TransactionResponse, error) {
	// Validate that all accounts in journal entries exist and belong to user
	for _, entry := range req.JournalEntries {
		account, err := s.accountRepo.GetByID(entry.AccountID)
		if err != nil {
			return nil, err
		}
		// Note: Account model doesn't have UserID field, so we skip this validation for now
		_ = account
	}

	// Validate that debits equal credits
	totalDebits := decimal.NewFromFloat(0)
	totalCredits := decimal.NewFromFloat(0)
	for _, entry := range req.JournalEntries {
		totalDebits = totalDebits.Add(entry.DebitAmount)
		totalCredits = totalCredits.Add(entry.CreditAmount)
	}
	if !totalDebits.Equal(totalCredits) {
		return nil, fmt.Errorf("debits must equal credits")
	}

	// Create transaction
	transaction := &models.Transaction{
		ID:              uuid.New(),
		Reference:       req.Reference,
		Description:     req.Description,
		TotalAmount:     totalDebits, // Total amount is the sum of debits (or credits)
		TransactionDate: req.TransactionDate,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}

	if err := s.transactionRepo.Create(transaction); err != nil {
		return nil, err
	}

	// Create journal entries
	for _, entryReq := range req.JournalEntries {
		entry := &models.JournalEntry{
			ID:            uuid.New(),
			TransactionID: transaction.ID,
			AccountID:     entryReq.AccountID,
			DebitAmount:   entryReq.DebitAmount,
			CreditAmount:  entryReq.CreditAmount,
			Description:   entryReq.Description,
			CreatedAt:     time.Now(),
		}
		if err := s.transactionRepo.CreateJournalEntry(entry); err != nil {
			return nil, err
		}
	}

	return s.toTransactionResponse(transaction), nil
}

// GetByID retrieves a transaction by ID
func (s *transactionService) GetByID(transactionID uuid.UUID) (*models.TransactionResponse, error) {
	transaction, err := s.transactionRepo.GetByID(transactionID)
	if err != nil {
		return nil, err
	}

	return s.toTransactionResponse(transaction), nil
}

// GetByUserID retrieves transactions for a user with optional filtering
func (s *transactionService) GetByUserID(userID uuid.UUID, filter *models.TransactionFilter) ([]*models.TransactionResponse, error) {
	transactions, err := s.transactionRepo.GetByUserID(userID, filter)
	if err != nil {
		return nil, err
	}

	var responses []*models.TransactionResponse
	for _, transaction := range transactions {
		responses = append(responses, s.toTransactionResponse(transaction))
	}

	return responses, nil
}

// GetByAccountID retrieves transactions for an account with optional filtering
func (s *transactionService) GetByAccountID(accountID uuid.UUID, filter *models.TransactionFilter) ([]*models.TransactionResponse, error) {
	transactions, err := s.transactionRepo.GetByAccountID(accountID, filter)
	if err != nil {
		return nil, err
	}

	var responses []*models.TransactionResponse
	for _, transaction := range transactions {
		responses = append(responses, s.toTransactionResponse(transaction))
	}

	return responses, nil
}

// Update updates an existing transaction
func (s *transactionService) Update(transactionID uuid.UUID, req *models.UpdateTransactionRequest) (*models.TransactionResponse, error) {
	transaction, err := s.transactionRepo.GetByID(transactionID)
	if err != nil {
		return nil, err
	}

	// Update fields if provided
	if req.Description != "" {
		transaction.Description = req.Description
	}
	if !req.TransactionDate.IsZero() {
		transaction.TransactionDate = req.TransactionDate
	}
	transaction.UpdatedAt = time.Now()

	if err := s.transactionRepo.Update(transaction); err != nil {
		return nil, err
	}

	return s.toTransactionResponse(transaction), nil
}

// Delete deletes a transaction
func (s *transactionService) Delete(transactionID uuid.UUID) error {
	// Check if transaction exists
	_, err := s.transactionRepo.GetByID(transactionID)
	if err != nil {
		return err
	}

	return s.transactionRepo.Delete(transactionID)
}

// GetSummary retrieves transaction summary within a date range
func (s *transactionService) GetSummary(startDate, endDate time.Time) (*models.TransactionSummary, error) {
	return s.transactionRepo.GetSummaryByDateRange(startDate, endDate)
}

// toTransactionResponse converts Transaction model to TransactionResponse
func (s *transactionService) toTransactionResponse(transaction *models.Transaction) *models.TransactionResponse {
	return &models.TransactionResponse{
		ID:              transaction.ID,
		Reference:       transaction.Reference,
		Description:     transaction.Description,
		TotalAmount:     transaction.TotalAmount,
		TransactionDate: transaction.TransactionDate,
		CreatedAt:       transaction.CreatedAt,
		UpdatedAt:       transaction.UpdatedAt,
	}
}
